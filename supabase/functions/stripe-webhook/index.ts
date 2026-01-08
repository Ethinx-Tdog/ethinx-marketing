import { serve } from "../_shared/deps.ts";
import { stripe } from "../_shared/stripe.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Webhook error: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as any;
    if (s.payment_status === "paid" && s.metadata?.order_id) {
      await sbAdmin
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: s.payment_intent,
        })
        .eq("id", s.metadata.order_id);
    }
  }

  if (event.type === "checkout.session.expired") {
    const s = event.data.object as any;
    if (s.metadata?.order_id) {
      await sbAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", s.metadata.order_id)
        .eq("status", "pending");
    }
  }

  if (event.type === "charge.refunded") {
    const ch = event.data.object as any;
    if (ch.payment_intent) {
      await sbAdmin
        .from("orders")
        .update({ status: "refunded" })
        .eq("stripe_payment_intent_id", ch.payment_intent);
    }
  }

  return new Response("ok");
});
