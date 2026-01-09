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
    console.error("Webhook signature verification failed:", (e as Error).message);
    return new Response(`Webhook error: ${(e as Error).message}`, { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("ok");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(`Processing error: ${(error as Error).message}`, { status: 500 });
  }
});

// Handle completed checkout sessions
async function handleCheckoutCompleted(session: Record<string, unknown>) {
  const s = session as {
    payment_status: string;
    payment_intent: string;
    id: string;
    metadata?: {
      type?: string;
      order_id?: string;
      user_id?: string;
      credits?: string;
      credit_pack_id?: string;
    };
  };

  if (s.payment_status !== "paid") {
    console.log("Payment not completed, skipping");
    return;
  }

  const metadata = s.metadata || {};

  // Handle credit pack purchase
  if (metadata.type === "credit_purchase" && metadata.user_id && metadata.credits) {
    const userId = metadata.user_id;
    const credits = parseInt(metadata.credits, 10);

    console.log(`Adding ${credits} credits to user ${userId}`);

    // Add credits using RPC function
    const { error: creditError } = await sbAdmin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: credits,
      p_type: "purchase",
      p_description: `Purchased ${credits} credits`,
    });

    if (creditError) {
      console.error("Failed to add credits:", creditError);
      throw new Error(`Failed to add credits: ${creditError.message}`);
    }

    console.log(`Successfully added ${credits} credits to user ${userId}`);
    return;
  }

  // Handle regular order
  if (metadata.order_id) {
    console.log(`Updating order ${metadata.order_id} to paid`);
    
    const { error: orderError } = await sbAdmin
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: s.payment_intent,
      })
      .eq("id", metadata.order_id);

    if (orderError) {
      console.error("Failed to update order:", orderError);
      throw new Error(`Failed to update order: ${orderError.message}`);
    }

    console.log(`Order ${metadata.order_id} marked as paid`);
  }
}

// Handle expired checkout sessions
async function handleCheckoutExpired(session: Record<string, unknown>) {
  const s = session as { metadata?: { order_id?: string } };
  
  if (s.metadata?.order_id) {
    console.log(`Marking order ${s.metadata.order_id} as failed due to expired checkout`);
    
    await sbAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", s.metadata.order_id)
      .eq("status", "pending");
  }
}

// Handle refunded charges
async function handleChargeRefunded(charge: Record<string, unknown>) {
  const ch = charge as { payment_intent?: string };
  
  if (ch.payment_intent) {
    console.log(`Processing refund for payment intent ${ch.payment_intent}`);
    
    await sbAdmin
      .from("orders")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", ch.payment_intent);
  }
}

// Handle subscription creation/updates
async function handleSubscriptionUpdate(subscription: Record<string, unknown>) {
  const sub = subscription as {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    metadata?: { user_id?: string };
    items: { data: Array<{ price: { id: string; product: string } }> };
  };

  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.log("No user_id in subscription metadata, skipping");
    return;
  }

  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) {
    console.log("No price ID found in subscription");
    return;
  }

  // Look up plan by checking pricing_plans for matching price
  const { data: plans } = await sbAdmin
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true);

  // Find matching plan (you may want to add stripe_price_id column to pricing_plans)
  const plan = plans?.find((p) => p.metadata?.stripe_price_id === priceId) || plans?.[0];

  if (!plan) {
    console.log("No matching plan found for price:", priceId);
    return;
  }

  console.log(`Updating subscription for user ${userId}, plan: ${plan.name}`);

  // Upsert subscription record
  const { error: subError } = await sbAdmin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      user_id: userId,
      status: sub.status === "active" ? "active" : sub.status,
      plan_id: plan.id,
      plan_name: plan.name,
      price_cents: plan.price_cents,
      interval: plan.interval as "month" | "year",
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      metadata: sub,
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (subError) {
    console.error("Failed to upsert subscription:", subError);
    throw new Error(`Failed to upsert subscription: ${subError.message}`);
  }

  console.log(`Subscription updated for user ${userId}`);
}

// Handle subscription cancellation
async function handleSubscriptionCancellation(subscription: Record<string, unknown>) {
  const sub = subscription as { id: string; metadata?: { user_id?: string } };

  console.log(`Processing subscription cancellation: ${sub.id}`);

  const { error } = await sbAdmin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", sub.id);

  if (error) {
    console.error("Failed to cancel subscription:", error);
  }
}

// Handle paid invoices (for subscription renewals)
async function handleInvoicePaid(invoice: Record<string, unknown>) {
  const inv = invoice as {
    subscription?: string;
    customer: string;
    lines?: { data: Array<{ price: { product: string } }> };
  };

  if (!inv.subscription) {
    return; // Not a subscription invoice
  }

  // Get subscription to find user
  const { data: subscription } = await sbAdmin
    .from("subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_subscription_id", inv.subscription)
    .single();

  if (!subscription) {
    console.log("No subscription found for invoice");
    return;
  }

  // Get plan to check credits
  const { data: plan } = await sbAdmin
    .from("pricing_plans")
    .select("credits_included, name")
    .eq("id", subscription.plan_id)
    .single();

  if (plan && plan.credits_included > 0) {
    console.log(`Adding ${plan.credits_included} subscription credits to user ${subscription.user_id}`);

    await sbAdmin.rpc("add_credits", {
      p_user_id: subscription.user_id,
      p_amount: plan.credits_included,
      p_type: "bonus",
      p_description: `${plan.name} subscription renewal`,
    });
  }
}