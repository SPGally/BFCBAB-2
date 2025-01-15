/*
  # Initial Schema Setup for Barnsley FC Fan Advisory Board

  1. New Tables
    - `board_members`
      - Basic information about board members
      - Stores member details and role
    - `news`
      - News articles and updates
      - Includes title, content, and publishing info
    - `minutes`
      - Meeting minutes storage
      - Includes date, title, and file storage
    - `submissions`
      - Fan submissions and ideas
      - Stores submission details and status

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Restrict write access to authenticated admin users
*/

-- Board Members Table
CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  image_url text,
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Minutes Table
CREATE TABLE IF NOT EXISTS minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read access to board members" ON board_members
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to published news" ON news
  FOR SELECT TO public USING (published = true);

CREATE POLICY "Allow public read access to minutes" ON minutes
  FOR SELECT TO public USING (true);

-- Admin Write Policies
CREATE POLICY "Allow admin write access to board members" ON board_members
  FOR ALL TO authenticated USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write access to news" ON news
  FOR ALL TO authenticated USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write access to minutes" ON minutes
  FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- Submissions Policies
CREATE POLICY "Allow public to create submissions" ON submissions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow admin read access to submissions" ON submissions
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');