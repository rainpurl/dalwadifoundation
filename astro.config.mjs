// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The production URL. Update this once the domain is live.
  site: 'https://dalwadi.org',

  // Static site (perfect for Cloudflare Pages). When you're ready to add
  // server features (form handling, file uploads, etc.) install the
  // Cloudflare adapter and switch `output` to 'server' or 'hybrid':
  //   npx astro add cloudflare
  output: 'static',

  // Inline the (small) stylesheet so the first paint has no extra request.
  build: { inlineStylesheets: 'auto' },
});
