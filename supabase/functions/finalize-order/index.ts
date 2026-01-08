import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ModalCallback {
  queue_id: string;
  order_id: string;
  order_token: string;
  success: boolean;
  result_files: string[];
  zip_path?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const providedSecret = req.headers.get("X-Webhook-Secret");
    if (providedSecret !== env.MODAL_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body: ModalCallback = await req.json();
    const now = new Date().toISOString();

    if (!body.success) {
      // Mark queue item as failed
      await sbAdmin
        .from("order_queue")
        .update({
          status: "failed",
          last_error: body.error || "Processing failed",
          updated_at: now,
        })
        .eq("id", body.queue_id);

      // Update order status to failed
      await sbAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", body.order_id);

      // Dispatch failure email
      await fetch(`${env.SUPABASE_URL}/functions/v1/email-dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: "processing_failed",
          order_id: body.order_id,
          order_token: body.order_token,
        }),
      });

      return new Response(
        JSON.stringify({ success: false, message: "Order marked as failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success path - update queue and order
    await sbAdmin
      .from("order_queue")
      .update({ status: "completed", processed_at: now, updated_at: now })
      .eq("id", body.queue_id);

    await sbAdmin
      .from("orders")
      .update({
        status: "completed",
        result_files: body.result_files,
        completed_at: now,
      })
      .eq("id", body.order_id);

    // Dispatch success email
    await fetch(`${env.SUPABASE_URL}/functions/v1/email-dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "images_ready",
        order_id: body.order_id,
        order_token: body.order_token,
        zip_path: body.zip_path,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Order finalized", order_id: body.order_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
