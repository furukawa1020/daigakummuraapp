import express from 'express';
import { query, transaction } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';
import { calculateActivityPoints, checkUnlockRequirement } from '../utils/points.js';

const router = express.Router();

/**
 * GET /avatar/parts
 * Get all avatar parts with unlock status for current user
 */
router.get('/parts', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all parts
    const partsResult = await query(
      `SELECT 
        ap.id,
        ap.category,
        ap.name,
        ap.asset_url,
        ap.unlock_rule,
        ap.rarity,
        CASE WHEN uap.user_id IS NOT NULL THEN true ELSE false END as unlocked,
        uap.unlocked_at
       FROM avatar_parts ap
       LEFT JOIN user_avatar_parts uap ON uap.part_id = ap.id AND uap.user_id = $1
       ORDER BY ap.category, ap.rarity, ap.name`,
      [userId]
    );
    
    // Get user's activity points
    const pointsData = await calculateActivityPoints(userId);
    
    // Group by category
    const partsByCategory = {};
    
    for (const part of partsResult.rows) {
      if (!partsByCategory[part.category]) {
        partsByCategory[part.category] = [];
      }
      
      // Check if can be unlocked (if not already unlocked)
      let canUnlock = part.unlocked;
      if (!part.unlocked) {
        canUnlock = await checkUnlockRequirement(userId, part.unlock_rule);
      }
      
      partsByCategory[part.category].push({
        id: part.id,
        name: part.name,
        assetUrl: part.asset_url,
        unlockRule: part.unlock_rule,
        rarity: part.rarity,
        unlocked: part.unlocked,
        canUnlock,
        unlockedAt: part.unlocked_at,
      });
    }
    
    res.json({
      parts: partsByCategory,
      activityPoints: pointsData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /avatar/unlock/:partId
 * Unlock a specific avatar part
 */
router.post('/unlock/:partId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partId = req.params.partId;
    
    // Get part details
    const partResult = await query(
      'SELECT id, name, unlock_rule FROM avatar_parts WHERE id = $1',
      [partId]
    );
    
    if (partResult.rows.length === 0) {
      throw new ApiError('Avatar part not found', 404, 'PART_NOT_FOUND');
    }
    
    const part = partResult.rows[0];
    
    // Check if already unlocked
    const existingResult = await query(
      'SELECT id FROM user_avatar_parts WHERE user_id = $1 AND part_id = $2',
      [userId, partId]
    );
    
    if (existingResult.rows.length > 0) {
      throw new ApiError('Part already unlocked', 400, 'ALREADY_UNLOCKED');
    }
    
    // Check unlock requirements
    const canUnlock = await checkUnlockRequirement(userId, part.unlock_rule);
    
    if (!canUnlock) {
      throw new ApiError('Unlock requirements not met', 403, 'REQUIREMENTS_NOT_MET');
    }
    
    // Unlock the part
    await query(
      'INSERT INTO user_avatar_parts (user_id, part_id) VALUES ($1, $2)',
      [userId, partId]
    );
    
    res.json({
      message: `${part.name} unlocked successfully`,
      partId: part.id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /avatar/save
 * Save user's avatar configuration
 */
router.post('/save', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { avatarState } = req.body;
    
    if (!avatarState || typeof avatarState !== 'object') {
      throw new ApiError('Invalid avatar state', 400, 'INVALID_AVATAR_STATE');
    }
    
    // Validate that all parts are unlocked
    const partIds = Object.values(avatarState).filter(id => id && id !== 'none');
    
    if (partIds.length > 0) {
      const unlockedResult = await query(
        `SELECT part_id FROM user_avatar_parts 
         WHERE user_id = $1 AND part_id = ANY($2)`,
        [userId, partIds]
      );
      
      const unlockedIds = unlockedResult.rows.map(r => r.part_id);
      const invalidParts = partIds.filter(id => !unlockedIds.includes(id));
      
      if (invalidParts.length > 0) {
        throw new ApiError('Some parts are not unlocked', 403, 'PARTS_NOT_UNLOCKED');
      }
    }
    
    // Update user's avatar state
    await query(
      'UPDATE users SET avatar_state = $1 WHERE id = $2',
      [JSON.stringify(avatarState), userId]
    );
    
    res.json({
      message: 'Avatar saved successfully',
      avatarState,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /avatar/my-parts
 * Get only unlocked parts for current user
 */
router.get('/my-parts', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        ap.id,
        ap.category,
        ap.name,
        ap.asset_url,
        ap.rarity,
        uap.unlocked_at
       FROM user_avatar_parts uap
       JOIN avatar_parts ap ON ap.id = uap.part_id
       WHERE uap.user_id = $1
       ORDER BY ap.category, ap.name`,
      [userId]
    );
    
    // Group by category
    const partsByCategory = {};
    
    for (const part of result.rows) {
      if (!partsByCategory[part.category]) {
        partsByCategory[part.category] = [];
      }
      
      partsByCategory[part.category].push({
        id: part.id,
        name: part.name,
        assetUrl: part.asset_url,
        rarity: part.rarity,
        unlockedAt: part.unlocked_at,
      });
    }
    
    res.json({
      parts: partsByCategory,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /avatar/auto-unlock
 * Auto-unlock all parts that meet requirements
 */
router.post('/auto-unlock', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all locked parts
    const partsResult = await query(
      `SELECT ap.id, ap.name, ap.unlock_rule
       FROM avatar_parts ap
       WHERE ap.id NOT IN (
         SELECT part_id FROM user_avatar_parts WHERE user_id = $1
       )`,
      [userId]
    );
    
    const unlockedParts = [];
    
    // Check and unlock each part
    for (const part of partsResult.rows) {
      const canUnlock = await checkUnlockRequirement(userId, part.unlock_rule);
      
      if (canUnlock) {
        await query(
          'INSERT INTO user_avatar_parts (user_id, part_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, part.id]
        );
        unlockedParts.push({
          id: part.id,
          name: part.name,
        });
      }
    }
    
    res.json({
      message: `${unlockedParts.length} parts auto-unlocked`,
      unlockedParts,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
