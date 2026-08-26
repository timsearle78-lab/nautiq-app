-- Add hide_whats_new preference to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS hide_whats_new boolean NOT NULL DEFAULT false;
