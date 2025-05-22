import { Header } from "@/components/header"
import { VibeGrid } from "@/components/vibe-grid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sampleVibes, currentUser } from "@/lib/sample-data"
import { CreateVibeButton } from "@/components/create-vibe-button"

export default function MyVibes() {
  const createdVibes = sampleVibes.filter((vibe) => vibe.createdBy.id === currentUser.id)
  const ratedVibes = sampleVibes.filter((vibe) => vibe.ratings.some((rating) => rating.user.id === currentUser.id))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Vibes</h1>
          <CreateVibeButton />
        </div>
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="created">Created</TabsTrigger>
            <TabsTrigger value="rated">Rated</TabsTrigger>
          </TabsList>
          <TabsContent value="created" className="mt-0">
            {createdVibes.length > 0 ? (
              <VibeGrid vibes={createdVibes} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">You haven't created any vibes yet</h3>
                <p className="text-muted-foreground mb-4">Share your experiences with the world!</p>
                <CreateVibeButton variant="default" />
              </div>
            )}
          </TabsContent>
          <TabsContent value="rated" className="mt-0">
            {ratedVibes.length > 0 ? (
              <VibeGrid vibes={ratedVibes} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">You haven't rated any vibes yet</h3>
                <p className="text-muted-foreground">Explore and rate some vibes to see them here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
