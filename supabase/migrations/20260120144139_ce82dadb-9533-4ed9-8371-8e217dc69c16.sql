-- Fix Critical Security Issues: Remove overly permissive "Block anonymous access" policies
-- These policies allow ANY authenticated user to read data that should be restricted

-- 1. Drop the problematic policy on user_profiles
DROP POLICY IF EXISTS "Block anonymous access to user_profiles" ON public.user_profiles;

-- 2. Drop the problematic policy on order_emails  
DROP POLICY IF EXISTS "Block anonymous access to order_emails" ON public.order_emails;

-- 3. Drop the problematic policy on promo_events
DROP POLICY IF EXISTS "Block anonymous access to promo_events" ON public.promo_events;

-- The existing restrictive policies will now be the only ones controlling access:
-- - user_profiles: "Users can view own profile" (auth.uid() = user_id)
-- - order_emails: "Owner can view own order email" (checks order ownership)
-- - promo_events: "Only service role can read promo events" + "Admins can view all promo events"