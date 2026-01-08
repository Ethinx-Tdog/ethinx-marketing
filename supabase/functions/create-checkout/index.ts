import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";
import { env } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email, package_name = "starter", upsell_ids, promo_code, source_page } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email is required");
    }

    if (!PRICE_MAP[package_name]) {
      throw new Error("Invalid package selected");
    }

    // Build line items
    const lineItems = [{ price: PRICE_MAP[package_name], quantity: 1 }];
    const validUpsells: string[] = [];

    if (upsell_ids && Array.isArray(upsell_ids)) {
      for (const upsellId of upsell_ids) {
        if (PRICE_MAP[upsellId]) {
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
        promo_code: promo_code || null,
        source_page: source_page || null,
      })
      .select()
      .single();

    if (orderError) throw new Error("Failed to create order");

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
