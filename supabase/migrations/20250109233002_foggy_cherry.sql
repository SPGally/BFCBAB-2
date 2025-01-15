-- Add social media prompt columns to settings table
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS facebook_prompt text,
  ADD COLUMN IF NOT EXISTS instagram_prompt text;

-- Update default prompts
UPDATE settings
SET 
  twitter_prompt = 'I am a board member of the Barnsley FC Fan Advisory Board. Create a tweet that is professional yet engaging, aimed at football fans. Use emojis effectively - a red dot followed by white dot (🔴⚪) is a favorite among Barnsley fans! Keep the tone enthusiastic and community-focused.',
  facebook_prompt = 'I am a board member of the Barnsley FC Fan Advisory Board. Create a Facebook post that is informative and engaging. The tone should be professional but conversational, encouraging discussion and community engagement. Feel free to use formatting like paragraphs and bullet points for better readability. Include relevant emojis where appropriate.',
  instagram_prompt = 'I am a board member of the Barnsley FC Fan Advisory Board. Create an Instagram caption that is visually descriptive and engaging. Use relevant emojis and hashtags. The tone should be more casual and vibrant than other platforms while maintaining professionalism. Include our signature red and white dots (🔴⚪) where appropriate.'
WHERE id = 1;