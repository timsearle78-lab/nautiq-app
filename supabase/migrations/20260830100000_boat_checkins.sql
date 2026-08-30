-- Boat check-ins: records when an owner visits / inspects their boat
CREATE TABLE IF NOT EXISTS boat_checkins (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id     uuid        NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at  date        NOT NULL DEFAULT CURRENT_DATE,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE boat_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their checkins"
  ON boat_checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS boat_checkins_boat_id_idx ON boat_checkins(boat_id);
CREATE INDEX IF NOT EXISTS boat_checkins_checked_at_idx ON boat_checkins(boat_id, checked_at DESC);
