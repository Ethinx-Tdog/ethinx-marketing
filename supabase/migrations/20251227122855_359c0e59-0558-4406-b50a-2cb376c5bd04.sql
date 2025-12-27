-- Create storage buckets for uploads and processed images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('uploads', 'uploads', false),
  ('processed', 'processed', false);

-- RLS policies for uploads bucket - anyone can upload (for now, no auth)
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public read uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- RLS policies for processed bucket
CREATE POLICY "Allow public read processed" ON storage.objects
FOR SELECT USING (bucket_id = 'processed');

CREATE POLICY "Allow service role insert processed" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'processed');