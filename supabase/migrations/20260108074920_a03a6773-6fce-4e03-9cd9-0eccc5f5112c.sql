-- Create storage bucket for order results and zips
INSERT INTO storage.buckets (id, name, public)
VALUES ('orders', 'orders', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for orders bucket

-- Service role can do everything
CREATE POLICY "Service role full access to orders bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'orders' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'orders' AND auth.role() = 'service_role');

-- Users can read their own order files (by order_token in path)
CREATE POLICY "Users can read order files via signed URL"
ON storage.objects
FOR SELECT
USING (bucket_id = 'orders');