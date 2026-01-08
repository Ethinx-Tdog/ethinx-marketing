-- Create promo_events table for banner analytics
CREATE TABLE public.promo_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  promo_code TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'default',
  page_path TEXT NOT NULL,
  session_id TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (tracking doesn't require auth)
CREATE POLICY "Allow anonymous event tracking"
ON public.promo_events
FOR INSERT
WITH CHECK (true);

-- Allow service role to read all events
CREATE POLICY "Service role can read all events"
ON public.promo_events
FOR SELECT
USING (true);

-- Create index for common queries
CREATE INDEX idx_promo_events_event_type ON public.promo_events(event_type);
CREATE INDEX idx_promo_events_promo_code ON public.promo_events(promo_code);
CREATE INDEX idx_promo_events_created_at ON public.promo_events(created_at DESC);