-- Block anonymous (unauthenticated) access to sensitive tables
-- These policies require users to be logged in before any other policies apply

-- 1. Block anonymous access to user_profiles
CREATE POLICY "Block anonymous access to user_profiles"
ON public.user_profiles 
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Block anonymous access to order_emails
CREATE POLICY "Block anonymous access to order_emails"
ON public.order_emails
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Block anonymous access to promo_events
CREATE POLICY "Block anonymous access to promo_events"
ON public.promo_events
FOR SELECT
USING (auth.uid() IS NOT NULL);