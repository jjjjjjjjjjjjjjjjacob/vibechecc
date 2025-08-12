import * as React from 'react';
// shadcn card primitives used for visual containers
import { Card, CardContent } from '@/components/ui/card';
// primary and outline buttons for navigation actions
import { Button } from '@/components/ui/button';
// small badge used to highlight feed features
import { Badge } from '@/components/ui/badge';
// assorted icons convey meaning without extra text
import { Sparkles, Users, Heart, ArrowRight, Star } from 'lucide-react';
// utility to merge class names conditionally
import { cn } from '@/utils/tailwind-utils';
// follow suggestions appear at the bottom of the empty state
import { CompactSuggestedFollows } from '@/features/follows/components/suggested-follows';
// hook retrieving how many people the current user follows
import { useCurrentUserFollowStats } from '@/features/follows/hooks/use-follow-stats';

// minimal props to allow custom styling from callers
interface ForYouEmptyStateProps {
  className?: string;
}

/**
 * Display guidance when a user's "for you" feed lacks content.
 *
 * The component branches based on whether the viewer already follows people.
 * Users with follows see navigation suggestions while brand‑new users receive
 * onboarding tips and a short list of accounts to follow.
 */
export function ForYouEmptyState({ className }: ForYouEmptyStateProps) {
  // fetch lightweight stats about how many accounts the user follows
  const { data: followStats } = useCurrentUserFollowStats();
  // track if the user follows anyone to choose which empty state to render
  const hasFollows = followStats.following > 0;

  // when the user already follows people but their feed has no content
  if (hasFollows) {
    // show a simple message encouraging patience and navigation elsewhere
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
                your personalized feed is getting ready
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mx-auto mb-6 max-w-md">
                you're following {followStats.following}{' '}
                {followStats.following === 1 ? 'person' : 'people'}, but they
                haven't shared any vibes yet. check back soon for personalized
                content!
              </p>

              {/* Actions */}
              {/* links to other parts of the site so the user can explore */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  {/* jump to the "hot" tab to browse trending content */}
                  <a href="/?tab=hot" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    explore hot vibes
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  {/* encourage creating a vibe to populate the feed */}
                  <a href="/vibes/create" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    create a vibe
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
              discover your personalized feed
            </h3>

            {/* Description */}
            <p className="text-muted-foreground mx-auto mb-6 max-w-lg">
              follow people to see their vibes in your personalized "for you"
              feed. start by connecting with users who share similar interests
              and experiences.
            </p>

            {/* Feature highlights */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              <Badge
                variant="secondary"
                className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                personalized content
              </Badge>
              <Badge
                variant="secondary"
                className="border-theme-primary/20 bg-theme-secondary/10 text-theme-secondary"
              >
                <Heart className="mr-1 h-3 w-3" />
                from people you follow
              </Badge>
              <Badge
                variant="secondary"
                className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary"
              >
                <Users className="mr-1 h-3 w-3" />
                curated just for you
              </Badge>
            </div>

            {/* Get Started Button - scroll to suggestions */}
            <Button
              size="lg" // make the button stand out on mobile
              className="mb-4"
              onClick={() => {
                // locate the suggestions section and scroll to it smoothly
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

      {/* follow suggestions rendered below the onboarding card */}
      <div data-suggestions>
        {/* show a small list of suggested users without mutual counts */}
        <CompactSuggestedFollows limit={4} showMutualConnections={false} />
      </div>

      {/* Additional Help Card */}
      <Card className="bg-background/50 border-theme-secondary/20 shadow-lg backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-center">
            <h4 className="mb-2 font-semibold">new to viberatr?</h4>
            <p className="text-muted-foreground/80 mb-4 text-sm">
              share your life experiences, rate others' vibes, and discover
              content from people you connect with.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/?tab=new">see what's new</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/?tab=unrated">discover unrated vibes</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
