/*
  # Add sample meetings data

  1. Changes
    - Add sample upcoming and past meetings
    - Ensure meetings table has proper data for testing

  2. Security
    - No changes to security policies
*/

-- Insert sample meetings if none exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM meetings) THEN
    -- Upcoming meetings
    INSERT INTO meetings (title, date, location, description)
    VALUES 
      (
        'January Fan Advisory Board Meeting',
        '2024-01-27 18:00:00+00',
        'Oakwell Stadium',
        'Regular monthly meeting to discuss ongoing initiatives and fan feedback. Topics will include matchday experience improvements and community engagement programs.'
      ),
      (
        'February Fan Advisory Board Meeting',
        '2024-02-24 18:00:00+00',
        'Oakwell Stadium',
        'Monthly meeting focusing on supporter feedback and upcoming club initiatives.'
      ),
      (
        'March Fan Advisory Board Meeting',
        '2024-03-30 18:00:00+00',
        'Oakwell Stadium',
        'Spring meeting to review season progress and plan end-of-season activities.'
      );

    -- Past meetings (for testing the past meetings section)
    INSERT INTO meetings (title, date, location, description)
    VALUES 
      (
        'December Fan Advisory Board Meeting',
        '2023-12-16 18:00:00+00',
        'Oakwell Stadium',
        'End of year review meeting discussing achievements and setting goals for 2024.'
      ),
      (
        'November Fan Advisory Board Meeting',
        '2023-11-25 18:00:00+00',
        'Oakwell Stadium',
        'Discussion of winter initiatives and holiday period planning.'
      );
  END IF;
END $$;