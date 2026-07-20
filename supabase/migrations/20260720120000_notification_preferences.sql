-- Notification preferences per user
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  health_summary text NOT NULL DEFAULT 'none' CHECK (health_summary IN ('none', 'daily', 'weekly')),
  health_summary_day smallint DEFAULT 1 CHECK (health_summary_day BETWEEN 0 AND 6), -- 0=Sun, 1=Mon … 6=Sat
  overdue_alerts boolean NOT NULL DEFAULT false,
  last_health_summary_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- Tracks when we last sent an overdue alert for a specific component
-- so we don't spam the user (re-sends at most every 7 days per component).
CREATE TABLE IF NOT EXISTS public.component_overdue_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, component_id)
);

ALTER TABLE public.component_overdue_notifications ENABLE ROW LEVEL SECURITY;

-- Service role only — managed by the edge function
CREATE POLICY "Service role manages overdue notifications"
  ON public.component_overdue_notifications FOR ALL USING (false);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------
-- pg_cron: run the send-notifications edge function daily at 08:00 UTC
-- Replace <PROJECT_REF> with your Supabase project reference ID
-- (found in Project Settings → General → Reference ID)
-- and set the SUPABASE_SERVICE_ROLE_KEY secret in the edge function config.
-- -----------------------------------------------------------------------

-- Enable required extensions (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if re-running this migration
SELECT cron.unschedule('nautiq-daily-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'nautiq-daily-notifications'
);

-- Schedule the daily notification job
-- NOTE: Update the URL below with your project reference before applying.
SELECT cron.schedule(
  'nautiq-daily-notifications',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Store the service role key in a postgres setting so pg_cron can use it.
-- Run this once in the SQL editor (not in a migration):
--   ALTER DATABASE postgres SET app.service_role_key = '<YOUR_SERVICE_ROLE_KEY>';
