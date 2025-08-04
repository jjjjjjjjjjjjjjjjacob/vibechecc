import { Heart, MessageCircle, UserPlus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';
import { formatDistanceToNow } from 'date-fns';
import { useMarkNotificationAsReadMutation } from '@/queries';
import type { Notification } from '@viberatr/types';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsReadMutation = useMarkNotificationAsReadMutation();

  const handleMarkAsRead = () => {
    if (!notification.read && notification._id) {
      markAsReadMutation.mutate({ notificationId: notification._id as any });
    }
  };

  const getNotificationContent = () => {
    const user = notification.triggerUser;
    const userName = user?.first_name || user?.username || 'someone';
    
    switch (notification.type) {
      case 'rating':
        return {
          icon: notification.metadata?.emoji ? (
            <span className="text-lg">{notification.metadata.emoji}</span>
          ) : <Heart className="h-4 w-4" />,
          text: `${userName} ${notification.metadata?.emoji ? 'reacted to' : 'liked'} your vibe`,
          actionText: 'see rating',
          href: `/vibes/${notification.targetId}`,
        };
      case 'new_rating':
        return {
          icon: <MessageCircle className="h-4 w-4" />,
          text: `${userName} left a comment on your vibe`,
          actionText: 'see comment',
          href: `/vibes/${notification.targetId}`,
        };
      case 'follow':
        return {
          icon: <UserPlus className="h-4 w-4" />,
          text: `${userName} started following you`,
          actionText: 'see profile',
          href: `/@${user?.username || user?._id}`,
        };
      case 'new_vibe':
        return {
          icon: <Star className="h-4 w-4" />,
          text: `${userName} shared a new vibe`,
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
  const timeAgo = formatDistanceToNow(new Date(notification._creationTime!), { addSuffix: true });
  const user = notification.triggerUser;

  return (
    <div 
      className={cn(
        'hover:bg-muted/50 flex items-start gap-3 p-3 transition-colors',
        !notification.read && 'bg-muted/20'
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={user?.image_url} 
            alt={user?.first_name || user?.username || 'User'} 
          />
          <AvatarFallback className="text-sm">
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="bg-background border-background absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2">
          {icon}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground text-sm leading-relaxed">
            {text}
          </p>
          {!notification.read && (
            <div className="bg-theme-primary mt-1 h-2 w-2 flex-shrink-0 rounded-full"></div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">{timeAgo}</p>
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs lowercase"
            onClick={handleMarkAsRead}
          >
            <Link to={href}>{actionText}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}