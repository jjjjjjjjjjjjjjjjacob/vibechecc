import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sitemap/xml')({
  loader: async () => {
    const baseUrl = 'https://viberater.com';

    // Static pages
    const staticUrls = [
      '',
      '/discover',
      '/search',
      '/vibes',
      '/terms',
      '/privacy',
    ];

    // For now, just include static URLs
    // Dynamic URLs would require server-side data fetching
    const allUrls = staticUrls;

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

    // Return sitemap data that the component can render
    return { sitemap };
  },
  component: SitemapXML,
});

function SitemapXML() {
  const { sitemap } = Route.useLoaderData();

  // Set the response headers for XML
  if (typeof window === 'undefined') {
    // This will be handled by the server
    return <div dangerouslySetInnerHTML={{ __html: sitemap }} />;
  }

  return null;
}
