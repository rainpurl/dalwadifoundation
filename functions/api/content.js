import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { getContent, putContent } from "../_lib/kv.js";

export async function onRequestGet(context) {
  return json(await getContent(context.env), 200, { "Cache-Control": "no-store" });
}
export async function onRequestPut(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "bad json" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "bad body" }, 400);
  const content = {
    pillars: Array.isArray(body.pillars) ? body.pillars : [],
    about: body.about && typeof body.about === "object" ? body.about : {},
    contribute: body.contribute && typeof body.contribute === "object" ? body.contribute : {},
    settings: body.settings && typeof body.settings === "object" ? body.settings : {},
  };
  await putContent(context.env, content);
  return json({ ok: true });
}
