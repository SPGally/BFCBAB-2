/*
  # Add meeting relationship columns

  1. Changes
    - Add content column to meetings table
    - Add meeting_id to minutes table
    - Add foreign key constraint
*/

-- Add content column to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS content text;

-- Add meeting_id to minutes
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS meeting_id uuid;

-- Add foreign key constraint with deferred check
ALTER TABLE minutes 
  ADD CONSTRAINT fk_minutes_meeting 
  FOREIGN KEY (meeting_id) 
  REFERENCES meetings(id)
  DEFERRABLE INITIALLY DEFERRED;