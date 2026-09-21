-- Add 'daily_always' and 'weekly_always' variants to health_summary
-- so users can receive the summary email regardless of whether issues exist.

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS notification_preferences_health_summary_check;

ALTER TABLE public.user_settings
  ADD CONSTRAINT notification_preferences_health_summary_check
  CHECK (health_summary IN ('none', 'daily', 'weekly', 'daily_always', 'weekly_always'));
