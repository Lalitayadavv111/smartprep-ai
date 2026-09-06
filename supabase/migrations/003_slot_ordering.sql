-- 1. Add scheduled status to orders
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'scheduled';

-- 2. Add scheduled_for column to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz DEFAULT NULL;

-- 3. Create time_slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_time time NOT NULL,
  capacity  int  NOT NULL DEFAULT 8,
  is_active boolean NOT NULL DEFAULT true
);

-- 4. Seed 15-min slots from 8:00am to 8:00pm
INSERT INTO public.time_slots (slot_time)
  generate_series('08:00'::time, '21:30'::time, '15 minutes'::interval)::time
  ON CONFLICT DO NOTHING;

-- 5. RLS on time_slots — anyone authenticated can read
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_slots_read" ON public.time_slots
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Update place_order() to accept p_scheduled_for
--    Keep ALL existing logic exactly as is.
--    Add p_scheduled_for parameter (DEFAULT NULL).
--    In INSERT into orders: scheduled_for = p_scheduled_for
--    Status assignment:
--      IF p_scheduled_for IS NOT NULL THEN v_status := 'scheduled';
--      ELSE v_status := 'placed'; END IF;
--    Token generation: only assign token when v_status = 'placed'.
--    When scheduled, set token_number = NULL, token_label = NULL.
--    In RETURN: scheduled_for, status
CREATE OR REPLACE FUNCTION public.place_order(
  p_student_id  uuid,
  p_items       jsonb,
  p_notes       text    DEFAULT NULL,
  p_scheduled_for timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item          jsonb;
  v_menu_item     record;
  v_total         numeric := 0;
  v_order_id      uuid;
  v_token         int;
  v_token_label   text;
  v_balance       numeric;
  v_new_balance   numeric;
  v_status        order_status;
BEGIN
  -- Validate items array
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_ITEMS';
  END IF;

  -- Validate each item and compute total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT id, price, is_available
      INTO v_menu_item
      FROM menu_items
     WHERE id = (v_item->>'menu_item_id')::uuid;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_ITEMS';
    END IF;

    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'ITEM_NOT_AVAILABLE';
    END IF;

    v_total := v_total + v_menu_item.price * (v_item->>'quantity')::int;
  END LOOP;

  -- Check wallet balance
  SELECT wallet_balance INTO v_balance
    FROM profiles
   WHERE id = p_student_id
   FOR UPDATE;

  IF v_balance < v_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  -- Determine status and token
  IF p_scheduled_for IS NOT NULL THEN
    v_status      := 'scheduled';
    v_token       := NULL;
    v_token_label := NULL;
  ELSE
    v_status := 'placed';

    -- Upsert daily token counter and get next token
    INSERT INTO daily_token_counter (date, last_token)
      VALUES (CURRENT_DATE, 0)
      ON CONFLICT (date) DO NOTHING;

    UPDATE daily_token_counter
       SET last_token = last_token + 1
     WHERE date = CURRENT_DATE
    RETURNING last_token INTO v_token;

    v_token_label := 'T-' || LPAD(v_token::text, 3, '0');
  END IF;

  -- Deduct wallet balance
  UPDATE profiles
     SET wallet_balance = wallet_balance - v_total
   WHERE id = p_student_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Insert order
  INSERT INTO orders (
    student_id, token_number, token_label, status,
    total_amount, notes, scheduled_for
  )
  VALUES (
    p_student_id, v_token, v_token_label, v_status,
    v_total, p_notes, p_scheduled_for
  )
  RETURNING id INTO v_order_id;

  -- Insert order items and deduct wallet transaction
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT id, name, price INTO v_menu_item
      FROM menu_items
     WHERE id = (v_item->>'menu_item_id')::uuid;

    INSERT INTO order_items (
      order_id, menu_item_id, item_name, item_price, quantity
    )
    VALUES (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_menu_item.price,
      (v_item->>'quantity')::int
    );
  END LOOP;

  -- Record wallet deduction
  INSERT INTO wallet_transactions (
    student_id, type, amount, balance_after, description
  )
  VALUES (
    p_student_id, 'deduction', v_total, v_new_balance,
    'Order ' || v_order_id::text
  );

  RETURN jsonb_build_object(
    'order_id',      v_order_id,
    'token_number',  v_token,
    'token_label',   v_token_label,
    'total_amount',  v_total,
    'new_balance',   v_new_balance,
    'scheduled_for', p_scheduled_for,
    'status',        v_status
  );
END;
$$;

-- 7. Create slot availability function
CREATE OR REPLACE FUNCTION public.get_slot_availability(
  p_date date
) RETURNS TABLE(slot_time time, capacity int, booked int, available int)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ts.slot_time,
    ts.capacity,
    COUNT(o.id)::int   AS booked,
    GREATEST(0, ts.capacity - COUNT(o.id)::int) AS available
  FROM public.time_slots ts
  LEFT JOIN public.orders o
    ON  o.scheduled_for::date = p_date
    AND o.scheduled_for::time >= ts.slot_time
    AND o.scheduled_for::time <  ts.slot_time + interval '15 minutes'
    AND o.status NOT IN ('cancelled')
  WHERE ts.is_active = true
  GROUP BY ts.slot_time, ts.capacity
  ORDER BY ts.slot_time;
$$;

-- 8. Create activate_slot function (admin only)
CREATE OR REPLACE FUNCTION public.activate_slot(
  p_slot_datetime timestamptz
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
  v_token int;
  v_order RECORD;
BEGIN
  v_count := 0;

  FOR v_order IN
    SELECT id FROM public.orders
     WHERE status = 'scheduled'
       AND scheduled_for >= p_slot_datetime
       AND scheduled_for <  p_slot_datetime + interval '15 minutes'
     ORDER BY created_at ASC
  LOOP
    UPDATE daily_token_counter
       SET last_token = last_token + 1
     WHERE date = CURRENT_DATE
    RETURNING last_token INTO v_token;

    UPDATE public.orders
       SET status      = 'placed',
           token_number = v_token,
           token_label  = 'T-' || LPAD(v_token::text, 3, '0'),
           updated_at   = now()
     WHERE id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
