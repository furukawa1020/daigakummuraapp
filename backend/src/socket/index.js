import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import db from '../db/index.js';

export function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Get user info
      const result = await db.query(
        'SELECT id, username, nickname FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // Join user's channels
    socket.on('join:channels', async () => {
      try {
        const result = await db.query(
          `SELECT channel_id 
           FROM channel_members 
           WHERE user_id = $1`,
          [socket.user.id]
        );

        result.rows.forEach((row) => {
          socket.join(`channel:${row.channel_id}`);
        });

        socket.emit('channels:joined', {
          count: result.rows.length,
        });
      } catch (error) {
        console.error('Error joining channels:', error);
        socket.emit('error', { message: 'Failed to join channels' });
      }
    });

    // Join a specific channel
    socket.on('join:channel', async (channelId) => {
      try {
        // Verify user is member of channel
        const result = await db.query(
          'SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2',
          [channelId, socket.user.id]
        );

        if (result.rows.length > 0) {
          socket.join(`channel:${channelId}`);
          socket.emit('channel:joined', { channelId });
        }
      } catch (error) {
        console.error('Error joining channel:', error);
      }
    });

    // Leave a channel
    socket.on('leave:channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('channel:left', { channelId });
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, messageType = 'text', mediaUrl } = data;

        // Verify user is member of channel
        const memberCheck = await db.query(
          'SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2',
          [channelId, socket.user.id]
        );

        if (memberCheck.rows.length === 0) {
          socket.emit('error', { message: 'Not a member of this channel' });
          return;
        }

        // Save message to database
        const result = await db.query(
          `INSERT INTO chat_messages (channel_id, user_id, content, message_type, media_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, content, message_type, media_url, created_at`,
          [channelId, socket.user.id, content, messageType, mediaUrl]
        );

        const message = {
          ...result.rows[0],
          user_id: socket.user.id,
          username: socket.user.username,
          nickname: socket.user.nickname,
        };

        // Broadcast to all users in the channel
        io.to(`channel:${channelId}`).emit('message:new', {
          channelId,
          message,
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (channelId) => {
      socket.to(`channel:${channelId}`).emit('typing:user', {
        channelId,
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on('typing:stop', (channelId) => {
      socket.to(`channel:${channelId}`).emit('typing:stop', {
        channelId,
        userId: socket.user.id,
      });
    });

    // WebRTC signaling for voice calls
    socket.on('call:offer', async (data) => {
      const { targetUserId, offer } = data;
      
      io.to(`user:${targetUserId}`).emit('call:offer', {
        fromUserId: socket.user.id,
        fromUsername: socket.user.username,
        offer,
      });
    });

    socket.on('call:answer', async (data) => {
      const { targetUserId, answer } = data;
      
      io.to(`user:${targetUserId}`).emit('call:answer', {
        fromUserId: socket.user.id,
        answer,
      });
    });

    socket.on('call:ice-candidate', async (data) => {
      const { targetUserId, candidate } = data;
      
      io.to(`user:${targetUserId}`).emit('call:ice-candidate', {
        fromUserId: socket.user.id,
        candidate,
      });
    });

    socket.on('call:end', async (data) => {
      const { targetUserId } = data;
      
      io.to(`user:${targetUserId}`).emit('call:end', {
        fromUserId: socket.user.id,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.user.id})`);
    });
  });

  return io;
}
