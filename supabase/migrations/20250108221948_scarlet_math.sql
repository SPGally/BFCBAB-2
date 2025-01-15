/*
  # Add summary and pinned fields to news table

  1. Changes
    - Add `summary` column to news table for article summaries
    - Add `pinned` column to news table for pinning articles
    - Update existing rows with default values
*/

DO $$ 
BEGIN 
  -- Add summary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'summary'
  ) THEN 
    ALTER TABLE news ADD COLUMN summary text;
    -- Set existing summaries to first 200 characters of content
    UPDATE news SET summary = substring(content from 1 for 200);
  END IF;

  -- Add pinned column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'pinned'
  ) THEN 
    ALTER TABLE news ADD COLUMN pinned boolean DEFAULT false;
  END IF;
END $$;