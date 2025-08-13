import {
  Heart,
  MessageCircle,
  Sparkles,
  UserPlus,
  Grid3X3,
} from 'lucide-react'; // icons representing each filter option
import { Button } from '@/components/ui/button'; // shared button component
import { cn } from '@/utils/tailwind-utils'; // tailwind class merger

/**
 * Allowed filter values for notification views.
 */
export type NotificationFilterType =
  | 'all'
  | 'likes'
  | 'comments'
  | 'mentions'
  | 'followers';

/**
 * Props for {@link NotificationFilters} component.
 * @property activeFilter - currently selected filter id
 * @property onFilterChange - callback when a filter button is pressed
 * @property unreadCounts - optional map of unread counts per filter
 */
interface NotificationFiltersProps {
  activeFilter: NotificationFilterType; // which filter is selected
  onFilterChange: (filter: NotificationFilterType) => void; // notify parent when selection changes
  unreadCounts?: {
    all: number;
    likes: number;
    comments: number;
    mentions: number;
    followers: number;
  }; // counts displayed as small badges
}

// configuration for each filter button: id, label and icon
const filterConfig = [
  {
    id: 'all' as const, // show all notifications
    label: 'all activity',
    icon: Grid3X3,
  },
  {
    id: 'likes' as const, // reactions
    label: 'likes',
    icon: Heart,
  },
  {
    id: 'comments' as const, // rating comments
    label: 'comments',
    icon: MessageCircle,
  },
  {
    id: 'mentions' as const, // mentions and tags
    label: 'mentions and tags',
    icon: Sparkles,
  },
  {
    id: 'followers' as const, // follow events
    label: 'followers',
    icon: UserPlus,
  },
];

/**
 * Renders horizontal filter buttons for switching notification views.
 */
export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCounts,
}: NotificationFiltersProps) {
  return (
    <div className="border-border/50 border-b">
      {' '}
      {/* top border separating from dropdown header */}
      <div className="flex flex-wrap gap-1 px-3 pt-0 pb-3">
        {filterConfig.map(({ id, label, icon: Icon }) => {
          const isActive = activeFilter === id; // determine if button is selected
          const unreadCount = unreadCounts?.[id] || 0; // unread badge count for this filter

          return (
            <Button
              key={id}
              variant={isActive ? 'secondary' : 'ghost'} // highlight active filter
              size="sm"
              className={cn(
                'hover:bg-muted/80 bg-muted/30 relative h-6 justify-start gap-[5px] rounded-xl p-[6px] text-xs lowercase transition-colors',
                isActive && 'bg-muted text-foreground'
              )}
              onClick={() => onFilterChange(id)} // inform parent of new selection
            >
              <Icon style={{ width: '12px' }} />{' '}
              {/* small icon representing filter */}
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
