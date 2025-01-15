-- Drop the enum type and convert status to text
ALTER TABLE submissions 
  ALTER COLUMN status TYPE text;

-- Set default status for new submissions
ALTER TABLE submissions 
  ALTER COLUMN status SET DEFAULT 'new';

-- Drop the enum type if it exists
DROP TYPE IF EXISTS submission_status;