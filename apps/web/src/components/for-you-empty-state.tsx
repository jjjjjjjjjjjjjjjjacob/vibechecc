import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Users,
  Heart,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
} from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { CompactSuggestedFollows } from '@/features/follows/components/suggested-follows';
import { useCurrentUserFollowStats } from '@/features/follows/hooks/use-follow-stats';

interface ForYouEmptyStateProps {
  className?: string;
}

export function ForYouEmptyState({ className }: ForYouEmptyStateProps) {
  const { data: followStats } = useCurrentUserFollowStats();

  const hasFollows = followStats && followStats.following > 0;

  if (hasFollows) {
    // User follows people but their personalized feed is empty
    return (
      <div className={cn('w-full', className)}>
        <Card className="bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="from-theme-primary to-theme-secondary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r">
                <Sparkles className="text-primary-foreground h-8 w-8" />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-bold">
                building your personalized feed
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mx-auto mb-6 max-w-md">
                you're following {followStats.following}{' '}
                {followStats.following === 1 ? 'person' : 'people'}! as they
                share more vibes and you interact with content, your feed will
                become more personalized.
              </p>

              {/* Enhanced Feature highlights */}
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                <Badge
                  variant="secondary"
                  className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  smart recommendations
                </Badge>
                <Badge
                  variant="secondary"
                  className="border-theme-secondary/20 bg-theme-secondary/10 text-theme-secondary"
                >
                  <Heart className="mr-1 h-3 w-3" />
                  interest-based
                </Badge>
                <Badge
                  variant="secondary"
                  className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  trending discovery
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  <a href="/?tab=hot" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    discover trending
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/vibes/create" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    share a vibe
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New user who doesn't follow anyone yet - show onboarding with suggestions
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Welcome Card */}
      <Card className="bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md">
        <CardContent className="p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="from-theme-primary to-theme-secondary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r">
              <Users className="text-primary-foreground h-8 w-8" />
            </div>

            {/* Title */}
            <h3 className="mb-3 text-xl font-bold">
              your intelligent feed awaits
            </h3>

            {/* Description */}
            <p className="text-muted-foreground mx-auto mb-6 max-w-lg">
              as you rate vibes, follow users, and interact with content, our
              recommendation system learns your interests to show you the most
              relevant and engaging vibes.
            </p>

            {/* Enhanced Feature highlights */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              <Badge
                variant="secondary"
                className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                ai-powered recommendations
              </Badge>
              <Badge
                variant="secondary"
                className="border-theme-secondary/20 bg-theme-secondary/10 text-theme-secondary"
              >
                <Heart className="mr-1 h-3 w-3" />
                emoji & interest matching
              </Badge>
              <Badge
                variant="secondary"
                className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                trending discovery
              </Badge>
              <Badge
                variant="secondary"
                className="border-theme-secondary/20 bg-theme-secondary/10 text-theme-secondary"
              >
                <Users className="mr-1 h-3 w-3" />
                social connections
              </Badge>
            </div>

            {/* Get Started Button - scroll to suggestions */}
            <Button
              size="lg"
              className="mb-4"
              onClick={() => {
                const suggestionsElement =
                  document.querySelector('[data-suggestions]');
                suggestionsElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              find people to follow
            </Button>

            {/* Alternative actions */}
            <div className="border-border/50 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-center">
              <Button variant="outline" asChild>
                <a href="/?tab=hot">explore trending vibes</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/vibes/create">create your first vibe</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow Suggestions */}
      <div data-suggestions>
        <CompactSuggestedFollows limit={4} showMutualConnections={false} />
      </div>

      {/* Additional Help Card */}
      <Card className="bg-background/50 border-theme-secondary/20 shadow-lg backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-center">
            <h4 className="mb-2 font-semibold">how recommendations work</h4>
            <p className="text-muted-foreground/80 mb-4 text-sm">
              our algorithm considers your emoji preferences, tags from vibes
              you rate highly, and content from users you follow to create a
              personalized feed that gets smarter over time.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/?tab=hot" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  explore trending
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/?tab=new" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  see what's new
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
