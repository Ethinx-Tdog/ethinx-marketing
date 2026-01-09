-- Phase 1: Create order_emails table for email isolation
CREATE TABLE IF NOT EXISTS public.order_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_emails
CREATE POLICY "Service role full access order_emails" ON public.order_emails
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Owner can view own order email" ON public.order_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_emails.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order emails" ON public.order_emails
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Migrate existing emails to new table
INSERT INTO public.order_emails (order_id, email)
SELECT id, email FROM public.orders WHERE email IS NOT NULL
ON CONFLICT (order_id) DO NOTHING;

-- Phase 1.3: Create rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_log(identifier, endpoint, window_start);

-- RLS: Only service role
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only rate_limit" ON public.rate_limit_log
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Phase 2: Create secure RPC functions

-- 2.1 get_order_by_token - SECURITY DEFINER for public order lookup
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  SELECT 
    order_token,
    status,
    result_files,
    package_name,
    photo_count,
    created_at,
    user_id
  INTO v_order
  FROM public.orders
  WHERE order_token = p_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found', 'code', 'NOT_FOUND');
  END IF;
  
  -- For authenticated users, verify ownership
  -- For guest orders (user_id IS NULL), allow access with valid token
  IF v_order.user_id IS NOT NULL AND v_caller_id IS DISTINCT FROM v_order.user_id THEN
    -- Check if admin
    IF NOT has_role(v_caller_id, 'admin') THEN
      RETURN json_build_object('error', 'Unauthorized', 'code', 'UNAUTHORIZED');
    END IF;
  END IF;
  
  -- Return sanitized order data (no id, no email)
  RETURN json_build_object(
    'order_token', v_order.order_token,
    'status', v_order.status,
    'result_files', COALESCE(v_order.result_files, ARRAY[]::TEXT[]),
    'package_name', v_order.package_name,
    'photo_count', v_order.photo_count,
    'created_at', v_order.created_at
  );
END;
$$;

-- 2.2 get_user_orders - for authenticated dashboard
CREATE OR REPLACE FUNCTION public.get_user_orders(p_limit INTEGER DEFAULT 20)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_result JSON;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('error', 'Authentication required', 'code', 'AUTH_REQUIRED');
  END IF;
  
  SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  INTO v_result
  FROM (
    SELECT 
      order_token,
      status,
      amount_cents,
      currency,
      package_name,
      photo_count,
      created_at,
      paid_at,
      completed_at
    FROM public.orders
    WHERE user_id = v_caller_id
    ORDER BY created_at DESC
    LIMIT LEAST(p_limit, 100) -- Cap at 100
  ) sub;
  
  RETURN json_build_object('orders', v_result);
END;
$$;

-- 2.3 get_order_email - for admin/service use only
CREATE OR REPLACE FUNCTION public.get_order_email(p_order_token UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  -- Only allow admins or service role
  IF auth.role() != 'service_role' AND NOT has_role(v_caller_id, 'admin') THEN
    RETURN NULL;
  END IF;
  
  SELECT oe.email INTO v_email
  FROM public.order_emails oe
  JOIN public.orders o ON o.id = oe.order_id
  WHERE o.order_token = p_order_token;
  
  RETURN v_email;
END;
$$;

-- Phase 5: Rate limit alerting trigger
CREATE OR REPLACE FUNCTION public.log_rate_limit_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.blocked_at IS NOT NULL AND (OLD.blocked_at IS NULL OR OLD.blocked_at IS DISTINCT FROM NEW.blocked_at) THEN
    -- Log to admin_audit for alerting
    INSERT INTO public.admin_audit (
      action, 
      actor_user_id,
      metadata
    ) VALUES (
      'rate_limit_blocked',
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      jsonb_build_object(
        'identifier', NEW.identifier,
        'endpoint', NEW.endpoint,
        'request_count', NEW.request_count,
        'window_start', NEW.window_start
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_rate_limit_alert
AFTER UPDATE ON public.rate_limit_log
FOR EACH ROW
EXECUTE FUNCTION public.log_rate_limit_alert();

-- Grant execute permissions on RPCs
GRANT EXECUTE ON FUNCTION public.get_order_by_token(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_orders(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_email(UUID) TO authenticated;