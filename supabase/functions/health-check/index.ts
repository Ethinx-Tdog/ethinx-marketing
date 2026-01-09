// health-check Edge Function
//
// Returns system health status including database, storage, and cron jobs.
// Useful for external monitoring services (UptimeRobot, Pingdom, etc.)

import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency_ms?: number; error?: string };
    cron_jobs: { status: string; healthy: number; warning: number; critical: number };
    queue: { status: string; pending: number; processing: number; failed: number };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "unknown" },
      cron_jobs: { status: "unknown", healthy: 0, warning: 0, critical: 0 },
      queue: { status: "unknown", pending: 0, processing: 0, failed: 0 },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const { error } = await sbAdmin.from("orders").select("id").limit(1);
    const latency = Date.now() - dbStart;
    
    if (error) {
      health.checks.database = { status: "unhealthy", latency_ms: latency, error: error.message };
      health.status = "unhealthy";
    } else {
      health.checks.database = { status: "healthy", latency_ms: latency };
    }
  } catch (err) {
    health.checks.database = { status: "unhealthy", error: String(err) };
    health.status = "unhealthy";
  }

  // Check cron heartbeats
  try {
    const { data: heartbeats } = await sbAdmin.from("cron_heartbeats").select("status");
    
    const counts = { healthy: 0, warning: 0, critical: 0 };
    for (const hb of heartbeats || []) {
      if (hb.status === "critical") counts.critical++;
      else if (hb.status === "warning") counts.warning++;
      else counts.healthy++;
    }

    let cronStatus = "healthy";
    if (counts.critical > 0) {
      cronStatus = "unhealthy";
      health.status = "unhealthy";
    } else if (counts.warning > 0) {
      cronStatus = "degraded";
      if (health.status === "healthy") health.status = "degraded";
    }

    health.checks.cron_jobs = { status: cronStatus, ...counts };
  } catch (err) {
    health.checks.cron_jobs = { status: "unknown", healthy: 0, warning: 0, critical: 0 };
  }

  // Check queue status
  try {
    const { data: queueItems } = await sbAdmin
      .from("order_queue")
      .select("status");

    const counts = { pending: 0, processing: 0, failed: 0 };
    for (const item of queueItems || []) {
      if (item.status === "queued") counts.pending++;
      else if (item.status === "processing" || item.status === "dispatching") counts.processing++;
      else if (item.status === "failed") counts.failed++;
    }

    let queueStatus = "healthy";
    if (counts.failed > 5) {
      queueStatus = "degraded";
      if (health.status === "healthy") health.status = "degraded";
    }

    health.checks.queue = { status: queueStatus, ...counts };
  } catch (err) {
    health.checks.queue = { status: "unknown", pending: 0, processing: 0, failed: 0 };
  }

  const responseTime = Date.now() - startTime;
  console.log(`[HEALTH] Status: ${health.status}, Response time: ${responseTime}ms`);

  // Return 200 for healthy/degraded, 503 for unhealthy
  const httpStatus = health.status === "unhealthy" ? 503 : 200;

  return new Response(
    JSON.stringify({ ...health, response_time_ms: responseTime }),
    { 
      status: httpStatus,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
});
