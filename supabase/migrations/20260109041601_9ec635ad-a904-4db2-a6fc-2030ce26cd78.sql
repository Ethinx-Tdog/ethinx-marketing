-- Add job response history table for tracking all Modal responses
CREATE TABLE public.job_response_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES public.order_queue(id) ON DELETE SET NULL,
  response_status TEXT NOT NULL, -- 'success', 'error', 'retry'
  response_code INTEGER,
  response_body JSONB,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_response_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view job response history
CREATE POLICY "Admins can view job response history"
ON public.job_response_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient queries
CREATE INDEX idx_job_response_history_order_id ON public.job_response_history(order_id);
CREATE INDEX idx_job_response_history_created_at ON public.job_response_history(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.job_response_history IS 'Tracks all Modal job responses for debugging and monitoring';