import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Flame, Sparkles, Clock, Star } from '@/components/ui/icons';
import { useHeaderNavStore } from '@/stores/header-nav-store';
import { useUser } from '@clerk/tanstack-react-start';
import { useCurrentUserFollowStats } from '@/features/follows/hooks/use-follow-stats';

interface FeedTabsProps {
  tooltipSide?: 'top' | 'bottom';
}

export function FeedTabs({ tooltipSide = 'top' }: FeedTabsProps) {
  const feedTab = useHeaderNavStore((state) => state.feedTab);
  const setFeedTab = useHeaderNavStore((state) => state.setFeedTab);
  const { user } = useUser();
  const { data: followStats } = useCurrentUserFollowStats();

  // Feed tabs configuration
  const feedTabs = [
    {
      id: 'for-you' as const,
      label: 'for you',
      icon: <Sparkles className="h-4 w-4" />,
      description:
        followStats?.following > 0
          ? `personalized vibes from ${followStats.following} ${followStats.following === 1 ? 'person' : 'people'} you follow`
          : 'discover and follow people to see personalized content',
      requiresAuth: true,
    },
    {
      id: 'hot' as const,
      label: 'hot',
      icon: <Flame className="h-4 w-4" />,
      description: 'most rated & recently active vibes',
      requiresAuth: false,
    },
    {
      id: 'new' as const,
      label: 'new',
      icon: <Clock className="h-4 w-4" />,
      description: 'freshly posted vibes',
      requiresAuth: false,
    },
    {
      id: 'unrated' as const,
      label: 'unrated',
      icon: <Star className="h-4 w-4" />,
      description: "vibes that haven't been rated yet",
      requiresAuth: false,
    },
  ];

  // Show "For You" only if user is authenticated, otherwise default to "Hot"
  const availableTabs = user?.id
    ? feedTabs
    : feedTabs.filter((tab) => !tab.requiresAuth);

  return (
    <TooltipProvider>
      <div className="flex gap-2 overflow-x-auto">
        {availableTabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <Button
                variant={feedTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedTab(tab.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {tab.icon}
                {tab.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>
              <p>{tab.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
