import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the JWT token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, includeContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from database if requested - requires admin role
    let contextData = "";
    if (includeContext) {
      // Verify admin role before loading sensitive context
      const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: hasRole, error: roleError } = await sbAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (roleError || !hasRole) {
        return new Response(
          JSON.stringify({ error: "Admin access required for system context" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch recent queue logs (sanitized - no sensitive data)
      const { data: queueLogs } = await sbAdmin
        .from("order_queue")
        .select("order_id, status, attempts, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch recent orders - SANITIZED: exclude email addresses
      const { data: recentOrders } = await sbAdmin
        .from("orders")
        .select("id, status, package_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch DLQ entries - SANITIZED: generic error info only
      const { data: dlqEntries } = await sbAdmin
        .from("order_dlq")
        .select("order_id, retry_count, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch job response stats - SANITIZED: no error messages
      const { data: jobStats } = await sbAdmin
        .from("job_response_history")
        .select("order_id, response_status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      contextData = `
## Current System Context (Admin View)

### Recent Queue Status (last 20):
${JSON.stringify(queueLogs?.map(q => ({
  order_id: q.order_id,
  status: q.status,
  attempts: q.attempts,
  created_at: q.created_at
})) || [], null, 2)}

### Recent Orders (last 20):
${JSON.stringify(recentOrders?.map(o => ({
  id: o.id,
  status: o.status,
  package: o.package_name,
  created_at: o.created_at
})) || [], null, 2)}

### Dead Letter Queue (failed orders):
${JSON.stringify(dlqEntries?.map(d => ({
  order_id: d.order_id,
  retries: d.retry_count,
  created_at: d.created_at
})) || [], null, 2)}

### Recent Job Status:
${JSON.stringify(jobStats?.map(j => ({
  order_id: j.order_id,
  status: j.response_status,
  created_at: j.created_at
})) || [], null, 2)}
`;
    }

    const systemPrompt = `You are ETHINX Agent — an autonomous digital assistant built by ETHINX. You speak like a sharp founder-operator who's building with bleeding-edge tools (AI, Modal, Supabase, Cron, etc). You are solution-oriented and never guess.

Personality:
- Short, clear, direct answers — no fluff
- Show JSON or command-line examples when relevant
- After every action or answer, remind the user what to test or verify next
- Confident but not arrogant — you know your stack cold
- If you don't know something, say so and suggest where to look

You have access to real-time system data:
${contextData}

When discussing system status:
- Reference actual queue/order/DLQ data above
- Provide actionable next steps
- Format data as JSON snippets when helpful
- Always end with: "→ Next: [what to verify]"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
