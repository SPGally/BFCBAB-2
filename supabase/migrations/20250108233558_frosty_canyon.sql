/*
  # FAQ System Schema

  1. New Tables
    - `faq_topics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `order_position` (integer)
      - Timestamps
    
    - `faqs`
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer` (text)
      - `topic_id` (uuid, foreign key)
      - `author_id` (uuid, foreign key)
      - `order_position` (integer)
      - `minutes_refs` (uuid array)
      - `raised_by` (text array)
      - Timestamps

  2. Security
    - Enable RLS on both tables
    - Public read access
    - Admin write access
*/

-- Create FAQ Topics table
CREATE TABLE IF NOT EXISTS faq_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  topic_id uuid REFERENCES faq_topics(id) ON DELETE CASCADE,
  author_id uuid REFERENCES board_members(id),
  order_position integer DEFAULT 0,
  minutes_refs uuid[] DEFAULT '{}',
  raised_by text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to FAQ topics"
  ON faq_topics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to FAQs"
  ON faqs FOR SELECT
  TO public
  USING (true);

-- Admin write access policies
CREATE POLICY "Allow admin write access to FAQ topics"
  ON faq_topics FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write access to FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_faq_topics_updated_at
  BEFORE UPDATE ON faq_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();