/*
  # Add meetings table

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key)
      - `title` (text)
      - `date` (timestamptz)
      - `location` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `meetings` table
    - Add policy for public read access
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to meetings" ON meetings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin write access to meetings" ON meetings
  FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- Insert the first meeting
INSERT INTO meetings (title, date, location, description)
VALUES (
  'January Fan Advisory Board Meeting',
  '2024-01-27 18:00:00+00',
  'Oakwell Stadium',
  'Regular monthly meeting of the Fan Advisory Board to discuss ongoing initiatives and fan feedback.'
);