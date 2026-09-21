CREATE TABLE public.audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id       uuid REFERENCES public.boats(id) ON DELETE SET NULL,
  action        text NOT NULL,
  entity_type   text,
  entity_id     uuid,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_user_id_idx  ON public.audit_events(user_id, created_at DESC);
CREATE INDEX audit_events_boat_id_idx  ON public.audit_events(boat_id,  created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_deny_all" ON public.audit_events FOR ALL USING (false);
