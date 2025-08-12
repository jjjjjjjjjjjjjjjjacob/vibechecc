import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

/**
 * Schema describing allowed search params before redirecting to the search
 * page. Each param is validated using zod for type safety.
 */
const searchParamsSchema = z.object({
  emoji: z.string().optional(),
  emojis: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  emojiMinValue: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  sort: z.string().optional(),
});

export const Route = createFileRoute('/vibes/')({
  validateSearch: searchParamsSchema,
  beforeLoad: ({ search }) => {
    // redirect to search page with proper parameters
    const searchParams: Record<string, unknown> = {
      tab: 'vibes',
    };

    // convert emoji (single) to emojiFilter (array)
    if (search.emoji) {
      searchParams.emojiFilter = [search.emoji];
    } else if (search.emojis) {
      searchParams.emojiFilter = search.emojis;
    }

    // set emojiMinValue if emoji filter is present and minRating is specified
    if ((search.emoji || search.emojis) && search.minRating) {
      searchParams.emojiMinValue = search.minRating;
    } else if (search.minRating && search.minRating !== 1) {
      searchParams.ratingMin = search.minRating;
    }

    if (search.maxRating && search.maxRating !== 5) {
      searchParams.ratingMax = search.maxRating;
    }

    if (search.tags) {
      searchParams.tags = search.tags;
    }

    if (search.sort) {
      searchParams.sort = search.sort;
    }

    // perform the redirect
    throw redirect({
      to: '/search',
      search: searchParams,
    });
  },
});

export default Route;
