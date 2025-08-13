import { Heart, MessageCircle, UserPlus, Star } from 'lucide-react'; // icons for notification types
import { Button } from '@/components/ui/button'; // shared button
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // avatar primitives
import { Link } from '@tanstack/react-router'; // client navigation
import { cn } from '@/utils/tailwind-utils'; // tailwind class merger
import { formatDistanceToNow } from 'date-fns'; // relative time formatter
import { useMarkNotificationAsReadMutation } from '@/queries'; // convex mutation hook
import type { Notification } from '@viberatr/types'; // notification model

/**
 * Props for {@link NotificationItem} component.
 * @property notification - notification record to display
 * @property onClick - optional callback fired on click
 */
interface NotificationItemProps {
  notification: Notification; // notification payload
  onClick?: () => void; // optional click handler
}

/**
 * Renders a single notification entry with avatar, message and actions.
 */
export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  // mutation for marking notifications as read
  const markAsReadMutation = useMarkNotificationAsReadMutation();

  // mark notification as read if it's unread
  const handleMarkAsRead = () => {
    if (!notification.read && notification._id) {
      markAsReadMutation.mutate({ notificationId: notification._id as any });
    }
  };

  // compute icon, text, and link based on notification type
  const getNotificationContent = () => {
    const user = notification.triggerUser; // triggering user
    const userName = user?.first_name || user?.username || 'someone'; // display name fallback

    switch (notification.type) {
      case 'rating':
        return {
          // show emoji reaction if provided, otherwise a heart icon
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
          icon: <MessageCircle className="h-4 w-4" />, // comment icon
          text: `${userName} left a comment on your vibe`,
          actionText: 'see comment',
          href: `/ratings/${notification.targetId}`,
        };
      case 'follow':
        return {
          icon: <UserPlus className="h-4 w-4" />, // user plus icon for follows
          text: `${userName} started following you`,
          actionText: 'see profile',
          href: `/users/${user?.username || user?._id}`,
        };
      case 'new_vibe':
        return {
          icon: <Star className="h-4 w-4" />, // star for new vibe
          text: `${userName} shared '${notification.metadata?.vibeTitle || 'a vibe'}'`,
          actionText: 'see vibe',
          href: `/vibes/${notification.targetId}`,
        };
      default:
        return {
          icon: <Star className="h-4 w-4" />, // generic fallback icon
          text: notification.description || 'you have a new notification',
          actionText: 'view',
          href: '/',
        };
    }
  };

  const { icon, text, actionText, href } = getNotificationContent(); // resolved content details
  const timeAgo = formatDistanceToNow(new Date(notification._creationTime!), {
    addSuffix: true,
  }); // relative time string
  const user = notification.triggerUser; // used for avatar

  return (
    <Link to={href} onClick={onClick}>
      {' '}
      {/* navigate to target */}
      <div
        className={cn(
          'hover:bg-muted/50 flex items-start gap-3 px-4 pt-3 pb-2',
          !notification.read && 'bg-muted/20'
        )}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.image_url}
              alt={user?.first_name || user?.username || 'user'}
            />
            <AvatarFallback className="text-sm">
              {(
                user?.first_name?.[0] ||
                user?.username?.[0] ||
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
              <div className="bg-theme-primary mt-1 h-2 w-2 flex-shrink-0 rounded-full"></div> // unread dot
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs lowercase"
              onClick={handleMarkAsRead}
            >
              {actionText}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
