import { createFileRoute } from '@tanstack/react-router';

/**
 * Main sitemap.xml route
 *
 * This route redirects to the API route for sitemap generation.
 * This provides a clean /sitemap.xml URL that search engines expect.
 */
export const Route = createFileRoute('/sitemap/xml')({
  beforeLoad: async () => {
    // Redirect to the API route
    throw new Response(null, {
      status: 301,
      headers: {
        Location: '/api/sitemap',
      },
    });
  },
  component: () => null, // This will never render due to the redirect
});
