import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
import { setupSocketIO } from './socket/index.js';
import { performSecurityChecks } from './utils/security.js';

// Import routes
import authRoutes from './routes/auth.js';
import checkinRoutes from './routes/checkins.js';
import statsRoutes from './routes/stats.js';
import avatarRoutes from './routes/avatar.js';
import questRoutes from './routes/quests.js';
import diaryRoutes from './routes/diary.js';
import chatRoutes from './routes/chat.js';
import calendarRoutes from './routes/calendar.js';

const app = express();

// Trust proxy - Required for Railway, Heroku, etc.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.corsOrigin],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
}));

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use(limiter);

// Auth-specific rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: config.authRateLimit.max,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/checkins', checkinRoutes);
app.use('/avatar', avatarRoutes);
app.use('/quests', questRoutes);
app.use('/diary', diaryRoutes);
app.use('/chat', chatRoutes);
app.use('/calendar', calendarRoutes);
app.use('/', statsRoutes); // public/stats, leaderboard, users/:id/summary

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Perform security checks before starting
performSecurityChecks();

// Create HTTP server and setup Socket.IO
const httpServer = createServer(app);
const io = setupSocketIO(httpServer);

// Start server
const server = httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`💬 Socket.IO enabled`);
  console.log(`📍 Village center: ${config.village.centerLat}, ${config.village.centerLng}`);
  console.log(`📏 Village radius: ${config.village.radiusKm} km`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔐 CORS origin: ${config.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
