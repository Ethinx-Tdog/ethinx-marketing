import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { stripe } from "../_shared/stripe.ts";
import { env } from "../_shared/env.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { 
  validateCheckoutInput, 
  isValidEmail, 
  checkRateLimit, 
  getClientIdentifier,
  isNonEmptyString 
} from "../_shared/validation.ts";

// Existing package price IDs
const PRICE_MAP: Record<string, string> = {
  starter: "price_1Sn99qIik4hNc65MeXyOPCav",
  professional: "price_1Sn9FfIik4hNc65MloNhA1cw",
  ultimate: "price_1Sn9FgIik4hNc65MuFz9rADz",
  real_estate: "price_1Sn9FiIik4hNc65M5T9WkKII",
  tradie: "price_1Sn9FjIik4hNc65Ms1jcrLpD",
  healthcare: "price_1Sn9FlIik4hNc65MHWcp6RVS",
  creative: "price_1Sn9FmIik4hNc65Miij45gjR",
  bio_suite: "price_1Sn9FnIik4hNc65MVqXsOdkn",
  rush_3h: "price_1Sn9FoIik4hNc65MoJOmWk0L",
};

const PACKAGE_PHOTOS: Record<string, number> = {
  starter: 15,
  professional: 30,
  ultimate: 50,
};

const PRICE_AMOUNTS: Record<string, number> = {
  starter: 4900,
  professional: 8900,
  ultimate: 14900,
  real_estate: 5900,
  tradie: 4900,
  healthcare: 4900,
  creative: 4500,
  bio_suite: 2900,
  rush_3h: 2500,
};

// Credit pack configurations
const CREDIT_PACKS: Record<string, { credits: number; price: number }> = {
  pack_10: { credits: 10, price: 1500 },
  pack_25: { credits: 25, price: 3000 },
  pack_100: { credits: 100, price: 9000 },
  pack_500: { credits: 500, price: 40000 },
};

// Add-on configurations
const ADD_ONS: Record<string, { name: string; price: number }> = {
  priority: { name: "Priority Processing", price: 999 },
  detailed_report: { name: "Detailed Analysis", price: 1499 },
  export: { name: "Excel Export", price: 499 },
  api_access: { name: "API Access", price: 2999 },
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Rate limiting: 5 checkout attempts per minute per IP
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`checkout:${clientId}`, { 
      windowMs: 60000, 
      maxRequests: 5 
    });
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many checkout attempts. Please wait a moment." }),
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

    const body = await req.json();
    
    // Validate basic input structure
    const validation = validateCheckoutInput(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { type } = body;

    // Handle credit pack purchases
    if (type === "credit_pack") {
      return await handleCreditPackPurchase(body, req, corsHeaders);
    }

    // Handle enhanced checkout with plan + add-ons
    if (body.order_data || body.plan_id) {
      return await handleEnhancedCheckout(body, corsHeaders);
    }

    // Default: handle legacy package checkout
    return await handleLegacyCheckout(body, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    console.error("Checkout error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

// Credit pack purchase handler
async function handleCreditPackPurchase(
  body: {
    credit_pack_id: string;
    credits?: number;
    success_url?: string;
    cancel_url?: string;
  },
  req: Request,
  corsHeaders: Record<string, string>
) {
  const { credit_pack_id, success_url, cancel_url } = body;

  // Validate credit pack ID
  if (!isNonEmptyString(credit_pack_id, 50)) {
    throw new Error("Invalid credit pack ID");
  }

  const creditPack = CREDIT_PACKS[credit_pack_id];
  if (!creditPack) {
    throw new Error("Invalid credit pack selected");
  }

  // Get user from auth header if available
  const authHeader = req.headers.get("Authorization") || "";
  let userId: string | null = null;
  let userEmail: string | null = null;

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await sbAdmin.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email || null;
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `${creditPack.credits} Credits`,
            description: `Purchase ${creditPack.credits} credits for use on any service`,
          },
          unit_amount: creditPack.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "credit_purchase",
      user_id: userId || "",
      credits: String(creditPack.credits),
      credit_pack_id,
    },
    success_url: success_url || `${env.SITE_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel_url || `${env.SITE_URL}/credits`,
  });

  return new Response(
    JSON.stringify({ url: session.url, session_id: session.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Enhanced checkout with plans + add-ons
async function handleEnhancedCheckout(
  body: {
    order_data?: Record<string, unknown>;
    plan_id?: string;
    add_on_ids?: string[];
    email?: string;
    success_url?: string;
    cancel_url?: string;
  },
  corsHeaders: Record<string, string>
) {
  const { order_data, plan_id, add_on_ids, email, success_url, cancel_url } = body;

  // Build line items
  const lineItems: Array<{ price_data: unknown; quantity: number }> = [];
  let totalCents = 0;

  // Get plan from database
  if (plan_id || order_data?.plan_id) {
    const targetPlanId = plan_id || (order_data?.plan_id as string);
    
    // Validate plan ID format
    if (!isNonEmptyString(targetPlanId, 100)) {
      throw new Error("Invalid plan ID");
    }
    
    const { data: plan } = await sbAdmin
      .from("pricing_plans")
      .select("*")
      .eq("id", targetPlanId)
      .single();

    if (plan) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
          },
          unit_amount: plan.price_cents,
        },
        quantity: 1,
      });
      totalCents += plan.price_cents;
    }
  }

  // Add add-ons
  const validAddOns: string[] = [];
  if (add_on_ids && Array.isArray(add_on_ids)) {
    for (const addOnId of add_on_ids) {
      if (!isNonEmptyString(addOnId, 50)) continue;
      const addOn = ADD_ONS[addOnId];
      if (addOn) {
        lineItems.push({
          price_data: {
            currency: "aud",
            product_data: {
              name: `Add-on: ${addOn.name}`,
            },
            unit_amount: addOn.price,
          },
          quantity: 1,
        });
        totalCents += addOn.price;
        validAddOns.push(addOnId);
      }
    }
  }

  if (lineItems.length === 0) {
    throw new Error("No valid items in checkout");
  }

  // Get email
  const customerEmail = email || (order_data?.email as string);
  if (!isValidEmail(customerEmail)) {
    throw new Error("Valid email is required");
  }

  // Create order record
  const { data: order, error: orderError } = await sbAdmin
    .from("orders")
    .insert({
      email: customerEmail,
      plan_id: plan_id || (order_data?.plan_id as string) || null,
      amount_cents: totalCents,
      currency: "aud",
      status: "pending",
      user_id: (order_data?.user_id as string) || null,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation error:", orderError);
    throw new Error("Failed to create order");
  }

  // Insert email into isolated order_emails table
  await sbAdmin.from("order_emails").insert({
    order_id: order.id,
    email: customerEmail,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: lineItems,
    allow_promotion_codes: true,
    metadata: {
      type: "order",
      order_id: order.id,
      order_token: order.order_token,
      plan_id: plan_id || (order_data?.plan_id as string) || "",
      add_ons: validAddOns.join(","),
    },
    success_url: success_url || `${env.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel_url || `${env.SITE_URL}/checkout/cancel`,
  });

  await sbAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  return new Response(
    JSON.stringify({ url: session.url, order_token: order.order_token, session_id: session.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Legacy checkout handler (original flow)
async function handleLegacyCheckout(
  body: {
    email: string;
    package_name?: string;
    upsell_ids?: string[];
    promo_code?: string;
    source_page?: string;
  },
  corsHeaders: Record<string, string>
) {
  const { email, package_name = "starter", upsell_ids, promo_code, source_page } = body;

  if (!isValidEmail(email)) {
    throw new Error("Valid email is required");
  }

  if (!isNonEmptyString(package_name, 50) || !PRICE_MAP[package_name]) {
    throw new Error("Invalid package selected");
  }

  // Build line items
  const lineItems = [{ price: PRICE_MAP[package_name], quantity: 1 }];
  const validUpsells: string[] = [];

  if (upsell_ids && Array.isArray(upsell_ids)) {
    for (const upsellId of upsell_ids) {
      if (isNonEmptyString(upsellId, 50) && PRICE_MAP[upsellId]) {
        lineItems.push({ price: PRICE_MAP[upsellId], quantity: 1 });
        validUpsells.push(upsellId);
      }
    }
  }

  // Calculate total
  let totalCents = PRICE_AMOUNTS[package_name] || 0;
  for (const upsellId of validUpsells) {
    totalCents += PRICE_AMOUNTS[upsellId] || 0;
  }

  // Validate promo code if provided
  const sanitizedPromoCode = promo_code && isNonEmptyString(promo_code, 50) 
    ? promo_code.toUpperCase().replace(/[^A-Z0-9_-]/g, "") 
    : null;

  // Create order
  const { data: order, error: orderError } = await sbAdmin
    .from("orders")
    .insert({
      email,
      package_name,
      photo_count: PACKAGE_PHOTOS[package_name] || 0,
      amount_cents: totalCents,
      currency: "aud",
      status: "pending",
      promo_code: sanitizedPromoCode,
      source_page: source_page?.slice(0, 255) || null,
    })
    .select()
    .single();

  if (orderError) throw new Error("Failed to create order");

  // Insert email into isolated order_emails table
  await sbAdmin.from("order_emails").insert({
    order_id: order.id,
    email,
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    allow_promotion_codes: true,
    metadata: {
      order_id: order.id,
      order_token: order.order_token,
      package_name,
      upsell_ids: validUpsells.join(","),
    },
    success_url: `${env.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.SITE_URL}/checkout/cancel`,
  });

  await sbAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  return new Response(
    JSON.stringify({ url: session.url, order_token: order.order_token }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
