import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { getUsers, putUsers } from "../_lib/kv.js";
import { OWNER } from "../_lib/defaults.js";

export async function onRequestGet(context) {
  if (!(await requireUser(context))) return json({ error: "unauthorized" }, 401);
  return json({ users: await getUsers(context.env) });
}
export async function onRequestPost(context) {
  if (!(await requireUser(context))) return json({ error: "unauthorized" }, 401);
  let b; try { b = await context.request.json(); } catch { return json({ error: "bad" }, 400); }
  const add = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(add)) return json({ error: "bad email" }, 400);
  const list = await getUsers(context.env);
  if (!list.map((e) => e.toLowerCase()).includes(add)) list.push(add);
  await putUsers(context.env, list);
  return json({ ok: true, users: await getUsers(context.env) });
}
export async function onRequestDelete(context) {
  if (!(await requireUser(context))) return json({ error: "unauthorized" }, 401);
  let b; try { b = await context.request.json(); } catch { return json({ error: "bad" }, 400); }
  const rm = String(b.email || "").trim().toLowerCase();
  if (rm === OWNER) return json({ error: "owner cannot be removed" }, 403);
  const list = (await getUsers(context.env)).filter((e) => e.toLowerCase() !== rm);
  await putUsers(context.env, list);
  return json({ ok: true, users: await getUsers(context.env) });
}
