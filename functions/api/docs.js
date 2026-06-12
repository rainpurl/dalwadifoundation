import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { getDocs, putDocs, putDocBlob, deleteDocBlob } from "../_lib/kv.js";

const MAX = 10 * 1024 * 1024; // 10 MB
const OK_EXT = ["pdf", "doc", "docx"];

function extOf(name) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}
function uid() {
  try { return crypto.randomUUID(); }
  catch (e) { return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
}
function normUrl(u) {
  u = String(u || "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : "https://" + u;
}

export async function onRequestGet(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  return json({ docs: await getDocs(context.env) }, 200, { "Cache-Control": "no-store" });
}

export async function onRequestPost(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);

  const ct = context.request.headers.get("content-type") || "";
  const docs = await getDocs(context.env);

  // File upload (or a link submitted through the same multipart form)
  if (ct.indexOf("multipart/form-data") > -1) {
    const form = await context.request.formData();
    const file = form.get("file");
    const nameField = (form.get("name") || "").toString().trim();

    if (file && typeof file === "object" && typeof file.arrayBuffer === "function") {
      const ext = extOf(file.name || nameField);
      if (OK_EXT.indexOf(ext) === -1) {
        return json({ error: "type", message: "Only PDF, DOC, or DOCX files are allowed." }, 400);
      }
      if (file.size > MAX) {
        return json({ error: "size", message: "That file is larger than the 10 MB limit." }, 413);
      }
      const id = uid();
      await putDocBlob(context.env, id, await file.arrayBuffer());
      docs.push({
        id: id,
        name: nameField || file.name || "Document",
        kind: "file",
        ext: ext,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      await putDocs(context.env, docs);
      return json({ ok: true });
    }

    const url = normUrl(form.get("url"));
    if (url) {
      docs.push({ id: uid(), name: nameField || url, kind: "link", url: url });
      await putDocs(context.env, docs);
      return json({ ok: true });
    }
    return json({ error: "empty", message: "Choose a file or enter a link." }, 400);
  }

  // Link submitted as JSON
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "bad json" }, 400); }
  const url = normUrl(body && body.url);
  if (body && body.kind === "link" && url) {
    docs.push({ id: uid(), name: (body.name && String(body.name).trim()) || url, kind: "link", url: url });
    await putDocs(context.env, docs);
    return json({ ok: true });
  }
  return json({ error: "bad body" }, 400);
}

export async function onRequestDelete(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "no id" }, 400);
  let docs = await getDocs(context.env);
  const doc = docs.find((d) => d && d.id === id);
  docs = docs.filter((d) => d && d.id !== id);
  await putDocs(context.env, docs);
  if (doc && doc.kind === "file") await deleteDocBlob(context.env, id);
  return json({ ok: true });
}
