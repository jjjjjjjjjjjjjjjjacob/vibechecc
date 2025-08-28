import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VibeCardV2 as VibeCard } from '@/features/vibes/components/vibe-card';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import type {
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ReviewSearchResult,
  Vibe,
} from '@vibechecc/types';
import { Hash, Users, MessageSquare } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResultListCardProps {
  result?: SearchResult;
  queriedEmojis?: string[];
  loading?: boolean;
}

export function SearchResultListCard({
  result,
  queriedEmojis,
  loading = false,
}: SearchResultListCardProps) {
  // If loading, show skeleton based on result type or default
  if (loading) {
    // Default to vibe skeleton if no result type specified
    if (!result || result.type === 'vibe') {
      return <VibeResultListCard loading={true} />;
    }
    if (result.type === 'user') {
      return <UserResultListCard loading={true} />;
    }
    if (result.type === 'tag') {
      return <TagResultListCard loading={true} />;
    }
    if (result.type === 'review') {
      return <ReviewResultListCard loading={true} />;
    }
  }

  if (!result) return null;

  if (result.type === 'vibe') {
    return (
      <VibeResultListCard
        result={result as VibeSearchResult}
        queriedEmojis={queriedEmojis}
      />
    );
  }

  if (result.type === 'user') {
    return <UserResultListCard result={result as UserSearchResult} />;
  }

  if (result.type === 'tag') {
    return <TagResultListCard result={result as TagSearchResult} />;
  }

  if (result.type === 'review') {
    return <ReviewResultListCard result={result as ReviewSearchResult} />;
  }

  return null;
}

function VibeResultListCard({
  result,
  queriedEmojis: _queriedEmojis,
  loading = false,
}: {
  result?: VibeSearchResult;
  queriedEmojis?: string[];
  loading?: boolean;
}) {
  // If loading, delegate to VibeCard's loading state
  if (loading || !result) {
    return (
      <VibeCard
        loading={true}
        variant={'search-result'}
        ratingDisplayMode="most-rated"
      />
    );
  }

  // Convert VibeSearchResult to Vibe format for VibeCard
  const vibe: Vibe = {
    id: result.id,
    title: result.title,
    description: result.description,
    image: result.image,
    tags: result.tags,
    createdAt: result.createdAt ? String(result.createdAt) : String(Date.now()),
    createdById: result.createdBy?.id || '',
    createdBy: result.createdBy
      ? {
          externalId: result.createdBy.id,
          full_name: result.createdBy.name,
          username: result.createdBy.name,
          image_url: result.createdBy.avatar,
        }
      : null,
    ratings: [], // Not needed for search results
    viewCount: 0, // Not needed for search results
  };

  return (
    <VibeCard
      vibe={vibe}
      variant={'search-result'}
      ratingDisplayMode="most-rated"
    />
  );
}

function UserResultListCard({
  result,
  loading = false,
}: {
  result?: UserSearchResult;
  loading?: boolean;
}) {
  // Fetch user's top vibes - hooks must always be called
  const userVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByUser, {
      userId: result?.id || '',
    }),
    enabled: !!result?.id && !loading,
  });

  // Show skeleton if loading
  if (loading || !result) {
    return (
      <div className="space-y-1">
        <Card className="bg-card/30 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4 pb-2">
              <Skeleton className="h-16 w-16 flex-shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
                {[0, 1, 2].map((i) => (
                  <VibeCard
                    key={i}
                    loading={true}
                    variant="compact"
                    className="w-full"
                  />
                ))}
              </div>
              <div className="sm:hidden">
                <VibeCard loading={true} variant="compact" className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topVibes = (userVibesQuery.data || []).slice(0, 3);

  return (
    <div className="space-y-1">
      {/* Main User Card */}
      <Card className="bg-card/30 overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <Link to="/users/$username" params={{ username: result.username }}>
            <div className="flex items-center gap-4 p-4 pb-2">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={result.image} className="object-cover" />
                <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="truncate text-base font-semibold">
                      {result.title}
                    </h3>
                    <span className="text-muted-foreground flex-shrink-0 text-sm">
                      @{result.username}
                    </span>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span>{result.vibeCount || 0} vibes</span>
                    <span>{result.followerCount || 0} followers</span>
                  </div>
                </div>

                <Badge variant="secondary" className="flex-shrink-0">
                  <Users className="mr-1 h-3 w-3" />
                  user
                </Badge>
              </div>
            </div>
          </Link>

          {/* Top Vibes - Show 3 on desktop, 1 on mobile */}
          {topVibes.length > 0 && (
            <div className="px-4 pb-4">
              <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
                {topVibes.slice(0, 3).map((vibeData, index) => {
                  return (
                    <VibeCard
                      key={vibeData.id}
                      vibe={vibeData}
                      variant="compact"
                      className="w-full"
                      delay={index * 500}
                    />
                  );
                })}
              </div>
              {/* Mobile: Show only first vibe */}
              <div className="sm:hidden">
                {(() => {
                  const vibeData = topVibes[0] || {};
                  return (
                    <VibeCard
                      key={vibeData.id}
                      vibe={vibeData}
                      variant="compact"
                      className="w-full"
                      delay={0}
                    />
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TagResultListCard({
  result,
  loading = false,
}: {
  result?: TagSearchResult;
  loading?: boolean;
}) {
  // Fetch top vibes for this tag - hooks must always be called
  const tagVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByTag, {
      tag: result?.title || '',
      limit: 3,
    }),
    enabled: !!result?.title && !loading,
  });

  // Show skeleton if loading
  if (loading || !result) {
    return (
      <div className="space-y-1">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4 pb-2">
              <div className="bg-primary/10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
                {[0, 1, 2].map((i) => (
                  <VibeCard
                    key={i}
                    loading={true}
                    variant="compact"
                    className="w-full"
                  />
                ))}
              </div>
              <div className="sm:hidden">
                <VibeCard loading={true} variant="compact" className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topVibes = tagVibesQuery.data || [];

  return (
    <div className="space-y-1">
      {/* Main Tag Card */}
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <Link to="/search" search={{ tags: [result.title] }}>
            <div className="flex items-center gap-4 p-4 pb-2">
              <div className="bg-primary/10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
                <Hash className="text-primary h-8 w-8" />
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="truncate text-base font-semibold">
                      #{result.title}
                    </h3>
                    <span className="text-muted-foreground flex-shrink-0 text-sm">
                      {result.count} {result.count === 1 ? 'vibe' : 'vibes'}
                    </span>
                  </div>
                </div>

                <Badge variant="secondary" className="flex-shrink-0">
                  <Hash className="mr-1 h-3 w-3" />
                  tag
                </Badge>
              </div>
            </div>
          </Link>

          {/* Top Vibes - Show 3 on desktop, 1 on mobile */}
          {topVibes.length > 0 && (
            <div className="px-4 pb-4">
              <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
                {topVibes.slice(0, 3).map((vibeData, index) => {
                  return (
                    <VibeCard
                      key={vibeData.id}
                      vibe={vibeData}
                      variant="compact"
                      className="w-full"
                      delay={index * 500}
                    />
                  );
                })}
              </div>
              {/* Mobile: Show only first vibe */}
              <div className="sm:hidden">
                {(() => {
                  const vibeData = topVibes[0];
                  return (
                    <VibeCard
                      key={vibeData.id}
                      vibe={vibeData}
                      variant="compact"
                      className="w-full"
                      delay={0}
                    />
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewResultListCard({
  result,
  loading = false,
}: {
  result?: ReviewSearchResult;
  loading?: boolean;
}) {
  // Show skeleton if loading
  if (loading || !result) {
    return (
      <Card className="bg-card/30 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-3 p-4">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-col gap-0">
                <div className="flex w-full items-center justify-between gap-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="mb-3">
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const _usePlaceholder = !result.vibeImage;

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.vibeId }}>
      <Card className="bg-card/30 overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex gap-3 p-4">
            {/* Reviewer Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={result.reviewerAvatar}
                alt={result.reviewerName}
                className="object-cover"
              />
              <AvatarFallback className="text-sm">
                {result.reviewerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Header */}
              <div className="mb-2 flex flex-col gap-0">
                <div className="flex w-full items-center justify-between gap-0">
                  <span className="truncate text-sm font-medium">
                    @{result.reviewerName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    review
                  </Badge>
                </div>
                <span className="text-muted-foreground text-xs">
                  on "{result.vibeTitle}"
                </span>
              </div>

              {/* Review Text */}
              <div className="mb-3">
                <p className="text-sm leading-relaxed">{result.reviewText}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center">
                <EmojiRatingDisplay
                  rating={{
                    emoji: result.emoji,
                    value: result.rating,
                    count: undefined,
                  }}
                  vibeId={result.vibeId}
                  variant="compact"
                  size="sm"
                  existingUserRatings={[]}
                  emojiMetadata={{}}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
