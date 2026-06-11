import { json } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";

export async function onRequestGet(context) {
  if (!(await requireUser(context))) return json({ error: "unauthorized" }, 401);
  const env = context.env;
  // This endpoint runs on Cloudflare Pages Functions — if it answers at all, the
  // site is live, so Cloudflare defaults to OK. Tokens just add deploy/commit detail.
  const out = {
    cloudflare: { state: "ok", detail: "Functions live" },
    github: { state: "unknown", detail: "Add GITHUB_TOKEN to show repo status" },
  };

  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID && env.CF_PROJECT_NAME) {
    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${env.CF_PROJECT_NAME}/deployments?per_page=1`,
        { headers: { Authorization: "Bearer " + env.CF_API_TOKEN } }
      );
      const d = await r.json();
      if (r.ok && d.result && d.result[0]) {
        const dep = d.result[0];
        const st = dep.latest_stage && dep.latest_stage.status;
        out.cloudflare = {
          state: st === "success" ? "ok" : st === "failure" ? "bad" : "warn",
          detail: dep.latest_stage ? dep.latest_stage.name + " · " + st : "deployed",
        };
      } else {
        out.cloudflare = { state: "bad", detail: (d.errors && d.errors[0] && d.errors[0].message) || "API error" };
      }
    } catch { out.cloudflare = { state: "bad", detail: "unreachable" }; }
  }

  if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
    try {
      const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/commits?per_page=1`, {
        headers: { Authorization: "Bearer " + env.GITHUB_TOKEN, "User-Agent": "dalwadi-portal", Accept: "application/vnd.github+json" },
      });
      const d = await r.json();
      if (r.ok && Array.isArray(d) && d[0]) {
        out.github = { state: "ok", detail: "last commit " + String(d[0].sha || "").slice(0, 7) };
      } else {
        out.github = { state: "bad", detail: (d && d.message) || "API error" };
      }
    } catch { out.github = { state: "bad", detail: "unreachable" }; }
  }

  return json(out, 200, { "Cache-Control": "no-store" });
}
