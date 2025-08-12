/**
 * use notifications module.
 * enhanced documentation for clarity and maintenance.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '@viberatr/convex';

export type NotificationFilter =
  | 'all'
  | 'rating'
  | 'new_rating'
  | 'new_vibe'
  | 'follow';

export function useNotifications(
  filter?: NotificationFilter,
  options?: {
    enabled?: boolean;
    limit?: number;
  }
) {
  const { enabled = true, limit = 20 } = options || {};
  const convex = useConvex();

  return useInfiniteQuery({
    queryKey: ['notifications', filter || 'all'],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.notifications.getNotifications, {
        limit,
        cursor: pageParam || undefined,
        type: filter === 'all' ? undefined : filter,
      });
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled,
    initialPageParam: null as string | null,
  });
}
