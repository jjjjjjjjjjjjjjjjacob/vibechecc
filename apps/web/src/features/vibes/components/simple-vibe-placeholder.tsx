import { cn } from '@/utils/tailwind-utils';
import {
  generateGradientClasses,
  generateGradientStyle,
  isLightGradient,
} from '@/utils/gradient-utils';
import { useEffect, useState } from 'react';

interface SimplePlaceholderProps {
  title?: string;
  className?: string;
  hideText?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  textColorOverride?: 'auto' | 'white' | 'black';
}

export function SimpleVibePlaceholder({
  title,
  className,
  hideText = false,
  gradientFrom,
  gradientTo,
  gradientDirection,
  textColorOverride = 'auto',
}: SimplePlaceholderProps) {
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build Tailwind gradient classes from vibe or fallback to theme
  const direction = gradientDirection || 'to-br';
  const gradientDirectionClass = generateGradientClasses(
    gradientFrom,
    gradientTo,
    direction
  );
  const colorClasses =
    gradientFrom && gradientTo
      ? cn(`from-[${gradientFrom}]`, `to-[${gradientTo}]`)
      : 'from-theme-primary to-theme-secondary';

  const gradientClassName = cn(colorClasses, gradientDirectionClass);

  // Determine text color based on background type and override
  const textColor = (() => {
    if (textColorOverride === 'white') return 'text-white/90';
    if (textColorOverride === 'black') return 'text-black/70';
    if (gradientFrom && gradientTo) {
      return isLightGradient(gradientFrom, gradientTo)
        ? 'text-black/70'
        : 'text-white/90';
    }
    return 'text-white/90';
  })();

  // If not mounted yet, return a simple placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('bg-muted relative h-full w-full', className)}></div>
    );
  }

  // Build inline gradient style when explicit colors are provided
  const backgroundStyle =
    gradientFrom && gradientTo
      ? generateGradientStyle(gradientFrom, gradientTo, direction)
      : undefined;

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        gradientClassName,
        className
      )}
      style={backgroundStyle ? { background: backgroundStyle } : undefined}
    >
      {title && !hideText && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span
            className={cn(
              'line-clamp-3 text-lg font-medium drop-shadow-md',
              textColor
            )}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
