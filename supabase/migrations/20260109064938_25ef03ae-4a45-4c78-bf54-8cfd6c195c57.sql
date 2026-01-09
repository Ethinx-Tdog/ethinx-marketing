-- Create deduct_credits function
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has credits record
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'usage', COALESCE(p_description, 'Credit usage'));

  RETURN TRUE;
END;
$$;

-- Create add_credits function for completeness
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert user_credits
  INSERT INTO user_credits (user_id, balance, total_earned, last_top_up)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + p_amount,
    total_earned = user_credits.total_earned + p_amount,
    last_top_up = NOW(),
    updated_at = NOW();

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, COALESCE(p_description, 'Credit added'));

  RETURN TRUE;
END;
$$;