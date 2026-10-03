import type { HtmlTagDescriptor, Plugin } from 'vite';

export interface SeoOptions {
  /** Production origin, e.g. https://miyeon.app. Absent → no sitemap and no absolute OG/canonical tags. */
  siteUrl?: string;
}

/** Mirrors FixItem | ChangeItem | RestoreItem in src/types.ts — each is a /category/:subtype page. */
const CATEGORY_SUBTYPES = [
  'skin',
  'face',
  'hair',
  'nail',
  'personal-color',
  'makeup',
  'permanent-makeup',
  'photo',
  'sauna',
  'scrub',
  'massage',
  'yoga',
];

const STATIC_PATHS = ['/', '/map', '/community'];

const DISALLOWED_PATHS = ['/api/', '/profile', '/curator/signup', '/curator/*/edit', '/itinerary/'];

export const OG_IMAGE_PATH = '/og-image.png';

function robotsTxt(siteUrl?: string): string {
  const lines = ['User-agent: *', 'Allow: /', ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`)];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

function sitemapXml(siteUrl: string): string {
  const paths = [...STATIC_PATHS, ...CATEGORY_SUBTYPES.map((s) => `/category/${s}`)];
  const urls = paths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Emits robots.txt / sitemap.xml at build time and adds absolute canonical + OG URL tags to index.html. */
export function seo({ siteUrl: rawSiteUrl }: SeoOptions = {}): Plugin {
  const siteUrl = rawSiteUrl?.trim().replace(/\/$/, '') || undefined;

  return {
    name: 'miyeon-seo',
    transformIndexHtml() {
      if (!siteUrl) return [];
      const tags: HtmlTagDescriptor[] = [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: `${siteUrl}${OG_IMAGE_PATH}` }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${siteUrl}${OG_IMAGE_PATH}` }, injectTo: 'head' },
      ];
      return tags;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
      if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl) });
    },
  };
}
