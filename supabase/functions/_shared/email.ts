import { env } from "./env.ts";

const base = "https://api.resend.com/emails";

export async function sendEmail(to: string, subject: string, html: string) {
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
};
