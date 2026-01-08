import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function CheckoutCancel() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <SEO 
        title="Checkout Cancelled" 
        description="Your checkout was cancelled"
      />
      
      <div className="mx-auto max-w-md space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground">
          Checkout Cancelled
        </h1>

        <p className="text-lg text-muted-foreground">
          No worries! Your order wasn't processed and you haven't been charged.
        </p>

        <p className="text-sm text-muted-foreground">
          If you experienced any issues, please{" "}
          <Link to="/contact" className="text-gold underline hover:no-underline">
            contact our support team
          </Link>
          .
        </p>

        <Button asChild variant="gold" className="mt-4">
          <Link to="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Pricing
          </Link>
        </Button>
      </div>
    </div>
  );
}
