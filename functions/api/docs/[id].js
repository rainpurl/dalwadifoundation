import { json } from "../../_lib/respond.js";
import { requireUser } from "../../_lib/auth.js";
import { getDocs, getDocBlob } from "../../_lib/kv.js";

export async function onRequestGet(context) {
  // Staff-only for now. To make documents publicly downloadable later, remove this check.
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);

  const id = context.params.id;
  const docs = await getDocs(context.env);
  const doc = docs.find((d) => d && d.id === id);
  if (!doc) return json({ error: "not found" }, 404);

  if (doc.kind === "link") return Response.redirect(doc.url, 302);

  const buf = await getDocBlob(context.env, id);
  if (!buf) return json({ error: "not found" }, 404);

  const base = String(doc.name || "document").replace(/[^\w.\- ]+/g, "_").trim() || "document";
  const filename = /\.[a-z0-9]+$/i.test(base) ? base : base + "." + (doc.ext || "pdf");
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": doc.contentType || "application/octet-stream",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Cache-Control": "no-store",
    },
  });
}
