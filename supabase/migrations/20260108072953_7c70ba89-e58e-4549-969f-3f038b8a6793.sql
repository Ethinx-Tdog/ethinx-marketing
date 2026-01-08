-- Drop existing trigger and function first
DROP TRIGGER IF EXISTS trigger_enqueue_paid_order ON public.orders;
DROP FUNCTION IF EXISTS public.enqueue_paid_order();

-- Update touch function (use existing update_updated_at_column or create touch_updated_at)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$;

-- Add trigger for order_queue if not exists
DROP TRIGGER IF EXISTS trg_order_queue_touch ON public.order_queue;
CREATE TRIGGER trg_order_queue_touch 
  BEFORE UPDATE ON public.order_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enqueue when order becomes paid with full payload
CREATE OR REPLACE FUNCTION public.enqueue_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.order_queue(order_id, payload) VALUES (
      NEW.id,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_token', NEW.order_token,
        'email', NEW.email,
        'package_name', NEW.package_name,
        'photo_count', NEW.photo_count,
        'promo_code', NEW.promo_code,
        'upload_prefix', concat('uploads/raw/', NEW.order_token, '/'),
        'result_prefix', concat('orders/results/', NEW.order_token, '/'),
        'zip_path', concat('orders/zips/', NEW.order_token, '.zip')
      )
    );
  END IF;
  RETURN NEW;
END; 
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trg_orders_enqueue ON public.orders;
CREATE TRIGGER trg_orders_enqueue 
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_on_paid();