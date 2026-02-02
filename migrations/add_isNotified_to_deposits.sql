-- Migration: Add isNotified column to deposits table
-- This column tracks whether a deposit notification has been sent to Discord channels
-- Run this on VPS: docker exec -i redfinger-postgres psql -U postgres -d redfinger < migrations/add_isNotified_to_deposits.sql

ALTER TABLE deposits ADD COLUMN IF NOT EXISTS is_notified BOOLEAN NOT NULL DEFAULT false;

-- Update existing success deposits as already notified (to prevent spam on existing records)
UPDATE deposits SET is_notified = true WHERE status = 'success';
