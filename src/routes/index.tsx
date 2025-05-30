import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { useVibes } from '@/queries'
import { VibeGrid } from '@/components/vibe-grid'
import { VibeCategoryRow } from '@/components/vibe-category-row'
import { CreateVibeButton } from '@/components/create-vibe-button'
import {
  SignedIn,
  SignedOut,
} from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data: vibes, isLoading, error } = useVibes()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <p>failed to load vibes. please try again later.</p>
        </div>
      </div>
    )
  }

  const safeVibes = (vibes || []).filter(vibe => {
    if (!vibe.createdBy) return false;
    if (vibe.ratings && vibe.ratings.some(rating => !rating.user)) return false;
    return true;
  });

  const featuredVibes = safeVibes.slice(0, 4);
  const recentVibes = safeVibes.slice(0, 8);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 lowercase">discover and share vibes</h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              welcome to vibecheck, where you can discover, share, and rate vibes from around the world.
            </p>
            <SignedIn>
              <CreateVibeButton variant="outline" className="bg-secondary/20 text-primary hover:bg-secondary-foreground/20" />
            </SignedIn>
            <SignedOut>
              <p className="text-lg opacity-75">sign in to start creating and sharing your own vibes!</p>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Featured Vibes */}
      <VibeCategoryRow title="featured vibes" vibes={featuredVibes} />

      {/* Recent Vibes */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold lowercase">recent vibes</h2>
          <Link 
            to="/vibes" 
            className="text-primary hover:underline lowercase"
          >
            view all
          </Link>
        </div>
        <VibeGrid vibes={recentVibes} />
      </section>
    </div>
  )
}


