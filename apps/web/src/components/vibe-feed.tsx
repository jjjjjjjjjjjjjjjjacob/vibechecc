import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MasonryFeed } from '@/components/masonry-feed';
import type { Vibe } from '@/types';

/**
 * Shape of paginated results returned by the `queryFn` supplied to
 * {@link VibeFeed}. Each page provides the current slice of vibes along with
 * an optional cursor to fetch the next page and a flag indicating completion.
 */
interface VibeFeedData {
  /** list of vibes for the current page */
  vibes: Vibe[];
  /** cursor for the next page, omitted when there are no more results */
  continueCursor?: string;
  /** set to true when the backend has no more pages */
  isDone: boolean;
}

/** generic options forwarded to the query function */
interface QueryOptions {
  [key: string]: unknown;
}

/**
 * Props for the {@link VibeFeed} component. The feed is intentionally generic
 * so different features can supply their own query logic and configuration.
 */
interface VibeFeedProps {
  /** cache key for react-query's `useInfiniteQuery` */
  queryKey: string[];
  /** function that retrieves a page of vibes from the server */
  queryFn: (cursor?: string, options?: QueryOptions) => Promise<VibeFeedData>;
  /** optional parameters merged into every query invocation */
  queryOptions?: QueryOptions;
  /** maximum number of vibes to request per page */
  limit?: number;
  /** when false the feed remains unmounted and no requests are made */
  isActive: boolean;
  /** determines which rating value each vibe card highlights */
  ratingDisplayMode?: 'most-rated' | 'top-rated';
  /** controls styling for different feed contexts */
  variant?: 'feed' | 'search' | 'category';
  /** title shown when no vibes are available */
  emptyStateTitle: string;
  /** description displayed under the empty state title */
  emptyStateDescription: string;
  /** optional action element rendered in the empty state */
  emptyStateAction?: React.ReactNode;
  /** additional class names passed to the underlying feed */
  className?: string;
}

/**
 * Render a masonry grid of vibes with infinite scrolling support.
 *
 * Data fetching is delegated to the provided `queryFn` so pages can customize
 * their source while this component focuses purely on presentation.
 */
export function VibeFeed({
  queryKey,
  queryFn,
  queryOptions,
  limit,
  isActive,
  ratingDisplayMode = 'most-rated',
  variant = 'feed',
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  className,
}: VibeFeedProps) {
  // initiate a paginated query for vibes using tanstack-query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    // include options and limit in the cache key so variations are cached separately
    queryKey: [...queryKey, queryOptions, limit],
    // supply the cursor and any additional options to the caller's fetch function
    queryFn: ({ pageParam }) => queryFn(pageParam, { ...queryOptions, limit }),
    // undefined cursor signals the first page
    initialPageParam: undefined as string | undefined,
    // continue fetching until the backend indicates completion
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    // prevent network calls when the feed is disabled
    enabled: isActive,
  });

  // flatten the pages into a single list of vibes for rendering
  const vibes = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.vibes) || [];
  }, [data]);

  // request the next page when the observer signals we reached the end
  const loadMore = React.useCallback(() => {
    // do nothing if we've exhausted pages, are currently fetching, or inactive
    if (!hasNextPage || isFetchingNextPage || !isActive) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isActive, fetchNextPage]);

  // skip rendering the feed entirely if it isn't active
  if (!isActive) {
    return null;
  }

  return (
    <MasonryFeed
      vibes={vibes}
      isLoading={isLoading}
      error={error}
      hasMore={hasNextPage}
      onLoadMore={loadMore}
      ratingDisplayMode={ratingDisplayMode}
      variant={variant}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      emptyStateAction={emptyStateAction}
      className={className}
    />
  );
}
