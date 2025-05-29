import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useVibe, useAddRatingMutation, useReactToVibeMutation } from '~/queries'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { StarRating } from '~/components/star-rating'
import { EmojiReactions } from '~/components/emoji-reaction'
import { SimpleVibePlaceholder } from '~/components/simple-vibe-placeholder'

export const Route = createFileRoute('/vibes/$vibeId')({
  component: VibePage,
})

function VibePage() {
  const { vibeId } = Route.useParams()
  const { data: vibe, isLoading, error } = useVibe(vibeId)
  const [rating, setRating] = React.useState(0)
  const [review, setReview] = React.useState('')
  const addRatingMutation = useAddRatingMutation()
  const reactToVibeMutation = useReactToVibeMutation()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !vibe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <p>failed to load vibe. it may not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const averageRating = vibe.ratings.length 
    ? vibe.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / vibe.ratings.length 
    : 0

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    try {
      await addRatingMutation.mutateAsync({
        vibeId: vibe.id,
        userId: 'demo-user', // Use demo user ID for now
        rating,
        review: review.trim() || undefined
      })
      setReview('')
      // We don't reset rating to allow the user to see what they rated
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  const handleReact = async (emoji: string) => {
    try {
      await reactToVibeMutation.mutateAsync({
        vibeId: vibe.id,
        emoji,
        userId: 'demo-user', // Use demo user ID for now
      })
    } catch (error) {
      console.error('Failed to react:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="overflow-hidden mb-8">
        <div className="relative">
          {vibe.image ? (
            <img 
              src={vibe.image} 
              alt={vibe.title} 
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-96">
              <SimpleVibePlaceholder title={vibe.title} />
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold lowercase">{vibe.title}</h1>
            <div className="flex items-center gap-2">
              <StarRating value={averageRating} readOnly />
              <span className="text-sm text-muted-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'} ({vibe.ratings.length})
              </span>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            {vibe.createdBy ? (
              <>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={vibe.createdBy.avatar} alt={vibe.createdBy.name} />
                  <AvatarFallback>{vibe.createdBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{vibe.createdBy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10 mr-3">
                  {/* You might want a generic placeholder avatar icon here */}
                  <AvatarFallback>??</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Unknown User</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <p className="text-foreground mb-6 whitespace-pre-line">
            {vibe.description}
          </p>
          
          {vibe.tags && vibe.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {vibe.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6 mb-6">
            <h2 className="text-xl font-bold mb-4 lowercase">reactions</h2>
            <EmojiReactions 
              reactions={vibe.reactions || []} 
              onReact={handleReact}
              showAddButton={true}
            />
          </div>

          <div className="border-t pt-6 mb-6">
            <h2 className="text-xl font-bold mb-4 lowercase">rate this vibe</h2>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <StarRating 
                  value={rating} 
                  onChange={setRating}
                  size="lg"
                />
              </div>
              
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="write your review (optional)"
                rows={4}
              />
              
              <Button
                type="submit"
                disabled={rating === 0 || addRatingMutation.isPending}
              >
                {addRatingMutation.isPending ? 'submitting...' : 'submit rating'}
              </Button>
            </form>
          </div>

          {vibe.ratings.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 lowercase">reviews</h2>
              <div className="space-y-4">
                {vibe.ratings
                  .filter((r: any) => r.review)
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((rating: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={rating.user.avatar} alt={rating.user.name} />
                          <AvatarFallback>{rating.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{rating.user.name}</p>
                          <div className="flex items-center gap-2">
                            <StarRating value={rating.rating} readOnly size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(rating.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-muted-foreground whitespace-pre-line">
                          {rating.review}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 