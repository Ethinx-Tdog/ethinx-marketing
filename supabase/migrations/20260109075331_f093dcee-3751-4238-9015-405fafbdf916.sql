-- Fix RLS policies for all tables that are incorrectly publicly readable

-- 1. Fix promo_events - 'Only service role can read promo events' policy has USING (true)
DROP POLICY IF EXISTS "Only service role can read promo events" ON public.promo_events;
CREATE POLICY "Only service role can read promo events" 
ON public.promo_events 
FOR SELECT 
TO service_role
USING (true);

-- 2. Ensure order_queue is restricted to service role only
DROP POLICY IF EXISTS "Service role full access to queue" ON public.order_queue;
CREATE POLICY "Service role full access to queue" 
ON public.order_queue 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Add explicit deny for anon/authenticated if not already handled
DROP POLICY IF EXISTS "Admins can view order queue" ON public.order_queue;
CREATE POLICY "Admins can view order queue"
ON public.order_queue
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Ensure order_dlq is restricted properly
DROP POLICY IF EXISTS "Service role full access to DLQ" ON public.order_dlq;
CREATE POLICY "Service role full access to DLQ" 
ON public.order_dlq 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Ensure job_response_history is restricted
DROP POLICY IF EXISTS "Admins can view job response history" ON public.job_response_history;
CREATE POLICY "Admins can view job response history" 
ON public.job_response_history 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add service role access
DROP POLICY IF EXISTS "Service role full access job history" ON public.job_response_history;
CREATE POLICY "Service role full access job history"
ON public.job_response_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Ensure cron_heartbeats is restricted
DROP POLICY IF EXISTS "Admins can view cron heartbeats" ON public.cron_heartbeats;
CREATE POLICY "Admins can view cron heartbeats" 
ON public.cron_heartbeats 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add service role access
DROP POLICY IF EXISTS "Service role full access heartbeats" ON public.cron_heartbeats;
CREATE POLICY "Service role full access heartbeats"
ON public.cron_heartbeats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Fix user_roles - ensure only user and service role can read
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to user_roles" ON public.user_roles;
CREATE POLICY "Service role full access to user_roles" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Ensure credit_transactions has proper RLS (already has policies but verify TO clause)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" 
ON public.credit_transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.credit_transactions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role full access transactions" ON public.credit_transactions;
CREATE POLICY "Service role full access transactions" 
ON public.credit_transactions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Ensure user_credits has proper RLS
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" 
ON public.user_credits 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all credits" ON public.user_credits;
CREATE POLICY "Admins can view all credits" 
ON public.user_credits 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role full access credits" ON public.user_credits;
CREATE POLICY "Service role full access credits" 
ON public.user_credits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Ensure subscriptions has proper RLS
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access subscriptions" 
ON public.subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 10. Ensure orders has proper RLS - fix overly permissive service role policy
DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;
CREATE POLICY "Service role full access to orders" 
ON public.orders 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owner read/write" ON public.orders;
CREATE POLICY "Allow owner read/write" 
ON public.orders 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anonymous order creation" ON public.orders;
CREATE POLICY "Allow anonymous order creation" 
ON public.orders 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);