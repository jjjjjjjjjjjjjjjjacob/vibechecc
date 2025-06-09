import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import {
  useVibes,
  useAllTags,
  useVibesByTag,
  useTopRatedVibes,
} from '@/queries';
import { VibeCategoryRow } from '@/components/vibe-category-row';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import { HomepageSkeleton } from '@/components/ui/homepage-skeleton';
import { VibeCategoryRowSkeleton } from '@/components/ui/vibe-category-row-skeleton';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const {
    data: vibes,
    isLoading: vibesLoading,
    error: vibesError,
  } = useVibes();
  const { data: allTags, isLoading: tagsLoading } = useAllTags();
  const { data: topRatedVibes, isLoading: topRatedLoading } =
    useTopRatedVibes(10);

  // Get vibes for the most popular tags (top 6 tags)
  const popularTags = allTags?.slice(0, 6) || [];

  if (vibesLoading) {
    return <HomepageSkeleton />;
  }

  if (vibesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load vibes. please try again later.</p>
        </div>
      </div>
    );
  }

  const safeVibes = (vibes || []).filter((vibe) => {
    if (!vibe.createdBy) return false;
    if (vibe.ratings && vibe.ratings.some((rating) => !rating.user))
      return false;
    return true;
  });

  const featuredVibes = safeVibes.slice(0, 8);
  const recentVibes = safeVibes.slice(0, 12);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 p-8 text-white md:p-12">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold lowercase md:text-5xl">
              discover and share vibes
            </h1>
            <p className="mb-6 text-lg opacity-90 md:text-xl">
              welcome to vibecheck, where you can discover, share, and rate
              vibes from around the world.
            </p>
            <SignedIn>
              <CreateVibeButton
                variant="outline"
                className="bg-secondary/20 text-primary hover:bg-secondary-foreground/20"
              />
            </SignedIn>
            <SignedOut>
              <p className="text-lg opacity-75">
                sign in to start creating and sharing your own vibes!
              </p>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Featured Vibes */}
      <VibeCategoryRow title="featured vibes" vibes={featuredVibes} priority />

      {/* Top Rated Vibes */}
      {topRatedLoading ? (
        <VibeCategoryRowSkeleton />
      ) : (
        topRatedVibes &&
        topRatedVibes.length > 0 && (
          <VibeCategoryRow title="top rated" vibes={topRatedVibes} />
        )
      )}

      {/* Recent Vibes */}
      <VibeCategoryRow title="trending now" vibes={recentVibes} />

      {/* Tag-based Categories */}
      {!tagsLoading &&
        popularTags.map((tagData) => (
          <TagBasedSection key={tagData.tag} tag={tagData.tag} />
        ))}

      {/* Show all vibes link */}
      <section className="mt-12 text-center">
        <Link
          to="/vibes"
          className="text-primary text-lg lowercase hover:underline"
        >
          explore all vibes →
        </Link>
      </section>
    </div>
  );
}

// Component for tag-based sections
function TagBasedSection({ tag }: { tag: string }) {
  const { data: tagVibes, isLoading } = useVibesByTag(tag, 10);

  if (isLoading) {
    return <VibeCategoryRowSkeleton />;
  }

  // Only show sections with at least 3 vibes for a good experience
  if (!tagVibes || tagVibes.length < 3) {
    return null;
  }

  // Capitalize tag name for better display
  const displayTitle = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();

  return <VibeCategoryRow title={`${displayTitle} vibes`} vibes={tagVibes} />;
}
