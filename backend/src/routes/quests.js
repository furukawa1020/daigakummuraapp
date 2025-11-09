import express from 'express';
import { query, pool } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';

const router = express.Router();

/**
 * クエスト作成
 * POST /api/quests
 */
router.post('/', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { title, description, location, visibility = 'public' } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      throw new ApiError('タイトルと説明は必須です', 400);
    }

    if (!['public', 'village', 'private'].includes(visibility)) {
      throw new ApiError('無効な公開範囲です', 400);
    }

    await client.query('BEGIN');

    // Create quest
    const questResult = await client.query(
      `INSERT INTO quests (creator_id, title, description, location, visibility, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, title, description, location, visibility]
    );

    const quest = questResult.rows[0];

    // Create chat channel for the quest
    const channelResult = await client.query(
      `INSERT INTO chat_channels (type, name, quest_id)
       VALUES ('quest', $1, $2)
       RETURNING id`,
      [title, quest.id]
    );

    // Add creator to the channel
    await client.query(
      `INSERT INTO channel_members (channel_id, user_id)
       VALUES ($1, $2)`,
      [channelResult.rows[0].id, userId]
    );

    await client.query('COMMIT');

    res.status(201).json(quest);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * クエスト一覧取得
 * GET /api/quests
 * Query params: status, visibility, creatorId
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, visibility, creatorId } = req.query;
    const userId = req.user.userId;

    let queryText = `
      SELECT 
        q.*,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as creator,
        (SELECT COUNT(*) FROM quest_participants WHERE quest_id = q.id) as participant_count,
        (SELECT COUNT(*) FROM quest_participants WHERE quest_id = q.id AND status = 'completed') as completed_count,
        EXISTS(SELECT 1 FROM quest_participants WHERE quest_id = q.id AND user_id = $1) as is_participating,
        (SELECT status FROM quest_participants WHERE quest_id = q.id AND user_id = $1) as my_status
      FROM quests q
      JOIN users u ON q.creator_id = u.id
      WHERE 1=1
    `;
    const params = [userId];
    let paramIndex = 2;

    // 公開範囲フィルター（privateは作成者のみ閲覧可能）
    queryText += ` AND (q.visibility != 'private' OR q.creator_id = $1)`;

    if (status) {
      queryText += ` AND q.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (visibility) {
      queryText += ` AND q.visibility = $${paramIndex}`;
      params.push(visibility);
      paramIndex++;
    }

    if (creatorId) {
      queryText += ` AND q.creator_id = $${paramIndex}`;
      params.push(creatorId);
      paramIndex++;
    }

    queryText += ` ORDER BY q.created_at DESC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * クエスト詳細取得
 * GET /api/quests/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        q.*,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as creator,
        (SELECT json_agg(json_build_object(
          'id', qp.id,
          'userId', qp.user_id,
          'username', pu.username,
          'status', qp.status,
          'reflection', qp.reflection,
          'joinedAt', qp.joined_at,
          'completedAt', qp.completed_at
        ))
        FROM quest_participants qp
        JOIN users pu ON qp.user_id = pu.id
        WHERE qp.quest_id = q.id) as participants
      FROM quests q
      JOIN users u ON q.creator_id = u.id
      WHERE q.id = $1 AND (q.visibility != 'private' OR q.creator_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError('クエストが見つかりません', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * クエスト更新
 * PUT /api/quests/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, location, visibility, status } = req.body;
    const userId = req.user.userId;

    // 作成者かチェック
    const quest = await query(
      'SELECT creator_id FROM quests WHERE id = $1',
      [id]
    );

    if (quest.rows.length === 0) {
      throw new ApiError('クエストが見つかりません', 404);
    }

    if (quest.rows[0].creator_id !== userId) {
      throw new ApiError('クエストを更新する権限がありません', 403);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }

    if (visibility !== undefined) {
      updates.push(`visibility = $${paramIndex}`);
      params.push(visibility);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new ApiError('更新内容がありません', 400);
    }

    params.push(id);
    const result = await query(
      `UPDATE quests SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * クエスト削除
 * DELETE /api/quests/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const quest = await query(
      'SELECT creator_id FROM quests WHERE id = $1',
      [id]
    );

    if (quest.rows.length === 0) {
      throw new ApiError('クエストが見つかりません', 404);
    }

    if (quest.rows[0].creator_id !== userId) {
      throw new ApiError('クエストを削除する権限がありません', 403);
    }

    await query('DELETE FROM quests WHERE id = $1', [id]);
    res.json({ message: 'クエストを削除しました' });
  } catch (error) {
    next(error);
  }
});

/**
 * クエスト参加
 * POST /api/quests/:id/join
 */
router.post('/:id/join', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // クエスト存在チェック
    const quest = await client.query(
      'SELECT * FROM quests WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (quest.rows.length === 0) {
      throw new ApiError('アクティブなクエストが見つかりません', 404);
    }

    // 既に参加済みかチェック
    const existing = await client.query(
      'SELECT * FROM quest_participants WHERE quest_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length > 0) {
      throw new ApiError('既にこのクエストに参加しています', 400);
    }

    await client.query('BEGIN');

    // Add to quest participants
    const result = await client.query(
      `INSERT INTO quest_participants (quest_id, user_id, status)
       VALUES ($1, $2, 'joined')
       RETURNING *`,
      [id, userId]
    );

    // Add to quest chat channel
    const channelResult = await client.query(
      'SELECT id FROM chat_channels WHERE quest_id = $1 AND type = $2',
      [id, 'quest']
    );

    if (channelResult.rows.length > 0) {
      await client.query(
        `INSERT INTO channel_members (channel_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (channel_id, user_id) DO NOTHING`,
        [channelResult.rows[0].id, userId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * クエスト完了報告
 * POST /api/quests/:id/complete
 */
router.post('/:id/complete', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reflection } = req.body;
    const userId = req.user.userId;

    if (!reflection || reflection.trim().length === 0) {
      throw new ApiError('振り返りは必須です', 400);
    }

    // 参加状態チェック
    const participant = await query(
      'SELECT * FROM quest_participants WHERE quest_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participant.rows.length === 0) {
      throw new ApiError('このクエストに参加していません', 400);
    }

    if (participant.rows[0].status === 'completed') {
      throw new ApiError('既に完了報告済みです', 400);
    }

    if (participant.rows[0].status === 'cancelled') {
      throw new ApiError('キャンセル済みのクエストは完了できません', 400);
    }

    const result = await query(
      `UPDATE quest_participants
       SET status = 'completed', reflection = $1, completed_at = CURRENT_TIMESTAMP
       WHERE quest_id = $2 AND user_id = $3
       RETURNING *`,
      [reflection, id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * クエスト参加キャンセル
 * POST /api/quests/:id/cancel
 */
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const participant = await query(
      'SELECT * FROM quest_participants WHERE quest_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participant.rows.length === 0) {
      throw new ApiError('このクエストに参加していません', 400);
    }

    if (participant.rows[0].status === 'completed') {
      throw new ApiError('完了済みのクエストはキャンセルできません', 400);
    }

    const result = await query(
      `UPDATE quest_participants
       SET status = 'cancelled'
       WHERE quest_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
