import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[POLL-QUEUE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const modalWebhookUrl = Deno.env.get("MODAL_WEBHOOK_URL");
    const modalWebhookSecret = Deno.env.get("MODAL_WEBHOOK_SECRET");

    if (!modalWebhookUrl) {
      logStep("MODAL_WEBHOOK_URL not configured, skipping");
      return new Response(
        JSON.stringify({ message: "Modal webhook not configured", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch next queued item (oldest first, limit 1)
    const { data: queueItems, error: fetchError } = await supabase
      .from("order_queue")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      logStep("No items in queue");
      return new Response(
        JSON.stringify({ message: "No items to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const item = queueItems[0];
    logStep("Processing queue item", { id: item.id, order_id: item.order_id });

    // Mark as processing
    const { error: updateError } = await supabase
      .from("order_queue")
      .update({ 
        status: "processing", 
        attempts: item.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(`Failed to update queue status: ${updateError.message}`);
    }

    // Get signed URLs for uploaded photos
    const payload = item.payload as {
      email: string;
      order_token: string;
      package_name: string;
      photo_count: number;
      photo_files: string[];
      promo_code: string | null;
      amount_cents: number;
    };

    const photoUrls: string[] = [];
    for (const fileName of payload.photo_files || []) {
      const { data: signedData } = await supabase.storage
        .from("uploads")
        .createSignedUrl(fileName, 3600); // 1 hour expiry
      
      if (signedData?.signedUrl) {
        photoUrls.push(signedData.signedUrl);
      }
    }

    // Prepare Modal payload
    const modalPayload = {
      queue_id: item.id,
      order_id: item.order_id,
      order_token: payload.order_token,
      email: payload.email,
      package_name: payload.package_name,
      photo_count: payload.photo_count,
      photo_urls: photoUrls,
      callback_url: `${supabaseUrl}/functions/v1/finalize-order`,
    };

    logStep("Sending to Modal", { order_token: payload.order_token, photo_count: photoUrls.length });

    // POST to Modal webhook
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (modalWebhookSecret) {
      headers["X-Webhook-Secret"] = modalWebhookSecret;
    }

    const modalResponse = await fetch(modalWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(modalPayload),
    });

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      logStep("Modal webhook failed", { status: modalResponse.status, error: errorText });
      
      // Mark as failed
      await supabase
        .from("order_queue")
        .update({ 
          status: "failed",
          last_error: `Modal error: ${modalResponse.status} - ${errorText}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      throw new Error(`Modal webhook failed: ${modalResponse.status}`);
    }

    logStep("Successfully dispatched to Modal");

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: 1,
        queue_id: item.id,
        order_id: item.order_id
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
