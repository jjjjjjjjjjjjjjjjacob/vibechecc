import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { api } from '@vibechecc/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Users,
  MessageCircle,
  Star,
  TrendingUp,
  Activity,
  Calendar,
} from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const [growthDays, setGrowthDays] = React.useState(30);
  const [engagementDays, setEngagementDays] = React.useState(7);
  const [customGrowthDays, setCustomGrowthDays] = React.useState('');
  const [customEngagementDays, setCustomEngagementDays] = React.useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    ...convexQuery(api.admin.dashboard.getDashboardStats, {}),
    enabled: isAdmin && !authLoading,
  });

  const { data: growth, isLoading: growthLoading } = useQuery({
    ...convexQuery(api.admin.dashboard.getUserGrowth, { days: growthDays }),
    enabled: isAdmin && !authLoading,
  });

  const { data: engagement, isLoading: engagementLoading } = useQuery({
    ...convexQuery(api.admin.dashboard.getEngagementMetrics, {
      days: engagementDays,
    }),
    enabled: isAdmin && !authLoading,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    ...convexQuery(api.admin.dashboard.getRecentActivity, { limit: 20 }),
    enabled: isAdmin && !authLoading,
  });

  return (
    <AdminLayout
      title="dashboard"
      description="overview of platform metrics and recent activity"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="total users"
            value={stats?.users.total}
            description={`${stats?.users.new || 0} new today`}
            icon={Users}
            isLoading={statsLoading}
          />
          <StatCard
            title="total vibes"
            value={stats?.vibes.total}
            description={`${stats?.vibes.new || 0} new today`}
            icon={MessageCircle}
            isLoading={statsLoading}
          />
          <StatCard
            title="total ratings"
            value={stats?.ratings.total}
            description={`${stats?.ratings.averageRating || 0}★ average`}
            icon={Star}
            isLoading={statsLoading}
          />
          <StatCard
            title="engagement"
            value={stats?.engagement.totalFollows}
            description={`${stats?.engagement.newFollows || 0} new follows today`}
            icon={TrendingUp}
            isLoading={statsLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">
                    user growth ({growthDays} days)
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    daily new user registrations
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={growthDays === 1 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGrowthDays(1)}
                    className="h-7 px-2 text-xs"
                  >
                    1d
                  </Button>
                  <Button
                    variant={growthDays === 3 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGrowthDays(3)}
                    className="h-7 px-2 text-xs"
                  >
                    3d
                  </Button>
                  <Button
                    variant={growthDays === 7 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGrowthDays(7)}
                    className="h-7 px-2 text-xs"
                  >
                    7d
                  </Button>
                  <Button
                    variant={growthDays === 10 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGrowthDays(10)}
                    className="hidden h-7 px-2 text-xs sm:inline-flex"
                  >
                    10d
                  </Button>
                  <Button
                    variant={growthDays === 30 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGrowthDays(30)}
                    className="h-7 px-2 text-xs"
                  >
                    1m
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={
                          ![1, 3, 7, 10, 30].includes(growthDays)
                            ? 'default'
                            : 'ghost'
                        }
                        size="sm"
                        className="h-7 px-2"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <Label htmlFor="custom-growth">custom days</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-growth"
                            type="number"
                            min="1"
                            max="365"
                            value={customGrowthDays}
                            onChange={(e) =>
                              setCustomGrowthDays(e.target.value)
                            }
                            placeholder="days"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const days = parseInt(customGrowthDays);
                              if (days > 0 && days <= 365) {
                                setGrowthDays(days);
                              }
                            }}
                          >
                            apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {growthLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              ) : (
                <ChartContainer
                  config={{
                    users: {
                      label: 'New Users',
                      color: 'var(--chart-1)',
                    },
                  }}
                  className="h-[200px] w-full sm:h-[250px] md:h-[300px]"
                >
                  <AreaChart data={growth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="var(--color-users)"
                      fill="var(--color-users)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">
                    engagement metrics ({engagementDays} days)
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    daily vibes, ratings, and follows
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={engagementDays === 1 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEngagementDays(1)}
                    className="h-7 px-2 text-xs"
                  >
                    1d
                  </Button>
                  <Button
                    variant={engagementDays === 3 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEngagementDays(3)}
                    className="h-7 px-2 text-xs"
                  >
                    3d
                  </Button>
                  <Button
                    variant={engagementDays === 7 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEngagementDays(7)}
                    className="h-7 px-2 text-xs"
                  >
                    7d
                  </Button>
                  <Button
                    variant={engagementDays === 10 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEngagementDays(10)}
                    className="hidden h-7 px-2 text-xs sm:inline-flex"
                  >
                    10d
                  </Button>
                  <Button
                    variant={engagementDays === 30 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEngagementDays(30)}
                    className="h-7 px-2 text-xs"
                  >
                    1m
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={
                          ![1, 3, 7, 10, 30].includes(engagementDays)
                            ? 'default'
                            : 'ghost'
                        }
                        size="sm"
                        className="h-7 px-2"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <Label htmlFor="custom-engagement">custom days</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-engagement"
                            type="number"
                            min="1"
                            max="365"
                            value={customEngagementDays}
                            onChange={(e) =>
                              setCustomEngagementDays(e.target.value)
                            }
                            placeholder="days"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const days = parseInt(customEngagementDays);
                              if (days > 0 && days <= 365) {
                                setEngagementDays(days);
                              }
                            }}
                          >
                            apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {engagementLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              ) : (
                <ChartContainer
                  config={{
                    vibes: {
                      label: 'Vibes',
                      color: 'var(--chart-1)',
                    },
                    ratings: {
                      label: 'Ratings',
                      color: 'var(--chart-2)',
                    },
                    follows: {
                      label: 'Follows',
                      color: 'var(--chart-3)',
                    },
                  }}
                  className="h-[200px] w-full sm:h-[250px] md:h-[300px]"
                >
                  <LineChart data={engagement?.timeline}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="vibes"
                      stroke="var(--color-vibes)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-vibes)', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ratings"
                      stroke="var(--color-ratings)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-ratings)', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="follows"
                      stroke="var(--color-follows)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-follows)', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>user health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  active users
                </span>
                <span>{stats?.users.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  suspended users
                </span>
                <span
                  className={cn(
                    stats?.users.suspended &&
                      stats.users.suspended > 0 &&
                      'text-destructive'
                  )}
                >
                  {stats?.users.suspended || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>content health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  public vibes
                </span>
                <span>{stats?.vibes.public || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  deleted vibes
                </span>
                <span
                  className={cn(
                    stats?.vibes.deleted &&
                      stats.vibes.deleted > 0 &&
                      'text-destructive'
                  )}
                >
                  {stats?.vibes.deleted || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  flagged ratings
                </span>
                <span
                  className={cn(
                    stats?.ratings.flagged &&
                      stats.ratings.flagged > 0 &&
                      'text-destructive'
                  )}
                >
                  {stats?.ratings.flagged || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  unread notifications
                </span>
                <span>{stats?.engagement.unreadNotifications || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>recent activity</CardTitle>
            <CardDescription>latest platform actions</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : (
              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {activity?.map((item, index) => (
                  <ActivityItem key={index} activity={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value?: number;
  description: string;
  icon: React.ElementType;
  isLoading: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="bg-muted h-7 w-16 animate-pulse rounded" />
          ) : (
            value?.toLocaleString() || '0'
          )}
        </div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: {
    type: 'user_joined' | 'vibe_created' | 'rating_added' | 'user_followed';
    timestamp: number;
    data: {
      userId?: string;
      username?: string;
      displayName?: string;
      vibeId?: string;
      title?: string;
      description?: string;
      createdById?: string;
      emoji?: string;
      value?: number;
      review?: string;
      followerId?: string;
      followingId?: string;
      creatorName?: string;
      raterName?: string;
      vibeTitle?: string;
      followerName?: string;
      followingName?: string;
      ratingId?: string;
    };
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityDisplay = () => {
    switch (activity.type) {
      case 'user_joined':
        return {
          icon: Users,
          text: `${activity.data.displayName} joined the platform`,
          color: 'text-green-600 dark:text-green-400',
        };
      case 'vibe_created':
        return {
          icon: MessageCircle,
          text: `${activity.data.creatorName} created "${activity.data.title}"`,
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'rating_added':
        return {
          icon: Star,
          text: `${activity.data.raterName} rated "${activity.data.vibeTitle}" ${activity.data.emoji} ${activity.data.value}★`,
          color: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'user_followed':
        return {
          icon: Activity,
          text: `${activity.data.followerName} followed ${activity.data.followingName}`,
          color: 'text-purple-600 dark:text-purple-400',
        };
      default:
        return {
          icon: Activity,
          text: 'unknown activity',
          color: 'text-muted-foreground',
        };
    }
  };

  const { icon: Icon, text, color } = getActivityDisplay();

  return (
    <div className="flex items-center space-x-3 py-2">
      <Icon className={cn('h-4 w-4', color)} />
      <div className="flex-1 text-sm">{text}</div>
      <div className="text-muted-foreground text-xs">
        {new Date(activity.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
