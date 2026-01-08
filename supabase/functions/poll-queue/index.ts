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

const MODAL_ENDPOINT = "https://api.modal.com/ethinx/generate"; // TODO: replace after Modal deploy (STEP 13)

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

  const res = await fetch(MODAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item.payload),
  });

  if (!res.ok) {
    await sbAdmin
      .from("order_queue")
      .update({ status: "failed", last_error: await res.text() })
      .eq("id", item.id);
    return new Response("error", { status: 500 });
  }

  await sbAdmin
    .from("order_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  return new Response(JSON.stringify({ dispatched: item.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
