import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { name, industry, tone, length, platform } = await req.json();

  const response = await fetch('https://ethinx.solutions/api/bio/write', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // If using auth token or Bearer key:
      // 'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      name,
      industry,
      tone,
      length,
      platform
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate bio', status: response.status }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
