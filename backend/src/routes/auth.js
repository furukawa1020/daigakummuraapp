import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';
import { ApiError } from '../utils/errors.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, nickname } = req.body;
    
    // Validation
    if (!password || password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400, 'INVALID_PASSWORD', 'password');
    }
    
    if (!nickname || nickname.trim().length === 0) {
      throw new ApiError('Nickname is required', 400, 'INVALID_NICKNAME', 'nickname');
    }
    
    if (!email && !username) {
      throw new ApiError('Email or username is required', 400, 'MISSING_CREDENTIALS');
    }
    
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError('Invalid email format', 400, 'INVALID_EMAIL', 'email');
    }
    
    // Username validation
    if (username && (username.length < 3 || username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(username))) {
      throw new ApiError('Username must be 3-50 characters and contain only letters, numbers, and underscores', 400, 'INVALID_USERNAME', 'username');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await query(
      `INSERT INTO users (email, username, password_hash, nickname)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, nickname, created_at`,
      [email || null, username || null, passwordHash, nickname.trim()]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = generateToken(user.id);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      throw new ApiError('Email/username and password are required', 400, 'MISSING_CREDENTIALS');
    }
    
    // Find user by email or username
    const result = await query(
      `SELECT id, email, username, nickname, password_hash, avatar_state, privacy_defaults, created_at
       FROM users
       WHERE email = $1 OR username = $1`,
      [emailOrUsername]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    // Update last active
    await query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);
    
    // Generate token
    const token = generateToken(user.id);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatarState: user.avatar_state,
        privacyDefaults: user.privacy_defaults,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /me
 * Get current user
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        nickname: req.user.nickname,
        avatarState: req.user.avatar_state,
        privacyDefaults: req.user.privacy_defaults,
        createdAt: req.user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
