-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deduct_credits(UUID, INTEGER, TEXT);

-- Create add_credits function with transaction_id support
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get or create user credits record
  INSERT INTO user_credits (user_id, balance, total_earned, last_top_up)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + p_amount,
    total_earned = user_credits.total_earned + p_amount,
    last_top_up = NOW(),
    updated_at = NOW()
  RETURNING balance INTO current_balance;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'purchase',
    COALESCE(p_description, 'Credit purchase'),
    CASE WHEN p_transaction_id IS NOT NULL 
      THEN jsonb_build_object('transaction_id', p_transaction_id)
      ELSE '{}'::jsonb
    END
  );

  RETURN current_balance;
END;
$$;

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
  -- Get current balance with row lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has credits record
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if sufficient credits
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
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description
  ) VALUES (
    p_user_id,
    -p_amount,
    'usage',
    COALESCE(p_description, 'Credit usage')
  );

  RETURN TRUE;
END;
$$;

-- Create transfer_credits function for team sharing
CREATE OR REPLACE FUNCTION public.transfer_credits(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_balance INTEGER;
BEGIN
  -- Get sender's balance with lock
  SELECT balance INTO v_from_balance
  FROM user_credits
  WHERE user_id = p_from_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_from_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct from sender
  UPDATE user_credits
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_from_user_id;

  -- Add to receiver
  INSERT INTO user_credits (user_id, balance, total_earned)
  VALUES (p_to_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + p_amount,
    total_earned = user_credits.total_earned + p_amount,
    updated_at = NOW();

  -- Record both transactions
  INSERT INTO credit_transactions (user_id, amount, type, description) VALUES
    (p_from_user_id, -p_amount, 'usage', COALESCE(p_description, 'Credit transfer out')),
    (p_to_user_id, p_amount, 'referral', COALESCE(p_description, 'Credit transfer in'));

  RETURN TRUE;
END;
$$;

-- Create get_credit_balance function for easy queries
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(balance, 0)
  FROM user_credits
  WHERE user_id = p_user_id;
$$;