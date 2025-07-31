import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { EmojiRatingDisplay } from '@/components/emoji-rating-display';
import { api } from '@viberater/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import type {
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ReviewSearchResult,
  Vibe,
} from '@viberater/types';
import { Hash, Users, MessageSquare } from 'lucide-react';

interface SearchResultListCardProps {
  result: SearchResult;
  queriedEmojis?: string[];
}

export function SearchResultListCard({
  result,
  queriedEmojis,
}: SearchResultListCardProps) {
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
}: {
  result: VibeSearchResult;
  queriedEmojis?: string[];
}) {
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
      variant="search-result"
      ratingDisplayMode="most-rated"
    />
  );
}

function UserResultListCard({ result }: { result: UserSearchResult }) {
  // Fetch user's top vibes
  const userVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByUser, {
      userId: result.id,
    }),
    enabled: !!result.id,
  });

  const topVibes = (userVibesQuery.data || []).slice(0, 3);

  return (
    <div className="space-y-1">
      {/* Main User Card */}
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
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

function TagResultListCard({ result }: { result: TagSearchResult }) {
  // Fetch top vibes for this tag
  const tagVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByTag, {
      tag: result.title,
      limit: 3,
    }),
    enabled: !!result.title,
  });

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

function ReviewResultListCard({ result }: { result: ReviewSearchResult }) {
  const usePlaceholder = !result.vibeImage;

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.vibeId }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
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
              <div className="mb-1 flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  @{result.reviewerName}
                </span>
                <span className="text-muted-foreground flex-shrink-0 text-xs">
                  on "{result.vibeTitle}"
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  review
                </Badge>
              </div>

              {/* Review Text */}
              <div className="mb-3">
                <p className="text-sm leading-relaxed">{result.reviewText}</p>
              </div>

              {/* Rating and Vibe Image */}
              <div className="flex items-center justify-between">
                <EmojiRatingDisplay
                  rating={{
                    emoji: result.emoji,
                    value: result.rating,
                    count: undefined,
                  }}
                  showScale={false}
                  size="sm"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-8 w-8 cursor-pointer overflow-hidden rounded">
                      {usePlaceholder ? (
                        <SimpleVibePlaceholder title={result.vibeTitle} />
                      ) : (
                        <img
                          src={result.vibeImage}
                          alt={result.vibeTitle}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-background max-w-xs border p-0"
                  >
                    <div className="space-y-2">
                      {!usePlaceholder && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t">
                          <img
                            src={result.vibeImage}
                            alt={result.vibeTitle}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-foreground text-sm font-medium">
                          {result.vibeTitle}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
