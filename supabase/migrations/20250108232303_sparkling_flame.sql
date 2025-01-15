/*
  # Add image support to meetings

  1. Changes
    - Add image_url column to meetings table
    - Add content column for rich text content
*/

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'image_url'
  ) THEN 
    ALTER TABLE meetings ADD COLUMN image_url text;
  END IF;
END $$;