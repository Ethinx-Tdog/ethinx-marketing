-- Add promo metadata columns to orders table
ALTER TABLE public.orders 
ADD COLUMN promo_code TEXT,
ADD COLUMN promo_variant TEXT,
ADD COLUMN promo_group TEXT,
ADD COLUMN source_page TEXT;