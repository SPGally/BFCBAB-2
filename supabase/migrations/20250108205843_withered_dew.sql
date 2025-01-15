/*
  # Add initial meeting data

  1. Changes
    - Insert the first FAB meeting for January 2024
*/

-- Insert the first meeting if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM meetings 
    WHERE date = '2024-01-27 18:00:00+00'::timestamptz
  ) THEN 
    INSERT INTO meetings (title, date, location, description)
    VALUES (
      'January Fan Advisory Board Meeting',
      '2024-01-27 18:00:00+00',
      'Oakwell Stadium',
      'Regular monthly meeting of the Fan Advisory Board to discuss ongoing initiatives and fan feedback.'
    );
  END IF;
END $$;