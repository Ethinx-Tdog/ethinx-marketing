-- Remove the public upload policy that allows bypassing Edge Functions
-- Edge Functions use service role key, so this won't break functionality
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;