import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';

const router = express.Router();

/**
 * 譌･險俶兜遞ｿ菴懈・
 * POST /api/diary
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { content, visibility = 'public', media_urls } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length === 0) {
      throw new ApiError('謚慕ｨｿ蜀・ｮｹ縺ｯ蠢・医〒縺・, 400);
    }

    if (!['public', 'village', 'friends', 'private'].includes(visibility)) {
      throw new ApiError('辟｡蜉ｹ縺ｪ蜈ｬ髢狗ｯ・峇縺ｧ縺・, 400);
    }

    const result = await query(
      `INSERT INTO diary_posts (user_id, content, visibility, media_urls)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, content, visibility, media_urls ? JSON.stringify(media_urls) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 譌･險俶兜遞ｿ荳隕ｧ蜿門ｾ暦ｼ医ヵ繧｣繝ｼ繝会ｼ・
 * GET /api/diary
 * Query params: visibility, userId, limit, offset
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { visibility, userId, limit = 50, offset = 0 } = req.query;
    const currentUserId = req.user.userId;

    let queryText = `
      SELECT 
        dp.*,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as author,
        (SELECT COUNT(*) FROM reactions WHERE post_id = dp.id AND post_type = 'diary') as reaction_count,
        (SELECT COUNT(*) FROM reactions WHERE post_id = dp.id AND post_type = 'diary' AND user_id = $1) as user_reacted,
        (SELECT json_agg(json_build_object(
          'id', r.id,
          'type', r.reaction_type,
          'userId', r.user_id,
          'username', ru.username
        ))
        FROM reactions r
        JOIN users ru ON r.user_id = ru.id
        WHERE r.post_id = dp.id AND r.post_type = 'diary'
        LIMIT 10) as recent_reactions
      FROM diary_posts dp
      JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `;
    const params = [currentUserId];
    let paramIndex = 2;

    // 蜈ｬ髢狗ｯ・峇繝輔ぅ繝ｫ繧ｿ繝ｼ・・rivate縺ｯ譛ｬ莠ｺ縺ｮ縺ｿ髢ｲ隕ｧ蜿ｯ閭ｽ・・
    queryText += ` AND (dp.visibility != 'private' OR dp.user_id = $1)`;

    if (visibility) {
      queryText += ` AND dp.visibility = $${paramIndex}`;
      params.push(visibility);
      paramIndex++;
    }

    if (userId) {
      queryText += ` AND dp.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    queryText += ` ORDER BY dp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * 譌･險俶兜遞ｿ隧ｳ邏ｰ蜿門ｾ・
 * GET /api/diary/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        dp.*,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as author,
        (SELECT json_agg(json_build_object(
          'id', r.id,
          'type', r.reaction_type,
          'userId', r.user_id,
          'username', ru.username,
          'createdAt', r.created_at
        ))
        FROM reactions r
        JOIN users ru ON r.user_id = ru.id
        WHERE r.post_id = dp.id AND r.post_type = 'diary') as reactions
      FROM diary_posts dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = $1 AND (dp.visibility != 'private' OR dp.user_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError('謚慕ｨｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * 譌･險俶兜遞ｿ譖ｴ譁ｰ
 * PUT /api/diary/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, visibility, media_urls } = req.body;
    const userId = req.user.userId;

    // 謚慕ｨｿ閠・°繝√ぉ繝・け
    const post = await query(
      'SELECT user_id FROM diary_posts WHERE id = $1',
      [id]
    );

    if (post.rows.length === 0) {
      throw new ApiError('謚慕ｨｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    if (post.rows[0].user_id !== userId) {
      throw new ApiError('縺薙・謚慕ｨｿ繧堤ｷｨ髮・☆繧区ｨｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ', 403);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      params.push(content);
      paramIndex++;
    }

    if (visibility !== undefined) {
      updates.push(`visibility = $${paramIndex}`);
      params.push(visibility);
      paramIndex++;
    }

    if (media_urls !== undefined) {
      updates.push(`media_urls = $${paramIndex}`);
      params.push(media_urls ? JSON.stringify(media_urls) : null);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new ApiError('譖ｴ譁ｰ蜀・ｮｹ縺後≠繧翫∪縺帙ｓ', 400);
    }

    params.push(id);
    const result = await query(
      `UPDATE diary_posts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
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
 * 譌･險俶兜遞ｿ蜑企勁
 * DELETE /api/diary/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await query(
      'SELECT user_id FROM diary_posts WHERE id = $1',
      [id]
    );

    if (post.rows.length === 0) {
      throw new ApiError('謚慕ｨｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    if (post.rows[0].user_id !== userId) {
      throw new ApiError('縺薙・謚慕ｨｿ繧貞炎髯､縺吶ｋ讓ｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ', 403);
    }

    await query('DELETE FROM diary_posts WHERE id = $1', [id]);
    res.json({ message: '謚慕ｨｿ繧貞炎髯､縺励∪縺励◆' });
  } catch (error) {
    next(error);
  }
});

/**
 * 繝ｪ繧｢繧ｯ繧ｷ繝ｧ繝ｳ霑ｽ蜉/蜑企勁
 * POST /api/diary/:id/react
 */
router.post('/:id/react', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'like' } = req.body;
    const userId = req.user.userId;

    if (!['like', 'love', 'laugh', 'wow', 'sad'].includes(type)) {
      throw new ApiError('辟｡蜉ｹ縺ｪ繝ｪ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧ｿ繧､繝励〒縺・, 400);
    }

    // 謚慕ｨｿ蟄伜惠繝√ぉ繝・け
    const post = await query(
      'SELECT id FROM diary_posts WHERE id = $1',
      [id]
    );

    if (post.rows.length === 0) {
      throw new ApiError('謚慕ｨｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ', 404);
    }

    // 譌｢蟄倥Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧偵メ繧ｧ繝・け
    const existing = await query(
      'SELECT * FROM reactions WHERE post_id = $1 AND post_type = $2 AND user_id = $3',
      [id, 'diary', userId]
    );

    if (existing.rows.length > 0) {
      // 譌｢蟄倥Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧貞炎髯､
      await query(
        'DELETE FROM reactions WHERE post_id = $1 AND post_type = $2 AND user_id = $3',
        [id, 'diary', userId]
      );
      return res.json({ message: '繝ｪ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧貞炎髯､縺励∪縺励◆', action: 'removed' });
    }

    // 譁ｰ隕上Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧定ｿｽ蜉
    const result = await query(
      `INSERT INTO reactions (post_id, post_type, user_id, reaction_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, 'diary', userId, type]
    );

    res.status(201).json({ ...result.rows[0], action: 'added' });
  } catch (error) {
    next(error);
  }
});

export default router;

