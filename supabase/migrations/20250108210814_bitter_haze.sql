/*
  # Set up storage buckets for files and images

  1. New Storage Buckets
    - `minutes` for PDF files
    - `news-images` for article images

  2. Security
    - Enable public read access
    - Restrict write access to authenticated users
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('minutes', 'minutes', true),
  ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for minutes bucket
CREATE POLICY "Public can view minutes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'minutes');

CREATE POLICY "Authenticated users can upload minutes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'minutes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update minutes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'minutes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete minutes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'minutes' 
    AND auth.role() = 'authenticated'
  );

-- Set up storage policies for news images bucket
CREATE POLICY "Public can view news images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'news-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update news images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'news-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete news images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'news-images' 
    AND auth.role() = 'authenticated'
  );