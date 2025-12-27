import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucket, fileName } = await req.json();
    
    if (!bucket || !fileName) {
      return new Response(
        JSON.stringify({ error: 'bucket and fileName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bucket name
    if (!['uploads', 'processed'].includes(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Invalid bucket name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating signed URL for ${bucket}/${fileName}`);

    // Generate signed URL (15 minutes)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 900); // 900 seconds = 15 minutes

    if (error) {
      console.error('Signed URL error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Signed URL generated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl: data.signedUrl,
        expiresIn: 900,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-signed-url:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
