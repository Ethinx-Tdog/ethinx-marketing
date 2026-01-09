-- Create heartbeat tracking table for cron monitoring
CREATE TABLE public.cron_heartbeats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL UNIQUE,
  last_beat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'warning', 'critical'
  last_result JSONB,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_heartbeats ENABLE ROW LEVEL SECURITY;

-- Only admins can view heartbeats
CREATE POLICY "Admins can view cron heartbeats"
ON public.cron_heartbeats
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for lookups
CREATE INDEX idx_cron_heartbeats_function_name ON public.cron_heartbeats(function_name);

-- Add trigger for updated_at
CREATE TRIGGER update_cron_heartbeats_updated_at
BEFORE UPDATE ON public.cron_heartbeats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial row for poll-queue
INSERT INTO public.cron_heartbeats (function_name, status) VALUES ('poll-queue', 'healthy');

COMMENT ON TABLE public.cron_heartbeats IS 'Tracks cron job health via heartbeats';