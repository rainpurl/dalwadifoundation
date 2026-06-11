# The Dalwadi Foundation

Astro static site + Cloudflare Pages Functions (Google-auth staff portal & KV-backed CMS).

- Public pages: `/`, `/about`, `/contribute`
- Staff portal: `/staff` (Google sign-in; edit pillars / About / Contribute; dev tools)
- API: `functions/api/*` (auth, content, users, status)

```bash
npm install
npm run dev      # local dev (static only)
npm run build    # -> dist/
```

**Deploying and turning on the portal: see [SETUP.md](./SETUP.md).**

Edit default content in `src/data/` (and mirror it in `functions/_lib/defaults.js`).
