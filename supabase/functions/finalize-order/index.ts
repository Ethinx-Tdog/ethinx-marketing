/**
 * finalize-order Edge Function
 *
 * Callback endpoint for Modal to signal job completion.
 * Verifies HMAC signature and updates order status.
 *
 * MODAL CALLBACK CONTRACT:
 * -------------------------
 * POST https://<supabase-url>/functions/v1/finalize-order
 *
 * Headers:
 *   x-ethinx-signature: <hex-encoded HMAC-SHA256 of body>
 *
 * Request Payload:
 * {
 *   "order_id": "uuid",
 *   "order_token": "uuid",
 *   "email": "customer@example.com",
 *   "results": ["result_000.jpg", "result_001.jpg", ...],
 *   "zip_key": "orders/zips/<order_token>.zip"
 * }
 *
 * HMAC Signature:
 *   Sign the raw JSON body with MODAL_WEBHOOK_SECRET (hex-encoded)
 *   Python example:
 *     import hmac, hashlib
 *     sig = hmac.new(bytes.fromhex(SECRET), body.encode(), hashlib.sha256).hexdigest()
 *
 * Response: { "ok": true }
 */

import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";
import { sendEmail, tpl } from "../_shared/email.ts";

function hexToBytes(h: string) {
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) a[i / 2] = parseInt(h.slice(i, i + 2), 16);
  return a;
}

async function verify(req: Request) {
  const sig = req.headers.get("x-ethinx-signature") || "";
  const body = await req.text();
  const key = new TextEncoder().encode(env.MODAL_WEBHOOK_SECRET);
  const k = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    k,
    hexToBytes(sig),
    new TextEncoder().encode(body)
  );
  return { ok, body };
}

serve(async (req) => {
  const { ok, body } = await verify(req);
  if (!ok) return new Response("Invalid signature", { status: 401 });

  const { order_id, order_token, results, zip_key, email } = JSON.parse(body);

  await sbAdmin
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_files: results,
    })
    .eq("id", order_id);

  const r = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/sign/orders/${zip_key}?download=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }),
    }
  );

  const j = await r.json();
  const downloadUrl = `${Deno.env.get("SUPABASE_URL")}${j.signedURL}`;

  await sendEmail(email, "Your ETHINX headshots are ready", tpl.ready(order_token, downloadUrl));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
