import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useMemo } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useTopRatedEmojiVibes,
  useVibesPaginated,
  useVibesPaginatedInfinite,
  useTopRatedVibes,
  useTopRatedVibesInfinite,
  useAllTags,
  useVibesByTag,
  useCurrentUser,
} from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { VibeCard } from '@/features/vibes/components/vibe-card';

// Skeleton for lazy-loaded components
function VibeCategoryRowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="bg-background/90 w-64 flex-shrink-0 border-none shadow-lg backdrop-blur"
          >
            <div className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
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
  import('@/components/vibe-category-row').then((m) => ({
    default: m.VibeCategoryRow,
  }))
);

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

interface EmojiCollection {
  id: string;
  emoji: string;
  title: string;
  description: string;
  minValue: number;
  icon?: React.ReactNode;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
}

const FEATURED_COLLECTIONS: EmojiCollection[] = [
  {
    id: 'on-fire',
    emoji: '🔥',
    title: 'On Fire',
    description: 'Vibes rated 5 🔥 - The hottest content',
    minValue: 5,
    icon: <Flame className="h-4 w-4" />,
    ratingDisplayMode: 'top-rated',
  },
  {
    id: 'perfect-score',
    emoji: '💯',
    title: 'Perfect Score',
    description: 'Vibes rated 5 💯 - Absolutely perfect',
    minValue: 5,
    icon: <Sparkles className="h-4 w-4" />,
    ratingDisplayMode: 'top-rated',
  },
  {
    id: 'love-it',
    emoji: '😍',
    title: 'Love It',
    description: 'Vibes rated 4+ 😍 - Crowd favorites',
    minValue: 4,
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: 'mind-blown',
    emoji: '😱',
    title: 'Mind Blown',
    description: 'Vibes rated 4+ 😱 - Shocking content',
    minValue: 4,
  },
  {
    id: 'star-struck',
    emoji: '🤩',
    title: 'Star Struck',
    description: 'Vibes rated 4+ 🤩 - Amazing finds',
    minValue: 4,
  },
  {
    id: 'hilarious',
    emoji: '😂',
    title: 'Hilarious',
    description: 'Vibes rated 4+ 😂 - Comedy gold',
    minValue: 4,
  },
];

function DiscoverPage() {
  // Get current user's theme
  const { data: currentUser } = useCurrentUser();
  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  // Apply user's color themes when user data changes
  React.useEffect(() => {
    if (currentUser) {
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      setColorTheme(`${primaryColor}-primary` as any);
      setSecondaryColorTheme(`${secondaryColor}-secondary` as any);
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="from-theme-primary to-theme-secondary mb-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
            discover vibes by emoji
          </h1>
          <p className="text-muted-foreground drop-shadow-sm">
            explore curated collections based on emoji ratings
          </p>
        </div>

        {/* Featured Collections Grid */}
        <section className="mb-12">
          <h2 className="from-theme-primary to-theme-secondary mb-6 bg-gradient-to-r bg-clip-text text-2xl font-semibold text-transparent lowercase">
            featured collections
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {FEATURED_COLLECTIONS.map((collection) => (
              <FeaturedCollectionVibeList
                key={collection.emoji}
                collection={collection}
              />
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
      <div className="flex items-center gap-2">
        <Skeleton className="h-16 w-16 rounded" />
        <Skeleton className="h-16 w-16 rounded" />
        <Skeleton className="h-16 w-16 rounded" />
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-muted-foreground text-xs">no vibes yet</span>
      </div>
    );
  }

  // Show mini preview images or emoji counts
  return (
    <div className="flex items-center gap-1">
      {vibes.slice(0, 3).map((vibe, index) => (
        <div
          key={vibe.id}
          className="relative h-16 w-16 overflow-hidden rounded bg-muted/50"
          style={{ zIndex: 3 - index }}
        >
          {vibe.image ? (
            <img
              src={vibe.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              <span className="font-noto-color text-2xl opacity-50">{emoji}</span>
            </div>
          )}
        </div>
      ))}
      {vibes.length > 3 && (
        <span className="text-muted-foreground text-xs">+{vibes.length - 3}</span>
      )}
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
        <VibeCategoryRowSkeleton />
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return null;
  }

  const sectionTitle = `${collection.emoji} ${collection.title.toLowerCase()}`;

  return (
    <div className="relative mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1 border-[hsl(var(--theme-primary))]/20 bg-[hsl(var(--theme-primary))]/10 text-[hsl(var(--theme-primary))]"
          >
            <span className="font-noto-color">{collection.emoji}</span>
            {collection.minValue}+ rating
          </Badge>
        </div>
        <Link
          to="/search"
          search={{
            emojiFilter: [collection.emoji],
            emojiMinValue: collection.minValue,
            tab: 'vibes',
            sort: collection.ratingDisplayMode === 'top-rated' ? 'top_rated' : 'most_rated',
          }}
          className="text-muted-foreground text-sm font-medium transition-colors hover:text-[hsl(var(--theme-primary))]"
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
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useVibesPaginatedInfinite(12);

  const trendingVibes = useMemo(() => {
    if (!data?.pages) return [];
    // Flatten all pages to show all trending vibes
    return data.pages.flatMap(page => page?.vibes || []);
  }, [data]);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (trendingVibes.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title={
          <p>
            <span className="font-noto-color">🔥</span> trending now
          </p>
        }
        vibes={trendingVibes}
        priority
        ratingDisplayMode="most-rated"
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </Suspense>
  );
}

// Recent Arrivals Section Component
function RecentArrivalsSection() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useVibesPaginatedInfinite(10);

  const recentVibes = useMemo(() => {
    if (!data?.pages) return [];
    // Flatten all pages to show all recent vibes
    return data.pages.flatMap(page => page?.vibes || []);
  }, [data]);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (recentVibes.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title={
          <p>
            <span className="font-noto-color">✨</span> fresh arrivals
          </p>
        }
        vibes={recentVibes}
        ratingDisplayMode="most-rated"
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </Suspense>
  );
}

// Community Favorites Section Component
function CommunityFavoritesSection() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useTopRatedVibesInfinite(10);

  const topRatedVibes = useMemo(() => {
    if (!data?.pages) return [];
    // Flatten all pages and get top-rated vibes
    return data.pages.flatMap(page => page?.vibes || []);
  }, [data]);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  if (topRatedVibes.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title={
          <p>
            <span className="font-noto-color">❤️</span> community favorites
          </p>
        }
        vibes={topRatedVibes}
        ratingDisplayMode="top-rated"
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
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

// Component for featured collection vibe list
function FeaturedCollectionVibeList({
  collection,
}: {
  collection: EmojiCollection;
}) {
  const { data: vibes, isLoading } = useTopRatedEmojiVibes(
    collection.emoji,
    collection.minValue,
    3 // Get top 3 vibes for each collection
  );

  if (isLoading) {
    return (
      <Card className="bg-background/90 border-none shadow-lg backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/90 border-none shadow-lg backdrop-blur hover:shadow-xl transition-all duration-300">
      <Link
        to="/search"
        search={{
          emojiFilter: [collection.emoji],
          emojiMinValue: collection.minValue,
          tab: 'vibes',
          sort: collection.ratingDisplayMode === 'top-rated' ? 'top_rated' : 'most_rated',
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="font-noto-color text-4xl drop-shadow-[0_2px_5px_var(--color-slate-500)]">
                {collection.emoji}
              </span>
              <div>
                <CardTitle className="text-lg font-semibold lowercase">
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
      </Link>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {!vibes || vibes.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              no vibes yet
            </div>
          ) : (
            vibes.map((vibe) => (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                variant="list"
                ratingDisplayMode={collection.ratingDisplayMode || 'most-rated'}
              />
            ))
          )}
        </div>
        <Link
          to="/search"
          search={{
            emojiFilter: [collection.emoji],
            emojiMinValue: collection.minValue,
            tab: 'vibes',
            sort: collection.ratingDisplayMode === 'top-rated' ? 'top_rated' : 'most_rated',
          }}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[hsl(var(--theme-primary))] transition-colors"
        >
          view all {collection.emoji} vibes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
