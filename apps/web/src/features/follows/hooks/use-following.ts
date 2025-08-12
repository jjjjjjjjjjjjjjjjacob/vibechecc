import { useQuery } from '@tanstack/react-query';
import { api } from '@viberatr/convex';
import { convexQuery } from '@convex-dev/react-query';
import * as React from 'react';

interface UseFollowingOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * Retrieves the list of users that the given user is following.
 */
export function useFollowing(
  userId: string,
  options: UseFollowingOptions = {}
) {
  const { limit = 20, enabled = true } = options;
  const [cursor, setCursor] = React.useState<string | null>(null);

  const query = useQuery({
    ...convexQuery(api.follows.getUserFollowing, {
      userId,
      limit,
      cursor: cursor || undefined,
    }),
    enabled,
  });

  const data = query.data;

  const loadMore = React.useCallback(() => {
    if (data && data.continueCursor && !data.isDone) {
      // move cursor forward to fetch next set of followed users
      setCursor(data.continueCursor);
    }
  }, [data]);

  const reset = React.useCallback(() => {
    setCursor(null);
  }, []);

  return {
    data: data || {
      following: [],
      totalCount: 0,
      continueCursor: null,
      isDone: true,
    },
    isLoading: data === undefined && enabled,
    error: null,
    loadMore,
    reset,
    hasMore: data ? !data.isDone : false,
  };
}
