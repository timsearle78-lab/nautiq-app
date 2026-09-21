-- Boat syndicate / co-ownership
-- Owners can invite others via a short code; all members get full access.

-- Members table
CREATE TABLE IF NOT EXISTS public.boat_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id     uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (boat_id, user_id)
);

-- Invites table
CREATE TABLE IF NOT EXISTS public.boat_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id     uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at     timestamptz,
  used_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Helper: is the current user a member (not owner) of this boat?
CREATE OR REPLACE FUNCTION public.is_boat_member(p_boat_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boat_members
    WHERE boat_id = p_boat_id AND user_id = auth.uid()
  );
$$;

-- Helper: can the current user access this boat (owner OR member)?
CREATE OR REPLACE FUNCTION public.can_access_boat(p_boat_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boats WHERE id = p_boat_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.boat_members WHERE boat_id = p_boat_id AND user_id = auth.uid()
  );
$$;

-- RLS on boat_members
ALTER TABLE public.boat_members ENABLE ROW LEVEL SECURITY;

-- Boat owner or existing members can view members
CREATE POLICY "boat_members_select" ON public.boat_members
  FOR SELECT USING (can_access_boat(boat_id));

-- Only boat owner can add/remove members
CREATE POLICY "boat_members_insert" ON public.boat_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );

CREATE POLICY "boat_members_delete" ON public.boat_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );

-- RLS on boat_invites
ALTER TABLE public.boat_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boat_invites_select_owner" ON public.boat_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );

-- Anyone authenticated can read an invite by its code (to accept it)
CREATE POLICY "boat_invites_select_by_code" ON public.boat_invites
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "boat_invites_insert" ON public.boat_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );

CREATE POLICY "boat_invites_update" ON public.boat_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "boat_invites_delete" ON public.boat_invites
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.boats WHERE id = boat_id AND user_id = auth.uid())
  );

-- New SELECT policy on boats: allow members to select their shared boats
-- (existing owner SELECT policy stays; this is additive)
CREATE POLICY "boats_select_members" ON public.boats
  FOR SELECT USING (is_boat_member(id));

-- Members: full access to child tables
-- These are additive alongside existing owner policies.

-- systems
CREATE POLICY "systems_select_members" ON public.systems
  FOR SELECT USING (is_boat_member(boat_id));
CREATE POLICY "systems_insert_members" ON public.systems
  FOR INSERT WITH CHECK (is_boat_member(boat_id));
CREATE POLICY "systems_update_members" ON public.systems
  FOR UPDATE USING (is_boat_member(boat_id));
CREATE POLICY "systems_delete_members" ON public.systems
  FOR DELETE USING (is_boat_member(boat_id));

-- components
CREATE POLICY "components_select_members" ON public.components
  FOR SELECT USING (is_boat_member(boat_id));
CREATE POLICY "components_insert_members" ON public.components
  FOR INSERT WITH CHECK (is_boat_member(boat_id));
CREATE POLICY "components_update_members" ON public.components
  FOR UPDATE USING (is_boat_member(boat_id));
CREATE POLICY "components_delete_members" ON public.components
  FOR DELETE USING (is_boat_member(boat_id));

-- trips
CREATE POLICY "trips_select_members" ON public.trips
  FOR SELECT USING (is_boat_member(boat_id));
CREATE POLICY "trips_insert_members" ON public.trips
  FOR INSERT WITH CHECK (is_boat_member(boat_id));
CREATE POLICY "trips_update_members" ON public.trips
  FOR UPDATE USING (is_boat_member(boat_id));
CREATE POLICY "trips_delete_members" ON public.trips
  FOR DELETE USING (is_boat_member(boat_id));

-- maintenance_events
CREATE POLICY "maintenance_events_select_members" ON public.maintenance_events
  FOR SELECT USING (is_boat_member(boat_id));
CREATE POLICY "maintenance_events_insert_members" ON public.maintenance_events
  FOR INSERT WITH CHECK (is_boat_member(boat_id));
CREATE POLICY "maintenance_events_update_members" ON public.maintenance_events
  FOR UPDATE USING (is_boat_member(boat_id));
CREATE POLICY "maintenance_events_delete_members" ON public.maintenance_events
  FOR DELETE USING (is_boat_member(boat_id));

-- inventory_items
CREATE POLICY "inventory_items_select_members" ON public.inventory_items
  FOR SELECT USING (is_boat_member(boat_id));
CREATE POLICY "inventory_items_insert_members" ON public.inventory_items
  FOR INSERT WITH CHECK (is_boat_member(boat_id));
CREATE POLICY "inventory_items_update_members" ON public.inventory_items
  FOR UPDATE USING (is_boat_member(boat_id));
CREATE POLICY "inventory_items_delete_members" ON public.inventory_items
  FOR DELETE USING (is_boat_member(boat_id));
