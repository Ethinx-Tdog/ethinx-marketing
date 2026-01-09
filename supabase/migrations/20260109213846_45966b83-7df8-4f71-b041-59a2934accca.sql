-- Drop the legacy email column from orders table
-- Email data is now stored in the isolated order_emails table
ALTER TABLE public.orders DROP COLUMN IF EXISTS email;