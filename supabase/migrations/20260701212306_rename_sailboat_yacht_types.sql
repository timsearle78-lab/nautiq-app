-- Migrate legacy boat types: Sailboat and Yacht → Keeler Yacht
UPDATE public.boats
SET type = 'Keeler Yacht'
WHERE type IN ('Sailboat', 'Yacht');
