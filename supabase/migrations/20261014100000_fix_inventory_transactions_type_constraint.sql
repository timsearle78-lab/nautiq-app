-- Add 'correct' to the allowed transaction types (was missing, causing Set to fail)
ALTER TABLE public.inventory_transactions
  DROP CONSTRAINT inventory_transactions_type_valid;

ALTER TABLE public.inventory_transactions
  ADD CONSTRAINT inventory_transactions_type_valid
  CHECK (transaction_type = ANY (ARRAY['add'::text, 'consume'::text, 'adjust'::text, 'import'::text, 'correct'::text]));

-- Update the RPC to also handle 'adjust' as an alias for 'correct'
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_inventory_item_id uuid,
  p_transaction_type text,
  p_quantity_delta numeric,
  p_notes text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  v_stored_delta numeric;
  v_boat_id uuid;
  v_user_id uuid;
BEGIN
  SELECT boat_id, user_id INTO v_boat_id, v_user_id
    FROM public.inventory_items WHERE id = p_inventory_item_id;

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
  ELSIF p_transaction_type IN ('correct', 'adjust') THEN
    v_stored_delta := p_quantity_delta;
    UPDATE public.inventory_items
      SET quantity = quantity + v_stored_delta
      WHERE id = p_inventory_item_id;
  ELSE
    RAISE EXCEPTION 'Invalid transaction_type: %', p_transaction_type;
  END IF;

  INSERT INTO public.inventory_transactions
    (inventory_item_id, transaction_type, quantity_delta, notes, boat_id, user_id)
  VALUES
    (p_inventory_item_id, p_transaction_type, v_stored_delta, p_notes, v_boat_id, v_user_id);
END;
$func$;
