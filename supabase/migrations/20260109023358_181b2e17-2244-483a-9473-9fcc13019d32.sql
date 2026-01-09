-- Create dead-letter queue table for failed order finalization
CREATE TABLE public.order_dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  original_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT NOT NULL,
  failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retry_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_dlq ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to DLQ"
  ON public.order_dlq
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view and update DLQ entries
CREATE POLICY "Admins can view DLQ"
  ON public.order_dlq
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update DLQ"
  ON public.order_dlq
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for quick lookups
CREATE INDEX idx_order_dlq_order_id ON public.order_dlq(order_id);
CREATE INDEX idx_order_dlq_unresolved ON public.order_dlq(resolved_at) WHERE resolved_at IS NULL;