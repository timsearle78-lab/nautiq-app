-- Add photo_urls column to maintenance_events
ALTER TABLE maintenance_events ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Create the maintenance-photos storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-photos',
  'maintenance-photos',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for maintenance-photos bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload maintenance photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'maintenance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own photos
CREATE POLICY "Users can read own maintenance photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'maintenance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read of all maintenance photos (for public URLs)
CREATE POLICY "Public read maintenance photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'maintenance-photos');

-- Users can delete their own photos
CREATE POLICY "Users can delete own maintenance photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'maintenance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
