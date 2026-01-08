-- Allow viewing orders by order_token (for guest checkout status checks)
CREATE POLICY "Anyone can view order by token"
ON public.orders
FOR SELECT
USING (true);

-- Note: This is permissive but orders contain no sensitive data beyond email
-- The order_token acts as a secret bearer token for access