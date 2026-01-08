import { serve } from "../_shared/deps.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE = [
  { code: "WELCOME10", pct: 10, variant: "default" },
  { code: "FLASH20", pct: 20, variant: "flash" },
  { code: "SAVE15", pct: 15, variant: "default" },
];

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  const hit = ACTIVE.find((x) => x.code === code);

  return new Response(JSON.stringify(hit ?? null), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
