import { redirect } from "../../_lib/respond.js";
export async function onRequestGet() {
  return redirect("/staff", { "Set-Cookie": "dlw_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
}
