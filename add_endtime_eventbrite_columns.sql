-- Add endTime and eventbriteLink columns to events table
-- Run this in Supabase SQL Editor if you already have an events table

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS endTime TEXT,
ADD COLUMN IF NOT EXISTS eventbriteLink TEXT;

-- These columns are optional (nullable), so existing events will work fine

