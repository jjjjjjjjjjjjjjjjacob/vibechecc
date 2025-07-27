import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Sparkles } from 'lucide-react';
import { useTrendingEmojiRatings } from '@/queries';
import { cn } from '@/utils/tailwind-utils';

export function EmojiTrends({ className }: { className?: string }) {
  const { data: trends, isLoading } = useTrendingEmojiRatings(7); // Last 7 days

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-4 w-4" />
            Trending Emoji Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trends || trends.length === 0) {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-4 w-4" />
          Trending Emoji Ratings
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
          Last 7 days
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.slice(0, 5).map((trend, index) => (
            <Link
              key={trend.emoji}
              to="/search"
              search={{
                emojiFilter: [trend.emoji],
                sort: 'recent',
              }}
              className="hover:bg-secondary/50 flex items-center justify-between rounded-lg p-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground flex h-6 w-6 items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-2xl">{trend.emoji}</span>
                <div>
                  <p className="text-sm font-medium">
                    {trend.count} rating{trend.count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Avg: {trend.averageValue.toFixed(1)}
                  </p>
                </div>
              </div>
              {trend.change > 0 && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+{trend.change}%</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <Link
          to="/discover"
          className="text-muted-foreground hover:text-foreground mt-4 block text-center text-sm transition-colors"
        >
          Explore all emoji collections →
        </Link>
      </CardContent>
    </Card>
  );
}
