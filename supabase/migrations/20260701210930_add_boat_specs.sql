ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS propulsion    text,
  ADD COLUMN IF NOT EXISTS hull_design   text,
  ADD COLUMN IF NOT EXISTS hull_material text,
  ADD COLUMN IF NOT EXISTS length_m      numeric,
  ADD COLUMN IF NOT EXISTS beam_m        numeric,
  ADD COLUMN IF NOT EXISTS draft_m       numeric;
