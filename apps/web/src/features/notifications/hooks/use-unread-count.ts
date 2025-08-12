import { useQuery } from '@tanstack/react-query'; // stateful data fetching hook
import { convexQuery } from '@convex-dev/react-query'; // connect Convex functions to React Query
import { api } from '@viberatr/convex'; // generated API binding

/**
 * Fetches the total unread notification count for the current user.
 */
export function useUnreadCount() {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCount, {}), // query without args
  });
}

/**
 * Fetches unread counts broken down by notification type.
 */
export function useUnreadCountByType() {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCountByType, {}), // returns map of type -> count
  });
}
