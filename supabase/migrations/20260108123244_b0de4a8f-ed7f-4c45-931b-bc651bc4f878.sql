-- Create trigger to enqueue orders when status changes to 'paid'
CREATE TRIGGER enqueue_order_on_paid
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_on_paid();