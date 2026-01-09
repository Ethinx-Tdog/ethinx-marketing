export const env = {
  SITE_URL: Deno.env.get("SITE_URL")!,
  FROM_EMAIL: Deno.env.get("FROM_EMAIL")!,
  SENDER_NAME: Deno.env.get("SENDER_NAME") ?? "ETHINX",
  ADMIN_EMAIL: Deno.env.get("ADMIN_EMAIL") ?? "",
  SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY")!,
  STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
  RESEND_API_KEY: Deno.env.get("RESEND_API_KEY")!,
  // Self-hosted worker (replaces Modal)
  WORKER_URL: Deno.env.get("WORKER_URL") || "http://91.99.162.243:8080",
  WORKER_API_KEY: Deno.env.get("WORKER_API_KEY") || "",
  // Legacy Modal support (deprecated)
  MODAL_WEBHOOK_SECRET: Deno.env.get("MODAL_WEBHOOK_SECRET") || Deno.env.get("WORKER_API_KEY") || "",
};
