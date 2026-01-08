import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Mail,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  photo_files: string[];
  result_files: string[];
}

const STATUS_OPTIONS = ["pending", "paid", "processing", "completed", "failed", "refunded"];

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "Pending", color: "text-yellow-500", bg: "bg-yellow-500/20" },
  paid: { icon: CheckCircle, label: "Paid", color: "text-blue-500", bg: "bg-blue-500/20" },
  processing: { icon: RefreshCw, label: "Processing", color: "text-purple-500", bg: "bg-purple-500/20" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-green-500", bg: "bg-green-500/20" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500", bg: "bg-red-500/20" },
  refunded: { icon: RefreshCw, label: "Refunded", color: "text-muted-foreground", bg: "bg-muted" },
};

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      setOrder(data as Order);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      toast.error("Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === "paid" && !order.paid_at) {
        updates.paid_at = new Date().toISOString();
      }
      if (newStatus === "completed" && !order.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", order.id);

      if (error) throw error;
      
      setOrder({ ...order, ...updates } as Order);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update order:", err);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Order not found</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Order ${order.order_token.slice(0, 8)}`} description="Order details" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Order {order.order_token.slice(0, 8)}
              </h1>
              <p className="text-sm text-muted-foreground">{order.email}</p>
            </div>
          </div>
          <Badge className={cn("gap-1", statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Status Update */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Update Status</h2>
          <div className="flex items-center gap-4">
            <Select
              value={order.status}
              onValueChange={updateStatus}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span className="capitalize">{status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Order Details</h2>
            
            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Package</p>
                <p className="font-medium capitalize">{order.package_name || "—"}</p>
                {order.photo_count > 0 && (
                  <p className="text-sm text-muted-foreground">{order.photo_count} photos</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-bold text-gold">
                  {formatPrice(order.amount_cents, order.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Timeline</h2>
            
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {order.paid_at && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-medium">{formatDate(order.paid_at)}</p>
                </div>
              </div>
            )}

            {order.completed_at && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{formatDate(order.completed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stripe IDs */}
        {(order.stripe_session_id || order.stripe_payment_intent_id) && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">Stripe References</h2>
            <div className="space-y-2 text-sm">
              {order.stripe_session_id && (
                <div>
                  <span className="text-muted-foreground">Session ID: </span>
                  <code className="rounded bg-muted px-2 py-1">{order.stripe_session_id}</code>
                </div>
              )}
              {order.stripe_payment_intent_id && (
                <div>
                  <span className="text-muted-foreground">Payment Intent: </span>
                  <code className="rounded bg-muted px-2 py-1">{order.stripe_payment_intent_id}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files */}
        {(order.photo_files?.length > 0 || order.result_files?.length > 0) && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">Files</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {order.photo_files?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Uploaded Photos ({order.photo_files.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.photo_files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                      >
                        <Image className="h-3 w-3" />
                        {file.slice(0, 20)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {order.result_files?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Result Files ({order.result_files.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.result_files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                      >
                        <Image className="h-3 w-3" />
                        {file.slice(0, 20)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Token */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold">Order Token</h2>
          <code className="block rounded bg-muted p-3 text-sm">{order.order_token}</code>
          <p className="mt-2 text-xs text-muted-foreground">
            Customer can use this to check order status at /order-status
          </p>
        </div>
      </main>
    </div>
  );
}
