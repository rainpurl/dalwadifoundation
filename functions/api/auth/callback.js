import { redirect } from "../../_lib/respond.js";
import { getCookie, cookie, sign } from "../../_lib/auth.js";
import { getUsers } from "../../_lib/kv.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== getCookie(request, "dlw_state")) return redirect("/staff?error=state");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) return redirect("/staff?error=config");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: url.origin + "/api/auth/callback",
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return redirect("/staff?error=token");
  const tok = await tokenRes.json();

  const uiRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: "Bearer " + tok.access_token },
  });
  if (!uiRes.ok) return redirect("/staff?error=userinfo");
  const ui = await uiRes.json();
  const email = String(ui.email || "").toLowerCase();
  if (!email || ui.email_verified === false) return redirect("/staff?error=unauthorized");

  const users = (await getUsers(env)).map((e) => String(e).toLowerCase());
  if (!users.includes(email)) return redirect("/staff?error=unauthorized");

  const token = await sign({ email, exp: Date.now() + 7 * 24 * 3600 * 1000 }, env.SESSION_SECRET);
  return redirect("/staff", { "Set-Cookie": cookie("dlw_session", token, { maxAge: 7 * 24 * 3600 }) });
}
