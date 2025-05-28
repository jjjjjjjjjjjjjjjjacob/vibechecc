import * as React from "react"
import { cn } from "../utils/utils"
import { PlusCircle } from "lucide-react"
import { currentUser } from "../db/sample-data"
import type { EmojiReaction as EmojiReactionType } from "../types"

interface EmojiReactionProps {
  reaction: EmojiReactionType
  onReact?: (emoji: string) => void
  className?: string
  showAddButton?: boolean
}

export function EmojiReaction({ reaction, onReact, className, showAddButton = false }: EmojiReactionProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const hasReacted = reaction.users.includes(currentUser.id)

  const handleReact = () => {
    if (onReact) {
      onReact(reaction.emoji)
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: "inline-flex",
        alignItems: "center", 
        justifyContent: "center", 
        borderRadius: "9999px",
        paddingLeft: "0.5rem", 
        paddingRight: "0.5rem", 
        paddingTop: "0.25rem", 
        paddingBottom: "0.25rem", 
        fontSize: "0.875rem", 
        lineHeight: "1.25rem", 
        position: "relative", 
        transition: "all 150ms",
        backgroundColor: hasReacted ? "rgba(var(--primary), 0.1)" : "var(--muted)",
        cursor: "pointer"
      }}
      className={cn("hover:scale-105 active:scale-95", className)}
      role="button"
      tabIndex={0}
      onClick={handleReact}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleReact()
        }
      }}
    >
      <span style={{ fontSize: "1rem" }}>{reaction.emoji}</span>

      {isHovered && (
        <span
          style={{
            marginLeft: "0.25rem",
            fontWeight: "500"
          }}
        >
          {reaction.count}
        </span>
      )}
    </div>
  )
}

interface EmojiReactionsProps {
  reactions: EmojiReactionType[]
  onReact?: (emoji: string) => void
  className?: string
  showAddButton?: boolean
}

export function EmojiReactions({ reactions, onReact, className, showAddButton = true }: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)

  // Common emojis for quick reactions
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "🤔", "👀"]

  const handleAddEmoji = (emoji: string) => {
    if (onReact) {
      onReact(emoji)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className={cn("flex flex-wrap gap-1 items-center", className)}>
      {reactions.map((reaction) => (
        <EmojiReaction key={reaction.emoji} reaction={reaction} onReact={onReact} />
      ))}

      {showAddButton && (
        <div className="relative">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              padding: "0.25rem",
              fontSize: "0.875rem",
              backgroundColor: "var(--muted)",
              transition: "all 150ms",
              cursor: "pointer"
            }}
            className="hover:scale-105 active:scale-95"
            role="button"
            tabIndex={0}
            aria-label="Add reaction"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowEmojiPicker(!showEmojiPicker)
              }
            }}
          >
            <PlusCircle className="h-4 w-4" />
          </div>

          {showEmojiPicker && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: "0.5rem",
                padding: "0.5rem",
                backgroundColor: "var(--popover)",
                borderRadius: "0.5rem",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: "1px solid var(--border)",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
                maxWidth: "200px",
                zIndex: 10
              }}
            >
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  className="p-1 hover:bg-muted rounded cursor-pointer text-lg"
                  onClick={() => handleAddEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 