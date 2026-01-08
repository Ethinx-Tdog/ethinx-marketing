import { serve } from "../_shared/deps.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { name, role, tone = "professional" } = await req.json();
  const bio = `${name} is a ${role} with a ${tone} presence. This is a fallback bio while our generator is scaling.`;

  return new Response(JSON.stringify({ bio }), {
    headers: { "Content-Type": "application/json" },
  });
});
