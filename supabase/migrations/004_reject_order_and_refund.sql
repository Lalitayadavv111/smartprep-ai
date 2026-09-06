-- Migration 004: atomic order rejection + wallet refund
CREATE OR REPLACE FUNCTION public.reject_order_and_refund(p_order_id uuid)
RETURNS TABLE(refunded boolean, amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT id, student_id, total_amount, status, token_label
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.status NOT IN ('scheduled', 'placed', 'preparing', 'ready') THEN
    RAISE EXCEPTION 'INVALID_STATE';
  END IF;

  PERFORM public.credit_wallet(
    p_student_id   := v_order.student_id,
    p_amount       := v_order.total_amount,
    p_reference_id := 'refund_' || v_order.id,
    p_description  := 'Refund for cancelled order ' ||
                      COALESCE(v_order.token_label, v_order.id::text)
  );

  UPDATE public.orders
     SET status     = 'cancelled',
         updated_at = now()
   WHERE id = v_order.id;

  refunded := true;
  amount   := v_order.total_amount;
  RETURN NEXT;
END;
$$;
