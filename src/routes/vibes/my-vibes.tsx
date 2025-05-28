import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { useUserVibes } from '~/queries'
import { VibeGrid } from '~/components/vibe-grid'
import { CreateVibeButton } from '~/components/create-vibe-button'

export const Route = createFileRoute('/vibes/my-vibes')({
  component: MyVibes,
})

function MyVibes() {
  // Using demo user for now
  const { data: vibes, isLoading, error } = useUserVibes('demo-user')

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
          <p>failed to load your vibes. please try again later.</p>
        </div>
      </div>
    )
  }

  if (!vibes || vibes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4 lowercase">my vibes</h1>
          <p className="text-muted-foreground mb-6">
            you haven't created any vibes yet.
          </p>
          <CreateVibeButton />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 lowercase">my vibes</h1>
          <p className="text-muted-foreground">
            vibes you've created ({vibes.length})
          </p>
        </div>
        <CreateVibeButton />
      </div>

      <VibeGrid vibes={vibes} />
    </div>
  )
}

 