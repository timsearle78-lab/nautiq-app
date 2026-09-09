-- Add hide_greeting preference to user_settings
-- Allows users to suppress the Personal Boat Assistant greeting card on the Home screen.
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS hide_greeting boolean NOT NULL DEFAULT false;
