import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { SITE } from '../site.config';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.short} — blog`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      categories: p.data.tags,
      link: `/blog/${p.id}/`,
    })),
  });
}
