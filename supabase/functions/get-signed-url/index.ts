import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safe error message mapping to prevent information leakage
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('not found') || msg.includes('does not exist')) {
      return 'The requested file could not be found';
    }
    if (msg.includes('bucket') || msg.includes('storage')) {
      return 'Storage operation failed';
    }
    if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('permission')) {
      return 'Operation not permitted';
    }
    if (msg.includes('expired') || msg.includes('invalid')) {
      return 'Invalid request';
    }
  }
  
  return 'An error occurred processing your request';
}

// Validate fileName format to prevent path traversal
function isValidFileName(fileName: string): boolean {
  // Must not be empty
  if (!fileName || fileName.trim() === '') return false;
  
  // Must not contain path traversal characters
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
  
  // Must match expected format: timestamp-uuid.extension
  const validPattern = /^\d+-[a-f0-9-]+\.[a-z0-9]+$/i;
  return validPattern.test(fileName);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucket, fileName } = await req.json();
    
    if (!bucket || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Bucket and file name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bucket name against whitelist
    if (!['uploads', 'processed'].includes(bucket)) {
      console.log(`Invalid bucket requested: ${bucket}`);
      return new Response(
        JSON.stringify({ error: 'Invalid storage location specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate fileName format to prevent path traversal
    if (!isValidFileName(fileName)) {
      console.log(`Invalid fileName format: ${fileName}`);
      return new Response(
        JSON.stringify({ error: 'Invalid file reference format' }),
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
        JSON.stringify({ error: getSafeErrorMessage(error) }),
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
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
