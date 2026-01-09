-- Fix: Add caller authorization to transfer_credits function
-- This ensures only the account owner or an admin can transfer credits from an account

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
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Get caller's user ID
  v_caller_id := auth.uid();
  
  -- Check if caller is authorized (must be source user or admin)
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF v_caller_id != p_from_user_id THEN
    -- Check if caller is admin
    SELECT has_role(v_caller_id, 'admin') INTO v_is_admin;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
      RAISE EXCEPTION 'Unauthorized: Only account owner or admin can transfer credits';
    END IF;
  END IF;
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;
  
  -- Validate users are different
  IF p_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer credits to same account';
  END IF;

  -- Get sender's balance with lock
  SELECT balance INTO v_from_balance
  FROM user_credits
  WHERE user_id = p_from_user_id
  FOR UPDATE;
  
  -- Check if sender has credits record
  IF v_from_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;
  
  -- Check sufficient balance
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct from sender
  UPDATE user_credits
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_from_user_id;
  
  -- Add to receiver (upsert in case they don't have credits record)
  INSERT INTO user_credits (user_id, balance, total_earned)
  VALUES (p_to_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = user_credits.balance + p_amount,
    total_earned = user_credits.total_earned + p_amount,
    updated_at = now();
  
  -- Record transaction for sender
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_from_user_id, -p_amount, 'transfer_out', COALESCE(p_description, 'Transfer to ' || p_to_user_id::TEXT));
  
  -- Record transaction for receiver
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_to_user_id, p_amount, 'transfer_in', COALESCE(p_description, 'Transfer from ' || p_from_user_id::TEXT));
  
  RETURN TRUE;
END;
$$;