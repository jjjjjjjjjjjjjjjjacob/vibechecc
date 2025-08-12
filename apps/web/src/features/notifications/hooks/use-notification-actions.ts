import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';

/**
 * Marks a single notification as read and refreshes the notifications query.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: useConvexMutation(api.notifications.markAsRead),
    onSuccess: () => {
      // invalidate cached notifications so UI reflects read state
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Marks all notifications as read and refreshes the notifications query.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: useConvexMutation(api.notifications.markAllAsRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
