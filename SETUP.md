# The Dalwadi Foundation — deploy & setup (no terminal, all via the web)

Two layers:

1. **The public site** — static, deploys to Cloudflare Pages with no configuration. Ready today.
2. **The staff portal** — Google sign-in, the editable CMS, the authorized-user list, and the
   Cloudflare/GitHub status panel. These run as Cloudflare Pages Functions and need a Google
   OAuth app, a KV namespace, and a few secrets before they work.

Everything below is done in a web browser. No command line.

---

## Part A — Get the site live

### 1. Create the repository on github.com
1. Sign in to **github.com** → click the **+** (top right) → **New repository**.
2. Name it `dalwadi-foundation`. Public or Private is fine. **Do not** tick "Add a README".
   Click **Create repository**.

### 2. Upload the files (drag-and-drop)
1. On your computer, **double-click the downloaded `dalwadi-foundation.zip`** to unzip it.
2. **Open** the resulting `dalwadi-foundation` folder so you can see what's inside
   (`package.json`, `src`, `functions`, `public`, …).
3. Back on the new repo page, click the link **"uploading an existing file"**
   (or **Add file → Upload files**).
4. Select **everything inside** the folder (not the folder itself) and drag it onto the page.
   GitHub keeps the subfolders.
   - ⚠️ Important: `package.json` must land at the **top level** of the repo. That's why you drag
     the folder's *contents*, not the folder — otherwise it ends up one level too deep and the
     build will fail.
5. Scroll down, type a message like "Initial site", click **Commit changes**.

> If your browser won't accept dragging folders, install **GitHub Desktop** (a free app, no
> commands): create the repo, copy the files into its folder, then click **Commit** and **Push**.

### 3. Connect Cloudflare Pages
1. In the **Cloudflare dashboard** → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**. Authorize GitHub and pick the `dalwadi-foundation` repo.
2. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Save and Deploy.** In about a minute you'll get a live address like
   `dalwadi-foundation.pages.dev`. **Copy that URL — you'll need it in step 5.**

The public site now works. The portal will say it can't sign you in until Part B is done.

---

## Part B — Turn on the staff portal

### 4. Create the KV namespace (stores content + the user list)
1. **Workers & Pages → KV → Create a namespace**, name it `dalwadi`.
2. Go to **your Pages project → Settings → Functions → KV namespace bindings → Add binding**:
   - **Variable name:** `DALWADI_KV`  ← must be exactly this
   - **KV namespace:** the `dalwadi` one you just made
   - Save.

> The owner `pjbrahm369@gmail.com` is built in and can never be removed.

### 5. Create the Google sign-in app
1. Go to **console.cloud.google.com** → create or pick a project.
2. **APIs & Services → OAuth consent screen** → **External** → fill in an app name and your
   email → under **Test users**, add the Google addresses that should be allowed to sign in
   (at least `pjbrahm369@gmail.com`). You don't need to "publish" it.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type:** Web application
   - **Authorized redirect URIs → Add URI:** paste your live URL + `/api/auth/callback`, e.g.
     `https://dalwadi-foundation.pages.dev/api/auth/callback`
   - Create, then copy the **Client ID** and **Client secret**.

### 6. Add the secrets in Cloudflare
**Your Pages project → Settings → Environment variables → Production → Add variable.** Add three:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from step 5 |
| `GOOGLE_CLIENT_SECRET` | from step 5 |
| `SESSION_SECRET` | a long random string (40+ characters) — see note below |

For `SESSION_SECRET`, use any password generator (your browser's built-in one, or a password
manager) to make a long random string of letters and numbers. Keep it private; changing it later
signs everyone out.

**Then redeploy so the secrets take effect:** Pages project → **Deployments** → open the latest →
**Retry deployment** (or just commit any small change on github.com to trigger a rebuild).

### 7. Sign in
Go to your site → **About** → **Staff** (top right) → **Sign in with Google** with
`pjbrahm369@gmail.com`. You should land in the portal with four tiles.

### 8. (Optional) Light up the Dev-tools status dots
The "Dev tools" tile works without these (they just show "not configured"). To make them live,
add more environment variables (step 6) and redeploy:

**Cloudflare status:**
- `CF_API_TOKEN` — dashboard → **My Profile → API Tokens → Create Token** → use the
  **"Read all resources"** template (or a custom token with **Account → Cloudflare Pages → Read**).
- `CF_ACCOUNT_ID` — your account ID (shown on the Workers & Pages overview / in the dashboard URL).
- `CF_PROJECT_NAME` — `dalwadi-foundation`.

**GitHub status:**
- `GITHUB_TOKEN` — github.com → **Settings → Developer settings → Personal access tokens →
  Fine-grained tokens** → read-only **Contents** access to the repo.
- `GITHUB_REPO` — `your-username/dalwadi-foundation`.

### 9. Custom domain
**Your Pages project → Custom domains → Set up a domain** → add `dalwadi.org` (and/or
`dalwadi-org.katr.es`). Cloudflare walks you through the DNS.
- ⚠️ After the domain is live, go back to the Google app (step 5) and **add a second redirect URI**:
  `https://dalwadi.org/api/auth/callback` — otherwise sign-in fails on the real domain.

---

## Editing the site
Once you're signed in to the portal:
- **Pillars** tile — edit each pillar's copy and its partner links (this is where you fix the
  partner URLs), or add a pillar.
- **About** / **Contribute** tiles — edit that page's text; Contribute also has the donate link
  and contact email.

Text edits show on the public site immediately (no rebuild). **Adding a brand-new pillar** shows
on the About page right away, but a *new animated tower* on the landing page only appears after a
rebuild, because the towers are generated at build time. To add one, edit
`src/data/pillars.ts` on github.com (open the file → pencil icon → edit → Commit) — that triggers
an automatic redeploy.

## The real logo
On github.com: upload your `logo.svg` into the `public` folder (Add file → Upload files), then
open `src/components/Brand.astro` (pencil icon) and replace the placeholder `D` with
`<img src="/logo.svg" class="brandmark" alt="" aria-hidden="true" />`. Update `public/favicon.svg`
the same way. Keep the `brandmark` class so the intro animation still works.

## Good to know
- The auth/CMS layer is **v1 and hasn't been tested against live Google/Cloudflare yet** (it can't
  be until your credentials exist). Test the sign-in → edit → save loop right after your first
  deploy and treat it as something to harden, not as audited production auth.
- `functions/_lib/defaults.js` holds the API's fallback copy of the content; if you change the
  built-in defaults in `src/data/`, mirror them there too.
