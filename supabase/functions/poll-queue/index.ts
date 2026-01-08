import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch next queued item (oldest first)
    const { data: queueItems, error: fetchError } = await sbAdmin
      .from("order_queue")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const item = queueItems[0];
    const payload = item.payload as {
      order_id: string;
      order_token: string;
      email: string;
      package_name: string;
      photo_count: number;
      promo_code: string | null;
      upload_prefix: string;
      result_prefix: string;
      zip_path: string;
    };

    // Mark as dispatching
    await sbAdmin
      .from("order_queue")
      .update({
        status: "dispatching",
        attempts: item.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Get signed URLs for uploaded photos
    const { data: files } = await sbAdmin.storage
      .from("uploads")
      .list(payload.upload_prefix.replace("uploads/", ""));

    const photoUrls: string[] = [];
    for (const file of files || []) {
      const { data: signedData } = await sbAdmin.storage
        .from("uploads")
        .createSignedUrl(`${payload.upload_prefix.replace("uploads/", "")}${file.name}`, 3600);

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
      result_prefix: payload.result_prefix,
      zip_path: payload.zip_path,
      callback_url: `${env.SUPABASE_URL}/functions/v1/finalize-order`,
    };

    // POST to Modal webhook
    const modalWebhookUrl = Deno.env.get("MODAL_WEBHOOK_URL");
    if (!modalWebhookUrl) {
      throw new Error("MODAL_WEBHOOK_URL not configured");
    }

    const modalResponse = await fetch(modalWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": env.MODAL_WEBHOOK_SECRET,
      },
      body: JSON.stringify(modalPayload),
    });

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      await sbAdmin
        .from("order_queue")
        .update({
          status: "failed",
          last_error: `Modal error: ${modalResponse.status} - ${errorText}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      throw new Error(`Modal webhook failed: ${modalResponse.status}`);
    }

    // Mark as processing
    await sbAdmin
      .from("order_queue")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    return new Response(
      JSON.stringify({
        success: true,
        processed: 1,
        queue_id: item.id,
        order_id: item.order_id,
      }),
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
