import { json } from "../../_lib/respond.js";
import { requireUser } from "../../_lib/auth.js";
export async function onRequestGet(context) {
  const email = await requireUser(context);
  if (!email) return json({ error: "unauthorized" }, 401);
  return json({ email });
}
