import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrderUploadButton } from "@/components/OrderUploadButton";
import { ResultsGallery } from "@/components/ResultsGallery";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

interface Order {
  id: string;
  order_token: string;
  status: string;
  result_files: string[] | null;
}

export default function OrderStatus() {
  const [order, setOrder] = useState<Order | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_token, status, result_files")
        .eq("order_token", token)
        .maybeSingle();

      setOrder(data);
    };

    fetchOrder();
  }, [token]);

  const canUpload = ["paid", "processing"].includes(order?.status || "");

  return (
    <div className="container mx-auto px-4 py-16">
      <SEO title="Order Status" description="Check the status of your headshot order" />

      <h1 className="mb-8 text-3xl font-bold">Order Status</h1>

      {!token && <p className="text-muted-foreground">No order token provided.</p>}

      {token && !order && <p className="text-muted-foreground">Loading...</p>}

      {order && (
        <div className="space-y-8">
          {canUpload ? (
            <OrderUploadButton orderToken={token!} />
          ) : (
            <p className="text-muted-foreground">Awaiting payment…</p>
          )}

          {order.status === "completed" && (
            <ResultsGallery token={token!} files={order.result_files || []} />
          )}
        </div>
      )}
    </div>
  );
}
