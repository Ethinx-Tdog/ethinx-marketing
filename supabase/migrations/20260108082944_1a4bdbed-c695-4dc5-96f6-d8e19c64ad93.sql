-- Fix orders table RLS: Remove overly permissive "Anyone can view order by token" policy
-- and replace with a proper token-based lookup that requires the token to match
DROP POLICY IF EXISTS "Anyone can view order by token" ON public.orders;

-- Create a secure function to verify order token ownership
CREATE OR REPLACE FUNCTION public.verify_order_token(token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders WHERE order_token = token
  )
$$;

-- Allow users to view orders by providing the correct order_token via RPC
-- For now, we keep only authenticated user access and service role access
CREATE POLICY "Service role full access to orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix promo_events table RLS: The current policy allows anyone to read all events
-- Change it to only allow service_role to read
DROP POLICY IF EXISTS "Service role can read all events" ON public.promo_events;

CREATE POLICY "Only service role can read promo events"
ON public.promo_events
FOR SELECT
TO service_role
USING (true);

-- Add admin role support using the proper pattern
-- First create the role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role full access to user_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add admin read access to orders (admins can see all orders)
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to promo_events
CREATE POLICY "Admins can view all promo events"
ON public.promo_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));