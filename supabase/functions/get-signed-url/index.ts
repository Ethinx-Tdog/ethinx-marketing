import { serve } from "../_shared/deps.ts";
import { env } from "../_shared/env.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { containsPathTraversal, isValidStorageKey } from "../_shared/validation.ts";
import { checkRateLimitPersistent, getRateLimitIdentifier } from "../_shared/rate-limiter.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Get user ID if authenticated
    let userId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await sbAdmin.auth.getUser(token);
      userId = userData?.user?.id;
    }

    // Persistent rate limiting: 30 requests per minute per IP+user
    const identifier = getRateLimitIdentifier(req, userId);
    const rateLimit = await checkRateLimitPersistent(sbAdmin, identifier, {
      windowMs: 60000,
      maxRequests: 30,
      endpoint: "get-signed-url",
    });

    if (!rateLimit.allowed) {
      // Log blocked request for alerting (trigger handles audit log)
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    // Validate key parameter
    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing key parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Path traversal protection
    if (containsPathTraversal(key)) {
      console.error(`[SECURITY] Path traversal attempt blocked: ${key}`);
      return new Response(
        JSON.stringify({ error: "Invalid key format" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate key format (should match pattern: prefix/order_token/filename)
    if (!isValidStorageKey(key)) {
      return new Response(
        JSON.stringify({ error: "Invalid key format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract order_token from key path (format: prefix/order_token/filename)
    const keyParts = key.split("/");
    if (keyParts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid key structure" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderToken = keyParts[1];

    // Verify the order exists and get ownership info
    // SECURITY: Only select minimal fields needed for authorization - no sensitive data
    const { data: order, error: orderError } = await sbAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("order_token", orderToken)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check authorization
    if (userId) {
      // Authenticated user - verify they own this order or are admin
      if (order.user_id && order.user_id !== userId) {
        const { data: roleData } = await sbAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Access denied" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    // Note: For guest orders (no user_id), we allow access with valid order_token
    // This is intentional for the guest checkout flow

    // Generate signed URL
    const r = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/sign/orders/${key}?download=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 60 * 60 }), // 1 hour
      }
    );

    if (!r.ok) {
      console.error(`[STORAGE] Failed to generate signed URL: ${r.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const j = await r.json();

    return new Response(
      JSON.stringify({ signedUrl: `${env.SUPABASE_URL}${j.signedURL}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error generating URL";
    console.error(`[ERROR] get-signed-url: ${message}`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
