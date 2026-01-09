-- Create get_user_credit_summary function for dashboard
CREATE OR REPLACE FUNCTION public.get_user_credit_summary(p_user_id UUID)
RETURNS TABLE(
  balance INTEGER,
  total_earned INTEGER,
  total_spent INTEGER,
  last_transaction TIMESTAMPTZ,
  monthly_usage JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.balance,
    uc.total_earned,
    uc.total_spent,
    MAX(ct.created_at) as last_transaction,
    jsonb_build_object(
      'this_month', COALESCE(SUM(CASE 
        WHEN ct.type = 'usage' 
        AND ct.created_at >= date_trunc('month', CURRENT_DATE) 
        THEN ABS(ct.amount) END), 0)::INTEGER,
      'last_month', COALESCE(SUM(CASE 
        WHEN ct.type = 'usage' 
        AND ct.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        AND ct.created_at < date_trunc('month', CURRENT_DATE)
        THEN ABS(ct.amount) END), 0)::INTEGER
    ) as monthly_usage
  FROM user_credits uc
  LEFT JOIN credit_transactions ct ON uc.user_id = ct.user_id
  WHERE uc.user_id = p_user_id
  GROUP BY uc.balance, uc.total_earned, uc.total_spent;
END;
$$;