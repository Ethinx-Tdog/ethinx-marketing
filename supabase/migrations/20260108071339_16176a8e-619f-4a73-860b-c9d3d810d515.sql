-- Create order_queue table for async processing pipeline
CREATE TABLE public.order_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL DEFAULT '{}',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for queue polling
CREATE INDEX idx_order_queue_status_created ON public.order_queue(status, created_at);
CREATE INDEX idx_order_queue_order_id ON public.order_queue(order_id);

-- Enable RLS
ALTER TABLE public.order_queue ENABLE ROW LEVEL SECURITY;

-- RLS: Only service role can access queue (backend processing only)
CREATE POLICY "Service role full access to queue"
ON public.order_queue
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_order_queue_updated_at
BEFORE UPDATE ON public.order_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to enqueue order when status changes to 'paid'
CREATE OR REPLACE FUNCTION public.enqueue_paid_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO public.order_queue (order_id, status, payload)
    VALUES (
      NEW.id,
      'queued',
      jsonb_build_object(
        'email', NEW.email,
        'order_token', NEW.order_token,
        'package_name', NEW.package_name,
        'photo_count', NEW.photo_count,
        'photo_files', NEW.photo_files,
        'promo_code', NEW.promo_code,
        'amount_cents', NEW.amount_cents
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on orders table for auto-enqueue
CREATE TRIGGER trigger_enqueue_paid_order
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_paid_order();

-- Create storage buckets for results and zips
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('results', 'results', false),
  ('zips', 'zips', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for results bucket (service role write, token-based read)
CREATE POLICY "Service role can upload results"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'results' AND auth.role() = 'service_role');

CREATE POLICY "Service role can manage results"
ON storage.objects
FOR ALL
USING (bucket_id = 'results' AND auth.role() = 'service_role');

-- Storage policies for zips bucket
CREATE POLICY "Service role can upload zips"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'zips' AND auth.role() = 'service_role');

CREATE POLICY "Service role can manage zips"
ON storage.objects
FOR ALL
USING (bucket_id = 'zips' AND auth.role() = 'service_role');