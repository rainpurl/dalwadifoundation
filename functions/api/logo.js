import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";

// Serves the staff-uploaded logo (stored as its own KV value so it never bloats
// the content blob that every page fetches). Defaults to the baked /logo.svg
// when nothing has been uploaded.
export async function onRequestGet(context) {
  const env = context.env;
  if (!env.DALWADI_KV) return new Response("Not found", { status: 404 });
  const svg = await env.DALWADI_KV.get("logo");
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

export async function onRequestPut(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "bad json" }, 400); }
  const svg = body && typeof body.svg === "string" ? body.svg : "";
  if (svg.indexOf("<svg") === -1) return json({ error: "not an svg" }, 400);
  if (svg.length > 600000) return json({ error: "too large" }, 413);
  if (!context.env.DALWADI_KV) return json({ error: "KV not bound" }, 500);
  await context.env.DALWADI_KV.put("logo", svg);
  return json({ ok: true });
}
