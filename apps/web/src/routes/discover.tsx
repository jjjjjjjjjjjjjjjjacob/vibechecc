import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTopRatedEmojiVibes, useEmojiMetadata } from '@/queries';
import { VibeGrid } from '@/components/vibe-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, Sparkles, Flame } from 'lucide-react';

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

interface EmojiCollection {
  emoji: string;
  title: string;
  description: string;
  minValue: number;
  icon?: React.ReactNode;
}

const FEATURED_COLLECTIONS: EmojiCollection[] = [
  {
    emoji: '🔥',
    title: 'On Fire',
    description: 'Vibes rated 5 🔥 - The hottest content',
    minValue: 5,
    icon: <Flame className="h-4 w-4" />,
  },
  {
    emoji: '😍',
    title: 'Love It',
    description: 'Vibes rated 4+ 😍 - Crowd favorites',
    minValue: 4,
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    emoji: '💯',
    title: 'Perfect Score',
    description: 'Vibes rated 5 💯 - Absolutely perfect',
    minValue: 5,
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    emoji: '😱',
    title: 'Mind Blown',
    description: 'Vibes rated 4+ 😱 - Shocking content',
    minValue: 4,
  },
  {
    emoji: '🤩',
    title: 'Star Struck',
    description: 'Vibes rated 4+ 🤩 - Amazing finds',
    minValue: 4,
  },
  {
    emoji: '😂',
    title: 'Hilarious',
    description: 'Vibes rated 4+ 😂 - Comedy gold',
    minValue: 4,
  },
];

function DiscoverPage() {
  const { data: emojiMetadata, isLoading: metadataLoading } =
    useEmojiMetadata();

  // Get popular emojis from metadata (take first 8)
  const popularEmojis = emojiMetadata?.slice(0, 8).map((m) => m.emoji) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Discover Vibes by Emoji</h1>
        <p className="text-muted-foreground">
          Explore curated collections based on emoji ratings
        </p>
      </div>

      {/* Featured Collections */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">Featured Collections</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_COLLECTIONS.map((collection) => (
            <Link
              key={collection.emoji}
              to="/search"
              search={{
                emojiFilter: [collection.emoji],
                emojiMinValue: collection.minValue,
                sort: 'rating_desc',
              }}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{collection.emoji}</span>
                      <div>
                        <CardTitle className="text-lg">
                          {collection.title}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {collection.description}
                        </p>
                      </div>
                    </div>
                    {collection.icon && (
                      <div className="text-muted-foreground">
                        {collection.icon}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <EmojiCollectionPreview
                      emoji={collection.emoji}
                      minValue={collection.minValue}
                    />
                    <ArrowRight className="text-muted-foreground h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Emoji Ratings */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          Browse by Popular Emojis
        </h2>
        {metadataLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularEmojis.map((emoji) => (
              <Link
                key={emoji}
                to="/search"
                search={{
                  emojiFilter: [emoji],
                  sort: 'rating_desc',
                }}
              >
                <Card className="hover:bg-secondary/50 flex h-20 items-center justify-center transition-colors">
                  <span className="text-3xl">{emoji}</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Rated by Emoji */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold">Top Rated Vibes</h2>
        <div className="space-y-8">
          {FEATURED_COLLECTIONS.slice(0, 3).map((collection) => (
            <div key={collection.emoji}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{collection.emoji}</span>
                  <h3 className="text-lg font-medium">{collection.title}</h3>
                  <Badge variant="secondary">
                    {collection.minValue}+ rating
                  </Badge>
                </div>
                <Link
                  to="/search"
                  search={{
                    emojiFilter: [collection.emoji],
                    emojiMinValue: collection.minValue,
                    sort: 'rating_desc',
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  View all →
                </Link>
              </div>
              <TopRatedVibesPreview
                emoji={collection.emoji}
                minValue={collection.minValue}
                limit={4}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Component to show a preview of vibes for a collection
function EmojiCollectionPreview({
  emoji,
  minValue,
}: {
  emoji: string;
  minValue: number;
}) {
  const { data, isLoading } = useTopRatedEmojiVibes(emoji, minValue, 3);

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  const count = data?.length || 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">
        {count > 0 ? `${count}+ vibes` : 'No vibes yet'}
      </span>
    </div>
  );
}

// Component to show top-rated vibes preview
function TopRatedVibesPreview({
  emoji,
  minValue,
  limit = 4,
}: {
  emoji: string;
  minValue: number;
  limit?: number;
}) {
  const { data: vibes, isLoading } = useTopRatedEmojiVibes(
    emoji,
    minValue,
    limit
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(limit)].map((_, i) => (
          <Skeleton key={i} className="aspect-video" />
        ))}
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">No vibes found</p>
        </CardContent>
      </Card>
    );
  }

  return <VibeGrid vibes={vibes} />;
}
