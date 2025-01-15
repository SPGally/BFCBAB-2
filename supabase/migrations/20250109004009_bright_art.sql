-- Add topics support to submissions
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES faq_topics(id),
  ADD COLUMN IF NOT EXISTS search_text tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS submissions_search_idx ON submissions USING gin(search_text);

-- Create function to update search text
CREATE OR REPLACE FUNCTION submissions_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_text := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.message, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search updates
DROP TRIGGER IF EXISTS submissions_search_trigger ON submissions;
CREATE TRIGGER submissions_search_trigger
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION submissions_search_update();

-- Update existing rows
UPDATE submissions SET search_text = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(subject, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(message, '')), 'C');