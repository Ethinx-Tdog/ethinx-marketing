import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { isValidEmail, isValidUUID, isNonEmptyString } from "../_shared/validation.ts";

// Add-on prices (sync with frontend)
const ADD_ON_PRICES: Record<string, number> = {
  priority: 999,
  detailed_report: 1499,
  export: 499,
  api_access: 2999,
};

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
    // 1. Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate input
    const body = await req.json();
    const { plan_id, add_on_ids, email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate plan_id
    if (!isNonEmptyString(plan_id, 100)) {
      return new Response(
        JSON.stringify({ error: "Valid plan ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate add_on_ids is array
    if (add_on_ids !== undefined && !Array.isArray(add_on_ids)) {
      return new Response(
        JSON.stringify({ error: "Invalid add-on IDs format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get plan from database and validate
    const { data: plan, error: planError } = await sbAdmin
      .from("pricing_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Calculate total with add-ons (server-side calculation)
    let totalCents = plan.price_cents;
    const validAddOns: string[] = [];

    if (Array.isArray(add_on_ids)) {
      for (const addOnId of add_on_ids) {
        if (typeof addOnId === "string" && ADD_ON_PRICES[addOnId] !== undefined) {
          totalCents += ADD_ON_PRICES[addOnId];
          validAddOns.push(addOnId);
        }
      }
    }

    const creditsNeeded = Math.ceil(totalCents / 100);

    // 5. Check user has enough credits before deducting
    const { data: creditBalance } = await sbAdmin.rpc("get_credit_balance", {
      p_user_id: user.id,
    });

    if (creditBalance === null || creditBalance < creditsNeeded) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          required: creditsNeeded,
          available: creditBalance || 0
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Deduct credits atomically
    const { data: deductResult, error: creditError } = await sbAdmin.rpc(
      "deduct_credits",
      {
        p_user_id: user.id,
        p_amount: creditsNeeded,
        p_description: `Order: ${plan.name}${validAddOns.length > 0 ? ` + ${validAddOns.length} add-ons` : ""}`,
      }
    );

    if (creditError || deductResult === false) {
      console.error("Credit deduction failed:", creditError);
      return new Response(
        JSON.stringify({ error: "Failed to deduct credits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Create order (server sets status after validation)
    const { data: order, error: orderError } = await sbAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        package_name: plan.name,
        amount_cents: 0, // Paid with credits
        status: "paid",
        used_credits: creditsNeeded,
        currency: "aud",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !order) {
      // Log error - credits already deducted
      // TODO: Consider implementing a rollback mechanism or credit refund
      console.error("Order creation failed after credit deduction:", orderError);
      return new Response(
        JSON.stringify({ error: "Order creation failed. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert email into isolated table
    const { error: emailError } = await sbAdmin.from("order_emails").insert({
      order_id: order.id,
      email: email,
    });

    if (emailError) {
      console.error("Failed to save order email:", emailError);
      // Non-fatal - order is still created
    }

    // 9. Log the successful credit order
    console.log(`Credit order created: order_id=${order.id}, user_id=${user.id}, credits=${creditsNeeded}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_token: order.order_token,
        credits_used: creditsNeeded,
        remaining_credits: (creditBalance || 0) - creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Credit order error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
