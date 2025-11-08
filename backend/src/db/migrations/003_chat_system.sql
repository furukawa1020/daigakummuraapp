-- Migration: Chat system
-- Created: 2025-11-09

-- Chat channels table
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL, -- 'global', 'quest', 'dm'
  name VARCHAR(100),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_channel_type CHECK (type IN ('global', 'quest', 'dm')),
  CONSTRAINT quest_channel_has_quest_id CHECK (type != 'quest' OR quest_id IS NOT NULL)
);

-- Channel members table
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'image'
  media_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'voice', 'image'))
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_channel_time ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);

-- Create global channel
INSERT INTO chat_channels (type, name) 
VALUES ('global', '全体チャット');

-- Add all existing users to global channel
INSERT INTO channel_members (channel_id, user_id)
SELECT 
  (SELECT id FROM chat_channels WHERE type = 'global' LIMIT 1),
  id
FROM users;
