-- Remove the anonymous insert policy that allows spam
DROP POLICY IF EXISTS "Anyone can insert promo events for analytics" ON promo_events;

-- Create new restrictive policy - only service role can insert
-- This works because the track-promo edge function uses sbAdmin (service role)
CREATE POLICY "Service role can insert promo events"
  ON promo_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Remove the old authenticated insert policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert promo events" ON promo_events;

-- Also tighten orders table - remove client-side insert capability
-- Orders should only be created by edge functions (service role)
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;