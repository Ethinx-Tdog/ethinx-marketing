import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { env } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { order_token, files } = await req.json(); // files: [{name, type, base64}]

    if (!order_token || !files?.length) {
      return new Response(
        JSON.stringify({ error: "Missing order_token or files" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: order, error } = await sbAdmin
      .from("orders")
      .select("id, status, email, photo_files")
      .eq("order_token", order_token)
      .single();

    if (error || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["paid", "processing"].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: "Uploads not allowed for this order status" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

      const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));

      // Validate file size
      if (bytes.length > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: `File ${f.name} exceeds 10MB limit` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const filePath = `${prefix}${f.name}`;
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
        return new Response(
          JSON.stringify({ error: `Upload failed: ${await res.text()}` }),
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
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
