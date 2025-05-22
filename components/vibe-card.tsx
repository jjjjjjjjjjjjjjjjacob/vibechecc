"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "@/components/star-rating"
import { cn } from "@/lib/utils"
import { SimpleVibePlaceholder } from "@/components/simple-vibe-placeholder"
import { useState } from "react"
import { EmojiReactions } from "@/components/emoji-reaction"
import { currentUser } from "@/lib/sample-data"
import type { Vibe, EmojiReaction } from "@/lib/types"

interface VibeCardProps {
  vibe: Vibe
  compact?: boolean
  preview?: boolean
}

export function VibeCard({ vibe, compact, preview }: VibeCardProps) {
  const [imageError, setImageError] = useState(false)
  const [reactions, setReactions] = useState<EmojiReaction[]>(vibe.reactions || [])

  // Calculate average rating
  const averageRating =
    vibe.ratings.length > 0 ? vibe.ratings.reduce((sum, r) => sum + r.rating, 0) / vibe.ratings.length : 0

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError

  // Handle emoji reactions
  const handleReact = (emoji: string) => {
    if (preview) return

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

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", !compact && "h-full")}>
      <Link href={preview ? "#" : `/vibe/${vibe.id}`} className="block h-full">
        <div className="relative">
          <div className={cn("relative overflow-hidden", compact ? "aspect-[4/3]" : "aspect-video")}>
            {usePlaceholder ? (
              <SimpleVibePlaceholder title={vibe.title} />
            ) : (
              <Image
                src={vibe.image || "/placeholder.svg"}
                alt={vibe.title}
                className="object-cover transition-transform duration-300 hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>

        <CardContent className={cn("p-4", compact && "p-3")}>
          <h3 className={cn("font-bold line-clamp-1", compact ? "text-base" : "text-lg")}>{vibe.title}</h3>

          {!compact && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{vibe.description}</p>}
        </CardContent>

        <CardFooter className={cn("flex flex-col items-start p-4 pt-0 gap-2", compact && "p-3 pt-0")}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={vibe.createdBy.avatar || "/placeholder.svg"} alt={vibe.createdBy.name} />
                <AvatarFallback>{vibe.createdBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{vibe.createdBy.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <StarRating value={averageRating} readOnly size="sm" />
              <span className="text-xs font-medium">{averageRating > 0 ? averageRating.toFixed(1) : "-"}</span>
              <span className="text-xs text-muted-foreground">({vibe.ratings.length})</span>
            </div>
          </div>

          {reactions.length > 0 && (
            <div
              className="w-full"
              onClick={(e) => {
                // Prevent navigation when clicking reactions
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <EmojiReactions reactions={reactions} onReact={handleReact} showAddButton={!preview} />
            </div>
          )}
        </CardFooter>
      </Link>
    </Card>
  )
}
