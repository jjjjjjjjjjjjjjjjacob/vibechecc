"use client"

import { Header } from "@/components/header"
import { StarRating } from "@/components/star-rating"
import { sampleVibes, currentUser } from "@/lib/sample-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VibeCard } from "@/components/vibe-card"
import { Badge } from "@/components/ui/badge"
import { Share, Bookmark, Flag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SimpleVibePlaceholder } from "@/components/simple-vibe-placeholder"
import { EmojiReactions } from "@/components/emoji-reaction"
import type { EmojiReaction } from "@/lib/types"

export default function VibePage() {
  const params = useParams()
  const id = params.id as string

  // Find the vibe from sample data
  const vibe = sampleVibes.find((v) => v.id === id)

  // State for new rating
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [userRating, setUserRating] = useState(null)
  const [reactions, setReactions] = useState<EmojiReaction[]>([])

  useEffect(() => {
    if (vibe) {
      setUserRating(vibe.ratings.find((r) => r.user.id === currentUser.id))
      setReactions(vibe.reactions || [])
    }
  }, [vibe])

  // Initialize rating and review based on userRating
  useEffect(() => {
    if (userRating) {
      setRating(userRating.rating)
      setReview(userRating.review)
    }
  }, [userRating])

  if (!vibe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4 lowercase">vibe not found</h1>
          <p className="text-muted-foreground mb-6">the vibe you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">go back home</Link>
          </Button>
        </main>
      </div>
    )
  }

  // Calculate average rating
  const averageRating = vibe.ratings.reduce((sum, r) => sum + r.rating, 0) / vibe.ratings.length

  // Similar vibes (simple implementation)
  const similarVibes = sampleVibes
    .filter((v) => v.id !== vibe.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)

  // Handle submit rating
  const handleSubmitRating = () => {
    if (rating === 0) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // In a real app, we would update the backend here
      alert(`rating submitted: ${rating} stars with review: "${review}"`)
    }, 1000)
  }

  // Handle emoji reactions
  const handleReact = (emoji: string) => {
    // Find if this emoji already exists in reactions
    const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji)

    if (existingReactionIndex >= 0) {
      // Check if user already reacted with this emoji
      const existingReaction = reactions[existingReactionIndex]
      const userIndex = existingReaction.users.indexOf(currentUser.id)

      if (userIndex >= 0) {
        // User already reacted, remove their reaction
        const updatedReaction = {
          ...existingReaction,
          count: Math.max(0, existingReaction.count - 1),
          users: existingReaction.users.filter((id) => id !== currentUser.id),
        }

        // If no users left, remove the reaction entirely
        if (updatedReaction.users.length === 0) {
          setReactions(reactions.filter((r) => r.emoji !== emoji))
        } else {
          const newReactions = [...reactions]
          newReactions[existingReactionIndex] = updatedReaction
          setReactions(newReactions)
        }
      } else {
        // User hasn't reacted with this emoji yet, add their reaction
        const updatedReaction = {
          ...existingReaction,
          count: existingReaction.count + 1,
          users: [...existingReaction.users, currentUser.id],
        }

        const newReactions = [...reactions]
        newReactions[existingReactionIndex] = updatedReaction
        setReactions(newReactions)
      }
    } else {
      // This emoji doesn't exist in reactions yet, add it
      setReactions([
        ...reactions,
        {
          emoji,
          count: 1,
          users: [currentUser.id],
        },
      ])
    }
  }

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2 lowercase">
              <Link href="/">home</Link> / <span className="text-muted-foreground">vibe</span>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
              {usePlaceholder ? (
                <SimpleVibePlaceholder title={vibe.title} className="rounded-lg" />
              ) : (
                <Image
                  src={vibe.image || "/placeholder.svg"}
                  alt={vibe.title}
                  className="object-cover"
                  fill
                  priority
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {vibe.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="lowercase">
                  {tag.toLowerCase()}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold mb-2">{vibe.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex items-center"
                role="img"
                aria-label={`Rating: ${averageRating.toFixed(1)} out of 5 sparkles`}
              >
                <StarRating value={averageRating} readOnly size="md" />
                <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({vibe.ratings.length} ratings)</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={vibe.createdBy.avatar || "/placeholder.svg"} alt={vibe.createdBy.name} />
                <AvatarFallback>{vibe.createdBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm text-muted-foreground">originally vibed by </span>
                <Link href="/profile" className="text-sm font-medium hover:underline">
                  {vibe.createdBy.name}
                </Link>
              </div>
              <span className="text-sm text-muted-foreground">{new Date(vibe.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Emoji reactions */}
            <div className="mb-6">
              <EmojiReactions reactions={reactions} onReact={handleReact} className="mb-2" />
            </div>

            <div className="prose max-w-none mb-8">
              <p className="text-lg">{vibe.description}</p>
            </div>

            <div className="flex items-center gap-2 mb-8">
              <Button variant="outline" size="sm" className="lowercase">
                <Share className="h-4 w-4 mr-2" />
                share
              </Button>
              <Button variant="outline" size="sm" className="lowercase">
                <Bookmark className="h-4 w-4 mr-2" />
                save
              </Button>
              <Button variant="outline" size="sm" className="lowercase">
                <Flag className="h-4 w-4 mr-2" />
                report
              </Button>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 lowercase">rate this vibe</h2>
                <div className="mb-4">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
                <Textarea
                  placeholder="share your thoughts on this vibe (optional)"
                  className="mb-4"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
                <Button onClick={handleSubmitRating} disabled={rating === 0 || isSubmitting} className="lowercase">
                  {isSubmitting ? "submitting..." : userRating ? "update rating" : "submit rating"}
                </Button>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 lowercase">reviews</h2>
            {vibe.ratings.filter((r) => r.review).length > 0 ? (
              <div className="space-y-6">
                {vibe.ratings
                  .filter((r) => r.review)
                  .map((rating, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={rating.user.avatar || "/placeholder.svg"} alt={rating.user.name} />
                            <AvatarFallback>{rating.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <Link href="/profile" className="font-medium hover:underline">
                                  {rating.user.name}
                                </Link>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(rating.date).toLocaleDateString()}
                                </div>
                              </div>
                              <StarRating value={rating.rating} readOnly size="sm" />
                            </div>
                            <p>{rating.review}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground lowercase">
                no written reviews yet. be the first to share your thoughts!
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 lowercase">similar vibes</h2>
            <div className="space-y-4">
              {similarVibes.map((vibe) => (
                <VibeCard key={vibe.id} vibe={vibe} compact />
              ))}
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4 lowercase">who rated this</h2>
            <div className="flex flex-wrap gap-2">
              {vibe.ratings.slice(0, 10).map((rating, index) => (
                <Avatar key={index} className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={rating.user.avatar || "/placeholder.svg"} alt={rating.user.name} />
                  <AvatarFallback>{rating.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {vibe.ratings.length > 10 && (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  +{vibe.ratings.length - 10}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
