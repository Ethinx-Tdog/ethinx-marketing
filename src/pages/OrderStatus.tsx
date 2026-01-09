import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UploadButton } from "@/components/UploadButton";
import { ResultsGallery } from "@/components/ResultsGallery";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrderData {
  order_token: string;
  status: string;
  result_files: string[];
  package_name: string | null;
  photo_count: number;
  created_at: string;
  error?: string;
  code?: string;
}

export default function OrderStatus() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use secure RPC instead of direct table query
        const { data, error: rpcError } = await supabase.rpc("get_order_by_token", {
          p_token: token,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        // Check for application-level errors from the RPC
        const result = data as unknown as OrderData | null;
        if (result?.error) {
          if (result.code === "NOT_FOUND") {
            setError("Order not found. Please check your order link.");
          } else if (result.code === "UNAUTHORIZED") {
            setError("You don't have permission to view this order.");
          } else {
            setError(result.error);
          }
          setOrder(null);
        } else if (result) {
          setOrder(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  const canUpload = ["paid", "processing"].includes(order?.status || "");

  return (
    <div className="container mx-auto px-4 py-16">
      <SEO title="Order Status" description="Check the status of your headshot order" />

      <h1 className="mb-8 text-3xl font-bold">Order Status</h1>

      {!token && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No order token provided. Please use the link from your order confirmation email.</AlertDescription>
        </Alert>
      )}

      {token && loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading order...</span>
        </div>
      )}

      {token && !loading && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {order && !error && (
        <div className="space-y-8">
          <div className="rounded-lg border bg-card p-4">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Package</dt>
                <dd className="font-medium">{order.package_name || "Standard"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{order.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Photos</dt>
                <dd className="font-medium">{order.photo_count}</dd>
              </div>
            </dl>
          </div>

          {canUpload ? (
            <UploadButton orderToken={token} />
          ) : order.status === "pending" ? (
            <p className="text-muted-foreground">Awaiting payment…</p>
          ) : null}

          {order.status === "completed" && (
            <ResultsGallery token={token} files={order.result_files} />
          )}
        </div>
      )}
    </div>
  );
}
