-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own promo events" ON public.promo_events;

-- Create a new PERMISSIVE policy that allows anonymous inserts for analytics
CREATE POLICY "Anyone can insert promo events for analytics"
ON public.promo_events
FOR INSERT
WITH CHECK (
  -- Validate required fields
  session_id IS NOT NULL AND
  promo_code IS NOT NULL AND
  length(promo_code) <= 50 AND
  page_path IS NOT NULL AND
  length(page_path) <= 500 AND
  event_type = ANY (ARRAY['view', 'click', 'apply', 'purchase', 'dismiss'])
);