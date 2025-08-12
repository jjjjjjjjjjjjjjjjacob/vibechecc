import { useTheme } from '@/features/theming/components/theme-provider';
import { cn } from '@/utils/tailwind-utils';
import { useEffect, useState } from 'react';

/**
 * Props for {@link SimpleVibePlaceholder}. Allows customizing the displayed
 * title, additional classes, and whether the title text should be hidden.
 */
interface SimplePlaceholderProps {
  title?: string;
  className?: string;
  hideText?: boolean;
}

/**
 * Renders a deterministic gradient placeholder when a vibe doesn't have an
 * image. The background color is hashed from the title so it stays consistent
 * between renders. Optionally displays the title text centered over the
 * gradient.
 */
export function SimpleVibePlaceholder({
  title,
  className,
  hideText = false,
}: SimplePlaceholderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until the component has mounted on the client to avoid hydration
  // mismatches from theme-based gradients.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive a color index from the title using a basic hash. The index maps to
  // one of six gradient pairs.
  const getColorIndex = (title?: string) => {
    if (!title) return 0;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Constrain the hash into the available gradient range
    return Math.abs(hash % 6);
  };

  const colorIndex = getColorIndex(title);

  // Render a plain block before mounting so server and client markup match.
  if (!mounted) {
    return <div className={cn('relative h-full w-full bg-zinc-800', className)} />;
  }

  // Choose a gradient class based on the hashed index and current theme.
  const getBgClass = () => {
    const isDark = resolvedTheme === 'dark';

    switch (colorIndex) {
      case 0:
        return isDark
          ? 'bg-gradient-to-br from-pink-500 to-rose-400'
          : 'bg-gradient-to-br from-pink-300 to-rose-200';
      case 1:
        return isDark
          ? 'bg-gradient-to-br from-blue-500 to-sky-400'
          : 'bg-gradient-to-br from-blue-300 to-sky-200';
      case 2:
        return isDark
          ? 'bg-gradient-to-br from-green-500 to-emerald-400'
          : 'bg-gradient-to-br from-green-300 to-emerald-200';
      case 3:
        return isDark
          ? 'bg-gradient-to-br from-yellow-500 to-amber-400'
          : 'bg-gradient-to-br from-yellow-300 to-amber-200';
      case 4:
        return isDark
          ? 'bg-gradient-to-br from-purple-500 to-violet-400'
          : 'bg-gradient-to-br from-purple-300 to-violet-200';
      case 5:
        return isDark
          ? 'bg-gradient-to-br from-orange-500 to-red-400'
          : 'bg-gradient-to-br from-orange-300 to-red-200';
      default:
        return isDark
          ? 'bg-gradient-to-br from-pink-500 to-rose-400'
          : 'bg-gradient-to-br from-pink-300 to-rose-200';
    }
  };

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        getBgClass(),
        className
      )}
    >
      {title && !hideText && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span className="line-clamp-3 text-lg font-medium text-white drop-shadow-md">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

