import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@vibechecc/convex';
import { ACHIEVEMENT_DEFINITIONS, type User } from '@vibechecc/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  Heart,
  MessageSquare,
  Award,
  Crown,
  Flame,
  Zap,
} from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { useCurrentUser } from '@/queries';
import * as React from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  currentValue: number;
  progress: number;
  isCompleted: boolean;
  unlockedTier: {
    threshold: number;
    name: 'bronze' | 'silver' | 'gold' | 'platinum';
    multiplier: number;
  } | null;
  nextTier: {
    threshold: number;
    name: 'bronze' | 'silver' | 'gold' | 'platinum';
    multiplier: number;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    externalId: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  } | null;
  value: number;
  label: string;
  metadata: {
    level?: number;
    streak?: number;
  };
}

interface TrendingItem {
  vibe: {
    id: string;
    title: string;
  };
  author: {
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  } | null;
  ratingsCount: number;
  likesCount: number;
  shareCount: number;
  engagementScore: number;
}

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data: currentUser } = useCurrentUser();

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="from-theme-primary to-theme-secondary mb-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
            leaderboards & achievements
          </h1>
          <p className="text-muted-foreground drop-shadow-sm">
            see who's leading the community and unlock your achievements
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left Column - User Achievements */}
          <div className="lg:col-span-1">
            {currentUser && <UserAchievementsCard />}
            <div className="mt-6">
              <AchievementGuideCard />
            </div>
          </div>

          {/* Right Columns - Leaderboards */}
          <div className="lg:col-span-3">
            <LeaderboardTabs />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserAchievementsCard() {
  const { data: currentUser } = useCurrentUser();
  const achievements = useQuery(
    api.achievements.getUserAchievements,
    currentUser?.externalId ? { userId: currentUser.externalId } : 'skip'
  );
  const isLoading = achievements === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            your achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            your achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center text-sm">
            start participating to unlock achievements!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          your achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <AchievementProgress
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementProgress({ achievement }: { achievement: Achievement }) {
  const tierColors = {
    bronze: 'text-warning bg-warning/10',
    silver: 'text-muted-foreground bg-muted',
    gold: 'text-rating bg-rating/10',
    platinum: 'text-accent-foreground bg-accent',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{achievement.icon}</span>
          <span className="text-sm font-medium">{achievement.name}</span>
          {achievement.unlockedTier && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                tierColors[
                  achievement.unlockedTier.name as keyof typeof tierColors
                ]
              )}
            >
              {achievement.unlockedTier.name}
            </Badge>
          )}
        </div>
        {achievement.isCompleted ? (
          <Crown className="text-rating h-4 w-4" />
        ) : (
          <span className="text-muted-foreground text-xs">
            {achievement.currentValue}/
            {achievement.nextTier?.threshold || 'max'}
          </span>
        )}
      </div>

      <div className="bg-muted h-2 w-full rounded-full">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            achievement.isCompleted
              ? 'from-rating to-rating/80 bg-gradient-to-r'
              : 'from-theme-primary to-theme-secondary bg-gradient-to-r'
          )}
          style={{ width: `${achievement.progress}%` }}
        />
      </div>

      <p className="text-muted-foreground text-xs">{achievement.description}</p>
    </div>
  );
}

function AchievementGuideCard() {
  const achievements = Object.values(ACHIEVEMENT_DEFINITIONS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          achievement guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-start gap-2">
              <span className="mt-0.5 text-base">{achievement.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{achievement.name}</p>
                <p className="text-muted-foreground text-xs">
                  {achievement.description}
                </p>
                <div className="mt-1 flex gap-1">
                  {achievement.tiers.map((tier) => (
                    <Badge
                      key={tier.name}
                      variant="outline"
                      className="px-1 py-0 text-xs"
                    >
                      {tier.threshold}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardTabs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="points" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              points
            </TabsTrigger>
            <TabsTrigger value="level" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              level
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              streak
            </TabsTrigger>
            <TabsTrigger value="vibes" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              vibes
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              ratings
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            <LeaderboardContent category="points" />
          </TabsContent>

          <TabsContent value="level">
            <LeaderboardContent category="level" />
          </TabsContent>

          <TabsContent value="streak">
            <LeaderboardContent category="streak" />
          </TabsContent>

          <TabsContent value="vibes">
            <LeaderboardContent category="vibes" />
          </TabsContent>

          <TabsContent value="ratings">
            <LeaderboardContent category="ratings" />
          </TabsContent>

          <TabsContent value="trending">
            <TrendingLeaderboard />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LeaderboardContent({ category }: { category: string }) {
  const leaderboard = useQuery(api.achievements.getLeaderboard, {
    category: category as 'points' | 'level' | 'streak' | 'vibes' | 'ratings',
    timeframe: 'month',
    limit: 20,
  });
  const isLoading = leaderboard === undefined;

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">
          no leaderboard data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {leaderboard.map((entry: LeaderboardEntry) => (
        <LeaderboardEntry key={entry.rank} entry={entry} />
      ))}
    </div>
  );
}

function LeaderboardEntry({ entry }: { entry: LeaderboardEntry }) {
  if (!entry.user) return null;

  const rankColors = {
    1: 'text-rating bg-rating/10',
    2: 'text-muted-foreground bg-muted',
    3: 'text-warning bg-warning/10',
  };

  return (
    <a
      href={`/users/${entry.user.username || entry.user.externalId}`}
      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
    >
      <div className="flex h-6 w-8 items-center justify-center text-sm font-bold">
        {entry.rank <= 3 ? (
          <Badge
            variant="secondary"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs',
              rankColors[entry.rank as keyof typeof rankColors]
            )}
          >
            {entry.rank}
          </Badge>
        ) : (
          <span className="text-muted-foreground">#{entry.rank}</span>
        )}
      </div>

      <Avatar className="h-10 w-10">
        <AvatarImage
          src={getUserAvatarUrl(entry.user)}
          alt={computeUserDisplayName(entry.user)}
        />
        <AvatarFallback>
          {computeUserDisplayName(entry.user)[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {computeUserDisplayName(entry.user)}
        </p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {entry.metadata.level && <span>level {entry.metadata.level}</span>}
          {entry.metadata.streak && entry.metadata.streak > 0 && (
            <span>• {entry.metadata.streak}d streak</span>
          )}
        </div>
      </div>

      <div className="text-right">
        <Badge variant="secondary" className="text-sm">
          {entry.value.toLocaleString()}
        </Badge>
        <p className="text-muted-foreground mt-1 text-xs">{entry.label}</p>
      </div>
    </a>
  );
}

function TrendingLeaderboard() {
  const trending = useQuery(api.community.getTrendingCommunityContent, {
    limit: 10,
  });
  const isLoading = trending === undefined;

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!trending || trending.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">
          no trending content available yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {trending.map((item: TrendingItem, index: number) => (
        <a
          key={item.vibe.id}
          href={`/vibes/${item.vibe.id}`}
          className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
        >
          <div className="flex h-6 w-8 items-center justify-center text-sm font-bold">
            {index < 3 ? (
              <Badge
                variant="secondary"
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs',
                  index === 0 && 'bg-rating/10 text-rating',
                  index === 1 && 'bg-muted text-muted-foreground',
                  index === 2 && 'bg-warning/10 text-warning'
                )}
              >
                {index + 1}
              </Badge>
            ) : (
              <span className="text-muted-foreground">#{index + 1}</span>
            )}
          </div>

          {item.author && (
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={getUserAvatarUrl({
                  ...item.author,
                  externalId: '',
                } as User)}
                alt={computeUserDisplayName({
                  ...item.author,
                  externalId: '',
                } as User)}
              />
              <AvatarFallback>
                {computeUserDisplayName({
                  ...item.author,
                  externalId: '',
                } as User)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.vibe.title}</p>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>{item.ratingsCount} ratings</span>
              <span>• {item.likesCount} likes</span>
              {item.shareCount > 0 && <span>• {item.shareCount} shares</span>}
            </div>
          </div>

          <div className="text-right">
            <Badge
              variant="secondary"
              className="border-warning/20 bg-warning/10 text-warning text-sm"
            >
              <TrendingUp className="mr-1 h-3 w-3" />
              {Math.round(item.engagementScore)}
            </Badge>
            <p className="text-muted-foreground mt-1 text-xs">engagement</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default LeaderboardPage;
