-- =====================================================
-- Security Fix: Remove Public Read Access from Storage Buckets
-- Addresses: legacy_storage_public_read finding
-- =====================================================

-- 1. Drop the overly permissive public read policies
DROP POLICY IF EXISTS "Allow public read uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read processed" ON storage.objects;

-- 2. Create restrictive service-role-only policies for uploads bucket
CREATE POLICY "Service role full access uploads" ON storage.objects
FOR ALL
USING (bucket_id = 'uploads' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'service_role');

-- 3. Create restrictive service-role-only policies for processed bucket
-- First drop the existing insert-only policy to replace with full access
DROP POLICY IF EXISTS "Allow service role insert processed" ON storage.objects;

CREATE POLICY "Service role full access processed" ON storage.objects
FOR ALL
USING (bucket_id = 'processed' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'processed' AND auth.role() = 'service_role');