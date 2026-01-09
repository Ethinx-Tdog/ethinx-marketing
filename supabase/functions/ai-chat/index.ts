import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from database if requested
    let contextData = "";
    if (includeContext) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch recent queue logs
      const { data: queueLogs } = await supabase
        .from("order_queue")
        .select("order_id, status, locked_until, attempt, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, email, status, package_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch DLQ entries (failed orders)
      const { data: dlqEntries } = await supabase
        .from("order_dlq")
        .select("order_id, error_message, retries, resolved, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch webhook/job errors
      const { data: jobErrors } = await supabase
        .from("job_response_history")
        .select("order_id, success, message, created_at")
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(10);

      contextData = `
## Current System Context

### Recent Queue Status (last 20):
${JSON.stringify(queueLogs || [], null, 2)}

### Recent Orders (last 20):
${JSON.stringify(recentOrders || [], null, 2)}

### Dead Letter Queue (failed orders):
${JSON.stringify(dlqEntries || [], null, 2)}

### Recent Webhook Errors:
${JSON.stringify(jobErrors || [], null, 2)}
`;
    }

    const systemPrompt = `You are a creative, helpful AI assistant for ETHINX, a professional headshot service. Your thinking style is Creative - you provide imaginative, engaging responses while remaining helpful and accurate.

You have access to real-time system data including queue logs, order statuses, and webhook errors. Use this context to provide informed, context-aware responses.

${contextData}

Guidelines:
- Be creative and engaging in your responses
- Provide actionable insights when discussing system data
- If asked about orders or system status, reference the actual data above
- Keep responses concise but informative
- Use a friendly, professional tone`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        temperature: 0.8,
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
