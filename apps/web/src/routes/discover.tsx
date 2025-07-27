import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useTopRatedEmojiVibes, 
  useVibesPaginated, 
  useTopRatedVibes,
  useTrendingEmojiRatings,
  useAllTags,
  useVibesByTag
} from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, Sparkles, Flame } from 'lucide-react';

// Skeleton for lazy-loaded components
function VibeCategoryRowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-shrink-0 w-64">
            <div className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Lazy load heavy category component
const VibeCategoryRow = lazy(() => 
  import('@/components/vibe-category-row').then(m => ({ default: m.VibeCategoryRow }))
);

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

interface EmojiCollection {
  emoji: string;
  title: string;
  description: string;
  minValue: number;
  icon?: React.ReactNode;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
}

const FEATURED_COLLECTIONS: EmojiCollection[] = [
  {
    emoji: '🔥',
    title: 'On Fire',
    description: 'Vibes rated 5 🔥 - The hottest content',
    minValue: 5,
    icon: <Flame className="h-4 w-4" />,
    ratingDisplayMode: 'top-rated',
  },
  {
    emoji: '💯',
    title: 'Perfect Score',
    description: 'Vibes rated 5 💯 - Absolutely perfect',
    minValue: 5,
    icon: <Sparkles className="h-4 w-4" />,
    ratingDisplayMode: 'top-rated',
  },
  {
    emoji: '😍',
    title: 'Love It',
    description: 'Vibes rated 4+ 😍 - Crowd favorites',
    minValue: 4,
    icon: <TrendingUp className="h-4 w-4" />,
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
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold lowercase">
          discover vibes by emoji
        </h1>
        <p className="text-muted-foreground">
          explore curated collections based on emoji ratings
        </p>
      </div>

      {/* Featured Collections Grid */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold lowercase">
          featured collections
        </h2>
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
                        <CardTitle className="text-lg lowercase">
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

      {/* Trending Section */}
      <TrendingSection />

      {/* Recent Arrivals Section */}
      <RecentArrivalsSection />

      {/* Community Favorites Section */}
      <CommunityFavoritesSection />

      {/* Popular Tags Section */}
      <PopularTagsSection />

      {/* Top Rated Collections with VibeCategoryRow */}
      <section>
        {FEATURED_COLLECTIONS.slice(0, 4).map((collection) => (
          <EmojiCollectionSection
            key={collection.emoji}
            collection={collection}
          />
        ))}
      </section>
    </div>
  );
}

// Component to show thumbnail previews of vibes for a collection
function EmojiCollectionPreview({
  emoji,
  minValue,
}: {
  emoji: string;
  minValue: number;
}) {
  const { data: vibes, isLoading } = useTopRatedEmojiVibes(emoji, minValue, 3);

  if (isLoading) {
    return (
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">
        no vibes yet
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {vibes.slice(0, 3).map((vibe, index) => (
          <div
            key={vibe.id}
            className="h-8 w-8 overflow-hidden rounded border"
            style={{ zIndex: 3 - index }}
          >
            {vibe.image ? (
              <img
                src={vibe.image}
                alt={vibe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center text-xs">
                {vibe.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="text-muted-foreground text-xs">
        {vibes.length} vibe{vibes.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// Component for emoji collection sections using VibeCategoryRow
function EmojiCollectionSection({
  collection,
}: {
  collection: EmojiCollection;
}) {
  const { data: vibes, isLoading } = useTopRatedEmojiVibes(
    collection.emoji,
    collection.minValue,
    10
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-64 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return null;
  }

  const sectionTitle = `${collection.emoji} ${collection.title.toLowerCase()}`;

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
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
          view all →
        </Link>
      </div>
      <Suspense fallback={<VibeCategoryRowSkeleton />}>
        <VibeCategoryRow
          title={sectionTitle}
          vibes={vibes}
          ratingDisplayMode={collection.ratingDisplayMode || 'most-rated'}
        />
      </Suspense>
    </div>
  );
}

// Trending Section Component
function TrendingSection() {
  const { data: vibes, isLoading } = useVibesPaginated(12);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (!vibes?.vibes || vibes.vibes.length === 0) {
    return null;
  }

  // Get the most recent vibes as "trending"
  const trendingVibes = vibes.vibes.slice(0, 10);

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title="🔥 trending now"
        vibes={trendingVibes}
        priority
        ratingDisplayMode="most-rated"
      />
    </Suspense>
  );
}

// Recent Arrivals Section Component
function RecentArrivalsSection() {
  const { data: vibes, isLoading } = useVibesPaginated(10);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (!vibes?.vibes || vibes.vibes.length === 0) {
    return null;
  }

  const recentVibes = vibes.vibes.slice(0, 8);

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title="✨ fresh arrivals"
        vibes={recentVibes}
        ratingDisplayMode="most-rated"
      />
    </Suspense>
  );
}

// Community Favorites Section Component
function CommunityFavoritesSection() {
  const { data: topRatedVibes, isLoading } = useTopRatedVibes(10);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (!topRatedVibes || topRatedVibes.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title="❤️ community favorites"
        vibes={topRatedVibes}
        ratingDisplayMode="top-rated"
      />
    </Suspense>
  );
}

// Popular Tags Section Component
function PopularTagsSection() {
  const { data: allTags, isLoading: tagsLoading } = useAllTags();

  if (tagsLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (!allTags || allTags.length === 0) {
    return null;
  }

  // Get the most popular tag
  const popularTag = allTags[0];

  return <PopularTagVibes tag={popularTag.tag} />;
}

// Component for vibes from popular tags
function PopularTagVibes({ tag }: { tag: string }) {
  const { data: tagVibes, isLoading } = useVibesByTag(tag, 10);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (!tagVibes || tagVibes.length < 3) {
    return null;
  }

  const displayTitle = `#${tag}`;

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title={displayTitle}
        vibes={tagVibes}
        ratingDisplayMode="most-rated"
      />
    </Suspense>
  );
}
