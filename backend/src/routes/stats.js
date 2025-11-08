import express from 'express';
import { query } from '../db/index.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /public/stats
 * Get global statistics
 */
router.get('/public/stats', async (req, res, next) => {
  try {
    // Total check-ins
    const totalCheckinsResult = await query('SELECT COUNT(*) as count FROM checkins');
    const totalCheckins = parseInt(totalCheckinsResult.rows[0].count);
    
    // Total unique visit days (distinct date of checkin_time)
    const totalDaysResult = await query(
      "SELECT COUNT(DISTINCT DATE(checkin_time)) as count FROM checkins"
    );
    const totalVisitDays = parseInt(totalDaysResult.rows[0].count);
    
    // Active users (within 7 days, not checked out)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM checkins
       WHERE checkout_time IS NULL
         AND checkin_time >= $1`,
      [sevenDaysAgo]
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);
    
    // Total users registered
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    
    res.json({
      stats: {
        totalCheckins,
        totalVisitDays,
        activeUsers,
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /users/:id/summary
 * Get user's visit summary
 */
router.get('/users/:id/summary', optionalAuthenticate, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Total visits (checkin count)
    const visitsResult = await query(
      'SELECT COUNT(*) as count FROM checkins WHERE user_id = $1',
      [userId]
    );
    const totalVisits = parseInt(visitsResult.rows[0].count);
    
    // Unique visit days
    const daysResult = await query(
      `SELECT COUNT(DISTINCT DATE(checkin_time)) as count
       FROM checkins
       WHERE user_id = $1`,
      [userId]
    );
    const uniqueVisitDays = parseInt(daysResult.rows[0].count);
    
    // Total stay duration (sum of all completed sessions)
    const durationResult = await query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (checkout_time - checkin_time)) / 86400), 0) as days
       FROM checkins
       WHERE user_id = $1
         AND checkout_time IS NOT NULL`,
      [userId]
    );
    const totalStayDays = parseFloat(durationResult.rows[0].days);
    
    // Is currently active?
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeResult = await query(
      `SELECT id FROM checkins
       WHERE user_id = $1
         AND checkout_time IS NULL
         AND checkin_time >= $2
       LIMIT 1`,
      [userId, sevenDaysAgo]
    );
    const isActive = activeResult.rows.length > 0;
    
    // Get user info
    const userResult = await query(
      'SELECT nickname, avatar_state, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      user: {
        id: userId,
        nickname: user.nickname,
        avatarState: user.avatar_state,
        memberSince: user.created_at,
      },
      summary: {
        totalVisits,
        uniqueVisitDays,
        totalStayDays: Math.round(totalStayDays * 10) / 10, // Round to 1 decimal
        isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /leaderboard
 * Get ranking leaderboard
 * Query params: type (visits|days|duration), limit (default 50)
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const type = req.query.type || 'visits';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    let rankingQuery;
    let orderField;
    
    switch (type) {
      case 'visits':
        // Ranking by total visit count
        rankingQuery = `
          SELECT
            u.id,
            u.nickname,
            u.avatar_state,
            COUNT(c.id) as score
          FROM users u
          LEFT JOIN checkins c ON c.user_id = u.id
          GROUP BY u.id, u.nickname, u.avatar_state
          ORDER BY score DESC
          LIMIT $1
        `;
        orderField = 'totalVisits';
        break;
        
      case 'days':
        // Ranking by unique visit days
        rankingQuery = `
          SELECT
            u.id,
            u.nickname,
            u.avatar_state,
            COUNT(DISTINCT DATE(c.checkin_time)) as score
          FROM users u
          LEFT JOIN checkins c ON c.user_id = u.id
          GROUP BY u.id, u.nickname, u.avatar_state
          ORDER BY score DESC
          LIMIT $1
        `;
        orderField = 'uniqueVisitDays';
        break;
        
      case 'duration':
        // Ranking by total stay duration
        rankingQuery = `
          SELECT
            u.id,
            u.nickname,
            u.avatar_state,
            COALESCE(SUM(EXTRACT(EPOCH FROM (c.checkout_time - c.checkin_time)) / 86400), 0) as score
          FROM users u
          LEFT JOIN checkins c ON c.user_id = u.id AND c.checkout_time IS NOT NULL
          GROUP BY u.id, u.nickname, u.avatar_state
          ORDER BY score DESC
          LIMIT $1
        `;
        orderField = 'totalStayDays';
        break;
        
      default:
        return res.status(400).json({
          error: {
            code: 'INVALID_TYPE',
            message: 'Invalid ranking type. Use: visits, days, or duration',
          },
        });
    }
    
    const result = await query(rankingQuery, [limit]);
    
    const rankings = result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.id,
      nickname: row.nickname,
      avatarState: row.avatar_state,
      [orderField]: type === 'duration' 
        ? Math.round(parseFloat(row.score) * 10) / 10 
        : parseInt(row.score),
    }));
    
    res.json({
      type,
      rankings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
