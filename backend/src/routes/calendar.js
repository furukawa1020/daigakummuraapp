import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../db/index.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

// Get calendar events (personal + quests + checkins)
router.get('/events', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    if (!start || !end) {
      throw new AppError('Start and end dates are required', 400);
    }

    // Get personal events
    const personalEvents = await db.query(
      `SELECT 
        id,
        'personal' as type,
        title,
        description,
        start_time,
        end_time,
        all_day,
        location,
        reminder_minutes,
        color
      FROM calendar_events
      WHERE user_id = $1
        AND start_time >= $2
        AND start_time <= $3
      ORDER BY start_time ASC`,
      [userId, start, end]
    );

    // Get quest deadlines (for quests user is participating in)
    const questEvents = await db.query(
      `SELECT 
        q.id,
        'quest' as type,
        q.title,
        q.description,
        q.deadline as start_time,
        q.deadline as end_time,
        false as all_day,
        q.location,
        null as reminder_minutes,
        '#3b82f6' as color
      FROM quests q
      JOIN quest_participants qp ON q.id = qp.quest_id
      WHERE qp.user_id = $1
        AND q.deadline IS NOT NULL
        AND q.deadline >= $2
        AND q.deadline <= $3
        AND q.status = 'active'
      ORDER BY q.deadline ASC`,
      [userId, start, end]
    );

    // Get checkin history
    const checkinEvents = await db.query(
      `SELECT 
        id,
        'checkin' as type,
        'チェックイン' as title,
        null as description,
        checkin_time as start_time,
        checkout_time as end_time,
        false as all_day,
        null as location,
        null as reminder_minutes,
        '#10b981' as color
      FROM checkins
      WHERE user_id = $1
        AND checkin_time >= $2
        AND checkin_time <= $3
      ORDER BY checkin_time ASC`,
      [userId, start, end]
    );

    const allEvents = [
      ...personalEvents.rows,
      ...questEvents.rows,
      ...checkinEvents.rows,
    ].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    res.json(allEvents);
  } catch (error) {
    next(error);
  }
});

// Create personal event
router.post('/events', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      startTime,
      endTime,
      allDay = false,
      location,
      reminderMinutes,
      color = '#3b82f6',
    } = req.body;

    if (!title || !startTime) {
      throw new AppError('Title and start time are required', 400);
    }

    const result = await db.query(
      `INSERT INTO calendar_events 
        (user_id, title, description, start_time, end_time, all_day, location, reminder_minutes, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        title,
        description,
        startTime,
        endTime,
        allDay,
        location,
        reminderMinutes,
        color,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update personal event
router.put('/events/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      allDay,
      location,
      reminderMinutes,
      color,
    } = req.body;

    const result = await db.query(
      `UPDATE calendar_events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           all_day = COALESCE($5, all_day),
           location = COALESCE($6, location),
           reminder_minutes = COALESCE($7, reminder_minutes),
           color = COALESCE($8, color),
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, description, startTime, endTime, allDay, location, reminderMinutes, color, id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event not found or access denied', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete personal event
router.delete('/events/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event not found or access denied', 404);
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
