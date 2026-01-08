import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EMAIL-DISPATCH] ${step}${detailsStr}`);
};

type EmailType = 
  | "order_received" 
  | "upload_received" 
  | "processing_started"
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
  download_url?: string;
}

const EMAIL_TEMPLATES: Record<EmailType, { subject: string; getHtml: (data: Record<string, unknown>) => string }> = {
  order_received: {
    subject: "Your ETHINX Order is Confirmed! 🎉",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Thanks for your order!</h1>
        <p>We've received your order and are ready to create your professional headshots.</p>
        <p><strong>Order Reference:</strong> ${data.order_token}</p>
        <p><strong>Package:</strong> ${data.package_name}</p>
        <p><strong>Amount:</strong> $${((data.amount_cents as number) / 100).toFixed(2)} AUD</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p>Next step: Upload your photos to get started!</p>
        <a href="${data.site_url}/order/${data.order_token}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Upload Photos
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questions? Reply to this email and we'll help you out.
        </p>
      </div>
    `,
  },
  upload_received: {
    subject: "Photos Received - Processing Starting Soon! 📸",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">We've got your photos!</h1>
        <p>Your ${data.photo_count} photos have been received and are queued for processing.</p>
        <p>Our AI is warming up and will start creating your professional headshots shortly.</p>
        <p><strong>Expected delivery:</strong> Within ${data.delivery_time}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">
          We'll email you as soon as your headshots are ready!
        </p>
      </div>
    `,
  },
  processing_started: {
    subject: "Your Headshots Are Being Created! ✨",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Processing in progress</h1>
        <p>Our AI is now working on your professional headshots.</p>
        <p>This usually takes 15-30 minutes depending on your package.</p>
        <p>Sit back and relax - we'll notify you the moment they're ready!</p>
      </div>
    `,
  },
  images_ready: {
    subject: "Your Professional Headshots Are Ready! 🎯",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Your headshots are ready!</h1>
        <p>Great news! Your professional headshots have been created and are ready for download.</p>
        <a href="${data.download_url}" 
           style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 16px;">
          Download Your Headshots
        </a>
        <p style="color: #666; font-size: 14px;">
          Download link expires in 7 days. Make sure to save your images!
        </p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p>We'd love to see how you use your new headshots! Tag us @ethinx on LinkedIn.</p>
      </div>
    `,
  },
  processing_failed: {
    subject: "Issue With Your Order - We're On It! 🔧",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">We hit a snag</h1>
        <p>Unfortunately, we encountered an issue processing your order.</p>
        <p>Our team has been notified and is looking into it. We'll reach out within 24 hours with an update.</p>
        <p><strong>Order Reference:</strong> ${data.order_token}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p>If you need immediate assistance, reply to this email.</p>
      </div>
    `,
  },
  receipt: {
    subject: "Your ETHINX Receipt",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Payment Receipt</h1>
        <p>Thank you for your purchase!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Order:</strong></td><td>${data.order_token}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td>${data.package_name}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td><td>$${((data.amount_cents as number) / 100).toFixed(2)} AUD</td></tr>
          <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px;">ETHINX PTY LTD | ABN: XX XXX XXX XXX</p>
      </div>
    `,
  },
  nps_followup: {
    subject: "How did we do? Quick feedback request 🙏",
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">How was your experience?</h1>
        <p>It's been a week since you received your headshots. We'd love to know how we did!</p>
        <p>On a scale of 0-10, how likely are you to recommend ETHINX to a friend or colleague?</p>
        <div style="text-align: center; margin: 20px 0;">
          ${[0,1,2,3,4,5,6,7,8,9,10].map(n => 
            `<a href="${data.site_url}/feedback?order=${data.order_token}&score=${n}" 
                style="display: inline-block; width: 30px; height: 30px; line-height: 30px; margin: 2px; 
                       background: ${n <= 6 ? '#fee2e2' : n <= 8 ? '#fef3c7' : '#dcfce7'}; 
                       border-radius: 4px; text-decoration: none; color: #333;">${n}</a>`
          ).join('')}
        </div>
        <p style="color: #666; font-size: 14px;">Your feedback helps us improve!</p>
      </div>
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured", sent: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const resend = new Resend(resendApiKey);
    const body: EmailRequest = await req.json();
    
    logStep("Processing email request", { type: body.type, order_id: body.order_id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", body.order_id)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error(`Order not found: ${body.order_id}`);
    }

    const template = EMAIL_TEMPLATES[body.type];
    if (!template) {
      throw new Error(`Unknown email type: ${body.type}`);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://ethinx.ai";
    const fromEmail = Deno.env.get("FROM_EMAIL") || "no-reply@ethinx.ai";
    const senderName = Deno.env.get("SENDER_NAME") || "ETHINX";

    // Generate download URL if needed
    let downloadUrl = body.download_url;
    if (body.type === "images_ready" && body.zip_path && !downloadUrl) {
      const { data: signedData } = await supabase.storage
        .from("zips")
        .createSignedUrl(body.zip_path, 7 * 24 * 3600); // 7 days
      downloadUrl = signedData?.signedUrl;
    }

    const htmlContent = template.getHtml({
      ...order,
      site_url: siteUrl,
      download_url: downloadUrl,
      delivery_time: order.package_name === "ultimate" ? "6 hours" : 
                     order.package_name === "professional" ? "12 hours" : "24 hours",
    });

    const emailResponse = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: [body.email || order.email],
      subject: template.subject,
      html: htmlContent,
    });

    const emailId = (emailResponse as { id?: string }).id || 'sent';
    logStep("Email sent successfully", { id: emailId, type: body.type });

    return new Response(
      JSON.stringify({ success: true, sent: true, emailId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message, sent: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
