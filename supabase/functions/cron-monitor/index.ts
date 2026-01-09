// cron-monitor Edge Function
//
// Checks cron heartbeats and sends alerts for stale or failing jobs.
// Should be called periodically (e.g., every 5 minutes) by an external monitor.
//
// CONFIGURATION:
// --------------
// Target URL: https://ywaseswwmlxjkfpnwaou.supabase.co/functions/v1/cron-monitor
// Method: POST
// Schedule: every 5 minutes (*/5 * * * *)
//
// Thresholds:
// - Warning: No heartbeat for 3 minutes
// - Critical: No heartbeat for 10 minutes

import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { sendAdminAlert } from "../_shared/email.ts";

const WARNING_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const CRITICAL_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const now = Date.now();
  const alerts: { function_name: string; status: string; minutes_since_beat: number }[] = [];

  // Fetch all heartbeats
  const { data: heartbeats, error } = await sbAdmin
    .from("cron_heartbeats")
    .select("*");

  if (error) {
    console.error("Failed to fetch heartbeats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch heartbeats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  for (const hb of heartbeats || []) {
    const lastBeat = new Date(hb.last_beat_at).getTime();
    const ageSince = now - lastBeat;
    const minutesSince = Math.round(ageSince / 60000);

    let newStatus = "healthy";
    if (ageSince >= CRITICAL_THRESHOLD_MS) {
      newStatus = "critical";
    } else if (ageSince >= WARNING_THRESHOLD_MS) {
      newStatus = "warning";
    }

    // Only alert on status changes or persistent critical
    if (newStatus !== hb.status || (newStatus === "critical" && hb.consecutive_failures > 0)) {
      alerts.push({
        function_name: hb.function_name,
        status: newStatus,
        minutes_since_beat: minutesSince,
      });

      // Update status in DB
      await sbAdmin
        .from("cron_heartbeats")
        .update({ status: newStatus })
        .eq("id", hb.id);
    }
  }

  // Send alerts if any
  if (alerts.length > 0) {
    const criticalAlerts = alerts.filter((a) => a.status === "critical");
    const warningAlerts = alerts.filter((a) => a.status === "warning");

    if (criticalAlerts.length > 0) {
      const html = `
        <h2>🚨 Critical: Cron Jobs Down</h2>
        <p>The following cron jobs have not reported a heartbeat in over 10 minutes:</p>
        <ul>
          ${criticalAlerts.map((a) => `<li><strong>${a.function_name}</strong> - Last beat ${a.minutes_since_beat} minutes ago</li>`).join("")}
        </ul>
        <p>Check the cron scheduler and edge function logs immediately.</p>
      `;
      await sendAdminAlert("🚨 CRITICAL: Cron Jobs Down", html);
      console.log(`[CRITICAL ALERT] Sent for: ${criticalAlerts.map((a) => a.function_name).join(", ")}`);
    }

    if (warningAlerts.length > 0) {
      const html = `
        <h2>⚠️ Warning: Cron Jobs Delayed</h2>
        <p>The following cron jobs have not reported a heartbeat in over 3 minutes:</p>
        <ul>
          ${warningAlerts.map((a) => `<li><strong>${a.function_name}</strong> - Last beat ${a.minutes_since_beat} minutes ago</li>`).join("")}
        </ul>
        <p>This may indicate temporary issues or high load.</p>
      `;
      await sendAdminAlert("⚠️ Warning: Cron Jobs Delayed", html);
      console.log(`[WARNING ALERT] Sent for: ${warningAlerts.map((a) => a.function_name).join(", ")}`);
    }
  }

  // Summary response
  const summary = (heartbeats || []).map((hb) => ({
    function_name: hb.function_name,
    status: hb.status,
    last_beat_at: hb.last_beat_at,
    total_runs: hb.total_runs,
    consecutive_failures: hb.consecutive_failures,
  }));

  console.log(`[MONITOR] Checked ${heartbeats?.length || 0} functions, ${alerts.length} alerts`);

  return new Response(
    JSON.stringify({ 
      checked: heartbeats?.length || 0, 
      alerts: alerts.length,
      summary 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
