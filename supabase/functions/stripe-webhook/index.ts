import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("Missing signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signature verification failed";
      logStep("Signature verification failed", { message });
      return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          orderId: session.metadata?.order_id,
        });

        if (session.payment_status === "paid" && session.metadata?.order_id) {
          // Check for applied discount/coupon
          let couponCode: string | null = null;
          let discountAmount = 0;

          if (session.total_details?.amount_discount) {
            discountAmount = session.total_details.amount_discount;
          }

          // Retrieve full session to get discount details
          if (discountAmount > 0) {
            try {
              const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ["discounts.promotion_code.coupon"],
              });
              
              if (fullSession.discounts && fullSession.discounts.length > 0) {
                const discount = fullSession.discounts[0];
                if (discount.promotion_code && typeof discount.promotion_code === "object") {
                  couponCode = discount.promotion_code.code;
                } else if (discount.coupon && typeof discount.coupon === "object") {
                  couponCode = discount.coupon.name || discount.coupon.id;
                }
              }

              logStep("Coupon applied", {
                coupon_code: couponCode,
                order_id: session.metadata.order_id,
                discount_amount: discountAmount,
              });
            } catch (err) {
              logStep("Failed to retrieve discount details", { error: String(err) });
            }
          }

          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", session.metadata.order_id);

          if (error) {
            logStep("Failed to update order", error);
            throw new Error("Failed to update order status");
          }

          logStep("Order updated to paid", { orderId: session.metadata.order_id });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session expired", { sessionId: session.id });

        if (session.metadata?.order_id) {
          await supabase
            .from("orders")
            .update({ status: "failed" })
            .eq("id", session.metadata.order_id)
            .eq("status", "pending");

          logStep("Order marked as failed", { orderId: session.metadata.order_id });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { paymentIntentId: paymentIntent.id });

        // Update any orders with this payment intent
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id, paymentIntent: charge.payment_intent });

        if (charge.payment_intent) {
          await supabase
            .from("orders")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent);

          logStep("Order marked as refunded");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
