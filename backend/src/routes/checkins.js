import express from 'express';
import { query, transaction } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';
import { isValidCoordinates, isWithinVillageRange } from '../utils/location.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * POST /checkins
 * Check in to the village
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;
    
    // Validate coordinates
    if (!isValidCoordinates(lat, lng)) {
      throw new ApiError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    
    // Server-side validation: check if within village range
    if (!isWithinVillageRange(lat, lng, config.village)) {
      throw new ApiError(
        `You must be within ${config.village.radiusKm}km of the village to check in`,
        403,
        'OUT_OF_RANGE'
      );
    }
    
    // Check if user already has an active check-in
    const existingResult = await query(
      'SELECT id FROM checkins WHERE user_id = $1 AND checkout_time IS NULL',
      [userId]
    );
    
    if (existingResult.rows.length > 0) {
      throw new ApiError('You already have an active check-in. Please check out first.', 409, 'ALREADY_CHECKED_IN');
    }
    
    // Create new check-in
    const result = await query(
      `INSERT INTO checkins (user_id, lat, lng, checkin_time)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, user_id, lat, lng, checkin_time, checkout_time`,
      [userId, lat, lng]
    );
    
    const checkin = result.rows[0];
    
    res.status(201).json({
      checkin: {
        id: checkin.id,
        userId: checkin.user_id,
        checkinTime: checkin.checkin_time,
        checkoutTime: checkin.checkout_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /checkins/checkout
 * Check out from the village
 */
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find the latest unchecked-out checkin using transaction
    const result = await transaction(async (client) => {
      // Lock and get the latest active checkin
      const checkinResult = await client.query(
        `SELECT id, checkin_time
         FROM checkins
         WHERE user_id = $1 AND checkout_time IS NULL
         ORDER BY checkin_time DESC
         LIMIT 1
         FOR UPDATE`,
        [userId]
      );
      
      if (checkinResult.rows.length === 0) {
        throw new ApiError('No active check-in found', 404, 'NOT_CHECKED_IN');
      }
      
      const checkin = checkinResult.rows[0];
      
      // Update checkout time
      const updateResult = await client.query(
        `UPDATE checkins
         SET checkout_time = NOW()
         WHERE id = $1
         RETURNING id, user_id, checkin_time, checkout_time`,
        [checkin.id]
      );
      
      return updateResult.rows[0];
    });
    
    res.json({
      checkin: {
        id: result.id,
        userId: result.user_id,
        checkinTime: result.checkin_time,
        checkoutTime: result.checkout_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /checkins/active-latest
 * Get current user's latest active check-in (if any)
 */
router.get('/active-latest', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT id, user_id, checkin_time, checkout_time, lat, lng
       FROM checkins
       WHERE user_id = $1 AND checkout_time IS NULL
       ORDER BY checkin_time DESC
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ checkin: null });
    }
    
    const checkin = result.rows[0];
    
    // Check if it's within 7 days (active definition)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const isActive = new Date(checkin.checkin_time) >= sevenDaysAgo;
    
    res.json({
      checkin: {
        id: checkin.id,
        userId: checkin.user_id,
        checkinTime: checkin.checkin_time,
        checkoutTime: checkin.checkout_time,
        isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /public/active
 * Get all currently active users (checked in within 7 days and not checked out)
 */
router.get('/public/active', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await query(
      `SELECT DISTINCT ON (c.user_id)
         c.user_id,
         u.nickname,
         u.avatar_state,
         c.checkin_time
       FROM checkins c
       JOIN users u ON u.id = c.user_id
       WHERE c.checkout_time IS NULL
         AND c.checkin_time >= $1
       ORDER BY c.user_id, c.checkin_time DESC`,
      [sevenDaysAgo]
    );
    
    res.json({
      activeUsers: result.rows.map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        avatarState: row.avatar_state,
        checkinTime: row.checkin_time,
      })),
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
