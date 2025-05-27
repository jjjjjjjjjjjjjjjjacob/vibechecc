import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useVibes } from '~/queries'
import { VibeGrid } from '~/components/vibe-grid'

export const Route = createFileRoute('/vibes/')({
  component: AllVibes,
})

function AllVibes() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 lowercase">all vibes</h1>
        <p className="text-muted-foreground">
          discover and explore all vibes shared by our community.
        </p>
      </div>

      <VibeGrid vibes={vibes || []} />
    </div>
  )
}

 