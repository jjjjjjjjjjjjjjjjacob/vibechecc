import { createFileRoute } from '@tanstack/react-router';

/**
 * Generates an XML sitemap for the site.
 * For now this only lists static routes; dynamic entries
 * (like individual vibes or profiles) would require server data.
 */
export const Route = createFileRoute('/sitemap/xml')({
  loader: async () => {
    const baseUrl = 'https://viberatr.com';

    // Static pages that never change and can be hard coded
    const staticUrls = [
      '',
      '/discover',
      '/search',
      '/vibes',
      '/terms',
      '/privacy',
    ];

    // Dynamic URLs could be fetched here in the future
    const allUrls = staticUrls;

    // Build XML document manually since we only have a few links
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === '' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    // Loader returns the raw XML string for the component to output
    return { sitemap };
  },
  component: SitemapXML,
});

/**
 * Outputs the pre-built XML from the loader.
 * When rendered server-side we return the string wrapped in a
 * <pre> tag so no dangerous HTML injection is needed.
 */
function SitemapXML() {
  const { sitemap } = Route.useLoaderData();

  // Only render the content during SSR; clients don't need a sitemap UI
  if (typeof window === 'undefined') {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {sitemap}
      </pre>
    );
  }

  // Client render just returns nothing so this route doesn't explode
  return null;
}
