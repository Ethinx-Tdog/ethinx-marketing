-- Create order status enum
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'paid', 
  'processing',
  'completed',
  'failed',
  'refunded'
);

-- Create orders table for photo headshot orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User reference (nullable for guest checkout, but recommended)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer info
  email TEXT NOT NULL,
  
  -- Order details
  status order_status NOT NULL DEFAULT 'pending',
  
  -- Payment info
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Photo references (array of filenames in uploads bucket)
  photo_files TEXT[] NOT NULL DEFAULT '{}',
  
  -- Processed results (array of filenames in processed bucket)  
  result_files TEXT[] DEFAULT '{}',
  
  -- Package/product info
  package_name TEXT,
  photo_count INTEGER DEFAULT 0,
  
  -- Guest order access token (for non-authenticated order lookup)
  order_token UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders (authenticated)
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can create orders (authenticated users link to their account)
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow anonymous order creation (guest checkout)
-- The order_token provides secure access for guests
CREATE POLICY "Allow anonymous order creation" 
ON public.orders 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);

-- Policy: Service role has full access (for Edge Functions/webhooks)
-- This is implicit with service role key, but explicitly documented

-- Create index for faster lookups
CREATE INDEX idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_orders_email ON public.orders(email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_stripe_session ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_orders_order_token ON public.orders(order_token);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();