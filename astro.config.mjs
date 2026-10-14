import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical URL, og:url, sitemap và robots.txt được sinh ra dựa trên `site`.
  site: 'https://thuongnh.com',
  integrations: [sitemap()],
});
