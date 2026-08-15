-- Fix adjust_inventory_stock RPC: consume transactions were stored with a
-- positive quantity_delta, causing them to display as Added in history.
-- Correct behaviour:
--   add     -> positive delta, quantity increases
--   consume -> negative delta, quantity decreases
--   correct -> signed delta applied directly

CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_inventory_item_id uuid,
  p_transaction_type   text,
  p_quantity_delta     numeric,
  p_notes              text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_delta numeric;
BEGIN
  IF p_transaction_type = 'consume' THEN
    v_stored_delta := -abs(p_quantity_delta);
    UPDATE public.inventory_items
      SET quantity = GREATEST(0, quantity + v_stored_delta)
      WHERE id = p_inventory_item_id;
  ELSIF p_transaction_type = 'add' THEN
    v_stored_delta := abs(p_quantity_delta);
    UPDATE public.inventory_items
      SET quantity = quantity + v_stored_delta
      WHERE id = p_inventory_item_id;
  ELSIF p_transaction_type = 'correct' THEN
    v_stored_delta := p_quantity_delta;
    UPDATE public.inventory_items
      SET quantity = quantity + v_stored_delta
      WHERE id = p_inventory_item_id;
  ELSE
    RAISE EXCEPTION 'Invalid transaction_type: %', p_transaction_type;
  END IF;

  INSERT INTO public.inventory_transactions
    (inventory_item_id, transaction_type, quantity_delta, notes)
  VALUES
    (p_inventory_item_id, p_transaction_type, v_stored_delta, p_notes);
END;
$$;
