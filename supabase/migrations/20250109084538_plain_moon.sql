/*
  # Add settings table for system configuration

  1. New Tables
    - `settings`
      - `id` (integer, primary key)
      - `twitter_prompt` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `settings` table
    - Add policies for authenticated users to manage settings
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  twitter_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Allow admin read access to settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write access to settings"
  ON settings FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO settings (twitter_prompt)
VALUES (
  'I am a board member of the Barnsley FC Fan Advisory Board. I would like to generate a tweet in a professional yet fun sounding way aimed at football fans. Include some emojis. A red dot followed by white dot is a favourite to use with barnsley fans! Here is the news article'
) ON CONFLICT (id) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();