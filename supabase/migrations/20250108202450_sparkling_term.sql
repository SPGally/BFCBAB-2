/*
  # Add email field to board members

  1. Changes
    - Add `email` column to `board_members` table
    - Make it optional since existing members might not have emails yet
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'board_members' AND column_name = 'email'
  ) THEN 
    ALTER TABLE board_members ADD COLUMN email text;
  END IF;
END $$;