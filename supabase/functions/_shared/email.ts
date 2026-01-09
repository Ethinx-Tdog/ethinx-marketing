import { env } from "./env.ts";

const base = "https://api.resend.com/emails";

// Production flag - set to false to disable actual email sending
const EMAIL_ENABLED = false;

export async function sendEmail(to: string, subject: string, html: string) {
  // Log all email attempts for debugging
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Enabled: ${EMAIL_ENABLED}`);
  
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL] DISABLED - Would have sent to ${to}: ${subject}`);
    return { id: "disabled", to, subject };
  }

  const r = await fetch(base, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${env.SENDER_NAME} <${env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });
  if (!r.ok) throw new Error(`Email failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export const tpl = {
  orderReceived: (order_token: string) =>
    `<h2>We got your order 🎉</h2><p><a href="${env.SITE_URL}/order-status?token=${order_token}">Open your order</a></p>`,

  uploadReceived: (order_token: string) =>
    `<h2>Uploads received 📸</h2><p><a href="${env.SITE_URL}/order-status?token=${order_token}">Track progress</a></p>`,

  ready: (order_token: string, downloadUrl: string) =>
    `<h2>Your headshots are ready ✅</h2><p><a href="${downloadUrl}">Download ZIP</a></p><p><a href="${env.SITE_URL}/order-status?token=${order_token}">View gallery</a></p>`,

  receipt: (amount: number, currency: string) =>
    `<h2>Receipt</h2><p>Amount: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>`,

  followup: () => `<h2>How did we do?</h2>`,

  dlqAlert: (orderId: string, email: string, errorMessage: string, retryCount: number) =>
    `<h2>⚠️ Order Moved to Dead Letter Queue</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Customer Email:</strong> ${email}</p>
    <p><strong>Retry Attempts:</strong> ${retryCount}</p>
    <p><strong>Error:</strong></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;">${errorMessage}</pre>
    <p><a href="${env.SITE_URL}/admin/dlq" style="display:inline-block;padding:12px 24px;background:#dc2626;color:white;text-decoration:none;border-radius:6px;">View Dead Letter Queue</a></p>`,
};

export async function sendAdminAlert(subject: string, html: string) {
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("ADMIN_EMAIL not configured, skipping admin notification");
    return null;
  }
  
  try {
    return await sendEmail(adminEmail, subject, html);
  } catch (err) {
    console.error("Failed to send admin alert:", err);
    return null;
  }
}
