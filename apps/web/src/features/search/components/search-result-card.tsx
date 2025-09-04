import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import {
  EmojiRatingDisplay,
  TopEmojiRatings,
} from '@/features/ratings/components/emoji-rating-display';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import type {
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ReviewSearchResult,
} from '@vibechecc/types';

interface SearchResultCardProps {
  result: SearchResult;
  queriedEmojis?: string[]; // Pass queried emojis to prioritize in display
}

export function SearchResultCard({
  result,
  queriedEmojis,
}: SearchResultCardProps) {
  if (result.type === 'vibe') {
    return (
      <VibeResultCard
        result={result as VibeSearchResult}
        queriedEmojis={queriedEmojis}
      />
    );
  }

  if (result.type === 'user') {
    return <UserResultCard result={result as UserSearchResult} />;
  }

  if (result.type === 'tag') {
    return <TagResultCard result={result as TagSearchResult} />;
  }

  if (result.type === 'review') {
    return <ReviewResultCard result={result as ReviewSearchResult} />;
  }

  return null;
}

function VibeResultCard({
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

  // Convert to EmojiRating format
  const emojiRatings = rawEmojiData.map((data) => ({
    emoji: data.emoji,
    value: data.averageValue,
    count: data.count,
  }));

  // Prioritize queried emojis - move them to the front
  const prioritizedRatings =
    queriedEmojis && queriedEmojis.length > 0
      ? [
          // First, show queried emojis if they exist
          ...emojiRatings.filter((rating) =>
            queriedEmojis.includes(rating.emoji)
          ),
          // Then show other emojis
          ...emojiRatings.filter(
            (rating) => !queriedEmojis.includes(rating.emoji)
          ),
        ]
      : emojiRatings;

  // Determine how many ratings to show based on emoji filters
  const maxRatingsToShow =
    queriedEmojis && queriedEmojis.length > 0
      ? Math.min(queriedEmojis.length, 3)
      : 3;

  const displayRatings = prioritizedRatings.slice(0, maxRatingsToShow);

  return (
    <Card className="relative h-full overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Creator Avatar - positioned absolutely in upper left corner */}
      {result.createdBy && (
        <div className="absolute top-2 left-2 z-10">
          <Avatar className="h-6 w-6 shadow-md">
            <AvatarImage
              src={result.createdBy.avatar}
              alt={result.createdBy.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-background/50 border-none text-xs">
              {result.createdBy.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="block h-full">
        <Link to="/vibes/$vibeId" params={{ vibeId: result.id }}>
          <div className="relative">
            <div className="relative aspect-video overflow-hidden">
              {usePlaceholder ? (
                <SimpleVibePlaceholder title={result.title} />
              ) : (
                <img
                  src={result.image}
                  alt={result.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              )}
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="line-clamp-1 text-lg font-bold">{result.title}</h3>

            {result.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {result.description}
              </p>
            )}
          </CardContent>
        </Link>

        <CardFooter className="flex flex-col items-start gap-3 p-4 pt-0">
          {/* Emoji Ratings Display - Show emoji ratings if available, fallback to generic rating */}
          {prioritizedRatings.length > 0 ? (
            <div className="w-full">
              <TopEmojiRatings
                emojiRatings={displayRatings}
                expanded={true}
                vibeId={result.id}
                className="space-y-1"
                size="sm"
              />
            </div>
          ) : result.rating ? (
            <div className="w-full">
              <div className="bg-secondary/50 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium">
                <span>{result.rating.toFixed(1)}</span>
                {result.ratingCount && (
                  <span className="text-muted-foreground">
                    ({result.ratingCount} reviews)
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </CardFooter>
      </div>
    </Card>
  );
}

function UserResultCard({ result }: { result: UserSearchResult }) {
  return (
    <Link to="/users/$username" params={{ username: result.username }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col items-center space-y-4 p-6 text-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={result.image} />
            <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-lg font-semibold">{result.title}</h3>
            <p className="text-muted-foreground text-sm">@{result.username}</p>
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <p className="font-semibold">{result.vibeCount}</p>
              <p className="text-muted-foreground">Vibes</p>
            </div>
            <div>
              <p className="font-semibold">{result.followerCount || 0}</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
          </div>

          <Badge variant="secondary">USER</Badge>
        </div>
      </Card>
    </Link>
  );
}

function TagResultCard({ result }: { result: TagSearchResult }) {
  return (
    <Link to="/search" search={{ tags: [result.title] }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="flex flex-col items-center space-y-4 p-6 text-center">
          <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-3xl">#</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold">#{result.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {result.count} {result.count === 1 ? 'vibe' : 'vibes'}
            </p>
          </div>

          <Badge variant="secondary">TAG</Badge>
        </div>
      </Card>
    </Link>
  );
}

function ReviewResultCard({ result }: { result: ReviewSearchResult }) {
  const usePlaceholder = !result.vibeImage;

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: result.vibeId }}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {/* Header with reviewer info and emoji rating */}
              <div className="mb-2 flex items-start gap-2">
                {/* Reviewer Avatar */}
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={result.reviewerAvatar}
                    alt={result.reviewerName}
                  />
                  <AvatarFallback>
                    {result.reviewerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {/* Reviewer name and emoji rating on same line */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      @{result.reviewerName}
                    </span>
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
                  <p className="text-muted-foreground text-xs">
                    on "{result.vibeTitle}"
                  </p>
                </div>
              </div>

              {/* Review Text */}
              <p className="line-clamp-3 text-sm">{result.reviewText}</p>
            </div>

            {/* Vibe Image on the right */}
            <div className="w-20 flex-shrink-0">
              <div className="relative aspect-square overflow-hidden rounded-md">
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
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Badge variant="secondary" className="text-xs">
            REVIEW
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
