import * as React from 'react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/utils/tailwind-utils';

interface VibePlaceholderProps {
  title?: string;
  variant?: 'default' | 'wavy' | 'gradient' | 'dots' | 'noise';
  className?: string;
}

export function VibePlaceholder({
  title,
  variant = 'default',
  className,
}: VibePlaceholderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Generate a consistent color based on the title
  const getColorFromTitle = (title?: string) => {
    if (!title) return 0;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 6); // 0-5 for our color palette
  };

  const colorIndex = getColorFromTitle(title);

  // Define color palettes for light and dark modes
  const darkModeGradients = [
    'bg-gradient-to-br from-pink-500 to-rose-400',
    'bg-gradient-to-br from-blue-500 to-sky-400',
    'bg-gradient-to-br from-green-500 to-emerald-400',
    'bg-gradient-to-br from-yellow-500 to-amber-400',
    'bg-gradient-to-br from-purple-500 to-violet-400',
    'bg-gradient-to-br from-orange-500 to-red-400',
  ];

  const lightModeGradients = [
    'bg-gradient-to-br from-pink-300 to-rose-200',
    'bg-gradient-to-br from-blue-300 to-sky-200',
    'bg-gradient-to-br from-green-300 to-emerald-200',
    'bg-gradient-to-br from-yellow-300 to-amber-200',
    'bg-gradient-to-br from-purple-300 to-violet-200',
    'bg-gradient-to-br from-orange-300 to-red-200',
  ];

  // Get gradient classes based on variant and theme
  const getGradientClasses = () => {
    const gradients =
      resolvedTheme === 'dark' ? darkModeGradients : lightModeGradients;
    const baseGradient = gradients[colorIndex];

    switch (variant) {
      case 'wavy':
        return cn(
          resolvedTheme === 'dark'
            ? darkModeGradients[(colorIndex + 1) % 6]
            : lightModeGradients[(colorIndex + 1) % 6]
        );
      case 'gradient':
        return cn(
          resolvedTheme === 'dark'
            ? `bg-gradient-to-r from-${colorIndex * 60} via-${(colorIndex * 60 + 30) % 360} to-${
                (colorIndex * 60 + 60) % 360
              }`
            : baseGradient
        );
      case 'dots':
        return cn(baseGradient);
      case 'noise':
        return cn(baseGradient);
      default:
        return cn(baseGradient);
    }
  };

  // If not mounted yet, return a simple placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-muted relative flex h-full w-full items-center justify-center',
          className
        )}
      >
        {title && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center opacity-0"></div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        getGradientClasses(),
        className
      )}
    >
      {/* Add subtle pattern overlay based on variant */}
      <div
        className={cn(
          'absolute inset-0',
          variant === 'dots' && 'bg-dot-pattern opacity-20',
          variant === 'noise' && 'bg-noise-pattern opacity-100'
        )}
      ></div>

      {title && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span className="line-clamp-3 text-lg font-medium text-white drop-shadow-md">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
