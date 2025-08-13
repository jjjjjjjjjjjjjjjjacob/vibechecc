import { createFileRoute, redirect } from '@tanstack/react-router';
import { api } from '@viberatr/convex';

export const Route = createFileRoute('/ratings/$ratingId')({
  beforeLoad: async ({ params, context }) => {
    const { ratingId } = params;

    // Fetch the rating to get the vibeId
    const rating = await context.convexClient.query(api.ratings.getById, {
      ratingId,
    });

    if (!rating?.vibeId) {
      // Rating not found, redirect to home
      throw redirect({
        to: '/',
        search: {
          error: 'Rating not found',
        },
      });
    }

    // Redirect to the vibe page with the rating anchor
    throw redirect({
      to: '/vibes/$vibeId',
      params: { vibeId: rating.vibeId },
      hash: `rating-${rating._id}`,
    });
  },
  // This component should never render since we always redirect
  component: () => null,
});
