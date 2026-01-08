import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Safe error message mapping to prevent information leakage
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('size') || msg.includes('too large') || msg.includes('payload')) {
      return 'File size exceeds the allowed limit';
    }
    if (msg.includes('type') || msg.includes('invalid file') || msg.includes('mime')) {
      return 'Invalid file type provided';
    }
    if (msg.includes('bucket') || msg.includes('not found') || msg.includes('storage')) {
      return 'Storage operation failed';
    }
    if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('permission')) {
      return 'Operation not permitted';
    }
  }
  
  return 'An error occurred processing your request';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      console.log(`File rejected: size ${file.size} exceeds limit ${MAX_FILE_SIZE}`);
      return new Response(
        JSON.stringify({ error: 'File size exceeds the 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log(`File rejected: MIME type ${file.type} not allowed`);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only image files are allowed (JPG, PNG, GIF, WebP, HEIC)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and validate file extension
    let ext = (file.name.split('.').pop() || '').toLowerCase().trim();
    // Sanitize: remove special chars, limit length
    ext = ext.replace(/[^a-z0-9]/g, '').slice(0, 10);
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      // Default to extension based on MIME type if extension is invalid
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heic'
      };
      ext = mimeToExt[file.type] || 'jpg';
    }

    // Create Supabase client with service role for storage operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename with sanitized extension
    const timestamp = Date.now();
    const fileName = `${timestamp}-${crypto.randomUUID()}.${ext}`;

    console.log(`Uploading file: ${fileName}, size: ${file.size}, type: ${file.type}`);

    // Upload to 'uploads' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: getSafeErrorMessage(uploadError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL (15 minutes)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(fileName, 900); // 900 seconds = 15 minutes

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return new Response(
        JSON.stringify({ error: getSafeErrorMessage(signedError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Upload successful: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        path: uploadData.path,
        signedUrl: signedData.signedUrl,
        expiresIn: 900,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-photo:', error);
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
