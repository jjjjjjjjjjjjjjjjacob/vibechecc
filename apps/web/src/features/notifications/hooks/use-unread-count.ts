import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';

export function useUnreadCount() {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCount, {}),
  });
}

export function useUnreadCountByType() {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCountByType, {}),
  });
}