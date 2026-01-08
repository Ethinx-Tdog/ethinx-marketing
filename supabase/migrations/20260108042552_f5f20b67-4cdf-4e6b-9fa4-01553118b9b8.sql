-- Add ab_group column to promo_events table for A/B test tracking
ALTER TABLE public.promo_events 
ADD COLUMN ab_group TEXT;