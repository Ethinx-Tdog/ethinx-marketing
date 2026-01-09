/**
 * finalize-order Edge Function
 *
 * Callback endpoint for Modal to signal job completion.
 * Verifies HMAC signature and updates order status.
 *
 * MODAL CALLBACK CONTRACT:
 * -------------------------
 * POST https://<supabase-url>/functions/v1/finalize-order
 *
 * Headers:
 *   x-ethinx-signature: <hex-encoded HMAC-SHA256 of body>
 *
 * Request Payload:
 * {
 *   "order_id": "uuid",
 *   "order_token": "uuid",
 *   "email": "customer@example.com",
 *   "results": ["result_000.jpg", "result_001.jpg", ...],
 *   "zip_key": "orders/zips/<order_token>.zip"
 * }
 *
 * HMAC Signature:
 *   Sign the raw JSON body with MODAL_WEBHOOK_SECRET (hex-encoded)
 *   Python example:
 *     import hmac, hashlib
 *     sig = hmac.new(bytes.fromhex(SECRET), body.encode(), hashlib.sha256).hexdigest()
 *
 * Response: { "ok": true }
 */

import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";
import { sendEmail, tpl } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ethinx-signature",
};

function hexToBytes(h: string) {
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) a[i / 2] = parseInt(h.slice(i, i + 2), 16);
  return a;
}

async function verify(req: Request) {
  const sig = req.headers.get("x-ethinx-signature") || "";
  const body = await req.text();
  const key = new TextEncoder().encode(env.MODAL_WEBHOOK_SECRET);
  const k = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    k,
    hexToBytes(sig),
    new TextEncoder().encode(body)
  );
  return { ok, body };
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms: ${lastError.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function updateOrderStatus(orderId: string, results: string[]) {
  const { error } = await sbAdmin
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_files: results,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

async function updateQueueStatus(orderId: string, status: string, errorMsg?: string) {
  const updateData: Record<string, unknown> = { status };
  if (errorMsg) {
    updateData.last_error = errorMsg;
  }
  
  await sbAdmin
    .from("order_queue")
    .update(updateData)
    .eq("order_id", orderId);
}

async function generateSignedUrl(zipKey: string): Promise<string> {
  const r = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/sign/orders/${zipKey}?download=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }), // 7 days
    }
  );

  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`Failed to generate signed URL: ${r.status} ${errorText}`);
  }

  const j = await r.json();
  if (!j.signedURL) {
    throw new Error("No signedURL in response");
  }
  
  return `${Deno.env.get("SUPABASE_URL")}${j.signedURL}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let orderId: string | undefined;

  try {
    const { ok, body } = await verify(req);
    if (!ok) {
      console.error("HMAC signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: {
      order_id: string;
      order_token: string;
      email: string;
      results: string[];
      zip_key: string;
    };

    try {
      payload = JSON.parse(body);
    } catch {
      console.error("Invalid JSON payload");
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, order_token, results, zip_key, email } = payload;
    orderId = order_id;

    // Validate required fields
    if (!order_id || !order_token || !email || !results || !zip_key) {
      console.error("Missing required fields in payload", { order_id, order_token, email, results: !!results, zip_key });
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing finalize-order for order_id: ${order_id}, results: ${results.length} files`);

    // Update order status with retry
    await retryWithBackoff(() => updateOrderStatus(order_id, results));
    console.log(`Order ${order_id} marked as completed`);

    // Generate signed URL with retry
    const downloadUrl = await retryWithBackoff(() => generateSignedUrl(zip_key));
    console.log(`Signed URL generated for order ${order_id}`);

    // Send email with retry
    await retryWithBackoff(() => sendEmail(email, "Your ETHINX headshots are ready", tpl.ready(order_token, downloadUrl)));
    console.log(`Email sent to ${email} for order ${order_id}`);

    // Update queue status to completed
    await updateQueueStatus(order_id, "completed");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`finalize-order failed: ${errorMessage}`, err);

    // Update queue status to failed if we have the order_id
    if (orderId) {
      try {
        await updateQueueStatus(orderId, "failed", errorMessage);
      } catch (updateErr) {
        console.error("Failed to update queue status:", updateErr);
      }
    }

    return new Response(
      JSON.stringify({ error: "Internal error", details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
