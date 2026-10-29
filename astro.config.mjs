// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // TODO: your real domain. Used for canonical URLs, the sitemap and RSS.
  site: 'https://cheaptrunk.dev',
  integrations: [sitemap()],
  markdown: {
    // Code fences use the design system's ink block, not a Shiki theme.
    syntaxHighlight: false,
  },
});
