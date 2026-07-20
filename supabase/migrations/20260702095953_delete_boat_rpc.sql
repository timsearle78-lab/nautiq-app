-- Add missing DELETE policy on maintenance_events
CREATE POLICY "Users can delete their own maintenance events"
  ON public.maintenance_events
  FOR DELETE
  USING (user_id = auth.uid());

-- SECURITY DEFINER function so the server action can delete a boat and all
-- related data in one call, bypassing per-table RLS edge cases.
CREATE OR REPLACE FUNCTION public.delete_boat_cascade(p_boat_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership before doing anything
  IF NOT EXISTS (
    SELECT 1 FROM public.boats WHERE id = p_boat_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Boat not found or permission denied';
  END IF;

  DELETE FROM public.maintenance_events WHERE boat_id = p_boat_id;
  DELETE FROM public.components        WHERE boat_id = p_boat_id;
  DELETE FROM public.systems           WHERE boat_id = p_boat_id;
  DELETE FROM public.trips             WHERE boat_id = p_boat_id;
  DELETE FROM public.inventory_items   WHERE boat_id = p_boat_id;
  DELETE FROM public.boats             WHERE id = p_boat_id AND user_id = p_user_id;
END;
$$;
