import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin emails - must match AuthContext
const ADMIN_EMAILS = [
  "admin@ethinx.solutions",
];

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXPORT-ORDERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Export request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user?.email) {
      logStep("Auth failed", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin access
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      logStep("Access denied - not admin", { email: user.email });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Admin authenticated", { email: user.email });

    // Parse query params
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");

    logStep("Query params", { from, to, status, q });

    // Build query with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (from) {
      query = query.gte("created_at", from);
    }

    if (to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    const { data: orders, error: dbError } = await query;

    if (dbError) {
      logStep("DB error", dbError);
      throw new Error("Failed to fetch orders");
    }

    logStep("Orders fetched", { count: orders?.length || 0 });

    // Filter by search query if provided
    let filteredOrders = orders || [];
    if (q) {
      const searchLower = q.toLowerCase();
      filteredOrders = filteredOrders.filter((order) =>
        order.email?.toLowerCase().includes(searchLower) ||
        order.order_token?.toLowerCase().includes(searchLower) ||
        order.package_name?.toLowerCase().includes(searchLower)
      );
    }

    // Generate CSV
    const csvHeaders = [
      "order_id",
      "order_token",
      "email",
      "product",
      "amount_total",
      "currency",
      "status",
      "created_at",
      "updated_at",
      "paid_at",
      "completed_at",
      "stripe_session_id",
      "stripe_payment_intent_id",
      "photo_count",
      "source",
    ];

    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [csvHeaders.join(",")];

    for (const order of filteredOrders) {
      const row = [
        order.id,
        order.order_token,
        order.email,
        order.package_name || "",
        (order.amount_cents / 100).toFixed(2),
        order.currency?.toUpperCase() || "AUD",
        order.status,
        order.created_at,
        order.updated_at,
        order.paid_at || "",
        order.completed_at || "",
        order.stripe_session_id || "",
        order.stripe_payment_intent_id || "",
        order.photo_count || 0,
        "web",
      ].map(escapeCSV);

      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;

    logStep("CSV generated", { rows: csvRows.length, filename });

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
