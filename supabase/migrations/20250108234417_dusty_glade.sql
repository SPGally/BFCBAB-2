-- Insert test FAQ topics
INSERT INTO faq_topics (name, description, order_position)
VALUES 
  ('Matchday Experience', 'Questions about attending matches and the stadium experience', 0),
  ('Club Operations', 'Questions about how the club is run and managed', 1),
  ('Fan Engagement', 'Questions about how fans can get involved with the club', 2);

-- Insert test FAQs
INSERT INTO faqs (
  question,
  answer,
  topic_id,
  order_position,
  raised_by,
  created_at
)
SELECT
  'What improvements are planned for the catering facilities?',
  '<p>The club is actively working on improving the catering facilities at Oakwell. Short-term improvements include:</p><ul><li>Adding more food service points to reduce queues</li><li>Introducing a wider variety of food options</li><li>Implementing a new payment system to speed up service</li></ul><p>Long-term plans include a complete renovation of the main concourse facilities, expected to be completed by the start of next season.</p>',
  id,
  0,
  ARRAY['John Smith', 'Sarah Wilson'],
  NOW()
FROM faq_topics
WHERE name = 'Matchday Experience';

INSERT INTO faqs (
  question,
  answer,
  topic_id,
  order_position,
  raised_by,
  created_at
)
SELECT
  'How is the club improving communication with supporters?',
  '<p>The club has implemented several new communication channels and initiatives:</p><ul><li>Monthly fan forums with club executives</li><li>Regular updates through the official club website and social media</li><li>A new dedicated fan liaison team</li><li>Quarterly surveys to gather supporter feedback</li></ul><p>The Fan Advisory Board also plays a crucial role in ensuring two-way communication between the club and supporters.</p>',
  id,
  0,
  ARRAY['Mike Johnson', 'Emma Thompson'],
  NOW()
FROM faq_topics
WHERE name = 'Fan Engagement';

INSERT INTO faqs (
  question,
  answer,
  topic_id,
  order_position,
  raised_by,
  created_at
)
SELECT
  'What is being done to improve the academy structure?',
  '<p>The club is making significant investments in the academy:</p><ul><li>Upgrading training facilities</li><li>Expanding the scouting network</li><li>Hiring additional coaching staff</li><li>Creating stronger links with local schools and youth teams</li></ul><p>The goal is to develop more homegrown talent and create a sustainable pipeline of players for the first team.</p>',
  id,
  0,
  ARRAY['David Brown', 'Lisa Parker'],
  NOW()
FROM faq_topics
WHERE name = 'Club Operations';