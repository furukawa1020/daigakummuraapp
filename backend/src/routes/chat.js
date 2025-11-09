import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { ApiError } from '../utils/errors.js';

const router = express.Router();

// Get chat channels
router.get('/channels', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT DISTINCT
        c.id,
        c.type,
        c.name,
        c.quest_id,
        c.created_at,
        q.title as quest_title,
        (
          SELECT COUNT(*)
          FROM chat_messages cm
          WHERE cm.channel_id = c.id
          AND cm.created_at > COALESCE(
            (SELECT last_read_at FROM channel_members WHERE channel_id = c.id AND user_id = $1),
            '1970-01-01'
          )
        ) as unread_count,
        (
          SELECT json_build_object(
            'content', content,
            'created_at', created_at,
            'user_id', user_id,
            'username', (SELECT username FROM users WHERE id = user_id)
          )
          FROM chat_messages
          WHERE channel_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) as last_message
      FROM chat_channels c
      LEFT JOIN quests q ON c.quest_id = q.id
      INNER JOIN channel_members cm ON c.id = cm.channel_id
      WHERE cm.user_id = $1
      ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get messages from a channel
router.get('/channels/:channelId/messages', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;
    const { before, limit = 50 } = req.query;

    // Check if user is member of channel
    const memberCheck = await query(
      'SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (memberCheck.rows.length === 0) {
      throw new ApiError('Channel not found or access denied', 404);
    }

    let query = `
      SELECT 
        m.id,
        m.content,
        m.message_type,
        m.media_url,
        m.created_at,
        m.user_id,
        u.username,
        u.nickname,
        u.avatar_data
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = $1
    `;
    
    const queryParams = [channelId];
    
    if (before) {
      query += ` AND m.created_at < $${queryParams.length + 1}`;
      queryParams.push(before);
    }
    
    query += ` ORDER BY m.created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const result = await query(query, queryParams);

    // Update last_read_at
    await query(
      `UPDATE channel_members 
       SET last_read_at = NOW() 
       WHERE channel_id = $1 AND user_id = $2`,
      [channelId, userId]
    );

    res.json(result.rows.reverse());
  } catch (error) {
    next(error);
  }
});

// Send a message
router.post('/channels/:channelId/messages', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;
    const { content, messageType = 'text', mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      throw new ApiError('Message content or media URL is required', 400);
    }

    // Check if user is member of channel
    const memberCheck = await query(
      'SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (memberCheck.rows.length === 0) {
      throw new ApiError('Channel not found or access denied', 404);
    }

    const result = await query(
      `INSERT INTO chat_messages (channel_id, user_id, content, message_type, media_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, message_type, media_url, created_at`,
      [channelId, userId, content, messageType, mediaUrl]
    );

    const message = result.rows[0];
    
    // Get user info
    const userResult = await query(
      'SELECT username, nickname, avatar_data FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      ...message,
      user_id: userId,
      ...userResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Create a DM channel
router.post('/channels/dm', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      throw new ApiError('Target user ID is required', 400);
    }

    if (targetUserId === userId) {
      throw new ApiError('Cannot create DM with yourself', 400);
    }

    // Check if DM channel already exists
    const existingChannel = await query(
      `SELECT c.id
       FROM chat_channels c
       WHERE c.type = 'dm'
       AND EXISTS (SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $1)
       AND EXISTS (SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $2)
       AND (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) = 2`,
      [userId, targetUserId]
    );

    if (existingChannel.rows.length > 0) {
      return res.json({ id: existingChannel.rows[0].id, existing: true });
    }

    // Create new DM channel
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      const channelResult = await client.query(
        `INSERT INTO chat_channels (type, name)
         VALUES ('dm', 'Direct Message')
         RETURNING id`,
      );

      const channelId = channelResult.rows[0].id;

      // Add both users as members
      await client.query(
        `INSERT INTO channel_members (channel_id, user_id)
         VALUES ($1, $2), ($1, $3)`,
        [channelId, userId, targetUserId]
      );

      await client.query('COMMIT');

      res.status(201).json({ id: channelId, existing: false });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// Delete a message (only own messages)
router.delete('/messages/:messageId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const result = await query(
      'DELETE FROM chat_messages WHERE id = $1 AND user_id = $2 RETURNING id',
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Message not found or access denied', 404);
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

