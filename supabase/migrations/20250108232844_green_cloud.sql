/*
  # Add meetings storage bucket

  1. Changes
    - Create meetings storage bucket
    - Add storage policies for meetings bucket
*/

-- Create meetings storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('meetings', 'meetings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for meetings bucket
CREATE POLICY "Public can view meeting images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meetings');

CREATE POLICY "Authenticated users can upload meeting images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meetings' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update meeting images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'meetings' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete meeting images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meetings' 
    AND auth.role() = 'authenticated'
  );