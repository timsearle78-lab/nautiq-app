-- Watch items: things that need attention but aren't a maintenance log yet
CREATE TABLE IF NOT EXISTS maintenance_watch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id uuid NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  component_id uuid REFERENCES components(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  photo_urls text[] DEFAULT '{}',
  resolved_at timestamptz,
  resolved_maintenance_event_id uuid REFERENCES maintenance_events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_watch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watch items"
  ON maintenance_watch_items
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for watch item photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'watch-item-photos',
  'watch-item-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload watch item photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'watch-item-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own watch item photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'watch-item-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read watch item photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'watch-item-photos');

CREATE POLICY "Users can delete own watch item photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'watch-item-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
