-- Create policy for owners to have full access to their own orders
CREATE POLICY "Allow owner read/write" ON public.orders
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);