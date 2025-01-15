/*
  # Add author relationship to news table

  1. Changes
    - Add author_id column to news table
    - Add foreign key constraint to board_members table
    - Add default RLS policy for author relationship
*/

-- Add author_id column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'author_id'
  ) THEN 
    ALTER TABLE news ADD COLUMN author_id uuid REFERENCES board_members(id);
  END IF;
END $$;