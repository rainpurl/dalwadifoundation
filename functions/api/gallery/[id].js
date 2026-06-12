import { json } from "../../_lib/respond.js";
import { getGallery, getGalleryBlob } from "../../_lib/kv.js";

// Public: gallery photos are shown on the About page, so no auth here. Each image is
// addressed by a unique id and never changes, so it can be cached hard.
export async function onRequestGet(context) {
  const id = context.params.id;
  const gallery = await getGallery(context.env);
  const item = gallery.find((g) => g && g.id === id);
  if (!item) return json({ error: "not found" }, 404);
  const buf = await getGalleryBlob(context.env, id);
  if (!buf) return json({ error: "not found" }, 404);
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": item.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
