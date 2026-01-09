// Shared HMAC verification for cron/webhook endpoints
const CRON_SECRET = Deno.env.get("MODAL_WEBHOOK_SECRET") || "";

function hexToBytes(h: string): ArrayBuffer {
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) {
    a[i / 2] = parseInt(h.slice(i, i + 2), 16);
  }
  return a.buffer as ArrayBuffer;
}

export async function verifyCronSignature(req: Request): Promise<{ valid: boolean; body: string }> {
  const sig = req.headers.get("x-cron-signature") || "";
  const body = await req.text();
  
  if (!CRON_SECRET) {
    console.warn("[HMAC] MODAL_WEBHOOK_SECRET not set - rejecting request");
    return { valid: false, body };
  }
  
  if (!sig) {
    console.warn("[HMAC] No x-cron-signature header present");
    return { valid: false, body };
  }

  try {
    const key = new TextEncoder().encode(CRON_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const valid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      hexToBytes(sig),
      new TextEncoder().encode(body)
    );
    
    return { valid, body };
  } catch (err) {
    console.error("[HMAC] Verification error:", err);
    return { valid: false, body };
  }
}

export function unauthorizedResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "Unauthorized - invalid signature" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
