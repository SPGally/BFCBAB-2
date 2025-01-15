-- Add TikTok prompt column to settings table
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS tiktok_prompt text;

-- Update default TikTok prompt
UPDATE settings
SET 
  tiktok_prompt = 'I am a board member of the Barnsley FC Fan Advisory Board. Create a TikTok caption that is trendy and engaging, perfect for video content. The tone should be casual and energetic, appealing to a younger audience while maintaining professionalism. Use relevant emojis and hashtags that resonate with football fans and the TikTok community.'
WHERE id = 1;