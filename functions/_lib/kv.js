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

// ---- Official Documents ----
// Metadata lives in the "docs" key (a JSON array). File bytes live in "doc:<id>".
export async function getDocs(env) {
  if (!env.DALWADI_KV) return [];
  const raw = await env.DALWADI_KV.get("docs");
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}
export async function putDocs(env, list) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("docs", JSON.stringify(Array.isArray(list) ? list : []));
}
export async function putDocBlob(env, id, buf) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("doc:" + id, buf);
}
export async function getDocBlob(env, id) {
  if (!env.DALWADI_KV) return null;
  return await env.DALWADI_KV.get("doc:" + id, { type: "arrayBuffer" });
}
export async function deleteDocBlob(env, id) {
  if (!env.DALWADI_KV) return;
  await env.DALWADI_KV.delete("doc:" + id);
}

// ---- Photo gallery (About page) ----
// Order-preserving metadata in "gallery"; image bytes in "gimg:<id>".
export async function getGallery(env) {
  if (!env.DALWADI_KV) return [];
  const raw = await env.DALWADI_KV.get("gallery");
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}
export async function putGallery(env, list) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("gallery", JSON.stringify(Array.isArray(list) ? list : []));
}
export async function putGalleryBlob(env, id, buf) {
  if (!env.DALWADI_KV) throw new Error("KV not bound");
  await env.DALWADI_KV.put("gimg:" + id, buf);
}
export async function getGalleryBlob(env, id) {
  if (!env.DALWADI_KV) return null;
  return await env.DALWADI_KV.get("gimg:" + id, { type: "arrayBuffer" });
}
export async function deleteGalleryBlob(env, id) {
  if (!env.DALWADI_KV) return;
  await env.DALWADI_KV.delete("gimg:" + id);
}
