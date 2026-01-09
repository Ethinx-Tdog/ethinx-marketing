-- Add email_sent flag to admin_audit
ALTER TABLE public.admin_audit 
ADD COLUMN email_sent boolean DEFAULT false,
ADD COLUMN email_sent_at timestamptz;