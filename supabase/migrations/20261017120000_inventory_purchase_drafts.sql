CREATE TABLE IF NOT EXISTS inventory_purchase_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id uuid REFERENCES boats(id) ON DELETE CASCADE,
  email_from text,
  email_subject text,
  email_body text,
  -- AI-parsed: array of {name, quantity, unit, price, notes}
  parsed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz
);

ALTER TABLE inventory_purchase_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchase drafts"
  ON inventory_purchase_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own purchase drafts"
  ON inventory_purchase_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own purchase drafts"
  ON inventory_purchase_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT INSERT ON inventory_purchase_drafts TO service_role;
GRANT SELECT ON inventory_purchase_drafts TO service_role;
