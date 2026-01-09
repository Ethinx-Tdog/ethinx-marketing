import { serve } from "../_shared/deps.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { 
  validatePromoCode, 
  checkRateLimit, 
  getClientIdentifier 
} from "../_shared/validation.ts";

const ACTIVE = [
  { code: "WELCOME10", pct: 10, variant: "default" },
  { code: "FLASH20", pct: 20, variant: "flash" },
  { code: "SAVE15", pct: 15, variant: "default" },
];

serve((req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Rate limiting: 20 promo validations per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`promo:${clientId}`, { 
    windowMs: 60000, 
    maxRequests: 20 
  });
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
        } 
      }
    );
  }

  const url = new URL(req.url);
  const rawCode = url.searchParams.get("code") || "";
  
  // Validate promo code format
  const validation = validatePromoCode(rawCode);
  if (!validation.success) {
    return new Response(JSON.stringify(null), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const code = validation.data!;
  const hit = ACTIVE.find((x) => x.code === code);

  return new Response(JSON.stringify(hit ?? null), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
