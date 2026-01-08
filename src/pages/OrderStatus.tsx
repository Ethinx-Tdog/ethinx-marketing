import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_token: string;
  email: string;
  package_name: string;
  photo_count: number;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "Awaiting Payment", color: "text-yellow-500", bg: "bg-yellow-500/20" },
  paid: { icon: CheckCircle, label: "Payment Received", color: "text-blue-500", bg: "bg-blue-500/20" },
  processing: { icon: RefreshCw, label: "Processing Your Photos", color: "text-purple-500", bg: "bg-purple-500/20" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-green-500", bg: "bg-green-500/20" },
  failed: { icon: XCircle, label: "Payment Failed", color: "text-red-500", bg: "bg-red-500/20" },
  refunded: { icon: RefreshCw, label: "Refunded", color: "text-muted-foreground", bg: "bg-muted" },
};

export default function OrderStatus() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrder = async (orderToken: string) => {
    if (!orderToken.trim()) {
      setError("Please enter an order token");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { data, error: dbError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_token", orderToken.trim())
        .maybeSingle();

      if (dbError) {
        throw new Error("Failed to fetch order");
      }

      if (!data) {
        setError("Order not found. Please check your order token.");
        setOrder(null);
      } else {
        setOrder(data as Order);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      fetchOrder(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(token);
  };

  const statusConfig = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null;
  const StatusIcon = statusConfig?.icon || Clock;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <SEO
        title="Order Status"
        description="Check the status of your headshot order"
      />

      <div className="mx-auto max-w-lg">
        <Link
          to="/"
          className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
          Order Status
        </h1>
        <p className="mb-8 text-muted-foreground">
          Enter your order token to check the status of your headshot order.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
          <Input
            type="text"
            placeholder="Enter order token..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1 bg-card"
          />
          <Button type="submit" variant="gold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
          </Button>
        </form>

        {/* Error state */}
        {error && hasSearched && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Order details */}
        {order && statusConfig && (
          <div className="space-y-6">
            {/* Status banner */}
            <div className={cn("rounded-lg p-6 text-center", statusConfig.bg)}>
              <div className={cn("mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full", statusConfig.bg)}>
                <StatusIcon className={cn("h-8 w-8", statusConfig.color)} />
              </div>
              <h2 className={cn("text-xl font-bold", statusConfig.color)}>
                {statusConfig.label}
              </h2>
            </div>

            {/* Order info card */}
            <div className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-medium capitalize text-foreground">
                    {order.package_name} ({order.photo_count} photos)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="font-bold text-gold">
                    {formatPrice(order.amount_cents, order.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordered</p>
                  <p className="font-medium text-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {order.paid_at && (
                <div className="border-t border-border/50 pt-4">
                  <p className="text-sm text-muted-foreground">Payment Received</p>
                  <p className="font-medium text-foreground">
                    {formatDate(order.paid_at)}
                  </p>
                </div>
              )}

              {order.completed_at && (
                <div className="border-t border-border/50 pt-4">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium text-foreground">
                    {formatDate(order.completed_at)}
                  </p>
                </div>
              )}

              <div className="border-t border-border/50 pt-4">
                <p className="text-sm text-muted-foreground">Order Reference</p>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {order.order_token.slice(0, 8)}
                </code>
              </div>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-muted-foreground">
              Questions about your order?{" "}
              <Link to="/contact" className="text-gold underline hover:no-underline">
                Contact support
              </Link>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!order && !error && !isLoading && !hasSearched && (
          <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Enter your order token above to view your order status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
