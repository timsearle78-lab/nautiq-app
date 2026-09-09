-- Rename notification_preferences to user_settings (better reflects its growing scope)
ALTER TABLE public.notification_preferences RENAME TO user_settings;

-- Rename the unique index/constraint
ALTER INDEX IF EXISTS notification_preferences_user_id_key RENAME TO user_settings_user_id_key;

-- Rename the updated_at trigger
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rename RLS policies
ALTER POLICY "Users can view own notification preferences" ON public.user_settings RENAME TO "Users can view own user settings";
ALTER POLICY "Users can insert own notification preferences" ON public.user_settings RENAME TO "Users can insert own user settings";
ALTER POLICY "Users can update own notification preferences" ON public.user_settings RENAME TO "Users can update own user settings";
