import { Bell, Heart, MessageCircle, UserPlus, Sparkles } from 'lucide-react'; // icons for different empty states
import { Button } from '@/components/ui/button'; // shared button component
import { Link } from '@tanstack/react-router'; // client-side navigation helper

/**
 * Props for {@link NotificationEmptyState}.
 * @property filter - which notification filter is active
 */
interface NotificationEmptyStateProps {
  filter: 'all' | 'likes' | 'comments' | 'mentions' | 'followers';
}

/**
 * Displays a friendly message when there are no notifications for the
 * currently selected filter.
 */
export function NotificationEmptyState({
  filter,
}: NotificationEmptyStateProps) {
  // compute copy and icon based on active filter
  const getEmptyStateContent = () => {
    switch (filter) {
      case 'likes':
        return {
          icon: Heart, // heart icon for reactions
          title: 'no likes yet',
          description: "when someone rates your vibes, you'll see them here",
          action: 'share a vibe',
          href: '/',
        };
      case 'comments':
        return {
          icon: MessageCircle, // speech bubble for comments
          title: 'no comments yet',
          description:
            "when someone leaves a rating comment on your vibes, you'll see them here",
          action: 'share a vibe',
          href: '/',
        };
      case 'mentions':
        return {
          icon: Sparkles, // sparkle icon for mentions/tags
          title: 'no mentions yet',
          description: 'mentions and tags will appear here in the future',
          action: 'explore vibes',
          href: '/discover',
        };
      case 'followers':
        return {
          icon: UserPlus, // plus-user for follows
          title: 'no new followers',
          description: "when someone follows you, you'll see them here",
          action: 'discover people',
          href: '/discover',
        };
      default:
        return {
          icon: Bell, // generic bell for all other cases
          title: 'no notifications yet',
          description:
            "when you get likes, comments, or new followers, they'll appear here",
          action: 'share a vibe',
          href: '/',
        };
    }
  };

  const {
    icon: Icon,
    title,
    description,
    action,
    href,
  } = getEmptyStateContent(); // destructure chosen content

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="from-theme-primary to-theme-secondary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r">
        <Icon className="text-primary-foreground h-6 w-6" /> {/* themed icon */}
      </div>
      <h3 className="text-muted-foreground mb-2 text-lg font-medium">
        {title}
      </h3>
      <p className="text-muted-foreground/80 mb-6 max-w-sm text-sm">
        {description}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to={href}>{action}</Link>
      </Button>
    </div>
  );
}
