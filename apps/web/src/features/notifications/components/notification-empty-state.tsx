import { Bell, Heart, MessageCircle, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface NotificationEmptyStateProps {
  filter: 'all' | 'likes' | 'comments' | 'mentions' | 'followers';
}

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (filter) {
      case 'likes':
        return {
          icon: Heart,
          title: 'no likes yet',
          description: 'when someone rates your vibes, you\'ll see them here',
          action: 'share a vibe',
          href: '/',
        };
      case 'comments':
        return {
          icon: MessageCircle,
          title: 'no comments yet',
          description: 'when someone leaves a rating comment on your vibes, you\'ll see them here',
          action: 'share a vibe',
          href: '/',
        };
      case 'mentions':
        return {
          icon: Sparkles,
          title: 'no mentions yet',
          description: 'mentions and tags will appear here in the future',
          action: 'explore vibes',
          href: '/discover',
        };
      case 'followers':
        return {
          icon: UserPlus,
          title: 'no new followers',
          description: 'when someone follows you, you\'ll see them here',
          action: 'discover people',
          href: '/discover',
        };
      default:
        return {
          icon: Bell,
          title: 'no notifications yet',
          description: 'when you get likes, comments, or new followers, they\'ll appear here',
          action: 'share a vibe',
          href: '/',
        };
    }
  };

  const { icon: Icon, title, description, action, href } = getEmptyStateContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-theme-primary to-theme-secondary">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="text-muted-foreground mb-2 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground/80 mb-6 max-w-sm text-sm">
        {description}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to={href}>{action}</Link>
      </Button>
    </div>
  );
}