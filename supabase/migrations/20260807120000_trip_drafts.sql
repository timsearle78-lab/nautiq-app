CREATE TABLE IF NOT EXISTS trip_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id uuid REFERENCES boats(id) ON DELETE CASCADE,
  -- raw inbound email
  email_from text,
  email_subject text,
  email_body text,
  -- AI-parsed fields
  parsed_started_at timestamptz,
  parsed_ended_at timestamptz,
  parsed_engine_hours numeric,
  parsed_fuel_litres numeric,
  parsed_notes text,
  parsed_issues text,
  -- lifecycle
  created_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz
);

ALTER TABLE trip_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip drafts"
  ON trip_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trip drafts"
  ON trip_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trip drafts"
  ON trip_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own trip drafts"
  ON trip_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Service role (used by webhook) can insert drafts
GRANT INSERT ON trip_drafts TO service_role;
GRANT SELECT ON trip_drafts TO service_role;
