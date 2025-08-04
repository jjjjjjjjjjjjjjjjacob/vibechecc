import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { useNotificationsInfinite, useUnreadNotificationCountByType, useMarkAllNotificationsAsReadMutation } from '@/queries';
import { NotificationFilters, type NotificationFilterType } from './notification-filters';
import { NotificationItem } from './notification-item';
import { NotificationEmptyState } from './notification-empty-state';
import { useInView } from 'react-intersection-observer';

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

export function NotificationDropdown({ open, onOpenChange, children }: NotificationDropdownProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');
  const [isMobile, setIsMobile] = useState(false);
  const { ref: loadMoreRef, inView } = useInView();

  // Load filter preference from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('viberatr-notification-filter');
    if (savedFilter && ['all', 'likes', 'comments', 'mentions', 'followers'].includes(savedFilter)) {
      setActiveFilter(savedFilter as NotificationFilterType);
    }
  }, []);

  // Save filter preference to localStorage
  useEffect(() => {
    localStorage.setItem('viberatr-notification-filter', activeFilter);
  }, [activeFilter]);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const notificationQuery = useNotificationsInfinite(
    FILTER_TYPE_MAP[activeFilter],
    { enabled: open }
  );

  const { data: unreadCountsByType } = useUnreadNotificationCountByType();
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();

  // Load more notifications when scrolling to bottom
  useEffect(() => {
    if (inView && notificationQuery.hasNextPage && !notificationQuery.isFetchingNextPage) {
      notificationQuery.fetchNextPage();
    }
  }, [inView, notificationQuery]);

  const notifications = React.useMemo(() => {
    if (!notificationQuery.data?.pages) return [];
    return notificationQuery.data.pages.flatMap((page: any) => page?.notifications || []);
  }, [notificationQuery.data]);

  const unreadCounts = unreadCountsByType ? {
    all: Object.values(unreadCountsByType).reduce((sum: number, count: number) => sum + count, 0),
    likes: unreadCountsByType.rating || 0,
    comments: unreadCountsByType.new_rating || 0,
    mentions: 0, // Future feature
    followers: unreadCountsByType.follow || 0,
  } : undefined;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate({});
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold lowercase">notifications</h2>
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

      <ScrollArea className="flex-1">
        <div className="min-h-0">
          {notificationQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">loading notifications...</div>
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
              {notificationQuery.hasNextPage && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                  {notificationQuery.isFetchingNextPage ? (
                    <div className="text-muted-foreground text-sm">loading more...</div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => notificationQuery.fetchNextPage()}
                      className="text-xs lowercase"
                    >
                      load more
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>notifications</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="h-96">
          {content}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}