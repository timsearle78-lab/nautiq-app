-- Fix circular RLS on boat_members: can_access_boat() itself queries boat_members,
-- causing infinite recursion when checking SELECT on that table.
-- Replace with a direct uid check instead.

DROP POLICY IF EXISTS "boat_members_select" ON public.boat_members;

CREATE POLICY "boat_members_select" ON public.boat_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );
