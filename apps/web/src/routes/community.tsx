import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@vibechecc/convex';
import type { Rating, User } from '@vibechecc/types';

interface CommunityActivity {
  type: 'vibe_created' | 'rating_created' | 'rating_liked';
  user: {
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    externalId?: string;
  };
  timestamp: number;
  data: {
    vibe?: {
      id: string;
      title: string;
      description?: string;
    };
    rating?: {
      emoji?: string;
      value?: number;
      review?: string;
    };
    ratingAuthor?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      image_url?: string;
    } | null;
  };
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  Trophy,
  Clock,
  Star,
  Flame,
  ExternalLink,
  Twitter,
  Instagram,
} from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { formatDistanceToNow } from '@/utils/date-utils';
import * as React from 'react';

export const Route = createFileRoute('/community')({
  component: CommunityPage,
});

function CommunityPage() {
  // Feature flag checks using PostHog
  const showSocialFeatures = useFeatureFlagEnabled('SOCIAL_FEATURES');

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="from-theme-primary to-theme-secondary mb-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
            community hub
          </h1>
          <p className="text-muted-foreground drop-shadow-sm">
            discover what's happening in the vibechecc community
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Stats & Leaderboard */}
          <div className="space-y-6 lg:col-span-1">
            <CommunityStatsCard />
            <TopContributorsCard />
            {showSocialFeatures && <SocialPlatformsCard />}
          </div>

          {/* Right Column - Activity & Trending */}
          <div className="space-y-6 lg:col-span-2">
            <TrendingCommunityContent />
            <CommunityActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityStatsCard() {
  const stats = useQuery(api.community.getCommunityStats);
  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            community stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="mx-auto mb-2 h-8 w-16" />
                <Skeleton className="mx-auto h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: 'total users',
      value: stats.totals.users.toLocaleString(),
      icon: Users,
      subtext: `${stats.totals.activeUsers} active`,
    },
    {
      label: 'vibes shared',
      value: stats.totals.vibes.toLocaleString(),
      icon: Heart,
      subtext: `+${stats.recent24h.vibes} today`,
    },
    {
      label: 'ratings given',
      value: stats.totals.ratings.toLocaleString(),
      icon: MessageSquare,
      subtext: `+${stats.recent24h.ratings} today`,
    },
    {
      label: 'rating likes',
      value: stats.totals.ratingLikes.toLocaleString(),
      icon: Star,
      subtext: `+${stats.recent24h.ratingLikes} today`,
    },
    {
      label: 'social connections',
      value: stats.totals.socialConnections.toLocaleString(),
      icon: Share2,
      subtext: `${stats.engagement.socialConnectionRate}% of users`,
    },
    {
      label: 'engagement rate',
      value: `${stats.engagement.averageRatingsPerVibe}`,
      icon: TrendingUp,
      subtext: 'ratings per vibe',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          community stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <item.icon className="text-theme-primary h-4 w-4" />
                <span className="text-theme-primary text-2xl font-bold">
                  {item.value}
                </span>
              </div>
              <p className="text-muted-foreground text-xs lowercase">
                {item.label}
              </p>
              {item.subtext && (
                <p className="text-muted-foreground/80 mt-0.5 text-xs">
                  {item.subtext}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopContributorsCard() {
  const contributors = useQuery(api.community.getTopContributors, {
    limit: 5,
    timeframe: 'month',
  });
  const isLoading = contributors === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            top contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contributors || contributors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            top contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center text-sm">
            no contributors yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            top contributors
          </CardTitle>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm">
              view all →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributors.map((contributor, index) => (
            <a
              key={contributor.user.externalId}
              href={`/users/${contributor.user.username || contributor.user.externalId}`}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getUserAvatarUrl(contributor.user)}
                    alt={computeUserDisplayName(contributor.user)}
                  />
                  <AvatarFallback>
                    {computeUserDisplayName(contributor.user)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <div
                    className={cn(
                      'absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-white',
                      index === 0 && 'bg-rating',
                      index === 1 && 'bg-muted-foreground',
                      index === 2 && 'bg-warning'
                    )}
                  >
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {computeUserDisplayName(contributor.user)}
                </p>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>level {contributor.points.level}</span>
                  {contributor.points.streak > 0 && (
                    <span>• {contributor.points.streak}d streak</span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {contributor.points.total.toLocaleString()}
              </Badge>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SocialPlatformsCard() {
  const platformStats = useQuery(api.community.getSocialPlatformStats);
  const isLoading = platformStats === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            social platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['twitter', 'instagram', 'tiktok', 'discord'].map((platform) => (
              <div key={platform} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!platformStats) return null;

  const platforms = [
    { key: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-primary' },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-accent',
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: ExternalLink,
      color: 'text-black dark:text-white',
    },
    {
      key: 'discord',
      name: 'Discord',
      icon: ExternalLink,
      color: 'text-secondary-foreground',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          social platforms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {platforms.map((platform) => {
            const stats = platformStats.connections[platform.key];
            const shares = platformStats.shares[platform.key] || 0;

            return (
              <div
                key={platform.key}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <platform.icon className={cn('h-4 w-4', platform.color)} />
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  {stats?.connected || 0} connected
                  {shares > 0 && <span>• {shares} shares</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t pt-4">
          <div className="text-muted-foreground text-center text-sm">
            {platformStats.totalConnectedAccounts} total connections
            {platformStats.totalShares > 0 && (
              <span> • {platformStats.totalShares} total shares</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingCommunityContent() {
  const trending = useQuery(api.community.getTrendingCommunityContent, {
    limit: 6,
  });
  const isLoading = trending === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            trending now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <VibeCard key={i} variant="compact" loading={true} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trending || trending.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            trending now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            no trending content yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            trending now
          </CardTitle>
          <Link to="/discover">
            <Button variant="ghost" size="sm">
              explore more →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {trending.map((item) => (
            <div key={item.vibe.id} className="relative">
              <VibeCard
                vibe={{
                  ...item.vibe,
                  ratings: (item.ratings || []).map((rating) => ({
                    ...rating,
                    user: null,
                  })) as Rating[],
                }}
                variant="compact"
                ratingDisplayMode="most-rated"
              />
              <Badge
                variant="secondary"
                className="border-warning/20 bg-warning/10 text-warning absolute top-2 right-2 text-xs"
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                {Math.round(item.engagementScore)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CommunityActivityFeed() {
  const activities = useQuery(api.community.getCommunityActivity, {
    limit: 10,
  });
  const isLoading = activities === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            no recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: CommunityActivity }) {
  const renderActivityContent = () => {
    switch (activity.type) {
      case 'vibe_created':
        return (
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">
                {computeUserDisplayName({
                  ...activity.user,
                  externalId: activity.user.externalId || '',
                } as User)}
              </span>{' '}
              created a new vibe
            </p>
            <a
              href={`/vibes/${activity.data.vibe?.id}`}
              className="text-theme-primary mt-1 block text-sm font-medium hover:underline"
            >
              "{activity.data.vibe?.title}"
            </a>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDistanceToNow(activity.timestamp)} ago
            </p>
          </div>
        );

      case 'rating_created':
        return (
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">
                {computeUserDisplayName({
                  ...activity.user,
                  externalId: activity.user.externalId || '',
                } as User)}
              </span>{' '}
              rated a vibe {activity.data.rating?.emoji} (
              {activity.data.rating?.value}/5)
            </p>
            <a
              href={`/vibes/${activity.data.vibe?.id}`}
              className="text-theme-primary mt-1 block text-sm font-medium hover:underline"
            >
              "{activity.data.vibe?.title}"
            </a>
            {activity.data.rating?.review && (
              <p className="text-muted-foreground mt-1 text-xs italic">
                "{activity.data.rating?.review}"
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDistanceToNow(activity.timestamp)} ago
            </p>
          </div>
        );

      case 'rating_liked':
        return (
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">
                {computeUserDisplayName({
                  ...activity.user,
                  externalId: activity.user.externalId || '',
                } as User)}
              </span>{' '}
              liked{' '}
              {activity.data.ratingAuthor
                ? `${activity.data.ratingAuthor.first_name || activity.data.ratingAuthor.username}'s`
                : 'a'}{' '}
              rating
            </p>
            <p className="text-muted-foreground mt-1 text-xs italic">
              {activity.data.rating?.emoji} "{activity.data.rating?.review}"
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDistanceToNow(activity.timestamp)} ago
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage
          src={getUserAvatarUrl({
            ...activity.user,
            externalId: activity.user.externalId || '',
          } as User)}
          alt={computeUserDisplayName({
            ...activity.user,
            externalId: activity.user.externalId || '',
          } as User)}
        />
        <AvatarFallback>
          {computeUserDisplayName({
            ...activity.user,
            externalId: activity.user.externalId || '',
          } as User)[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {renderActivityContent()}
    </div>
  );
}

export default CommunityPage;
