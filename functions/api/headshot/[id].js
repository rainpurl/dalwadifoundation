import { json } from "../../_lib/respond.js";
import { getHeadshot } from "../../_lib/kv.js";

// Public: team headshots are shown on the About page, so no auth here. Each image is
// addressed by a unique id and never changes, so it can be cached hard.
export async function onRequestGet(context) {
  const id = context.params.id;
  const hs = await getHeadshot(context.env, id);
  if (!hs) return json({ error: "not found" }, 404);
  return new Response(hs.buf, {
    status: 200,
    headers: {
      "Content-Type": hs.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
