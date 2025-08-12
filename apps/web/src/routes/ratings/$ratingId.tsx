import { createFileRoute, redirect } from '@tanstack/react-router';
import { api } from '@viberatr/convex';

/**
 * Route that immediately redirects a rating permalink to its parent vibe.
 *
 * The file uses TanStack Start's `beforeLoad` hook to perform the lookup and
 * dispatch a redirect before any component renders.
 */
export const Route = createFileRoute('/ratings/$ratingId')({
  beforeLoad: async ({ params, context }) => {
    // Extract the rating identifier from the URL params
    const { ratingId } = params;

    // Query Convex for the rating document to discover its vibeId
    const rating = await context.convexClient.query(api.ratings.getById, {
      ratingId,
    });

    // When the rating is missing or lacks an associated vibe, return to home
    if (!rating?.vibeId) {
      throw redirect({
        to: '/',
        search: {
          error: 'rating not found',
        },
      });
    }

    // Redirect to the vibe page with an anchor pointing to the rating
    throw redirect({
      to: `/vibes/${rating.vibeId}#rating-${rating._id}` as any,
    });
  },
  // No component ever renders because we always redirect in beforeLoad
  component: () => null,
});
