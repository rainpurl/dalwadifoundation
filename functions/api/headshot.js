import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { putHeadshotBlob } from "../_lib/kv.js";

const MAX = 6 * 1024 * 1024; // generous: the client already shrinks headshots to ~400px
const OK_TYPES = ["image/avif", "image/webp", "image/jpeg", "image/png", "image/gif"];

function uid() {
  try { return crypto.randomUUID(); }
  catch (e) { return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
}

// Staff only: store one team headshot and return its public URL. The bytes live in KV;
// the team member stores the returned /api/headshot/<id> URL (not the image itself).
export async function onRequestPost(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  const ct = context.request.headers.get("content-type") || "";
  if (ct.indexOf("multipart/form-data") === -1) return json({ error: "bad request" }, 400);
  const form = await context.request.formData();
  const file = form.get("file");
  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
    return json({ error: "empty" }, 400);
  }
  if (file.size > MAX) return json({ error: "size", message: "That image is too large." }, 413);
  const type = OK_TYPES.indexOf(file.type) > -1 ? file.type : "image/jpeg";
  const id = uid();
  await putHeadshotBlob(context.env, id, await file.arrayBuffer(), type);
  return json({ ok: true, id: id, url: "/api/headshot/" + id });
}
