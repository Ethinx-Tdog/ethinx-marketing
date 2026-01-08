-- Allow any user to insert promo tracking events
CREATE POLICY "Allow insert for any user" ON public.promo_events
  FOR INSERT 
  WITH CHECK (true);