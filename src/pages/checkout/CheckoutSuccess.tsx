import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Mail, ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderToken = searchParams.get("order");

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <SEO 
        title="Order Confirmed" 
        description="Your headshot order has been confirmed"
      />
      
      <div className="mx-auto max-w-md space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground">
          Payment Successful!
        </h1>

        <p className="text-lg text-muted-foreground">
          Thank you for your order. We've sent a confirmation email with your order details.
        </p>

        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span>Check your inbox for next steps</span>
          </div>
        </div>

        {orderToken && (
          <p className="text-sm text-muted-foreground">
            Order reference: <code className="rounded bg-muted px-2 py-1">{orderToken.slice(0, 8)}</code>
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          {orderToken && (
            <Button asChild variant="gold">
              <Link to={`/order-status?token=${orderToken}`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                View Order Status
              </Link>
            </Button>
          )}
          
          <Button asChild variant="outline">
            <Link to="/">
              Back to Home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
