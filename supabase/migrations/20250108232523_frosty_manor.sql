/*
  # Update meetings description to use rich text

  1. Changes
    - Add rich_description column to meetings table
    - Keep description column for backward compatibility
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'rich_description'
  ) THEN 
    ALTER TABLE meetings ADD COLUMN rich_description text;
  END IF;
END $$;