-- ============================================================================
-- SECURITY HARDENING MIGRATION: Fix all RLS policies
-- ============================================================================

-- ============================================================================
-- 1. ORDER_QUEUE: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access to queue" ON public.order_queue;
CREATE POLICY "Service role full access to queue" ON public.order_queue
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 2. ORDER_DLQ: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access to DLQ" ON public.order_dlq;
CREATE POLICY "Service role full access to DLQ" ON public.order_dlq
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 3. JOB_RESPONSE_HISTORY: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access job history" ON public.job_response_history;
CREATE POLICY "Service role full access job history" ON public.job_response_history
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 4. CRON_HEARTBEATS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access heartbeats" ON public.cron_heartbeats;
CREATE POLICY "Service role full access heartbeats" ON public.cron_heartbeats
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 5. USER_ROLES: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access to user_roles" ON public.user_roles;
CREATE POLICY "Service role full access to user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 6. CREDIT_TRANSACTIONS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access transactions" ON public.credit_transactions;
CREATE POLICY "Service role full access transactions" ON public.credit_transactions
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 7. USER_CREDITS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access credits" ON public.user_credits;
CREATE POLICY "Service role full access credits" ON public.user_credits
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 8. USER_PROFILES: Fix service role policy + drop role column
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access profiles" ON public.user_profiles;
CREATE POLICY "Service role full access profiles" ON public.user_profiles
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Drop redundant role column from user_profiles
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS role;

-- ============================================================================
-- 9. ADMIN_AUDIT: Fix both INSERT and service role policies
-- ============================================================================
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit;
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 10. PROMO_EVENTS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Only service role can read promo events" ON public.promo_events;
CREATE POLICY "Only service role can read promo events" ON public.promo_events
FOR SELECT TO authenticated
USING (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Allow insert for any user" ON public.promo_events;
DROP POLICY IF EXISTS "Allow anonymous event tracking" ON public.promo_events;
-- Allow tracking events from authenticated users only
CREATE POLICY "Authenticated users can insert promo events" ON public.promo_events
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 11. ORDERS: Fix service role + anonymous access policies
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;
CREATE POLICY "Service role full access to orders" ON public.orders
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Remove anonymous order creation - require authentication
DROP POLICY IF EXISTS "Allow anonymous order creation" ON public.orders;
-- Anonymous users can only create orders (no SELECT)
-- Orders will be created by service role via edge functions

-- ============================================================================
-- 12. SUBSCRIPTIONS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access subscriptions" ON public.subscriptions
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- 13. PRICING_PLANS: Fix service role policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access plans" ON public.pricing_plans;
CREATE POLICY "Service role full access plans" ON public.pricing_plans
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);