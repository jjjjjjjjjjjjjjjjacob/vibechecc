"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle } from "lucide-react"
import { currentUser } from "@/lib/sample-data"
import type { EmojiReaction as EmojiReactionType } from "@/lib/types"

interface EmojiReactionProps {
  reaction: EmojiReactionType
  onReact?: (emoji: string) => void
  className?: string
  showAddButton?: boolean
}

export function EmojiReaction({ reaction, onReact, className, showAddButton = false }: EmojiReactionProps) {
  const [isHovered, setIsHovered] = useState(false)

  const hasReacted = reaction.users.includes(currentUser.id)

  const handleReact = () => {
    if (onReact) {
      onReact(reaction.emoji)
    }
  }

  return (
    <motion.button
      className={cn(
        "relative inline-flex items-center justify-center rounded-full px-2 py-1 text-sm transition-all",
        hasReacted ? "bg-primary/10" : "bg-muted hover:bg-muted/80",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleReact}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-base">{reaction.emoji}</span>

      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="ml-1 font-medium"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            {reaction.count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

interface EmojiReactionsProps {
  reactions: EmojiReactionType[]
  onReact?: (emoji: string) => void
  className?: string
  showAddButton?: boolean
}

export function EmojiReactions({ reactions, onReact, className, showAddButton = true }: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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
          <motion.button
            className="inline-flex items-center justify-center rounded-full p-1 text-sm bg-muted hover:bg-muted/80 transition-all"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add reaction"
          >
            <PlusCircle className="h-4 w-4" />
          </motion.button>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                className="absolute bottom-full left-0 mb-2 p-2 bg-popover rounded-lg shadow-lg border flex flex-wrap gap-1 max-w-[200px] z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
