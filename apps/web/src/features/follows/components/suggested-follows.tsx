import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Users, Sparkles } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useSuggestedFollows } from '../hooks/use-suggested-follows';
import { FollowButton } from './follow-button';
import type { User } from '@vibechecc/types';

interface SuggestedFollowsSuggestion {
  user: User | null;
  mutualConnections?: number;
  engagementStats?: {
    totalRatings: number;
    averageRating: number;
    vibeCount: number;
  };
}

interface SuggestedFollowsProps {
  limit?: number;
  variant?: 'card' | 'list';
  className?: string;
  title?: string;
  showMutualConnections?: boolean;
}

export function SuggestedFollows({
  limit = 5,
  variant = 'card',
  className,
  title = 'suggested follows',
  showMutualConnections = true,
}: SuggestedFollowsProps) {
  const { data: suggestions, isLoading } = useSuggestedFollows({ limit });

  if (isLoading) {
    return (
      <Card
        className={cn(
          'bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md',
          className
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="from-theme-primary to-theme-secondary rounded-lg bg-gradient-to-r p-2">
              <Skeleton className="h-4 w-4" />
            </div>
            <div>
              <Skeleton className="mb-1 h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card
        className={cn(
          'bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md',
          className
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="from-theme-primary to-theme-secondary rounded-lg bg-gradient-to-r p-2">
              <Sparkles className="text-primary-foreground h-4 w-4" />
            </div>
            <div>
              <CardTitle className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase">
                {title}
              </CardTitle>
              <p className="text-muted-foreground/80 text-sm">
                discover new people to follow
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <UserPlus className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground mb-1 font-medium">
              no suggestions yet
            </p>
            <p className="text-muted-foreground/80 text-sm">
              start following people to get personalized suggestions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="from-theme-primary to-theme-secondary rounded-lg bg-gradient-to-r p-2">
            <Sparkles className="text-primary-foreground h-4 w-4" />
          </div>
          <div>
            <CardTitle className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase">
              {title}
            </CardTitle>
            <p className="text-muted-foreground/80 text-sm">
              people you might know
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            variant === 'list' ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'
          )}
        >
          {suggestions.map((suggestion: SuggestedFollowsSuggestion) => {
            if (!suggestion.user) return null;

            const user = suggestion.user;
            const displayName =
              `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
              user.username ||
              'User';

            return (
              <div
                key={user._id}
                className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-lg border p-3 backdrop-blur transition-all duration-200 hover:scale-[1.02]"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.image_url || user.profile_image_url}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-medium lowercase">
                    {displayName}
                  </p>
                  {user.username && (
                    <p className="text-muted-foreground truncate text-sm">
                      @{user.username}
                    </p>
                  )}

                  {/* Mutual Connections Badge */}
                  {showMutualConnections &&
                    suggestion.mutualConnections &&
                    suggestion.mutualConnections > 0 && (
                      <div className="mt-1">
                        <Badge
                          variant="secondary"
                          className="border-theme-primary/20 bg-theme-primary/10 text-theme-primary text-xs"
                        >
                          <Users className="mr-1 h-3 w-3" />
                          {suggestion.mutualConnections} mutual
                        </Badge>
                      </div>
                    )}

                  {/* Popular User Badge - show for users with no mutual connections but high engagement */}
                  {(!showMutualConnections ||
                    !suggestion.mutualConnections ||
                    suggestion.mutualConnections === 0) &&
                    suggestion.engagementStats && (
                      <div className="mt-1">
                        <Badge
                          variant="secondary"
                          className="border-warning/20 bg-warning/10 text-warning text-xs"
                        >
                          <span className="mr-1">⭐</span>
                          {suggestion.engagementStats.averageRating.toFixed(
                            1
                          )}{' '}
                          avg • {suggestion.engagementStats.totalRatings}{' '}
                          ratings
                        </Badge>
                      </div>
                    )}
                </div>

                <FollowButton
                  targetUserId={user.externalId}
                  variant="compact"
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactSuggestedFollowsProps {
  limit?: number;
  className?: string;
  showMutualConnections?: boolean;
}

export function CompactSuggestedFollows({
  limit = 3,
  className,
  showMutualConnections = true,
}: CompactSuggestedFollowsProps) {
  return (
    <SuggestedFollows
      limit={limit}
      variant="list"
      className={className}
      title="people to follow"
      showMutualConnections={showMutualConnections}
    />
  );
}
