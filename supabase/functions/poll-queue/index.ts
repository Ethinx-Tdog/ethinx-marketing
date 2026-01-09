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

// Log job response to history table
async function logJobResponse(
  orderId: string,
  queueId: string,
  status: "success" | "error" | "retry",
  responseCode: number | null,
  responseBody: unknown,
  errorMessage: string | null,
  attemptNumber: number,
  durationMs: number
) {
  try {
    await sbAdmin.from("job_response_history").insert({
      order_id: orderId,
      queue_id: queueId,
      response_status: status,
      response_code: responseCode,
      response_body: responseBody,
      error_message: errorMessage,
      attempt_number: attemptNumber,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error("Failed to log job response:", err);
  }
}

// Record heartbeat for monitoring
async function recordHeartbeat(success: boolean, result: unknown) {
  try {
    // Fetch current stats
    const { data: current } = await sbAdmin
      .from("cron_heartbeats")
      .select("consecutive_failures, total_failures, total_runs")
      .eq("function_name", "poll-queue")
      .single();

    const updateData: Record<string, unknown> = {
      last_beat_at: new Date().toISOString(),
      last_result: result,
      total_runs: (current?.total_runs || 0) + 1,
    };

    if (success) {
      updateData.consecutive_failures = 0;
      updateData.status = "healthy";
    } else {
      updateData.consecutive_failures = (current?.consecutive_failures || 0) + 1;
      updateData.total_failures = (current?.total_failures || 0) + 1;
    }

    await sbAdmin
      .from("cron_heartbeats")
      .update(updateData)
      .eq("function_name", "poll-queue");
  } catch (err) {
    console.error("Failed to record heartbeat:", err);
  }
}

serve(async () => {
  const { data: item } = await sbAdmin
    .from("order_queue")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!item) {
    await recordHeartbeat(true, { idle: true });
    return new Response(JSON.stringify({ idle: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const orderId = (item.payload as { order_id: string }).order_id;

  await sbAdmin
    .from("order_queue")
    .update({ status: "dispatching" })
    .eq("id", item.id);

  const startTime = Date.now();
  let responseBody: unknown = null;

  const res = await fetch(MODAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MODAL_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify(item.payload),
  });

  const durationMs = Date.now() - startTime;

  try {
    responseBody = await res.clone().json();
  } catch {
    responseBody = await res.clone().text();
  }

  const MAX_RETRIES = 5;

  // Handle retryable errors (5xx, 429)
  if (res.status >= 500 || res.status === 429) {
    const errorText = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
    const newAttempts = item.attempts + 1;
    
    await logJobResponse(
      orderId,
      item.id,
      newAttempts >= MAX_RETRIES ? "error" : "retry",
      res.status,
      responseBody,
      `${newAttempts >= MAX_RETRIES ? "Max retries exceeded" : "Retrying"} - status ${res.status}: ${errorText}`,
      newAttempts,
      durationMs
    );

    // Move to DLQ if max retries exceeded
    if (newAttempts >= MAX_RETRIES) {
      await sbAdmin
        .from("order_queue")
        .update({
          status: "failed",
          attempts: newAttempts,
          last_error: `Max retries (${MAX_RETRIES}) exceeded - status ${res.status}: ${errorText}`,
        })
        .eq("id", item.id);

      // Move to dead letter queue
      await sbAdmin.from("dead_letter_queue").insert({
        queue_id: item.id,
        order_id: orderId,
        payload: item.payload,
        error_message: `Max retries exceeded after ${MAX_RETRIES} attempts. Last error: ${res.status} - ${errorText}`,
        attempts: newAttempts,
      });

      console.log(`[DLQ] Order ${orderId} moved to dead letter queue after ${MAX_RETRIES} attempts`);
      await recordHeartbeat(false, { dlq: true, order_id: orderId, attempts: newAttempts });

      return new Response(
        JSON.stringify({ failed: true, reason: "Max retries exceeded", attempts: newAttempts }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    await sbAdmin
      .from("order_queue")
      .update({
        status: "queued", // Keep as queued for retry
        attempts: newAttempts,
        last_error: `Retrying due to status ${res.status}: ${errorText}`,
      })
      .eq("id", item.id);

    console.log(`[RETRY] Order ${orderId} - Status ${res.status}, Attempt ${newAttempts}/${MAX_RETRIES}`);
    await recordHeartbeat(false, { retry: true, order_id: orderId, status: res.status, attempt: newAttempts });

    return new Response(
      JSON.stringify({ retry: true, reason: `Status ${res.status}`, delay: 60, attempt: newAttempts, max: MAX_RETRIES }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle non-retryable failures
  if (!res.ok) {
    const errorText = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);

    await logJobResponse(
      orderId,
      item.id,
      "error",
      res.status,
      responseBody,
      `Failed with status ${res.status}: ${errorText}`,
      item.attempts + 1,
      durationMs
    );

    await sbAdmin
      .from("order_queue")
      .update({ status: "failed", last_error: `Failed with status ${res.status}: ${errorText}` })
      .eq("id", item.id);

    console.log(`[FAILED] Order ${orderId} - Status ${res.status}`);
    await recordHeartbeat(false, { failed: true, order_id: orderId, status: res.status });

    return new Response(
      JSON.stringify({ retry: false, reason: `Status ${res.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Success - mark as processing
  await logJobResponse(
    orderId,
    item.id,
    "success",
    res.status,
    responseBody,
    null,
    item.attempts + 1,
    durationMs
  );

  await sbAdmin
    .from("order_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  console.log(`[SUCCESS] Order ${orderId} dispatched to Modal in ${durationMs}ms`);
  await recordHeartbeat(true, { success: true, order_id: orderId, duration_ms: durationMs });

  return new Response(
    JSON.stringify({ success: true, dispatched: item.id, duration_ms: durationMs }),
    { headers: { "Content-Type": "application/json" } }
  );
});
