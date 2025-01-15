/*
  # Fix meetings table structure

  1. Changes
    - Ensure meetings table exists with correct structure
    - Add missing columns if they don't exist
    - Set up proper constraints and defaults

  2. Security
    - Enable RLS on meetings table
    - Add policies for public read access
    - Add policies for authenticated write access
*/

-- Create meetings table if it doesn't exist
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  description text,
  content text,
  minutes_id uuid REFERENCES minutes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to meetings"
  ON meetings FOR SELECT
  TO public
  USING (true);

-- Admin write access
CREATE POLICY "Allow admin write access to meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');