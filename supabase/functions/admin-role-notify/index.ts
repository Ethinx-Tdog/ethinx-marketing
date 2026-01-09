import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendAdminAlert } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  audit_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using service client
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: adminCheck } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { audit_id }: NotifyRequest = await req.json();

    if (!audit_id) {
      return new Response(
        JSON.stringify({ error: "Missing audit_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch audit entry
    const { data: auditEntry, error: auditError } = await serviceClient
      .from("admin_audit")
      .select("*")
      .eq("id", audit_id)
      .single();

    if (auditError || !auditEntry) {
      return new Response(
        JSON.stringify({ error: "Audit entry not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already sent
    if (auditEntry.email_sent) {
      return new Response(
        JSON.stringify({ message: "Email already sent", email_sent: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get actor email
    const { data: actorData } = await serviceClient.auth.admin.getUserById(auditEntry.actor_user_id);
    const actorEmail = actorData?.user?.email || auditEntry.actor_user_id;

    // Format timestamp
    const timestamp = new Date(auditEntry.ts).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Build email
    const actionLabel = auditEntry.action === "grant_admin" ? "🟢 Admin Granted" : "🔴 Admin Revoked";
    const subject = `Admin Role Updated: ${auditEntry.action === "grant_admin" ? "Granted" : "Revoked"}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
          ${actionLabel}
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666; width: 120px;">Action:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600;">${auditEntry.action}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Target:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600;">${auditEntry.target_email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Performed by:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">${actorEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #666;">Time:</td>
            <td style="padding: 12px 0;">${timestamp}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          <a href="${Deno.env.get("SITE_URL") || ""}/admin/audit" style="color: #f59e0b; text-decoration: none;">
            View Audit Log →
          </a>
        </p>
      </div>
    `;

    // Send email
    const emailResult = await sendAdminAlert(subject, html);
    console.log("[ADMIN-NOTIFY] Email result:", emailResult);

    // Update audit entry
    const { error: updateError } = await serviceClient
      .from("admin_audit")
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq("id", audit_id);

    if (updateError) {
      console.error("[ADMIN-NOTIFY] Failed to update audit entry:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent",
        email_sent: true 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN-NOTIFY] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
