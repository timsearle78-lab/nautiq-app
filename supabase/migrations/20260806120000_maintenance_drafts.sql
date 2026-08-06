CREATE TABLE IF NOT EXISTS maintenance_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id uuid REFERENCES boats(id) ON DELETE CASCADE,
  -- raw inbound email
  email_from text,
  email_subject text,
  email_body text,
  -- AI-parsed fields
  parsed_component_name text,
  parsed_work_done text,
  parsed_performed_at date,
  parsed_engine_hours numeric,
  parsed_vendor text,
  parsed_notes text,
  -- lifecycle
  created_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz
);

ALTER TABLE maintenance_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts"
  ON maintenance_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drafts"
  ON maintenance_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drafts"
  ON maintenance_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own drafts"
  ON maintenance_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Service role (used by webhook) can insert drafts
GRANT INSERT ON maintenance_drafts TO service_role;
GRANT SELECT ON maintenance_drafts TO service_role;
