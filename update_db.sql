-- Run this in Supabase SQL Editor

-- Add max_plays column to games table (0 = unlimited)
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_plays INTEGER DEFAULT 0;

-- Add responses_link column to homework table (if not already added)
ALTER TABLE homework ADD COLUMN IF NOT EXISTS responses_link TEXT;
