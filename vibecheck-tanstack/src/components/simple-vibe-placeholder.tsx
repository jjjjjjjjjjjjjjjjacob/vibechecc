import { useTheme } from "./theme-provider"
import { cn } from "../utils/utils"
import { useEffect, useState } from "react"

interface SimplePlaceholderProps {
  title?: string
  className?: string
}

export function SimpleVibePlaceholder({ title, className }: SimplePlaceholderProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate a consistent color based on the title
  const getColorIndex = (title?: string) => {
    if (!title) return 0
    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 6) // 0-5 for our color palette
  }

  const colorIndex = getColorIndex(title)

  // If not mounted yet, return a simple placeholder to avoid hydration mismatch
  if (!mounted) {
    return <div className={cn("relative w-full h-full bg-zinc-800", className)}></div>
  }

  // Define background classes based on color index and theme
  const getBgClass = () => {
    const isDark = resolvedTheme === "dark"

    switch (colorIndex) {
      case 0:
        return isDark ? "bg-gradient-to-br from-pink-500 to-rose-400" : "bg-gradient-to-br from-pink-300 to-rose-200"
      case 1:
        return isDark ? "bg-gradient-to-br from-blue-500 to-sky-400" : "bg-gradient-to-br from-blue-300 to-sky-200"
      case 2:
        return isDark
          ? "bg-gradient-to-br from-green-500 to-emerald-400"
          : "bg-gradient-to-br from-green-300 to-emerald-200"
      case 3:
        return isDark
          ? "bg-gradient-to-br from-yellow-500 to-amber-400"
          : "bg-gradient-to-br from-yellow-300 to-amber-200"
      case 4:
        return isDark
          ? "bg-gradient-to-br from-purple-500 to-violet-400"
          : "bg-gradient-to-br from-purple-300 to-violet-200"
      case 5:
        return isDark ? "bg-gradient-to-br from-orange-500 to-red-400" : "bg-gradient-to-br from-orange-300 to-red-200"
      default:
        return isDark ? "bg-gradient-to-br from-pink-500 to-rose-400" : "bg-gradient-to-br from-pink-300 to-rose-200"
    }
  }

  return (
    <div
      className={cn("relative w-full h-full flex items-center justify-center overflow-hidden", getBgClass(), className)}
    >
      {title && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span className="text-lg font-medium line-clamp-3 text-white drop-shadow-md">{title}</span>
        </div>
      )}
    </div>
  )
} 