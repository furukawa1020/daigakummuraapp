-- Migration: Initial schema
-- Created: 2025-11-08

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_state JSONB DEFAULT '{}',
  privacy_defaults JSONB DEFAULT '{"location": "quantized", "profile": "village", "diary": "village"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT email_or_username_required CHECK (email IS NOT NULL OR username IS NOT NULL)
);

-- Checkins table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_time TIMESTAMPTZ,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  CONSTRAINT valid_checkout CHECK (checkout_time IS NULL OR checkout_time >= checkin_time)
);

-- Partial unique index: only one active (unchecked-out) checkin per user
CREATE UNIQUE INDEX idx_checkins_active_user ON checkins(user_id) 
WHERE checkout_time IS NULL;

-- Indexes for checkins
CREATE INDEX idx_checkins_user_time ON checkins(user_id, checkin_time DESC);
CREATE INDEX idx_checkins_checkout ON checkins(checkout_time) WHERE checkout_time IS NOT NULL;

-- Avatar parts table
CREATE TABLE avatar_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL, -- hair, eyes, mouth, clothing, accessory, color
  name VARCHAR(100) NOT NULL,
  asset_url VARCHAR(500) NOT NULL,
  unlock_rule JSONB DEFAULT '{"type": "default"}',
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, name)
);

-- User avatar parts (unlocked parts)
CREATE TABLE user_avatar_parts (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  part_id UUID REFERENCES avatar_parts(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, part_id)
);

-- Quests table
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  location JSONB, -- {lat, lng, name}
  visibility VARCHAR(20) DEFAULT 'public', -- public, village, participants, private
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_quest_time CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE INDEX idx_quests_start ON quests(start_at);
CREATE INDEX idx_quests_creator ON quests(creator_id);

-- Quest participants
CREATE TABLE quest_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'joined', -- joined, completed, cancelled
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reflection TEXT,
  UNIQUE(quest_id, user_id)
);

CREATE INDEX idx_quest_participants_quest ON quest_participants(quest_id);
CREATE INDEX idx_quest_participants_user ON quest_participants(user_id);

-- Channels (for chat)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL, -- global, quest, dm
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_quest ON channels(quest_id) WHERE quest_id IS NOT NULL;

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  media_url VARCHAR(500),
  voice_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_channel_time ON messages(channel_id, created_at DESC);

-- Diary posts
CREATE TABLE diary_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  media_url VARCHAR(500),
  visibility VARCHAR(20) DEFAULT 'public', -- public, village, friends, private
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diary_posts_author ON diary_posts(author_id);
CREATE INDEX idx_diary_posts_created ON diary_posts(created_at DESC);

-- Reactions (for posts and messages)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type VARCHAR(20) NOT NULL, -- post, message
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- like, love, laugh, etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id, type)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

-- Calendar items
CREATE TABLE calendar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- personal, checkin, quest
  ref_id UUID, -- reference to quest_id or other entity
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  title VARCHAR(200) NOT NULL,
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_user_time ON calendar_items(user_id, starts_at);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Presence cache (for real-time location)
CREATE TABLE presence_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create global channel
INSERT INTO channels (id, type) VALUES (uuid_generate_v4(), 'global');
