-- Fix function search path for touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$;

-- The RLS warning is expected - order_queue intentionally uses service_role only access
-- This is correct for a backend-only queue table that should never be accessed by clients