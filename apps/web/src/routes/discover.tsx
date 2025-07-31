import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useMemo } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useTopRatedEmojiVibes,
  useVibesPaginated,
  useTopRatedVibes,
  useAllTags,
  useVibesByTag,
  useCurrentUser,
} from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, Sparkles, Flame } from 'lucide-react';
import {
  useTheme,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/components/theme-provider';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { DiscoverSectionWrapper } from '@/components/discover-section-wrapper';

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

      setColorTheme(`${primaryColor}-primary` as PrimaryColorTheme);
      setSecondaryColorTheme(
        `${secondaryColor}-secondary` as SecondaryColorTheme
      );
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="from-theme-primary to-theme-secondary mb-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
            discover all the vibes
          </h1>
          <p className="text-muted-foreground drop-shadow-sm">
            explore curated collections based on emoji ratings
          </p>
        </div>

        {/* Featured Collections Grid */}
        <section className="mb-12">
          <h2 className="text-primary mb-6 text-2xl font-semibold lowercase">
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

        {/* New Section */}
        <NewSection />

        {/* Trending Section */}
        <TrendingSection />

        {/* Recent Arrivals Section */}
        <RecentArrivalsSection />

        {/* Unrated Section */}
        <UnratedSection />

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
            sort:
              collection.ratingDisplayMode === 'top-rated'
                ? 'top_rated'
                : 'most_rated',
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

// New Section Component
function NewSection() {
  const { data, isLoading, error } = useVibesPaginated(15);

  const newVibes = data?.vibes || [];

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-noto-color">🆕</span> new vibes
        </>
      }
      vibes={newVibes}
      isLoading={isLoading}
      error={error}
      priority
      ratingDisplayMode="most-rated"
    />
  );
}

// Trending Section Component
function TrendingSection() {
  const { data, isLoading, error } = useVibesPaginated(20);

  const trendingVibes = useMemo(() => {
    if (!data?.vibes) return [];
    // Filter for vibes with good engagement (rating count >= 3) and limit to 12
    return data.vibes.filter((vibe) => vibe.ratings?.length >= 3).slice(0, 12);
  }, [data]);

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-noto-color">🔥</span> trending now
        </>
      }
      vibes={trendingVibes}
      isLoading={isLoading}
      error={error}
      priority
      ratingDisplayMode="most-rated"
    />
  );
}

// Recent Arrivals Section Component
function RecentArrivalsSection() {
  const { data, isLoading, error } = useVibesPaginated(20);

  const recentVibes = useMemo(() => {
    if (!data?.vibes) return [];
    // Show vibes created in the last 7 days, limit to 10
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return data.vibes
      .filter((vibe) => {
        const vibeDate = new Date(vibe.createdAt);
        return vibeDate >= sevenDaysAgo;
      })
      .slice(0, 10);
  }, [data]);

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-noto-color">✨</span> fresh arrivals
        </>
      }
      vibes={recentVibes}
      isLoading={isLoading}
      error={error}
      ratingDisplayMode="most-rated"
    />
  );
}

// Unrated Section Component
function UnratedSection() {
  const { data, isLoading, error } = useVibesPaginated(30);

  const unratedVibes = useMemo(() => {
    if (!data?.vibes) return [];
    // Filter for unrated vibes and limit to 10
    return data.vibes
      .filter((v) => !v.ratings || v.ratings.length === 0)
      .slice(0, 10);
  }, [data]);

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-noto-color">👀</span> needs love
        </>
      }
      vibes={unratedVibes}
      isLoading={isLoading}
      error={error}
      ratingDisplayMode="most-rated"
    />
  );
}

// Community Favorites Section Component
function CommunityFavoritesSection() {
  const { data, isLoading, error } = useTopRatedVibes(10);

  const topRatedVibes = data?.vibes || [];

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-noto-color">❤️</span> community favorites
        </>
      }
      vibes={topRatedVibes}
      isLoading={isLoading}
      error={error}
      ratingDisplayMode="top-rated"
    />
  );
}

// Popular Tags Section Component
function PopularTagsSection() {
  const {
    data: allTags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useAllTags();

  // Get the most popular tag
  const popularTag = allTags?.[0];

  if (tagsLoading) {
    return (
      <DiscoverSectionWrapper
        title="popular tags"
        vibes={undefined}
        isLoading={true}
        error={null}
      />
    );
  }

  if (tagsError) {
    return (
      <DiscoverSectionWrapper
        title="popular tags"
        vibes={undefined}
        isLoading={false}
        error={tagsError}
      />
    );
  }

  if (!popularTag) {
    return (
      <DiscoverSectionWrapper
        title="popular tags"
        vibes={[]}
        isLoading={false}
        error={null}
      />
    );
  }

  return <PopularTagVibes tag={popularTag.tag} />;
}

// Component for vibes from popular tags
function PopularTagVibes({ tag }: { tag: string }) {
  const { data: tagVibes, isLoading, error } = useVibesByTag(tag, 10);

  const displayTitle = `#${tag}`;

  return (
    <DiscoverSectionWrapper
      title={displayTitle}
      vibes={tagVibes}
      isLoading={isLoading}
      error={error}
      ratingDisplayMode="most-rated"
      hideWhenEmpty={false} // Always show popular tags section
    />
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
              <Skeleton className="mb-1 h-5 w-32" />
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
    <Card className="bg-background/90 border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl">
      <Link
        to="/search"
        search={{
          emojiFilter: [collection.emoji],
          emojiMinValue: collection.minValue,
          tab: 'vibes',
          sort:
            collection.ratingDisplayMode === 'top-rated'
              ? 'top_rated'
              : 'most_rated',
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
              <div className="text-muted-foreground">{collection.icon}</div>
            )}
          </div>
        </CardHeader>
      </Link>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {!vibes || vibes.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
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
            sort:
              collection.ratingDisplayMode === 'top-rated'
                ? 'top_rated'
                : 'most_rated',
          }}
          className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-sm transition-colors hover:text-[hsl(var(--theme-primary))]"
        >
          view all {collection.emoji} vibes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
