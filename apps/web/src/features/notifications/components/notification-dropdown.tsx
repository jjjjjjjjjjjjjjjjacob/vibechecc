import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from '@/components/ui/icons';
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

interface NotificationDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

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

export function NotificationDropdown({
  open,
  onOpenChange,
  children,
}: NotificationDropdownProps) {
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilterType>('all');
  const [isMobile, setIsMobile] = useState(false);
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

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const notificationQuery = useNotificationsInfinite(
    FILTER_TYPE_MAP[activeFilter],
    { enabled: open && convexAvailable }
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

  // Early return with just the trigger if Convex isn't available
  if (!convexAvailable) {
    return <>{children}</>;
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

  const content = (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold lowercase">notifications</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs lowercase"
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

      <ScrollArea className="flex-1 overflow-y-auto">
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
            <div className="divide-border/50 mt-1 divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => onOpenChange(false)}
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
                    className="min-w-16 text-xs lowercase"
                    disabled={notificationQuery.isRefetching}
                  >
                    {notificationQuery.isRefetching ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      'refresh'
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-background/60 w-96 p-0 backdrop-blur-md"
        align="end"
        sideOffset={8}
      >
        <div className="h-96">{content}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
