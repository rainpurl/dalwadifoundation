import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { getGallery, putGallery, putGalleryBlob, deleteGalleryBlob, getGallerySpeed, putGallerySpeed } from "../_lib/kv.js";

const MAX = 5 * 1024 * 1024; // 5 MB per photo
const MAX_COUNT = 30;
const OK_TYPES = ["image/avif", "image/webp", "image/jpeg", "image/png", "image/gif"];

function uid() {
  try { return crypto.randomUUID(); }
  catch (e) { return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
}
function extFor(ct) {
  return ct === "image/avif" ? "avif" : ct === "image/webp" ? "webp"
    : ct === "image/png" ? "png" : ct === "image/gif" ? "gif" : "jpg";
}

// Public: the About page reads this to render the galleries.
export async function onRequestGet(context) {
  return json(
    { gallery: await getGallery(context.env), speed: await getGallerySpeed(context.env) },
    200,
    { "Cache-Control": "no-store" }
  );
}

export async function onRequestPost(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  const ct = context.request.headers.get("content-type") || "";

  // Set the carousel scroll speed (JSON body, no file): seconds per loop, lower is faster.
  if (ct.indexOf("application/json") > -1) {
    let body = {};
    try { body = await context.request.json(); } catch (e) {}
    let n = parseInt(body && body.speed, 10);
    if (!isFinite(n)) return json({ error: "bad speed" }, 400);
    n = Math.max(10, Math.min(180, n));
    await putGallerySpeed(context.env, n);
    return json({ ok: true, speed: n });
  }

  if (ct.indexOf("multipart/form-data") === -1) return json({ error: "bad request" }, 400);

  const gallery = await getGallery(context.env);
  if (gallery.length >= MAX_COUNT) {
    return json({ error: "full", message: "The gallery is full (max " + MAX_COUNT + " photos)." }, 409);
  }
  const form = await context.request.formData();
  const file = form.get("file");
  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
    return json({ error: "empty" }, 400);
  }
  if (file.size > MAX) {
    return json({ error: "size", message: "That photo is larger than the 5 MB limit." }, 413);
  }
  const type = OK_TYPES.indexOf(file.type) > -1 ? file.type : "image/jpeg";
  const id = uid();
  await putGalleryBlob(context.env, id, await file.arrayBuffer());
  gallery.push({ id: id, contentType: type, ext: extFor(type), size: file.size });
  await putGallery(context.env, gallery);
  return json({ ok: true, id: id });
}

export async function onRequestDelete(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "no id" }, 400);
  let gallery = await getGallery(context.env);
  gallery = gallery.filter((g) => g && g.id !== id);
  await putGallery(context.env, gallery);
  await deleteGalleryBlob(context.env, id);
  return json({ ok: true });
}
