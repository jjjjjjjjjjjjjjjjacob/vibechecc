import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import {
  EmojiRatingDisplay,
  TopEmojiRatings,
} from '@/components/emoji-rating-display';
import { api } from '@viberater/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import type {
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ReviewSearchResult,
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
  queriedEmojis,
}: {
  result: VibeSearchResult;
  queriedEmojis?: string[];
}) {
  const usePlaceholder = !result.image;

  // Fetch emoji ratings for this vibe
  const emojiRatingsQuery = useQuery({
    ...convexQuery(api.emojiRatings.getTopEmojiRatings, { vibeId: result.id }),
    enabled: !!result.id,
  });

  const rawEmojiData = emojiRatingsQuery.data || [];
  const emojiRatings = rawEmojiData.map((data) => ({
    emoji: data.emoji,
    value: data.averageValue,
    count: data.count,
  }));

  // Prioritize queried emojis
  const prioritizedRatings =
    queriedEmojis && queriedEmojis.length > 0
      ? [
          ...emojiRatings.filter((rating) =>
            queriedEmojis.includes(rating.emoji)
          ),
          ...emojiRatings.filter(
            (rating) => !queriedEmojis.includes(rating.emoji)
          ),
        ]
      : emojiRatings;

  const displayRatings = prioritizedRatings.slice(0, 5);

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.id }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            {/* Image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              {usePlaceholder ? (
                <SimpleVibePlaceholder title={result.title} />
              ) : (
                <img
                  src={result.image}
                  alt={result.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="line-clamp-1 text-base font-semibold truncate">
                    {result.title}
                  </h3>
                  {result.createdBy && (
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      @{result.createdBy.name}
                    </span>
                  )}
                </div>

                {result.description && (
                  <p className="line-clamp-1 text-sm text-muted-foreground truncate">
                    {result.description}
                  </p>
                )}

                {/* Bottom row with ratings and tags */}
                <div className="mt-2 flex items-center gap-3">
                  {/* Emoji Ratings */}
                  {prioritizedRatings.length > 0 ? (
                    <TopEmojiRatings
                      emojiRatings={displayRatings.slice(0, 3)}
                      expanded={false}
                      vibeId={result.id}
                      size="sm"
                      orientation="horizontal"
                    />
                  ) : result.rating ? (
                    <Badge variant="secondary" className="text-xs">
                      ★ {result.rating.toFixed(1)} ({result.ratingCount})
                    </Badge>
                  ) : null}

                  {/* Tags */}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {result.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function UserResultListCard({ result }: { result: UserSearchResult }) {
  // Fetch user's top vibes for thumbnails
  const userVibesQuery = useQuery({
    ...convexQuery(api.vibes.getUserVibes, { 
      username: result.username,
      paginationOpts: { numItems: 3, cursor: null }
    }),
    enabled: !!result.username,
  });

  const topVibes = userVibesQuery.data?.page || [];

  return (
    <Link to="/users/$username" params={{ username: result.username }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={result.image} />
              <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
            </Avatar>

            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold truncate">{result.title}</h3>
                  <span className="text-sm text-muted-foreground flex-shrink-0">@{result.username}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{result.vibeCount || 0} vibes</span>
                  <span>{result.followerCount || 0} followers</span>
                  
                  {/* Recent vibes thumbnails */}
                  {topVibes.length > 0 && (
                    <div className="flex gap-1 ml-2">
                      {topVibes.slice(0, 3).map((vibe) => (
                        <div key={vibe._id} className="relative h-6 w-6 overflow-hidden rounded">
                          {vibe.imageUrl ? (
                            <img
                              src={vibe.imageUrl}
                              alt={vibe.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs text-primary">
                              {vibe.title.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
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
    ...convexQuery(api.vibes.getVibesByTag, { 
      tag: result.title,
      limit: 3
    }),
    enabled: !!result.title,
  });

  const topVibes = tagVibesQuery.data || [];

  return (
    <Link to="/search" search={{ tags: [result.title] }}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Hash className="h-8 w-8 text-primary" />
            </div>

            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold truncate">#{result.title}</h3>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {result.count} {result.count === 1 ? 'vibe' : 'vibes'}
                  </span>
                </div>

                {/* Top vibes thumbnails */}
                {topVibes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">top vibes:</span>
                    <div className="flex gap-1">
                      {topVibes.slice(0, 3).map((vibe) => (
                        <div key={vibe._id} className="relative h-6 w-6 overflow-hidden rounded">
                          {vibe.imageUrl ? (
                            <img
                              src={vibe.imageUrl}
                              alt={vibe.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs text-primary">
                              {vibe.title.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
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
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium truncate">@{result.reviewerName}</span>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    on "{result.vibeTitle}"
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
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

                <p className="line-clamp-1 text-sm text-muted-foreground truncate">
                  {result.reviewText}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
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