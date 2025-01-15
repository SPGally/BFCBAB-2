/*
  # Make file_path nullable in minutes table

  1. Changes
    - Make file_path column nullable to allow editing without requiring a new file
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'minutes' 
    AND column_name = 'file_path' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE minutes ALTER COLUMN file_path DROP NOT NULL;
  END IF;
END $$;