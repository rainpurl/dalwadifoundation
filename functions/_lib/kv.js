import { DEFAULT_CONTENT, OWNER } from "./defaults.js";

export async function getContent(env) {
  if (!env.DALWADI_KV) return DEFAULT_CONTENT;
  const raw = await env.DALWADI_KV.get("content");
  if (!raw) return DEFAULT_CONTENT;
  try { return JSON.parse(raw); } catch { return DEFAULT_CONTENT; }
}
export async function putContent(env, content) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("content", JSON.stringify(content));
}
function withOwner(list) {
  const lower = list.map((e) => String(e).toLowerCase());
  if (!lower.includes(OWNER)) list.unshift(OWNER);
  // de-dupe, owner first
  const seen = new Set(); const out = [];
  for (const e of list) { const k = String(e).toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(e); } }
  return out;
}
export async function getUsers(env) {
  if (!env.DALWADI_KV) return [OWNER];
  const raw = await env.DALWADI_KV.get("users");
  let list = [];
  if (raw) { try { list = JSON.parse(raw); } catch { list = []; } }
  if (!Array.isArray(list)) list = [];
  return withOwner(list);
}
export async function putUsers(env, list) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("users", JSON.stringify(withOwner(list)));
}
