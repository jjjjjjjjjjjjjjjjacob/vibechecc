import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { useVibes } from '@/queries';
import { VibeGrid } from '@/components/vibe-grid';
import { VibeCategoryRow } from '@/components/vibe-category-row';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import { HomepageSkeleton } from '@/components/ui/homepage-skeleton';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const { data: vibes, isLoading, error } = useVibes();

  if (isLoading) {
    return <HomepageSkeleton />;
  }

  if (error) {
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

  const featuredVibes = safeVibes.slice(0, 4);
  const recentVibes = safeVibes.slice(0, 8);

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
      <VibeCategoryRow title="featured vibes" vibes={featuredVibes} />

      {/* Recent Vibes */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold lowercase">recent vibes</h2>
          <Link to="/vibes" className="text-primary lowercase hover:underline">
            view all
          </Link>
        </div>
        <VibeGrid vibes={recentVibes} />
      </section>
    </div>
  );
}
