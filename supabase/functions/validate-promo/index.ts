import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VALIDATE-PROMO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { promoCode } = await req.json();
    logStep("Validating promo code", { promoCode });

    if (!promoCode || typeof promoCode !== "string") {
      throw new Error("Promo code is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Search for active promotion codes matching the input
    const promotionCodes = await stripe.promotionCodes.list({
      code: promoCode.toUpperCase().trim(),
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      logStep("Promo code not found or inactive", { promoCode });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Invalid or expired promo code" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const promoCodeObj = promotionCodes.data[0];
    const coupon = promoCodeObj.coupon;

    logStep("Promo code found", { 
      promoId: promoCodeObj.id, 
      couponId: coupon.id,
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off 
    });

    // Build discount info
    let discountLabel = "";
    let discountPercent: number | null = null;
    let discountAmountCents: number | null = null;

    if (coupon.percent_off) {
      discountPercent = coupon.percent_off;
      discountLabel = `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      discountAmountCents = coupon.amount_off;
      const currency = coupon.currency?.toUpperCase() || "AUD";
      discountLabel = `$${(coupon.amount_off / 100).toFixed(0)} off`;
    }

    return new Response(
      JSON.stringify({
        valid: true,
        promoCodeId: promoCodeObj.id,
        code: promoCodeObj.code,
        discountLabel,
        discountPercent,
        discountAmountCents,
        couponName: coupon.name || null,
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
      JSON.stringify({ valid: false, message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
