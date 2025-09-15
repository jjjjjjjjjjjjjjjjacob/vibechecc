import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
} from '@convex-dev/react-query';
import { useConvex } from 'convex/react';
import { api } from '@vibechecc/convex';

// Query to get notifications with pagination and filtering
export function useNotificationsQuery(
  type?: 'rating' | 'new_rating' | 'new_vibe' | 'follow',
  options?: { enabled?: boolean; limit?: number; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.notifications.getNotifications, {
      limit: options?.limit || 20,
      cursor: options?.cursor,
      type,
    }),
    enabled: options?.enabled !== false,
  });
}

// Infinite query for notifications
export function useNotificationsInfinite(
  type?: 'rating' | 'new_rating' | 'new_vibe' | 'follow',
  options?: { enabled?: boolean; limit?: number }
) {
  const { enabled = true, limit = 20 } = options || {};
  const convex = useConvex();

  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', type || 'all'],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.notifications.getNotifications, {
        limit,
        cursor: pageParam || undefined,
        type,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage?.nextCursor : undefined,
    enabled,
    initialPageParam: null as string | null,
  });
}

// Query to get unread notification count
export function useUnreadNotificationCount(options?: { enabled?: boolean }) {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCount, {}),
    enabled: options?.enabled !== false,
  });
}

// Query to get unread notification count by type
export function useUnreadNotificationCountByType(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCountByType, {}),
    enabled: options?.enabled !== false,
  });
}

// Mutation to mark notification as read
export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.notifications.markAsRead);

  return useMutation({
    mutationFn: convexMutation,
    onMutate: async (variables) => {
      // Optimistically update notification count
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Get current unread count
      const unreadCount = queryClient.getQueryData(['convexQuery', api.notifications.getUnreadCount]);

      if (typeof unreadCount === 'number' && unreadCount > 0) {
        queryClient.setQueryData(
          ['convexQuery', api.notifications.getUnreadCount],
          unreadCount - 1
        );
      }

      return { previousUnreadCount: unreadCount };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(
          ['convexQuery', api.notifications.getUnreadCount],
          context.previousUnreadCount
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Mutation to mark all notifications as read
export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.notifications.markAllAsRead);

  return useMutation({
    mutationFn: convexMutation,
    onMutate: async () => {
      // Optimistically update notification count to 0
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousUnreadCount = queryClient.getQueryData([
        'convexQuery',
        api.notifications.getUnreadCount
      ]);

      queryClient.setQueryData(
        ['convexQuery', api.notifications.getUnreadCount],
        0
      );

      return { previousUnreadCount };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(
          ['convexQuery', api.notifications.getUnreadCount],
          context.previousUnreadCount
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Hook for notification preferences (mobile-specific)
export function useNotificationPreferences() {
  return useQuery({
    ...convexQuery(api.notifications.getNotificationPreferences, {}),
  });
}

// Mutation to update notification preferences
export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.notifications.updatePreferences);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}