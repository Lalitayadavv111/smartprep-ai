CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_student_id uuid,
  p_amount numeric,
  p_reference_id text,
  p_description text
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance numeric;
BEGIN
  UPDATE profiles SET wallet_balance = wallet_balance + p_amount
    WHERE id = p_student_id
    RETURNING wallet_balance INTO new_balance;

  INSERT INTO wallet_transactions (student_id, type, amount, balance_after, reference_id, description)
    VALUES (p_student_id, 'topup', p_amount, new_balance, p_reference_id, p_description);

  RETURN new_balance;
END;
$$;
