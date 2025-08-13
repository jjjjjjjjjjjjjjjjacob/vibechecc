import { Heart, MessageCircle, UserPlus, Star } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';
import { formatDistanceToNow } from '@/utils/date-utils';
import { useMarkNotificationAsReadMutation } from '@/queries';
import type { Notification } from '@viberatr/types';
import type { Id } from '@viberatr/convex/dataModel';
import { useHeaderNavStore } from '@/stores/header-nav-store';
import { usePostHog } from '@/hooks/usePostHog';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const markAsReadMutation = useMarkNotificationAsReadMutation();
  const setNavState = useHeaderNavStore((state) => state.setNavState);
  const { trackEvents } = usePostHog();

  const handleMarkAsRead = (method: 'click' | 'button' = 'button') => {
    if (!notification.read && notification._id) {
      markAsReadMutation.mutate({
        notificationId: notification._id as Id<'notifications'>,
      });
      trackEvents.notificationMarkedAsRead(notification._id as string, method);
    }
  };

  const handleNotificationClick = () => {
    // Track the notification click
    trackEvents.notificationClicked(
      notification._id as string,
      notification.type,
      notification.targetId
    );

    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead('click');
    }

    // Close the nav state
    setNavState(null);

    // Call the passed onClick handler if provided
    onClick?.();
  };

  const getNotificationContent = () => {
    const user = notification.triggerUser;
    // Fallback chain for user display name
    const userName =
      user?.username || user?.first_name || user?.full_name || 'someone';

    switch (notification.type) {
      case 'rating':
        return {
          icon: notification.metadata?.emoji ? (
            <span className="text-lg">
              {notification.metadata.emoji as string}
            </span>
          ) : (
            <Heart className="h-4 w-4" />
          ),
          text: `${userName} ${notification.metadata?.emoji ? 'reacted to' : 'liked'} your vibe`,
          actionText: 'see rating',
          href: `/ratings/${notification.targetId}`,
        };
      case 'new_rating':
        return {
          icon: <MessageCircle className="h-4 w-4" />,
          text: `${userName} left a comment on your vibe`,
          actionText: 'see comment',
          href: `/ratings/${notification.targetId}`,
        };
      case 'follow':
        return {
          icon: <UserPlus className="h-4 w-4" />,
          text: `${userName} started following you`,
          actionText: 'see profile',
          href: user?.username ? `/users/${user.username}` : '#',
        };
      case 'new_vibe':
        return {
          icon: <Star className="h-4 w-4" />,
          text: `${userName} shared '${notification.metadata?.vibeTitle || 'a vibe'}'`,
          actionText: 'see vibe',
          href: `/vibes/${notification.targetId}`,
        };
      default:
        return {
          icon: <Star className="h-4 w-4" />,
          text: notification.description || 'you have a new notification',
          actionText: 'view',
          href: '/',
        };
    }
  };

  const { icon, text, actionText, href } = getNotificationContent();
  const timeAgo = formatDistanceToNow(new Date(notification._creationTime!), {
    addSuffix: true,
  });
  const user = notification.triggerUser;

  return (
    <Link to={href} onClick={handleNotificationClick}>
      <div
        className={cn(
          'hover:bg-muted/50 flex items-start gap-3 rounded-md px-2 pt-3 pb-2',
          !notification.read && 'bg-muted/20'
        )}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.image_url || user?.profile_image_url}
              alt={user?.first_name || user?.username || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="text-sm">
              {(
                user?.username?.[0] ||
                user?.first_name?.[0] ||
                user?.full_name?.[0] ||
                '?'
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="bg-background border-background absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2">
            {icon}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-foreground text-sm leading-relaxed">{text}</p>
            {!notification.read && (
              <div className="bg-theme-primary mt-1 h-2 w-2 flex-shrink-0 rounded-full"></div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs lowercase"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // The main link click will handle navigation and marking as read
              }}
            >
              {actionText}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
