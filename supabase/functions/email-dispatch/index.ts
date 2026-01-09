import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";
import { sendEmail, tpl } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType =
  | "order_received"
  | "upload_received"
  | "images_ready"
  | "processing_failed"
  | "receipt"
  | "nps_followup";

interface EmailRequest {
  type: EmailType;
  order_id: string;
  order_token: string;
  email?: string;
  zip_path?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();

    // Fetch order details (excluding email for security)
    const { data: order, error: orderError } = await sbAdmin
      .from("orders")
      .select("id, order_token, amount_cents, currency, status")
      .eq("id", body.order_id)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error(`Order not found: ${body.order_id}`);
    }

    // Get email from isolated order_emails table if not provided
    let toEmail = body.email;
    if (!toEmail) {
      const { data: emailData } = await sbAdmin
        .from("order_emails")
        .select("email")
        .eq("order_id", body.order_id)
        .maybeSingle();
      
      if (!emailData?.email) {
        // Fallback: check legacy email column (for migration period)
        const { data: legacyOrder } = await sbAdmin
          .from("orders")
          .select("email")
          .eq("id", body.order_id)
          .maybeSingle();
        toEmail = legacyOrder?.email;
      } else {
        toEmail = emailData.email;
      }
    }

    if (!toEmail) {
      throw new Error(`No email found for order: ${body.order_id}`);
    }

    let subject: string;
    let html: string;

    switch (body.type) {
      case "order_received":
        subject = "Your ETHINX Order is Confirmed! 🎉";
        html = tpl.orderReceived(order.order_token);
        break;

      case "upload_received":
        subject = "Photos Received - Processing Starting Soon! 📸";
        html = tpl.uploadReceived(order.order_token);
        break;

      case "images_ready": {
        subject = "Your Professional Headshots Are Ready! 🎯";
        let downloadUrl = "";
        if (body.zip_path) {
          const { data: signedData } = await sbAdmin.storage
            .from("zips")
            .createSignedUrl(body.zip_path, 7 * 24 * 3600); // 7 days
          downloadUrl = signedData?.signedUrl || "";
        }
        html = tpl.ready(order.order_token, downloadUrl);
        break;
      }

      case "processing_failed":
        subject = "Issue With Your Order - We're On It! 🔧";
        html = `<h2>We hit a snag</h2><p>Our team has been notified. Order ref: ${order.order_token}</p>`;
        break;

      case "receipt":
        subject = "Your ETHINX Receipt";
        html = tpl.receipt(order.amount_cents, order.currency);
        break;

      case "nps_followup":
        subject = "How did we do? Quick feedback request 🙏";
        html = tpl.followup();
        break;

      default:
        throw new Error(`Unknown email type: ${body.type}`);
    }

    await sendEmail(toEmail, subject, html);

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, sent: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
