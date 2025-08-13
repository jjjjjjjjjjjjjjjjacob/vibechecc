import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/tailwind-utils';
import {
  useNotificationsInfinite,
  useUnreadNotificationCountByType,
  useMarkAllNotificationsAsReadMutation,
} from '@/queries';
import {
  NotificationFilters,
  type NotificationFilterType,
} from './notification-filters';
import { NotificationItem } from './notification-item';
import { NotificationEmptyState } from './notification-empty-state';
import { useInView } from 'react-intersection-observer';
import { useConvex } from 'convex/react';

const FILTER_TYPE_MAP = {
  all: undefined,
  likes: 'rating' as const,
  comments: 'new_rating' as const,
  mentions: undefined, // Future feature
  followers: 'follow' as const,
};

function getEndOfListMessage(filter: NotificationFilterType): string {
  switch (filter) {
    case 'all':
      return "you're up to date";
    case 'likes':
      return 'no more likes';
    case 'comments':
      return 'no more comments';
    case 'mentions':
      return 'no more mentions';
    case 'followers':
      return 'no more follows';
    default:
      return "you're up to date";
  }
}

export function NotificationAccordion() {
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilterType>('all');
  const { ref: loadMoreRef, inView } = useInView();

  // Check if Convex context is available
  const convex = useConvex();
  const convexAvailable = !!convex;

  // Load filter preference from localStorage
  useEffect(() => {
    if (!convexAvailable) return;
    const savedFilter = localStorage.getItem('vibechecc-notification-filter');
    if (
      savedFilter &&
      ['all', 'likes', 'comments', 'mentions', 'followers'].includes(
        savedFilter
      )
    ) {
      setActiveFilter(savedFilter as NotificationFilterType);
    }
  }, [convexAvailable]);

  // Save filter preference to localStorage
  useEffect(() => {
    if (!convexAvailable) return;
    localStorage.setItem('vibechecc-notification-filter', activeFilter);
  }, [activeFilter, convexAvailable]);

  const notificationQuery = useNotificationsInfinite(
    FILTER_TYPE_MAP[activeFilter],
    { enabled: convexAvailable }
  );

  const { data: unreadCountsByType } = useUnreadNotificationCountByType({
    enabled: convexAvailable,
  });
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();

  // Load more notifications when scrolling to bottom
  useEffect(() => {
    if (
      !convexAvailable ||
      !inView ||
      !notificationQuery.hasNextPage ||
      notificationQuery.isFetchingNextPage ||
      notificationQuery.isLoading
    ) {
      return;
    }
    notificationQuery.fetchNextPage();
  }, [convexAvailable, inView, notificationQuery]);

  const notifications = React.useMemo(() => {
    if (!notificationQuery.data?.pages) return [];
    return notificationQuery.data.pages.flatMap(
      (page) => page?.notifications || []
    );
  }, [notificationQuery.data]);

  // Early return if Convex isn't available
  if (!convexAvailable) {
    return null;
  }

  const unreadCounts = unreadCountsByType
    ? {
        all: Object.values(unreadCountsByType).reduce<number>(
          (sum, count) => sum + count,
          0
        ),
        likes: unreadCountsByType.rating || 0,
        comments: unreadCountsByType.new_rating || 0,
        mentions: 0, // Future feature
        followers: unreadCountsByType.follow || 0,
      }
    : undefined;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate({});
  };

  return (
    <div className={cn('w-full bg-transparent')}>
      <div>
        <div className="container">
          <div className="border-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold lowercase">
                  notifications
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs lowercase"
                  onClick={handleMarkAllAsRead}
                  disabled={!unreadCounts?.all}
                >
                  mark all read
                </Button>
              </div>

              <NotificationFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                unreadCounts={unreadCounts}
              />

              <ScrollArea className="max-h-[70vh] flex-1 overflow-y-auto">
                <div className="min-h-0">
                  {notificationQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground text-sm">
                        loading notifications...
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <NotificationEmptyState filter={activeFilter} />
                  ) : (
                    <div className="divide-border/50 divide-y">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                        />
                      ))}
                      {notificationQuery.hasNextPage ? (
                        <div
                          ref={loadMoreRef}
                          className="flex items-center justify-center py-4"
                        >
                          {notificationQuery.isFetchingNextPage ? (
                            <div className="text-muted-foreground text-sm">
                              loading more...
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  notificationQuery.hasNextPage &&
                                  !notificationQuery.isFetchingNextPage
                                ) {
                                  notificationQuery.fetchNextPage();
                                }
                              }}
                              className="text-xs lowercase"
                              disabled={
                                !notificationQuery.hasNextPage ||
                                notificationQuery.isFetchingNextPage
                              }
                            >
                              load more
                            </Button>
                          )}
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-2 py-4">
                          <div className="text-muted-foreground text-xs">
                            {getEndOfListMessage(activeFilter)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => notificationQuery.refetch()}
                            className="text-xs lowercase"
                            disabled={notificationQuery.isRefetching}
                          >
                            {notificationQuery.isRefetching
                              ? 'refreshing...'
                              : 'refresh'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
