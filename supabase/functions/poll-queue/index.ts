import { serve } from "../_shared/deps.ts";
import { sbAdmin } from "../_shared/sb.ts";

const MODAL_ENDPOINT = "https://api.modal.com/ethinx/generate"; // TODO: replace after Modal deploy (STEP 13)

serve(async () => {
  const { data: item } = await sbAdmin
    .from("order_queue")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!item) {
    return new Response(JSON.stringify({ idle: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  await sbAdmin
    .from("order_queue")
    .update({ status: "dispatching" })
    .eq("id", item.id);

  const res = await fetch(MODAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item.payload),
  });

  if (!res.ok) {
    await sbAdmin
      .from("order_queue")
      .update({ status: "failed", last_error: await res.text() })
      .eq("id", item.id);
    return new Response("error", { status: 500 });
  }

  await sbAdmin
    .from("order_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  return new Response(JSON.stringify({ dispatched: item.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
