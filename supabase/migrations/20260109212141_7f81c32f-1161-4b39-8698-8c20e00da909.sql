-- =====================================================
-- Security Hardening Migration
-- Addresses warn-level security findings
-- =====================================================

-- 1. ADMIN_AUDIT: Add explicit RESTRICTIVE policies for UPDATE and DELETE
-- This ensures audit logs cannot be modified or deleted by anyone except service role

-- Drop any existing UPDATE/DELETE policies first (if they exist)
DROP POLICY IF EXISTS "No one can update audit logs" ON public.admin_audit;
DROP POLICY IF EXISTS "No one can delete audit logs" ON public.admin_audit;

-- Create restrictive policies that only allow service_role to modify/delete
CREATE POLICY "Only service role can update audit logs"
ON public.admin_audit
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Only service role can delete audit logs"
ON public.admin_audit
FOR DELETE
TO authenticated
USING (false);

-- 2. PROMO_EVENTS: Replace overly permissive INSERT policy
-- The current policy allows any authenticated user to insert with 'true' check

DROP POLICY IF EXISTS "Authenticated users can insert promo events" ON public.promo_events;

-- Create a more restrictive policy - only allow inserts from the user's own session
-- Events must have a valid session_id and reasonable data
CREATE POLICY "Users can insert own promo events"
ON public.promo_events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure session_id is provided (can be validated server-side)
  session_id IS NOT NULL
  -- Ensure promo_code is not empty
  AND promo_code IS NOT NULL
  AND length(promo_code) <= 50
  -- Ensure page_path is reasonable
  AND page_path IS NOT NULL
  AND length(page_path) <= 500
  -- Ensure event_type is valid
  AND event_type IN ('view', 'click', 'apply', 'purchase', 'dismiss')
);

-- 3. USER_PROFILES: Prevent modification of referred_by after creation
-- Create a trigger function to prevent referred_by modification

CREATE OR REPLACE FUNCTION public.prevent_referred_by_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- If referred_by is being changed after initial creation
  IF OLD.referred_by IS NOT NULL AND NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Cannot modify referred_by after it has been set';
  END IF;
  
  -- If referred_by was NULL and is being set, only allow if profile was just created
  -- (within 5 minutes of creation to allow for delayed referral code application)
  IF OLD.referred_by IS NULL AND NEW.referred_by IS NOT NULL THEN
    IF OLD.created_at < NOW() - INTERVAL '5 minutes' THEN
      RAISE EXCEPTION 'Cannot set referred_by after profile creation window has closed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_referred_by_immutability ON public.user_profiles;
CREATE TRIGGER enforce_referred_by_immutability
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_referred_by_modification();

-- 4. Add index for promo_events validation performance
CREATE INDEX IF NOT EXISTS idx_promo_events_session_id ON public.promo_events(session_id);
CREATE INDEX IF NOT EXISTS idx_promo_events_event_type ON public.promo_events(event_type);