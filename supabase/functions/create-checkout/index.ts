import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe price IDs mapped to package/upsell IDs
const PRICE_MAP: Record<string, string> = {
  // Packages
  starter: "price_1Sn99qIik4hNc65MeXyOPCav",
  professional: "price_1Sn9FfIik4hNc65MloNhA1cw",
  ultimate: "price_1Sn9FgIik4hNc65MuFz9rADz",
  // Upsells
  real_estate: "price_1Sn9FiIik4hNc65M5T9WkKII",
  tradie: "price_1Sn9FjIik4hNc65Ms1jcrLpD",
  healthcare: "price_1Sn9FlIik4hNc65MHWcp6RVS",
  creative: "price_1Sn9FmIik4hNc65Miij45gjR",
  bio_suite: "price_1Sn9FnIik4hNc65MVqXsOdkn",
  rush_3h: "price_1Sn9FoIik4hNc65MoJOmWk0L",
};

// Package photo counts for order metadata
const PACKAGE_PHOTOS: Record<string, number> = {
  starter: 15,
  professional: 30,
  ultimate: 50,
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { packageId, upsellIds, email, photoFiles } = await req.json();
    logStep("Request payload", { packageId, upsellIds, email, photoFileCount: photoFiles?.length });

    if (!packageId || !PRICE_MAP[packageId]) {
      throw new Error("Invalid package selected");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email is required");
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: PRICE_MAP[packageId], quantity: 1 },
    ];

    // Add upsells
    const validUpsells: string[] = [];
    if (upsellIds && Array.isArray(upsellIds)) {
      for (const upsellId of upsellIds) {
        if (PRICE_MAP[upsellId]) {
          lineItems.push({ price: PRICE_MAP[upsellId], quantity: 1 });
          validUpsells.push(upsellId);
        }
      }
    }
    logStep("Line items built", { count: lineItems.length });

    // Calculate total amount in cents
    const priceAmounts: Record<string, number> = {
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
    
    let totalCents = priceAmounts[packageId] || 0;
    for (const upsellId of validUpsells) {
      totalCents += priceAmounts[upsellId] || 0;
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        email,
        package_name: packageId,
        photo_count: PACKAGE_PHOTOS[packageId] || 0,
        amount_cents: totalCents,
        currency: "aud",
        status: "pending",
        photo_files: photoFiles || [],
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order creation failed", orderError);
      throw new Error("Failed to create order");
    }
    logStep("Order created", { orderId: order.id, orderToken: order.order_token });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.order_token}`,
      cancel_url: `${origin}/checkout/cancel?order=${order.order_token}`,
      metadata: {
        order_id: order.id,
        order_token: order.order_token,
        package_id: packageId,
        upsell_ids: validUpsells.join(","),
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        orderToken: order.order_token,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
