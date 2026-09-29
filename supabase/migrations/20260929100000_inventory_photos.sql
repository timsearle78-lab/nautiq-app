-- Add photo_urls column to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Create the inventory-photos storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-photos',
  'inventory-photos',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users can upload inventory photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inventory-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own photos
CREATE POLICY "Users can read own inventory photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'inventory-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read of all inventory photos (for public URLs)
CREATE POLICY "Public read inventory photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'inventory-photos');

-- Users can delete their own photos
CREATE POLICY "Users can delete own inventory photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inventory-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
