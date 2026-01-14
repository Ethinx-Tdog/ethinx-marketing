/**
 * retry-dlq Edge Function
 *
 * Allows admins to retry a failed order from the dead-letter queue.
 * Requeues the order back to order_queue for processing.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create authenticated client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasRole } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { dlq_id } = await req.json();
    if (!dlq_id) {
      return new Response(JSON.stringify({ error: "dlq_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get DLQ entry
    const { data: dlqEntry, error: dlqError } = await adminClient
      .from("order_dlq")
      .select("*")
      .eq("id", dlq_id)
      .maybeSingle();

    if (dlqError || !dlqEntry) {
      return new Response(JSON.stringify({ error: "DLQ entry not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dlqEntry.resolved_at) {
      return new Response(JSON.stringify({ error: "Entry already resolved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = dlqEntry.order_id;
    const payload = dlqEntry.original_payload;

    // Reset order status to 'paid' for reprocessing
    const { error: orderError } = await adminClient
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (orderError) {
      console.error("Failed to update order:", orderError);
      return new Response(JSON.stringify({ error: "Failed to update order status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if there's an existing queue entry
    const { data: existingQueue } = await adminClient
      .from("order_queue")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingQueue) {
      // Update existing queue entry
      const { error: queueError } = await adminClient
        .from("order_queue")
        .update({
          status: "queued",
          attempts: 0,
          last_error: null,
          payload: payload,
        })
        .eq("order_id", orderId);

      if (queueError) {
        console.error("Failed to update queue:", queueError);
        return new Response(JSON.stringify({ error: "Failed to requeue order" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new queue entry
      const { error: insertError } = await adminClient
        .from("order_queue")
        .insert({
          order_id: orderId,
          payload: payload,
          status: "queued",
          attempts: 0,
        });

      if (insertError) {
        console.error("Failed to insert queue:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create queue entry" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Mark DLQ entry as resolved
    const { error: resolveError } = await adminClient
      .from("order_dlq")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_notes: "Retried via admin dashboard",
      })
      .eq("id", dlq_id);

    if (resolveError) {
      console.error("Failed to resolve DLQ entry:", resolveError);
    }

    console.log(`Order ${orderId} requeued from DLQ by admin ${user.email}`);

    return new Response(
      JSON.stringify({ ok: true, order_id: orderId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("retry-dlq error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
