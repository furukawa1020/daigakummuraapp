import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';

const router = express.Router();

/**
 * 繧ｯ繧ｨ繧ｹ繝井ｽ懈・
 * POST /api/quests
 */
router.post('/', authenticateToken, async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    const { title, description, location, visibility = 'public' } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      throw new ApiError('繧ｿ繧､繝医Ν縺ｨ隱ｬ譏弱・蠢・医〒縺・, 400);
    }

    if (!['public', 'village', 'private'].includes(visibility)) {
      throw new ApiError('辟｡蜉ｹ縺ｪ蜈ｬ髢狗ｯ・峇縺ｧ縺・, 400);
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
 * 繧ｯ繧ｨ繧ｹ繝井ｸ隕ｧ蜿門ｾ・
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

    // 蜈ｬ髢狗ｯ・峇繝輔ぅ繝ｫ繧ｿ繝ｼ・・rivate縺ｯ菴懈・閠・・縺ｿ髢ｲ隕ｧ蜿ｯ閭ｽ・・
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
 * 繧ｯ繧ｨ繧ｹ繝郁ｩｳ邏ｰ蜿門ｾ・
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
      throw new ApiError('繧ｯ繧ｨ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 繧ｯ繧ｨ繧ｹ繝域峩譁ｰ
 * PUT /api/quests/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, location, visibility, status } = req.body;
    const userId = req.user.userId;

    // 菴懈・閠・°繝√ぉ繝・け
    const quest = await query(
      'SELECT creator_id FROM quests WHERE id = $1',
      [id]
    );

    if (quest.rows.length === 0) {
      throw new ApiError('繧ｯ繧ｨ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    if (quest.rows[0].creator_id !== userId) {
      throw new ApiError('繧ｯ繧ｨ繧ｹ繝医ｒ譖ｴ譁ｰ縺吶ｋ讓ｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ', 403);
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
      throw new ApiError('譖ｴ譁ｰ蜀・ｮｹ縺後≠繧翫∪縺帙ｓ', 400);
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
 * 繧ｯ繧ｨ繧ｹ繝亥炎髯､
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
      throw new ApiError('繧ｯ繧ｨ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    if (quest.rows[0].creator_id !== userId) {
      throw new ApiError('繧ｯ繧ｨ繧ｹ繝医ｒ蜑企勁縺吶ｋ讓ｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ', 403);
    }

    await query('DELETE FROM quests WHERE id = $1', [id]);
    res.json({ message: '繧ｯ繧ｨ繧ｹ繝医ｒ蜑企勁縺励∪縺励◆' });
  } catch (error) {
    next(error);
  }
});

/**
 * 繧ｯ繧ｨ繧ｹ繝亥盾蜉
 * POST /api/quests/:id/join
 */
router.post('/:id/join', authenticateToken, async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 繧ｯ繧ｨ繧ｹ繝亥ｭ伜惠繝√ぉ繝・け
    const quest = await client.query(
      'SELECT * FROM quests WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (quest.rows.length === 0) {
      throw new ApiError('繧｢繧ｯ繝・ぅ繝悶↑繧ｯ繧ｨ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    // 譌｢縺ｫ蜿ょ刈貂医∩縺九メ繧ｧ繝・け
    const existing = await client.query(
      'SELECT * FROM quest_participants WHERE quest_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length > 0) {
      throw new ApiError('譌｢縺ｫ縺薙・繧ｯ繧ｨ繧ｹ繝医↓蜿ょ刈縺励※縺・∪縺・, 400);
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
 * 繧ｯ繧ｨ繧ｹ繝亥ｮ御ｺ・ｱ蜻・
 * POST /api/quests/:id/complete
 */
router.post('/:id/complete', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reflection } = req.body;
    const userId = req.user.userId;

    if (!reflection || reflection.trim().length === 0) {
      throw new ApiError('謖ｯ繧願ｿ斐ｊ縺ｯ蠢・医〒縺・, 400);
    }

    // 蜿ょ刈迥ｶ諷九メ繧ｧ繝・け
    const participant = await query(
      'SELECT * FROM quest_participants WHERE quest_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participant.rows.length === 0) {
      throw new ApiError('縺薙・繧ｯ繧ｨ繧ｹ繝医↓蜿ょ刈縺励※縺・∪縺帙ｓ', 400);
    }

    if (participant.rows[0].status === 'completed') {
      throw new ApiError('譌｢縺ｫ螳御ｺ・ｱ蜻頑ｸ医∩縺ｧ縺・, 400);
    }

    if (participant.rows[0].status === 'cancelled') {
      throw new ApiError('繧ｭ繝｣繝ｳ繧ｻ繝ｫ貂医∩縺ｮ繧ｯ繧ｨ繧ｹ繝医・螳御ｺ・〒縺阪∪縺帙ｓ', 400);
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
 * 繧ｯ繧ｨ繧ｹ繝亥盾蜉繧ｭ繝｣繝ｳ繧ｻ繝ｫ
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
      throw new ApiError('縺薙・繧ｯ繧ｨ繧ｹ繝医↓蜿ょ刈縺励※縺・∪縺帙ｓ', 400);
    }

    if (participant.rows[0].status === 'completed') {
      throw new ApiError('螳御ｺ・ｸ医∩縺ｮ繧ｯ繧ｨ繧ｹ繝医・繧ｭ繝｣繝ｳ繧ｻ繝ｫ縺ｧ縺阪∪縺帙ｓ', 400);
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

