ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_fuel_source boolean NOT NULL DEFAULT false;
