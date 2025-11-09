import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { ApiError } from '../utils/errors.js';
import { query } from '../db/index.js';

/**
 * Middleware to authenticate JWT token from cookie
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Get user from database
    const result = await query(
      'SELECT id, email, username, nickname, avatar_state, privacy_defaults, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('User not found', 401, 'UNAUTHORIZED');
    }
    
    // Attach user to request
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, config.jwtSecret);
    const result = await query(
      'SELECT id, email, username, nickname, avatar_state, privacy_defaults FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    req.user = result.rows.length > 0 ? result.rows[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// Export authenticate as authenticateToken for backward compatibility
export { authenticate as authenticateToken };
