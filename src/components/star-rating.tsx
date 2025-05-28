import { Sparkle } from "lucide-react"
import { cn } from "../utils/utils"
import { useTheme } from "./theme-provider"
import { useEffect, useState } from "react"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: "sm" | "md" | "lg"
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const stars = [1, 2, 3, 4, 5]

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClick = (rating: number) => {
    if (readOnly) return
    onChange?.(rating)
  }

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  }

  // If not mounted yet, return a placeholder to avoid hydration mismatch
  if (!mounted) {
    return <div className="flex items-center gap-1">{Array(5).fill(<div className={sizeClasses[size]} />)}</div>
  }

  const activeColor = resolvedTheme === "dark" ? "text-purple-400" : "text-purple-500"
  const hoverColor = resolvedTheme === "dark" ? "hover:text-purple-300" : "hover:text-purple-400"

  return (
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} out of 5 sparkles`}
    >
      {stars.map((star, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(star)}
          className={cn(
            "text-muted-foreground transition-colors",
            hoverColor,
            readOnly ? "cursor-default" : "cursor-pointer",
            star <= Math.round(value) && activeColor,
          )}
          disabled={readOnly}
          role={readOnly ? undefined : "radio"}
          aria-checked={star === Math.round(value)}
          aria-label={`${star} sparkle${star === 1 ? "" : "s"}`}
        >
          <Sparkle className={sizeClasses[size]} />
        </button>
      ))}
    </div>
  )
} 