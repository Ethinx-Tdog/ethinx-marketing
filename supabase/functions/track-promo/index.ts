import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/validation.ts";

// Valid event types that match the RLS policy
const VALID_EVENT_TYPES = ["view", "click", "apply", "purchase", "dismiss", "viewed", "dismissed", "cta_clicked", "ab_assigned"];

// Valid AB groups
const VALID_AB_GROUPS = ["control", "banner_flash", "banner_urgent"];

// UUID v4 regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Promo code validation (alphanumeric + underscore/hyphen)
const PROMO_CODE_PATTERN = /^[A-Za-z0-9_-]*$/;

// Path validation (must start with /)
const PATH_PATTERN = /^\/[a-zA-Z0-9/_-]*$/;

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Rate limit: 30 events per minute per IP (generous for analytics)
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`promo_track:${clientId}`, {
      windowMs: 60000,
      maxRequests: 30,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
          } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { event_type, promo_code, variant, page_path, session_id, ab_group, order_id } = body;

    // Validate session_id (required, must be UUID format)
    if (!session_id || typeof session_id !== "string" || !UUID_PATTERN.test(session_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid session ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate event_type (required, must be in allowed list)
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid event type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate promo_code (required, max 50 chars, alphanumeric)
    if (typeof promo_code !== "string" || promo_code.length > 50 || !PROMO_CODE_PATTERN.test(promo_code)) {
      return new Response(
        JSON.stringify({ error: "Invalid promo code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate page_path (required, max 500 chars, safe path format)
    if (!page_path || typeof page_path !== "string" || page_path.length > 500) {
      return new Response(
        JSON.stringify({ error: "Invalid page path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize page_path - prevent script injection
    const sanitizedPath = page_path
      .replace(/[<>"'`]/g, "") // Remove potentially dangerous chars
      .substring(0, 500);

    // Validate variant (optional, must be default or flash)
    const validVariant = variant === "flash" ? "flash" : "default";

    // Validate ab_group (optional, must be in allowed list)
    let validAbGroup: string | null = null;
    if (ab_group && typeof ab_group === "string" && VALID_AB_GROUPS.includes(ab_group)) {
      validAbGroup = ab_group;
    }

    // Validate order_id (optional, must be UUID if provided)
    let validOrderId: string | null = null;
    if (order_id && typeof order_id === "string" && UUID_PATTERN.test(order_id)) {
      validOrderId = order_id;
    }

    // Insert into promo_events using service role
    const { error: insertError } = await sbAdmin.from("promo_events").insert({
      event_type,
      promo_code: promo_code || "",
      variant: validVariant,
      page_path: sanitizedPath,
      session_id,
      ab_group: validAbGroup,
      order_id: validOrderId,
    });

    if (insertError) {
      console.error("Failed to insert promo event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to track event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Promo tracking error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
