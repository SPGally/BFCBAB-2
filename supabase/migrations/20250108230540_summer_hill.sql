/*
  # Fix meeting and minutes relationship

  1. Changes
    - Drop existing foreign key constraints if they exist
    - Add minutes_id to meetings table
    - Add meeting_id to minutes table
    - Set up proper foreign key relationships
*/

DO $$ 
BEGIN
  -- Drop existing foreign key constraints if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_minutes_meeting'
  ) THEN
    ALTER TABLE minutes DROP CONSTRAINT fk_minutes_meeting;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_meeting_minutes'
  ) THEN
    ALTER TABLE meetings DROP CONSTRAINT fk_meeting_minutes;
  END IF;
END $$;

-- Add minutes_id to meetings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'minutes_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN minutes_id uuid;
  END IF;
END $$;

-- Add meeting_id to minutes if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'minutes' AND column_name = 'meeting_id'
  ) THEN
    ALTER TABLE minutes ADD COLUMN meeting_id uuid;
  END IF;
END $$;

-- Add foreign key constraints with deferred checks
ALTER TABLE meetings
  ADD CONSTRAINT fk_meeting_minutes
  FOREIGN KEY (minutes_id)
  REFERENCES minutes(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE minutes
  ADD CONSTRAINT fk_minutes_meeting
  FOREIGN KEY (meeting_id)
  REFERENCES meetings(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;