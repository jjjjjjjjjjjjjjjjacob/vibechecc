import { Header } from "@/components/header"
import { VibeGrid } from "@/components/vibe-grid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sampleVibes, currentUser } from "@/lib/sample-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Profile() {
  const createdVibes = sampleVibes.filter((vibe) => vibe.createdBy.id === currentUser.id)
  const ratedVibes = sampleVibes.filter((vibe) => vibe.ratings.some((rating) => rating.user.id === currentUser.id))

  // Calculate stats
  const totalCreated = createdVibes.length
  const totalRated = ratedVibes.length
  const averageRating =
    ratedVibes.length > 0
      ? ratedVibes.reduce((sum, vibe) => {
          const userRating = vibe.ratings.find((r) => r.user.id === currentUser.id)?.rating || 0
          return sum + userRating
        }, 0) / ratedVibes.length
      : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                    <p className="text-muted-foreground">
                      Member since {new Date(currentUser.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Vibe Connoisseur</Badge>
                  <Badge variant="secondary">Trend Setter</Badge>
                  <Badge variant="secondary">Early Adopter</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold">{totalCreated}</div>
                    <div className="text-sm text-muted-foreground">Vibes Created</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold">{totalRated}</div>
                    <div className="text-sm text-muted-foreground">Vibes Rated</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="created">Vibes I Created</TabsTrigger>
            <TabsTrigger value="rated">Vibes I've Rated</TabsTrigger>
          </TabsList>
          <TabsContent value="created" className="mt-0">
            {createdVibes.length > 0 ? (
              <VibeGrid vibes={createdVibes} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">You haven't created any vibes yet</h3>
                <p className="text-muted-foreground">Share your experiences with the world!</p>
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
