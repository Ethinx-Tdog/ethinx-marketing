/**
 * poll-queue Edge Function
 *
 * Polls the order_queue table for queued jobs and dispatches them to Modal.
 * Should be invoked periodically via cron or external scheduler.
 *
 * CRON CONFIGURATION:
 * -------------------
 * Target URL: https://ywaseswwmlxjkfpnwaou.supabase.co/functions/v1/poll-queue
 * Method: POST
 * Schedule: *\/1 * * * * (every minute)
 *
 * Recommended services: cron-job.org, EasyCron, GitHub Actions, or Modal scheduled functions
 *
 * MODAL ENDPOINT CONTRACT:
 * -------------------------
 * POST https://<your-modal-app>.modal.run/generate
 *
 * Request Payload (from order_queue.payload):
 * {
 *   "order_id": "uuid",
 *   "order_token": "uuid",
 *   "email": "customer@example.com",
 *   "package_name": "starter" | "pro" | "ultimate",
 *   "photo_count": 5,
 *   "promo_code": "SAVE20" | null,
 *   "upload_prefix": "uploads/raw/<order_token>/",
 *   "result_prefix": "orders/results/<order_token>/",
 *   "zip_path": "orders/zips/<order_token>.zip"
 * }
 *
 * Expected Response: 200 OK (processing started)
 *
 * Modal should callback to finalize-order when complete.
 */

import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";

const MODAL_ENDPOINT = Deno.env.get("MODAL_ENDPOINT")!;
const MODAL_WEBHOOK_SECRET = Deno.env.get("MODAL_WEBHOOK_SECRET")!;

serve(async () => {
  const { data: item } = await sbAdmin
    .from("order_queue")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!item) {
    return new Response(JSON.stringify({ idle: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  await sbAdmin
    .from("order_queue")
    .update({ status: "dispatching" })
    .eq("id", item.id);

  // TODO: Remove after testing retry logic
  throw new Error("Forced failure to test retry");

  const res = await fetch(MODAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MODAL_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify(item.payload),
  });

  // Handle retryable errors (5xx, 429)
  if (res.status >= 500 || res.status === 429) {
    await sbAdmin
      .from("order_queue")
      .update({
        status: "queued", // Keep as queued for retry
        attempts: item.attempts + 1,
        last_error: `Retrying due to status ${res.status}: ${await res.text()}`,
      })
      .eq("id", item.id);
    return new Response(
      JSON.stringify({ retry: true, reason: `Status ${res.status}`, delay: 60 }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle non-retryable failures
  if (!res.ok) {
    await sbAdmin
      .from("order_queue")
      .update({ status: "failed", last_error: `Failed with status ${res.status}: ${await res.text()}` })
      .eq("id", item.id);
    return new Response(
      JSON.stringify({ retry: false, reason: `Status ${res.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Success - mark as processing
  await sbAdmin
    .from("order_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  return new Response(
    JSON.stringify({ success: true, dispatched: item.id }),
    { headers: { "Content-Type": "application/json" } }
  );
});
