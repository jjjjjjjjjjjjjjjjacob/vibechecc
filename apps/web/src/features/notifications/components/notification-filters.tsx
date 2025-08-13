import {
  Heart,
  MessageCircle,
  Sparkles,
  UserPlus,
  Grid3X3,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/tailwind-utils';

export type NotificationFilterType =
  | 'all'
  | 'likes'
  | 'comments'
  | 'mentions'
  | 'followers';

interface NotificationFiltersProps {
  activeFilter: NotificationFilterType;
  onFilterChange: (filter: NotificationFilterType) => void;
  unreadCounts?: {
    all: number;
    likes: number;
    comments: number;
    mentions: number;
    followers: number;
  };
}

const filterConfig = [
  {
    id: 'all' as const,
    label: 'all activity',
    icon: Grid3X3,
  },
  {
    id: 'likes' as const,
    label: 'likes',
    icon: Heart,
  },
  {
    id: 'comments' as const,
    label: 'comments',
    icon: MessageCircle,
  },
  {
    id: 'mentions' as const,
    label: 'mentions and tags',
    icon: Sparkles,
  },
  {
    id: 'followers' as const,
    label: 'followers',
    icon: UserPlus,
  },
];

export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCounts,
}: NotificationFiltersProps) {
  return (
    <div className="border-border/50 border-b">
      <div className="flex flex-wrap gap-1 pt-0 pb-3">
        {filterConfig.map(({ id, label, icon: Icon }) => {
          const isActive = activeFilter === id;
          const unreadCount = unreadCounts?.[id] || 0;

          return (
            <Button
              key={id}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'hover:bg-muted/80 bg-muted/30 relative h-6 justify-start gap-[5px] rounded-xl p-[6px] text-xs lowercase transition-colors',
                isActive && 'bg-muted text-foreground'
              )}
              onClick={() => onFilterChange(id)}
            >
              <Icon style={{ width: '12px' }} />
              <span className="truncate">{label}</span>
              {unreadCount > 0 && (
                <span className="bg-theme-primary text-primary-foreground ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
