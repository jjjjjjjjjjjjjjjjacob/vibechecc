import { createFileRoute } from '@tanstack/react-router';

/**
 * robots.txt route
 *
 * This route redirects to the API route for robots.txt generation.
 * This provides a clean /robots.txt URL that search engines expect.
 */
export const Route = createFileRoute('/robots/txt')({
  beforeLoad: async () => {
    // Redirect to the API route with robots type
    throw new Response(null, {
      status: 301,
      headers: {
        Location: '/api/sitemap?type=robots',
      },
    });
  },
  component: () => null, // This will never render due to the redirect
});
