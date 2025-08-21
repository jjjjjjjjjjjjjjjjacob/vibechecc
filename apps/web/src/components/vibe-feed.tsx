import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MasonryFeed } from '@/components/masonry-feed';
import type { Vibe } from '@vibechecc/types';

interface VibeFeedData {
  vibes: Vibe[];
  continueCursor?: string;
  isDone: boolean;
}

interface QueryOptions {
  [key: string]: unknown;
}

interface VibeFeedProps {
  queryKey: string[];
  queryFn: (cursor?: string, options?: QueryOptions) => Promise<VibeFeedData>;
  queryOptions?: QueryOptions;
  limit?: number;
  isActive: boolean;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
  variant?: 'feed' | 'search' | 'category';
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateAction?: React.ReactNode;
  className?: string;
}

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
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: [...queryKey, queryOptions, limit],
    queryFn: ({ pageParam }) => queryFn(pageParam, { ...queryOptions, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    enabled: isActive,
  });

  const vibes = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.vibes) || [];
  }, [data]);

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || !isActive) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isActive, fetchNextPage]);

  // Only render if active to avoid unnecessary renders
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
