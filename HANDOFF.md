# The Dalwadi Foundation - Project Handoff

_Last updated by Claude at the end of a working session. This document is self-contained: a new chat should be able to pick up the project from this file plus the project zip alone._

---

## 0. Start here (for the next chat)

1. **Upload the project zip** and say: _"Read HANDOFF.md, then help me continue."_
2. The assistant's first move should be to read this file, then `npm install` + `npm run build` to confirm the project still builds before changing anything.
3. **Current state:** the GitHub↔Cloudflare connection is fixed - the Pages project was recreated, it builds from Git, and the CSS-columns revert is live. The active items now are (a) **fix the staff sign-in** (Google OAuth is returning `Error 401: invalid_client` - see §10) and (b) **set the live site font to IBM Plex Serif** through the staff portal (see §10, "KV stores content wholesale"). See §11 for the full TODO list.

---

## 1. What this is

A cinematic one-page landing site for **The Dalwadi Foundation**, a nonprofit organized around four "pillars." The bottom navigation bar is the literal *foundation*; on load, a splash screen ("The Dalwadi Foundation" + logo) slides down into that bar, and four **pillar columns** rise from it. Clicking a column sinks it to reveal a card with copy and a link to the partner organization.

**The four pillars and their partners (URLs confirmed correct):**

- **Art** (Community & Art) → House of Devi - `https://www.houseofdevi.org`
- **Water** (Water Access) → charity: water - `https://www.charitywater.org`
- **Education** → Conrad N. Hilton College, University of Houston - `https://www.uh.edu/hilton-college/`
- **Domestic Safety** → Daya (`https://www.dayahouston.org`) + Houston Area Women's Center (`https://www.hawc.org`)

**Key facts**

| | |
|---|---|
| GitHub repo | `rainpurl/dalwadifoundation` (private) |
| Staging URL | `dalwadi-org.katr.es` |
| Production URL (later) | `dalwadi.org` |
| Owner / sign-in | `pjbrahm369@gmail.com` (built into the code as the permanent owner; can't be removed) |
| Cloudflare KV namespace | `dalwadi` (bound to the Functions as `DALWADI_KV`) |
| Workflow | **No terminal** - everything via github.com (web UI) + the Cloudflare dashboard |

---

## 2. Tech stack & architecture

- **Astro 4.16.18**, `output: 'static'` - the public site is fully static HTML/CSS/JS. Builds with `npm run build` → `dist/`.
- **Cloudflare Pages** hosts the static site. **Cloudflare Pages Functions** (the `functions/` folder) run the dynamic layer.
- **Cloudflare KV** (`DALWADI_KV`) is the CMS store: staff edits to pillar copy, About/Contribute text, the team list, the font, the logo, and the authorized-user list all live here and override the built-in defaults at runtime.
- **Google OAuth** gates the staff portal. Only Google accounts on the authorized list (owner is always allowed) can sign in.
- Two layers, deployable independently:
  1. **Public site** - static, works with zero configuration.
  2. **Staff portal** - needs a Google OAuth app, the KV binding, and secrets (see §6) before it functions.

**How content flows:** the page ships with default copy baked in from `src/data/`. On load, `src/scripts/live.ts` fetches `/api/content` and patches staff-edited values into elements tagged `data-c` / `data-p` / `data-plink` / `data-href`, and applies the saved **font** and **logo**. So text/font edits made in the portal appear on the live site immediately - **but** a brand-new pillar *column* only appears after a rebuild, because the columns are generated at build time from `src/data/pillars.ts`. **Important:** see §10 on how KV content is served *wholesale*, which affects whether edits to baked defaults ever show.

---

## 3. File map

**Config / docs**
- `package.json`, `package-lock.json` - deps (just `astro`; Three.js was removed, see §9)
- `astro.config.mjs` - `site: 'https://dalwadi.org'`, static output
- `SETUP.md` - the original step-by-step deploy guide (some dashboard labels in it are outdated - trust §5)
- `README.md`, `HANDOFF.md` (this file)

**Pages - `src/pages/`**
- `index.astro` - the landing page (columns + foundation + brand + phone modal); imports the client scripts
- `about.astro` - About page + pillar cards + staff bio cards
- `contribute.astro` - Support page + full-bleed donation embed
- `staff/index.astro` - staff sign-in / portal entry

**Layouts - `src/layouts/`**
- `Base.astro` - landing layout (loads the IBM Plex Serif webfont, weights 300-700)
- `Page.astro` - sub-page layout (persistent nav; same font link)

**Components - `src/components/`**
- `Towers.astro` - the four pillar columns (**CSS 3D prism**, see §9). Each panel now has title + body + links (no eyebrow).
- `Foundation.astro` - the bottom "foundation" navbar (logo center, About left, Support right)
- `Brand.astro` - logo mark + wordmark (splash and navbar)
- `BackButton.astro` - sub-page back button

**Client scripts - `src/scripts/`**
- `stage.ts` - landing intro timeline + pillar open/close + **the cursor-turn/glare logic** (`--ry` / `--shine`)
- `metal.ts` - the shimmering "metal" button cursor effect
- `live.ts` - patches CMS content (copy, links, font, logo) from `/api/content` into the page
- `portal.ts` - the staff portal UI (four tiles: Pillars, About, Contribute, Dev tools). The Dev-tools **font picker is now a free-text Google-Font name box** (was a dropdown).

**Styles**
- `src/styles/global.css` - all styling (root variables, columns/faces, foundation bar, portal, mobile)

**Data (defaults) - `src/data/`**
- `pillars.ts` - the four pillars + partner links (no `eyebrow` field)
- `site.ts` - About copy, the team list, Contribute copy + donate link + contact email

**Functions (server) - `functions/`**
- `_lib/auth.js` - OAuth + session helpers (`requireUser`, etc.)
- `_lib/kv.js` - KV read/write helpers (`getContent` returns KV content **wholesale** - see §10)
- `_lib/defaults.js` - **fallback copy of the content** the API serves; mirror of `src/data/` + the default font + the immutable owner (keep in sync - see §10)
- `_lib/respond.js` - JSON/redirect response helpers
- `api/auth/login.js`, `callback.js`, `me.js`, `logout.js` - the Google sign-in flow (`/api/auth/callback` is the OAuth redirect target)
- `api/content.js` - GET/PUT the site + pillar content (the CMS)
- `api/users.js` - manage the authorized-user list
- `api/logo.js` - serves an uploaded logo at `/api/logo`
- `api/status.js` - powers the Dev-tools status dots (see §5); requires sign-in

---

## 4. Current state (as of this handoff)

**Deployment is unblocked.** The Cloudflare Pages project was deleted and recreated, it's connected to Git and building again, and the **CSS-columns revert is live** (`src/scripts/towers3d.ts` was deleted on github.com; the `three` dependency is gone; build is green and homepage JS is ~4.4 kB gzipped, down from ~117 kB on the old WebGL version).

**This session's changes.** Six batches; all still need pushing (see the note below). Newest first.

**Batch 6 - About cards sync, navbar-slide fix, bigger nav buttons, Zeffy warm-up:**

- **NAVBAR-SLIDE FIX (important gotcha).** The bar was sliding with the page despite `transition:name="sitenav"`. Cause: the directive was on the `<Foundation transition:name="sitenav" />` COMPONENT USAGE, and Astro did not forward it onto the component's root `<nav>` - it emitted the scoped `view-transition-name: sitenav` CSS rule, but the matching `data-astro-transition-scope` attribute landed on NO element, so nothing actually got the name and the bar stayed part of the sliding root. Fix: put `transition:name="sitenav"` directly on the `<nav>` inside `Foundation.astro`, and drop it from the two `<Foundation />` usages (home + Page layout). Verified in the build: the `<nav>` now carries the scope attribute and resolves to `view-transition-name: sitenav` on all three pages, so it is lifted into its own transition group and held static while the root slides. RULE: keep the directive ON THE NAV ELEMENT, never only on the component, or this regresses.
- **About-page pillar cards now sync with the columns.** `about.astro` still renders the baked `.pillar-grid` for no-JS/first paint, but `live.ts` now rebuilds that grid from `data.pillars` (the same array that feeds the columns), so edits, additions, and removals all reflect on the About page. (It rebuilds the whole grid, like the team list, so add/remove is handled, not just text.)
- **About / Support nav buttons are larger** for readability: `.foundation .metal` now uses `font-size: clamp(.9rem, 2.4vw, 1rem)` and a bit more padding. Scoped to the bar, so other small buttons are unchanged.
- **Zeffy embed is warmed in the background.** Both layouts add `preconnect` + `dns-prefetch` to `www.zeffy.com` and `prefetch` the embed document (`/embed/donation-form/d-lanthropy`), so opening Support has little to no load delay. preconnect (DNS/TLS warm-up) is the reliable win regardless of the embed's cache headers; the prefetch is a best-effort document cache. NOTE: this does not render the form in the background (no hidden live iframe), so it avoids skewing Zeffy's view analytics; if a truly zero-delay open is ever needed, a persistent hidden iframe (`transition:persist`) is the next step, at the cost of loading the form on every page.

**Batch 5 - rename fix (for real), Cormorant, no-flash, pillar base, copy protection, Official Documents:**

- **Renaming a pillar now updates the column, for real.** Batch 4 stored the key on the editor subblock so saves wouldn't drift, but that did not fix sites whose KV already held a drifted key from an earlier save: `live.ts` matched columns by key only (`byKey[bakedKey]`), so a stale key left the WHOLE column (label, title, body, links) un-patched. `live.ts` now walks each baked `.tower[data-i]` and resolves its pillar by key OR by position (`byKey[data-pillar] || data.pillars[data-i]`), then patches every `[data-p]` / `[data-plink]` inside that tower. Position is the reliable invariant for the four fixed columns, so renamed pillars (and any already-drifted KV keys) patch correctly now. The Batch 4 `data-key` preservation stays (it keeps keys clean going forward).
- **Why a content edit does NOT create a Cloudflare deployment.** This site's CMS is runtime KV, not rebuild-based: the portal PUTs to `/api/content` (writes KV), and `live.ts` fetches `/api/content` on each page load and patches the DOM. There is no Git commit and no new Pages deployment, unlike a build-time CMS. Edits appear on the live site on the next load (hard-refresh if a tab is open), not via a deploy. About-page edits already proved the pipeline works; the pillar issue above was a matching bug, not a save failure.
- **Default font is now Cormorant** (still changeable in Dev tools). Swapped in all five places: `--font` in `global.css`, both layouts' Google Fonts `<link>` and `fonts-loading` detection string, `functions/_lib/defaults.js`, and `portal.ts` `DEFAULT_FONT`. CAVEAT (KV is wholesale): if a font was previously saved via Dev tools, KV still holds it and overrides this default; set Cormorant once in Dev tools to update the live value.
- **No more flash of default copy on sub-pages.** On a fresh (non-VT) load, `Page.astro` adds `content-loading` to `<html>`; `html.content-loading .page .content` is `opacity:0`; `live.ts` removes the class after it patches (and on fetch failure), then the content fades in with the saved copy. A 1.5s inline timeout and the JS-off case both fail open. VT navigations skip the hide (the slide already covers them). The homepage is unaffected (the splash covers its initial paint).
- **Pillar base extends below the screen.** New `--foot: calc(var(--nav-h) + 16px)`. The three vertical faces (`front`/`left`/`right`) are now `height: calc(var(--th) + var(--foot))`, top-anchored (margin-top unchanged), so only the BASE extends off-screen; the column top, the top cap, the panel (`bottom:46%`), and the lift/sink transforms are all untouched. The column label is re-anchored to the original height (`top: calc(var(--th)*0.25)` desktop, `*0.5` mobile) so the taller face doesn't push it down. Net: the bottom edge sits a nav-height-plus below the viewport and is never visible in the rise, bob, or sink.
- **Navbar stays static during page slides (already the case).** The `<Foundation>` carries `transition:name="sitenav"` on home and both sub-pages, so it is lifted out of the root slide and held in place. The staff page is reached with `data-astro-reload` (full reload), so there is no slide into/out of the portal.
- **Text is non-selectable and images are protected.** `global.css`: `user-select:none` on everything, with `input/textarea/[contenteditable]` re-enabled so the portal stays usable; `img` gets `-webkit-user-drag:none; -webkit-touch-callout:none; pointer-events:none` (the last routes clicks on linked logos to the parent `<a>` and blocks right-click-save and drag-out cross-browser). This is a deterrent, not DRM (screenshots/devtools still work).
- **Official Documents (new staff-portal tile).** Staff can upload a PDF/DOC/DOCX (10 MB cap) or add a link; each row has Download/Open and Delete. Storage is the existing `DALWADI_KV` (no new binding): metadata in the `docs` key (JSON array), file bytes in `doc:<id>` (KV value, well under the 25 MiB limit). Endpoints: `functions/api/docs.js` (GET list / POST upload-or-link / DELETE `?id=`) and `functions/api/docs/[id].js` (GET streams the file with `Content-Disposition: attachment`, or 302-redirects a link). All four handlers require a signed-in staff cookie (`requireUser`). Uploads use multipart `FormData` (the only fetch that bypasses the JSON `api()` helper); links can be JSON or form. Validation is enforced on BOTH client and server (extension in pdf/doc/docx, size <= 10 MB). NOTE: downloads are staff-only for now; to expose documents publicly later, remove the `requireUser` check in `docs/[id].js` GET and surface a list on a public page.


**Batch 4 - swipe direction + column rename + pillar lines:**

- **Page-slide direction now actually changes per route.** Pages are ordered About (left) | Home (center) | Support (right), matching the nav tabs (About on the left, Support on the right). The bug was that the directional `nav-back` class was set on the current `<html>` in `astro:before-preparation`, but Astro's swap replaces every `<html>` attribute (it keeps only `data-astro-*`), so the class was wiped before the slide ran and every navigation fell back to the default (one) direction. Fix: compute the direction in `before-preparation`, then set the class on the INCOMING document (`e.newDocument.documentElement`) in `astro:before-swap`, so it survives the swap and is present when the animation plays. Order map in both layouts is `{ '/': 1, '/about': 0, '/contribute': 2 }`; animations are canonical (to a higher index pans the screen left, new page from the right; lower index reverses). The nav tabs were NOT moved (an earlier attempt to swap them was reverted). If the on-screen direction is ever inverted, swap the default and `.nav-back` animation pairs (one edit, noted in the CSS).
- **Renaming a column now updates the column.** `readPillars` in `portal.ts` was deriving each pillar's `key` from its name on every save, so a rename changed the key and broke the `data-p` match in `live.ts` (the baked column still carries the original key, e.g. `art`). The editor now stores the existing key on each subblock (`data-key`) and `readPillars` reuses it, so the key stays stable across renames and the column label / title / body patch correctly. Brand-new pillars still derive a key (they need a rebuild to appear as a column regardless).
- **Removed the faint horizontal lines on the pillars** (the `repeating-linear-gradient` striations on `.face--front::after`). The moving glare on the front face stays.

**Batch 3 - tweaks:**

- **Slide direction flipped** so it matches the page's spatial side (page order About 0, Home 1, Support 2). The mapping lives in the `::view-transition-*(root)` rules in `global.css`; if it ever needs reversing again, swap the default pair with the `.nav-back` pair (one edit).
- **Back arrow removed from the sub-pages.** `BackButton` was dropped from `Page.astro` (the persistent nav bar already returns home, and its left-pointing arrow read as the wrong direction). `BackButton.astro` itself stays because the staff page still uses it. The staff-login button (top-right, About only) is untouched, so nothing collides.
- **Pillar info stays put while the column covers it.** `.tower__panel` no longer hides the instant you close; it keeps `visibility` for 2s (matching the raise) via `transition: visibility 0s 2s`, so the rising opaque column visibly covers it. (It still starts hidden, so it never shows during the intro rise or at rest.)
- **Splash font no longer swaps.** The wordmark is hidden until IBM Plex Serif is loaded: an inline head script toggles a `fonts-loading` class on `<html>` (cleared on font load, on a 1.5s timeout, and never set if JS is off, so it fails open) and `html.fonts-loading .wordmark` is hidden.
- **Support page background is `#003566`** (the embed's own background), set in `contribute.astro`, so there's no color flash before the Zeffy iframe paints.
- **Column tilt** reduced again, 14 to 10 degrees (`TILT_MAX` in `stage.ts`).
- **Pillar raise (close)** slowed from 1.2s to 2s (base `.tower__lift` transition).
- **Double logo on splash fixed.** The foundation-bar logo is hidden on the homepage again (`.app .foundation__logo{visibility:hidden}`), so only the flying splash mark shows during the intro. (This reverts the coincident-logo experiment from Batch 2; the page-slide still reveals the bar logo via the named-nav morph.)

**Batch 2 - navigation, motion, punctuation:**

- **Page-slide navigation (Astro View Transitions).** Moving between About, Home, and Support now slides the whole screen instead of a hard page reload. Spatial order is About (left) | Home (center) | Support (right): going to Support slides the screen left, going to About slides it right, and the Back/forward buttons follow the same direction. Built with Astro's `<ViewTransitions />` (added to both layouts) plus prefetch, so the target page is fetched ahead and the move feels instant. The nav bar carries `transition:name="sitenav"`, so it is held in place across the slide (this is what removes the navbar jitter). The homepage logo and the foundation-bar logo now sit coincident, so the bar logo is revealed seamlessly as the page slides away. See §9 and the testing note in §10.
- **Reduced column rotation.** The cursor-driven left/right turn was too strong; `TILT_MAX` in `stage.ts` dropped from 20 to 14 degrees.
- **Pillar close is twice as slow as open.** Opening (the column sinking down to reveal its card) stays brisk at .6s; closing (rising back up) is now 1.2s. In CSS the base `.tower__lift` transition (which governs the upward return) is 1.2s, and the open-state rule re-declares .6s for the downward move.
- **No em-dashes anywhere (hard rule).** Em-dashes were removed from all copy (recast with commas/colons/periods) and from code comments and this doc (plain hyphens). Keep it that way going forward: no em-dash in content, comments, or docs.

**Batch 1 - pillars + font + portal:**

- **Pillars are fully opaque.** The column front face previously used a translucent gradient, so the copy/buttons behind it bled through while the column sank. The face gradient is now fully opaque (same silver→royal→navy look, no alpha). The text panel (copy + links) sits *behind* the column (`z-index` already correct) and is revealed purely by the opaque column sinking past it - true occlusion, no show-through.
- **Font → IBM Plex Serif, Light (300).** Swapped from Literata in all four places it's wired: both layouts' `<link>`, the `--font` CSS variable, and the runtime default in `functions/_lib/defaults.js`. Body text is weight **300 (Light)**; headings/labels stay 600. `live.ts` and `portal.ts` now load the 300 weight too, so Light survives a portal font-switch.
- **Pillar names: top-positioned + ALL CAPS.** The label on each column now sits centered in the **top half** of the visible face (≈25% line) and renders **all-caps** via CSS (data stays title-case). Reverses the old "no all-caps" rule for the labels (see §9).
- **Corner rounding reduced slightly.** `--radius` went from `clamp(12px, 2vw, 20px)` to `clamp(8px, 1.5vw, 14px)`. That variable is used only on the pillar faces.
- **Eyebrows removed.** The little category label (e.g. "Community & Art") is gone from the landing pillar panels, the About-page pillar cards, the data model (`pillars.ts` + `defaults.js`), and the staff portal's pillar editor.
- **Dev-tools font picker is now a free-text box.** Type any Google Fonts family name and Apply (was a fixed dropdown). See §10 for why this matters.

**The columns:** each is a four-face **opaque** CSS prism (silver→royal→navy gradient front with a moving glare streak, darker navy side faces, a light silver top cap) that turns left/right toward the cursor. Tuning knobs live in `stage.ts` (`TILT_MAX`, and the `--ry`/`--shine` math).

> ⚠️ **This zip is AHEAD of the GitHub repo** (six batches of changes). Upload these changed files on github.com and let Cloudflare rebuild. **No file deletions are needed** (unlike the WebGL revert). Files touched across the batches: `astro.config.mjs`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/layouts/Page.astro`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/contribute.astro`, `src/components/Foundation.astro`, `src/scripts/stage.ts`, `src/scripts/metal.ts`, `src/scripts/live.ts`, `src/scripts/portal.ts`, `src/components/Towers.astro`, `src/data/pillars.ts`, `src/data/site.ts`, `functions/_lib/defaults.js`, `functions/_lib/kv.js`, and `HANDOFF.md`. **NEW files (Batch 5, Official Documents):** `functions/api/docs.js` and `functions/api/docs/[id].js` (the `docs/` subfolder is new, so create it when uploading the nested `[id].js`).

---

## 5. The deployment situation - history + recreate reference

**Resolved:** the GitHub repo had been accidentally disconnected from the Cloudflare Pages project. Cloudflare Pages won't let you re-point a repo on an existing project, so the project was **deleted and recreated** (reusing the same name/`.pages.dev` URL). It is now connected to Git and deploying. The KV namespace, OAuth app, and domain registration were unaffected.

The recreate procedure is kept below for reference in case it's ever needed again.

1. **Before deleting**, note the old project's **name** and **`.pages.dev` URL**. Reuse the *exact same name* so it keeps the same `.pages.dev` address (which keeps the Google sign-in redirect working). Confirm the `dalwadi` KV namespace still exists under **Workers & Pages → KV** (or **Storage & Databases → KV**).
2. **Delete the old project:** open it → **Settings** → bottom → **Delete project**.
3. **Create the new project:** **Workers & Pages → Create → Pages → Connect to Git** → pick `dalwadifoundation`, name it the same as before. Build settings: **Framework Astro**, **Build command `npm run build`**, **Output directory `dist`** → **Save and Deploy**.
4. **Re-bind KV:** project → **Settings → Bindings → Add → KV namespace** → Variable name **`DALWADI_KV`**, select the existing `dalwadi` namespace.
5. **Re-add secrets:** project → **Settings → Variables and Secrets** → Production → add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (see §6). Mark secrets as encrypted.
6. **Redeploy** - variables only take effect on a fresh deploy.
7. **Re-attach the custom domain:** project → **Custom domains → Set up a domain** → `dalwadi-org.katr.es` (and/or `dalwadi.org`).
8. **Fix the Google OAuth redirect URI:** Google Cloud Console → **Credentials → your OAuth client → Authorized redirect URIs**. Ensure entries ending in `/api/auth/callback` exist for both `https://<pages-dev-name>.pages.dev` and `https://dalwadi-org.katr.es` (and `dalwadi.org` once live).

**Dev-tools status dots (optional, cosmetic).** The Dev-tools tile shows a Cloudflare and a GitHub status dot. They require sign-in to work (the endpoint is gated). Without tokens they read "Functions live" / "unknown." To light them up, add to the project's Variables and Secrets, then redeploy:
- **Cloudflare:** `CF_API_TOKEN` (dash → My Profile → API Tokens → Create Custom Token → permission **Account → Cloudflare Pages → Read**), `CF_ACCOUNT_ID` (on any domain's Overview page, API section; also in the dashboard URL), `CF_PROJECT_NAME` (exact Pages project name). The dot then shows the latest deploy stage/status.
- **GitHub:** `GITHUB_TOKEN` (github.com → Settings → Developer settings → Personal access tokens → Fine-grained → repo access = `dalwadifoundation`, permission **Contents: Read**), `GITHUB_REPO` = `rainpurl/dalwadifoundation`. The dot then shows the last commit hash.

---

## 6. Environment variables & bindings reference

| Name | Type | Required? | Value |
|---|---|---|---|
| `DALWADI_KV` | KV binding | **Yes** (for the portal/CMS) | bind to the `dalwadi` namespace |
| `GOOGLE_CLIENT_ID` | secret | **Yes** (for sign-in) | from the Google OAuth app - full string ending in `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | secret | **Yes** (for sign-in) | from the Google OAuth app |
| `SESSION_SECRET` | secret | **Yes** (for sign-in) | a long random string; changing it signs everyone out |
| `CF_API_TOKEN` | secret | optional (CF status dot) | token with Account → Cloudflare Pages → Read |
| `CF_ACCOUNT_ID` | var | optional (CF status dot) | your Cloudflare account ID |
| `CF_PROJECT_NAME` | var | optional (CF status dot) | the exact Pages project name |
| `GITHUB_TOKEN` | secret | optional (GH status dot) | fine-grained PAT, Contents: Read on the repo |
| `GITHUB_REPO` | var | optional (GH status dot) | `rainpurl/dalwadifoundation` |

---

## 7. Content & placeholders to finish before launch

- **Partner URLs** in `src/data/pillars.ts` - ✅ confirmed correct.
- **Team** in `src/data/site.ts` - currently three **Lorem Ipsum** placeholder members (no photos). To be filled in **later via the staff portal's About tile** (name, title, bio, headshot).
- **Donate link** - `site.ts` `donateUrl: "#"` is still a placeholder. (Note: the portal's Contribute tile currently opens `zeffy.com`; reconcile this when finalizing the donate flow.)
- **Contact email** - `site.ts` `email: "hello@dalwadi.org"` is still a placeholder.
- **Logo** - the brand mark currently uses `public/logo.png` (a working/placeholder mark). The brief calls for a specific stylized capital **D**. Swap via the portal's Dev-tools logo uploader, or in code (upload to `public/`, edit `Brand.astro`, keep the `brandmark` class so the intro animation still works).

---

## 8. Deployment workflow (no terminal)

- The user works entirely through **github.com (web UI)** and the **Cloudflare dashboard** - no git CLI.
- **Hand back changed files as a zip** named with a couple of words describing the change, rooted at the project root (paths like `src/...`, `package.json`). The user unzips and drags the *contents* onto the repo (Add file → Upload files), which updates those files; committing triggers an automatic Cloudflare rebuild.
- **`package.json` must stay at the repo top level.** When uploading the full project, drag the folder's *contents*, not the folder.
- **GitHub uploads add/update but never delete.** Any file removal must be done by hand on github.com (open file → ⋯ / trash → Delete).
- Editing an existing file: open it on github.com → pencil icon → edit → Commit (auto-redeploys).

---

## 9. Design decisions log - don't silently undo these

- **CSS columns, not WebGL.** The WebGL/Three.js columns were tried and rejected; the columns are intentionally CSS now. Don't reintroduce Three.js.
- **Opaque pillars.** The column faces are fully opaque on purpose - the copy/links panel sits behind each column and is revealed only as the opaque column sinks past it (true occlusion; no fade, no show-through). Don't reintroduce alpha on the front face.
- **Font: IBM Plex Serif, Light (300) body.** It's the single swappable site font (`--font`). The Dev-tools tile has a **free-text Google-Font name box** to change it live. Headings/labels are 600.
- **Pillar labels are ALL CAPS** and sit in the **top half** of each column face. (This intentionally retires the earlier "no all-caps" rule, which applied to the old Literata labels.) Other copy (titles, body, About/Contribute) stays title/sentence case.
- **No eyebrows on pillars.** The small category label was removed from the pillar panels and About cards and from the data model/portal. Don't add it back without a reason.
- **No gold accents** - the palette is deep/royal blues + ivory + silver. Buttons use a "metal"/silver shimmer.
- **Slightly reduced corner rounding** on the columns (`--radius` clamp(8-14px)).
- **No striation lines on the pillars.** The faint repeating lines on the front face were removed; only the moving glare remains. Don't add them back.
- **Splash screen shows on the first genuine page load only**, never when sliding back to the homepage in-session. Under View Transitions this is detected with a first-load flag (set on the first client navigation), which replaced the old sessionStorage approach.
- **Persistent bottom "foundation" bar** on every page (no top bar). Tabs are ordered Support (left), logo/Home (center), About (right) to match the page-slide directions. The Back button was removed from the sub-pages; only the staff page keeps one.
- **Mobile:** narrow screens shrink the columns to static (no animation); tapping one lifts it slightly and shows its info in a centered card. The pillar label stays centered (vertical) on mobile.
- **Staff "login" button** is ~25% opacity until hovered.
- **Page navigation slides; the nav bar holds still.** Built on Astro View Transitions. Each page keeps its own full-viewport layout (so the splash positioning is untouched), the nav bar carries `view-transition-name: sitenav` so it is lifted out of the sliding root and stays put, and a small `astro:before-preparation` hook picks the slide direction from a fixed page order (About 0, Home 1, Support 2). IMPORTANT: the `transition:name="sitenav"` directive lives on the `<nav>` element inside `Foundation.astro`, NOT on the `<Foundation />` component usage - Astro does not forward the directive from a component tag to its root element, so putting it on the usage emits the CSS but applies the name to nothing and the bar slides (this was a real bug, see Batch 6). `/staff` is intentionally a full reload (`data-astro-reload`) so the portal keeps initializing once per load. Because module scripts run only once under View Transitions, `stage.ts`, `metal.ts`, and `live.ts` re-init on `astro:page-load`; `stage.ts` also uses an AbortController so its window/document listeners never accumulate across navigations. Don't move init back to plain top-level module scope, or the scripts will go dead after the first slide.
- **Gentler column rotation:** `TILT_MAX` is 10 degrees (was 20, then 14); the rest tilt stays at -10 degrees.
- **Pillar close is slower than open** (2s rising up vs .6s sinking down) on purpose: brisk to reveal, slow and deliberate to hide. The base `.tower__lift` transition governs the upward/close direction. The panel behind it keeps `visibility` for the full 2s (`transition: visibility 0s 2s`) so the rising column visibly covers the info instead of it vanishing first.
- **Foundation-bar logo is hidden on the homepage** (`.app .foundation__logo{visibility:hidden}`) because the animated splash mark occupies that spot; this prevents a second logo showing while the mark flies down. The page-slide still reveals the bar logo via the named-nav morph. (Don't remove this hide, or the double-logo returns.)
- **Splash wordmark waits for its font.** It's hidden until Cormorant loads (`html.fonts-loading .wordmark`), driven by an inline head script, to avoid a font swap mid-animation. Keep the inline script and the rule together. (Sub-pages additionally hide their body copy on first load until `live.ts` patches the saved text in, via `html.content-loading .page .content`; same fail-open pattern.)
- **No em-dashes anywhere** (hard rule): copy, comments, and docs use commas/colons/periods or plain hyphens.

---

## 10. Known issues / cautions

- **KV stores the content object WHOLESALE.** `functions/_lib/kv.js` `getContent` returns the entire KV `content` key when it exists (it is *not* deep-merged with `defaults.js`). Consequence: once anything has been saved in the portal, the API serves that saved snapshot, and **changes to baked defaults (copy, pillars, font) in `src/data/` or `defaults.js` will NOT appear at runtime until they're re-saved through the portal** (or the KV `content` key is cleared). This is why a stale saved font can keep overriding a new baked default - the Dev-tools font writes a font into KV. **To set the live font:** sign in → Dev tools → Site font → type `Cormorant` → Apply. (Baked CSS/markup changes like the opaque faces, all-caps labels, radius, and the extended pillar base are *not* in KV, so those show as soon as the build deploys.)
- **Official Documents storage + access.** Metadata lives in KV `docs` (JSON array); file bytes live in KV `doc:<id>` (a 10 MB file is well under KV's 25 MiB value limit). It reuses the existing `DALWADI_KV` binding, so no new binding is required. Downloads (`/api/docs/[id]`) and the list/upload/delete (`/api/docs`) are all gated by `requireUser`, i.e. staff-only - a signed-in staff browser sends the `dlw_session` cookie automatically when the Download link is clicked. To make documents PUBLIC later: remove the `requireUser` check in `functions/api/docs/[id].js` `onRequestGet`, and add a public list/links somewhere on the site (the metadata is available via `getDocs`). Uploads are validated on both client and server (pdf/doc/docx, <= 10 MB).
- **Staff sign-in: `Error 401: invalid_client`** (current). This is a **client-ID** problem, not a redirect-URI one (a redirect problem shows as `Error 400: redirect_uri_mismatch`). Almost certainly the `GOOGLE_CLIENT_ID` re-entered into the recreated Pages project doesn't match a real OAuth client. Fix: (1) in Google Cloud Console → Credentials, copy the OAuth client's **Client ID** exactly (full `…apps.googleusercontent.com`, no whitespace); (2) in the Pages project → Settings → Variables and Secrets → Production, make `GOOGLE_CLIENT_ID` match, and confirm `GOOGLE_CLIENT_SECRET` + `SESSION_SECRET` are present; (3) **redeploy** (vars only apply on a fresh deploy). Then confirm the redirect URIs include `/api/auth/callback` for the `.pages.dev` and `dalwadi-org.katr.es` hosts.
- **Auth/CMS is v1 and has not been tested against live Google/Cloudflare.** Treat the sign-in then edit then save loop as something to test and harden once sign-in works.
- **View Transitions navigation needs a real-browser check.** The slide, the held-in-place nav bar, prefetch, and the re-init-on-`astro:page-load` script wiring all build cleanly but were not run in a live browser here. After deploying, verify on the deployed site: (1) the splash plays on a fresh load of `/` but NOT when sliding back to Home from About/Support; (2) sliding to Support shows the donation embed (the Zeffy iframe reloads each time you enter Support, since it is an external embed, so expect a short load there - this is the one spot that is not "already loaded"); (3) the towers still respond to hover/click after sliding away from Home and back; (4) the metal-button shimmer and any staff-edited copy still apply on About/Support reached via a slide; (5) `/staff` still loads and signs in (it is a full reload by design). If a script seems dead after a slide, the cause is almost always init that needs to be on `astro:page-load` rather than top-level module scope (see §9).
- **`functions/_lib/defaults.js` mirrors `src/data/`.** If you change built-in defaults in `src/data/pillars.ts` or `src/data/site.ts`, update `defaults.js` to match (and remember the wholesale-KV caveat above).
- **New pillars:** editing existing pillar text shows live immediately, and a new pillar shows on the About page right away, but a new animated *column* on the landing page only appears after a rebuild (columns are generated at build time).
- **Cloudflare dashboard labels drift.** SETUP.md uses older labels; the current dashboard uses **Settings → Bindings** and **Settings → Variables and Secrets**. Trust §5 over SETUP.md where they disagree.

---

## 11. Outstanding TODOs (roughly prioritized)

1. ✅ **Recreate the Cloudflare Pages project** so it builds from Git again - done.
2. ✅ **Push the CSS-columns revert** and delete `towers3d.ts` - done; CSS columns are live.
3. **Push this session's two batches** (Batch 1: opaque pillars, IBM Plex Serif Light, all-caps top-positioned labels, smaller radius, eyebrow removal, font textbox. Batch 2: page-slide navigation, gentler rotation, slower pillar close, em-dash removal) and redeploy. No deletions needed (§4). Then run the View Transitions checks in §10.
4. **Fix the staff sign-in** - resolve `Error 401: invalid_client` (verify `GOOGLE_CLIENT_ID` + redeploy; §10).
5. **Set the live site font to IBM Plex Serif** via Dev tools → Site font box, because KV may still hold an older font (§10).
6. **(Optional) Set up the Dev-tools status dots** (§5) - needs sign-in working first.
7. **Finish content** (§7): team bios/photos (via portal), donate link, contact email, real logo. (Partner URLs done.)
8. **Test and harden the auth/CMS loop** (§10) once sign-in works.
9. **Custom domain → production:** move from `dalwadi-org.katr.es` to `dalwadi.org` when ready, and add the production OAuth redirect URI.

---

## 12. Suggested message to start the next chat

> I'm continuing work on The Dalwadi Foundation site. I've uploaded the full project zip and HANDOFF.md. Please read HANDOFF.md first, then confirm the build is green. Current status: [paste what you've done - e.g. "I pushed the latest batch and fixed the OAuth client ID; sign-in works now" or "still seeing Error 401 invalid_client on sign-in"]. Next I want to [your goal].
