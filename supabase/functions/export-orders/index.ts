import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";

serve(async () => {
  const { data } = await sbAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const headers = Object.keys(data?.[0] ?? { id: "" });
  const csv = [
    headers.join(","),
    ...(data || []).map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ].join("\n");

  return new Response(csv, { headers: { "Content-Type": "text/csv" } });
});
