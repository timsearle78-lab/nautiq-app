-- Add cost tracking to maintenance events and inventory transactions

ALTER TABLE maintenance_events
  ADD COLUMN IF NOT EXISTS cost numeric(10,2);

ALTER TABLE inventory_transactions
  ADD COLUMN IF NOT EXISTS cost numeric(10,2);

COMMENT ON COLUMN maintenance_events.cost IS 'Total cost of this maintenance job (labour + parts, in local currency)';
COMMENT ON COLUMN inventory_transactions.cost IS 'Total cost of this purchase/restock transaction (add transactions only)';
