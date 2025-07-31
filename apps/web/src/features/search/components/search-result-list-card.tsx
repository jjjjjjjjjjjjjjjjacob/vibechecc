import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
    createdAt: result.createdAt || Date.now(),
    createdById: result.createdBy?.id || '',
    createdBy: result.createdBy
      ? {
          id: result.createdBy.id,
          name: result.createdBy.name,
          username: result.createdBy.username,
          imageUrl: result.createdBy.imageUrl,
        }
      : undefined,
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
  // Fetch user's top vibes for thumbnails
  const userVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByUser, {
      userId: result.id,
    }),
    enabled: !!result.id,
  });

  const topVibes = (userVibesQuery.data || []).slice(0, 3);

  return (
    <Link to="/users/$username" params={{ username: result.username }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={result.image} />
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

                  {/* Recent vibes thumbnails */}
                  {topVibes.length > 0 && (
                    <div className="ml-2 flex gap-1">
                      {topVibes
                        .slice(0, 3)
                        .map(
                          (vibe: {
                            _id: string;
                            title: string;
                            imageUrl?: string;
                          }) => (
                            <div
                              key={vibe._id}
                              className="relative h-6 w-6 overflow-hidden rounded"
                            >
                              {vibe.imageUrl ? (
                                <img
                                  src={vibe.imageUrl}
                                  alt={vibe.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-xs">
                                  {vibe.title.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              </div>

              <Badge variant="secondary" className="flex-shrink-0">
                <Users className="mr-1 h-3 w-3" />
                user
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TagResultListCard({ result }: { result: TagSearchResult }) {
  // Fetch top vibes for this tag for thumbnails
  const tagVibesQuery = useQuery({
    ...convexQuery(api.vibes.getByTag, {
      tag: result.title,
      limit: 3,
    }),
    enabled: !!result.title,
  });

  const topVibes = tagVibesQuery.data || [];

  return (
    <Link to="/search" search={{ tags: [result.title] }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
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

                {/* Top vibes thumbnails */}
                {topVibes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      top vibes:
                    </span>
                    <div className="flex gap-1">
                      {topVibes
                        .slice(0, 3)
                        .map(
                          (vibe: {
                            _id: string;
                            title: string;
                            imageUrl?: string;
                          }) => (
                            <div
                              key={vibe._id}
                              className="relative h-6 w-6 overflow-hidden rounded"
                            >
                              {vibe.imageUrl ? (
                                <img
                                  src={vibe.imageUrl}
                                  alt={vibe.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-xs">
                                  {vibe.title.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>

              <Badge variant="secondary" className="flex-shrink-0">
                <Hash className="mr-1 h-3 w-3" />
                tag
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ReviewResultListCard({ result }: { result: ReviewSearchResult }) {
  const usePlaceholder = !result.vibeImage;

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.vibeId }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            {/* Reviewer Avatar */}
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage
                src={result.reviewerAvatar}
                alt={result.reviewerName}
              />
              <AvatarFallback className="text-sm">
                {result.reviewerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex min-w-0 flex-1 items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-3">
                  <span className="truncate font-medium">
                    @{result.reviewerName}
                  </span>
                  <span className="text-muted-foreground flex-shrink-0 text-sm">
                    on "{result.vibeTitle}"
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-3">
                  <EmojiRatingDisplay
                    rating={{
                      emoji: result.emoji,
                      value: result.rating,
                      count: undefined,
                    }}
                    showScale={false}
                    size="sm"
                  />
                </div>

                <p className="text-muted-foreground line-clamp-1 truncate text-sm">
                  {result.reviewText}
                </p>
              </div>

              <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                {/* Vibe Image */}
                <div className="relative h-12 w-12 overflow-hidden rounded">
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

                <Badge variant="secondary">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  review
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
