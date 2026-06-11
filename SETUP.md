# The Dalwadi Foundation — deploy & setup

There are two layers here:

1. **The public site** — fully static (`dist/`). It deploys to Cloudflare Pages with zero
   configuration and is ready today.
2. **The app layer** — Google sign-in, the editable CMS, the authorized-user list, and the
   Cloudflare/GitHub status panel. These run as **Cloudflare Pages Functions** (the `functions/`
   folder) and need a few credentials before they work: a Google OAuth app, a Cloudflare KV
   namespace, and (optionally) API tokens for the status panel.

Do Part A to get the site live. Do Part B when you want the staff portal working.

---

## Part A — Get the site live (GitHub + Cloudflare Pages)

### 1. Put the code on GitHub
From this project folder:

```bash
git init
git add .
git commit -m "Dalwadi Foundation site"
git branch -M main
# create an empty repo on github.com first (e.g. dalwadi-foundation), then:
git remote add origin https://github.com/<you>/dalwadi-foundation.git
git push -u origin main
```

### 2. Create the Cloudflare Pages project
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the repo you just pushed.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy.** In ~1 minute you'll get a `*.pages.dev` URL with the live site.

The four pages (`/`, `/about`, `/contribute`, `/staff`) and the API routes in `functions/`
deploy together automatically. At this point the public site works; the portal will say it
can't sign you in until Part B is done.

---

## Part B — Turn on the staff portal

### 3. Create a KV namespace (stores content + the user list)
1. Dashboard → **Workers & Pages** → **KV** → **Create a namespace**, name it `dalwadi`.
2. Copy its **Namespace ID**.
3. Bind it to the Pages project: **your Pages project → Settings → Functions → KV namespace
   bindings → Add binding**:
   - **Variable name:** `DALWADI_KV`  ← must be exactly this
   - **KV namespace:** the one you just made
4. (Optional, for local dev) paste the ID into `wrangler.toml`.

> The owner account `pjbrahm369@gmail.com` is seeded automatically and can never be removed,
> even before anything is written to KV.

### 4. Create the Google sign-in app
1. Go to **console.cloud.google.com** → create/select a project.
2. **APIs & Services → OAuth consent screen** → choose **External** → fill in app name + your
   email → add yourself as a **Test user** (so only allowed people can sign in while it's in
   "Testing"). You don't need to publish it.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type:** Web application
   - **Authorized redirect URIs:** add your callback URL(s):
     - `https://<your-pages-subdomain>.pages.dev/api/auth/callback`
     - and later your real domain: `https://dalwadi.org/api/auth/callback`
4. Copy the **Client ID** and **Client secret**.

### 5. Add the secrets to Cloudflare Pages
**Your Pages project → Settings → Environment variables → Production** (add the same to
**Preview** if you want previews to work). Add:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from step 4 |
| `GOOGLE_CLIENT_SECRET` | from step 4 |
| `SESSION_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |

**Redeploy** (Deployments → Retry/redeploy) so the new variables take effect. Then visit
`/about`, click **Staff**, and sign in with `pjbrahm369@gmail.com`. You should land in the portal.

### 6. (Optional) Light up the Dev-tools status panel
The "Dev tools" tile shows Cloudflare + GitHub status. It works without these (shows
"not configured"); add them to make the dots live.

**Cloudflare deploy status** — add env vars:
- `CF_API_TOKEN` — dashboard → **My Profile → API Tokens → Create Token**. Use the
  **"Read all resources"** template, or a custom token with **Account → Cloudflare Pages → Read**.
- `CF_ACCOUNT_ID` — shown in the dashboard URL / Workers & Pages overview.
- `CF_PROJECT_NAME` — your Pages project name (e.g. `dalwadi-foundation`).

**GitHub status** — add env vars:
- `GITHUB_TOKEN` — github.com → Settings → Developer settings → **Fine-grained token**, read-only
  **Contents** access to the repo.
- `GITHUB_REPO` — `<you>/dalwadi-foundation`.

Redeploy after adding them.

### 7. Custom domain
**Your Pages project → Custom domains → Set up a domain.**
- Add `dalwadi.org` (and `www` if you want). Cloudflare walks you through DNS.
- You can also add `dalwadi-org.katr.es` the same way if that's where you want it first.
- **Important:** after the domain is live, add `https://dalwadi.org/api/auth/callback` to the
  Google OAuth **Authorized redirect URIs** (step 4) or sign-in will fail on that domain.

---

## How editing works
- Staff edits in the portal are saved to **KV** and served by `/api/content`.
- Public pages render the built-in copy instantly, then fetch `/api/content` and swap in any
  edits — so **text changes show up live, no rebuild needed**.
- **Adding a brand-new pillar** updates the About page and the API immediately, but the animated
  towers on the landing page are generated at build time. To make a *new* tower appear, edit
  `src/data/pillars.ts` and push (a redeploy). Editing existing pillar text shows live.

## Swapping in the real logo
Replace the placeholder "D" in `src/components/Brand.astro` with
`<img src="/logo.svg" class="brandmark" alt="" aria-hidden="true" />` (drop `logo.svg` into
`public/`). Update `public/favicon.svg` too. Keep the `brandmark` class so the animation works.

## Before launch — confirm these
Search the project for `EDIT` and the placeholders:
- Partner URLs in `src/data/pillars.ts` (House of Devi, charity: water, Hilton College, Daya, HAWC).
- `donateUrl` and `email` in `src/data/site.ts`.
- Keep `functions/_lib/defaults.js` in sync with `src/data/*` (it's the API's fallback copy).

## Local development
```bash
npm install
npm run build
npx wrangler pages dev dist          # serves the site + functions locally
```
For local OAuth, add the secrets to a `.dev.vars` file (same names as the env vars) and add
`http://localhost:8788/api/auth/callback` to the Google redirect URIs.

## Security notes (please read)
- Sessions are HMAC-signed cookies (HttpOnly, Secure, SameSite=Lax). Keep `SESSION_SECRET` secret;
  rotating it signs everyone out.
- Only verified Google emails on the allowlist can sign in; the owner is immutable server-side.
- This auth/CMS layer is **v1 and hasn't been exercised against live Google/Cloudflare/GitHub yet**
  (it can't be until your credentials exist). Test the full sign-in → edit → save loop after the
  first deploy, and treat it as something to harden, not as audited production auth.
