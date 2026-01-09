import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Parse and validate request body
    const body = await req.json();
    const { amount, description } = body;

    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return new Response(
        JSON.stringify({ error: "Invalid amount: must be a positive integer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount > 10000) {
      return new Response(
        JSON.stringify({ error: "Amount exceeds maximum allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedDescription = description 
      ? String(description).slice(0, 255) 
      : "Credit deduction";

    console.log(`Deducting ${amount} credits from user ${userId}`);

    // Call the database function using admin client
    const { data, error } = await sbAdmin.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_description: sanitizedDescription,
    });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to deduct credits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data === false) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get updated balance
    const { data: balanceData } = await sbAdmin.rpc("get_credit_balance", {
      p_user_id: userId,
    });

    console.log(`Successfully deducted ${amount} credits. New balance: ${balanceData}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deducted: amount,
        new_balance: balanceData || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
