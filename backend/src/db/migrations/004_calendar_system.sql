-- Migration: Calendar system
-- Created: 2025-11-09

-- Calendar events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(500),
  reminder_minutes INTEGER,
  color VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_end_time CHECK (end_time IS NULL OR end_time >= start_time)
);

-- Indexes for performance
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time DESC);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);

-- Add deadline field to quests table if not exists
ALTER TABLE quests ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
