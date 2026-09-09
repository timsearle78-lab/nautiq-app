-- Add fuel consumption rate to boats (litres per hour)
-- Used to estimate fuel used when a trip is logged without an explicit fuel figure.
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS fuel_consumption_lph numeric(6,2) DEFAULT NULL;
