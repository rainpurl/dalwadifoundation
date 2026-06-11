import { redirect } from "../../_lib/respond.js";
import { cookie } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.GOOGLE_CLIENT_ID) return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", origin + "/api/auth/callback");
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("prompt", "select_account");
  return redirect(auth.toString(), { "Set-Cookie": cookie("dlw_state", state, { maxAge: 600 }) });
}
