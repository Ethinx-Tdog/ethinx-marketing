import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINALIZE-ORDER] ${step}${detailsStr}`);
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
    logStep("Function started");

    // Verify webhook secret
    const webhookSecret = Deno.env.get("MODAL_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("X-Webhook-Secret");
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      logStep("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body: ModalCallback = await req.json();
    logStep("Received callback", { 
      queue_id: body.queue_id, 
      order_id: body.order_id,
      success: body.success,
      result_count: body.result_files?.length || 0
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!body.success) {
      // Mark queue item as failed
      await supabase
        .from("order_queue")
        .update({ 
          status: "failed",
          last_error: body.error || "Processing failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", body.queue_id);

      // Update order status to failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", body.order_id);

      logStep("Marked order as failed", { error: body.error });

      // Dispatch failure email
      try {
        await fetch(`${supabaseUrl}/functions/v1/email-dispatch`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            type: "processing_failed",
            order_id: body.order_id,
            order_token: body.order_token,
          }),
        });
      } catch (emailError) {
        logStep("Failed to send failure email", { error: emailError });
      }

      return new Response(
        JSON.stringify({ success: false, message: "Order marked as failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Success path - update order with results
    const now = new Date().toISOString();

    // Update queue item
    await supabase
      .from("order_queue")
      .update({ 
        status: "completed",
        processed_at: now,
        updated_at: now
      })
      .eq("id", body.queue_id);

    // Update order with result files and mark completed
    await supabase
      .from("orders")
      .update({ 
        status: "completed",
        result_files: body.result_files,
        completed_at: now
      })
      .eq("id", body.order_id);

    logStep("Order completed", { 
      order_id: body.order_id, 
      result_count: body.result_files.length 
    });

    // Dispatch success email with download link
    try {
      await fetch(`${supabaseUrl}/functions/v1/email-dispatch`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          type: "images_ready",
          order_id: body.order_id,
          order_token: body.order_token,
          zip_path: body.zip_path,
        }),
      });
      logStep("Success email dispatched");
    } catch (emailError) {
      logStep("Failed to send success email", { error: emailError });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order finalized",
        order_id: body.order_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
