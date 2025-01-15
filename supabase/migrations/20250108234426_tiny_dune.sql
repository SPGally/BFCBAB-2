-- Update test FAQs with minutes references
DO $$ 
DECLARE
  first_minute_id uuid;
  second_minute_id uuid;
  catering_faq_id uuid;
  communication_faq_id uuid;
  academy_faq_id uuid;
BEGIN
  -- Get the first two minutes IDs
  SELECT id INTO first_minute_id
  FROM minutes
  ORDER BY meeting_date DESC
  LIMIT 1;

  SELECT id INTO second_minute_id
  FROM minutes
  ORDER BY meeting_date DESC
  OFFSET 1
  LIMIT 1;

  -- Get FAQ IDs
  SELECT id INTO catering_faq_id
  FROM faqs
  WHERE question = 'What improvements are planned for the catering facilities?'
  LIMIT 1;

  SELECT id INTO communication_faq_id
  FROM faqs
  WHERE question = 'How is the club improving communication with supporters?'
  LIMIT 1;

  SELECT id INTO academy_faq_id
  FROM faqs
  WHERE question = 'What is being done to improve the academy structure?'
  LIMIT 1;

  -- Update catering facilities FAQ
  IF catering_faq_id IS NOT NULL AND first_minute_id IS NOT NULL THEN
    UPDATE faqs
    SET minutes_refs = ARRAY[first_minute_id]
    WHERE id = catering_faq_id;
  END IF;

  -- Update communication FAQ
  IF communication_faq_id IS NOT NULL AND first_minute_id IS NOT NULL AND second_minute_id IS NOT NULL THEN
    UPDATE faqs
    SET minutes_refs = ARRAY[first_minute_id, second_minute_id]
    WHERE id = communication_faq_id;
  END IF;

  -- Update academy FAQ
  IF academy_faq_id IS NOT NULL AND second_minute_id IS NOT NULL THEN
    UPDATE faqs
    SET minutes_refs = ARRAY[second_minute_id]
    WHERE id = academy_faq_id;
  END IF;
END $$;