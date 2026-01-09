import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { 
  validateUploadInput, 
  checkRateLimit, 
  getClientIdentifier,
  containsPathTraversal 
} from "../_shared/validation.ts";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Rate limiting: 10 uploads per minute per IP
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`upload:${clientId}`, { 
      windowMs: 60000, 
      maxRequests: 10 
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

    // Parse and validate input
    const body = await req.json();
    const validation = validateUploadInput(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_token, files } = validation.data!;

    // Verify order exists and is in valid state
    // SECURITY: Only select minimal fields needed - no sensitive data like email
    const { data: order, error } = await sbAdmin
      .from("orders")
      .select("id, status, photo_files, user_id")
      .eq("order_token", order_token)
      .single();

    if (error || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify order status allows uploads
    if (!["paid", "processing"].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: "Uploads not allowed for this order status" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If user is authenticated, verify ownership
    const authHeader = req.headers.get("Authorization");
    if (authHeader && order.user_id) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await sbAdmin.auth.getUser(token);
      
      if (userData?.user && userData.user.id !== order.user_id) {
        // Check if user is admin
        const { data: roleData } = await sbAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .single();
        
        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Access denied - you don't own this order" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const prefix = `raw/${order_token}/`;
    const uploadedFiles: string[] = order.photo_files || [];

    for (const f of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(f.type)) {
        return new Response(
          JSON.stringify({ error: `Invalid file type: ${f.type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize filename - remove any path traversal attempts
      const sanitizedName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      if (containsPathTraversal(sanitizedName)) {
        return new Response(
          JSON.stringify({ error: "Invalid filename" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));

      // Validate file size
      if (bytes.length > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: `File ${sanitizedName} exceeds 10MB limit` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const filePath = `${prefix}${sanitizedName}`;
      const res = await fetch(
        `${env.SUPABASE_URL}/storage/v1/object/uploads/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": f.type,
          },
          body: bytes,
        }
      );

      if (!res.ok) {
        console.error(`[UPLOAD] Failed: ${res.status} - ${await res.text()}`);
        return new Response(
          JSON.stringify({ error: `Upload failed for ${sanitizedName}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      uploadedFiles.push(filePath);
    }

    // Update order with uploaded file paths
    await sbAdmin
      .from("orders")
      .update({ photo_files: uploadedFiles })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ ok: true, files: uploadedFiles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload error";
    console.error(`[ERROR] upload-photo: ${message}`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
