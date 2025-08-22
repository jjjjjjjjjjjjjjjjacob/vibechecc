import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/utils/tailwind-utils';
import { generateGradientStyle, getConsistentGradient, isLightGradient } from '@/utils/gradient-utils';
import { useEffect, useState } from 'react';

interface SimplePlaceholderProps {
  title?: string;
  className?: string;
  hideText?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
}

export function SimpleVibePlaceholder({
  title,
  className,
  hideText = false,
  gradientFrom,
  gradientTo,
  gradientDirection,
}: SimplePlaceholderProps) {
  const { resolvedTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get gradient colors - either custom or generated
  const getGradient = () => {
    if (gradientFrom && gradientTo) {
      return {
        from: gradientFrom,
        to: gradientTo,
        direction: gradientDirection || 'to-br',
      };
    }
    
    // Generate consistent gradient based on title
    return getConsistentGradient(title);
  };

  const gradient = getGradient();
  
  // Determine text color based on gradient luminance
  const textColor = gradient.from && gradient.to && isLightGradient(gradient.from, gradient.to)
    ? 'text-gray-900'
    : 'text-white';

  // If not mounted yet, return a simple placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('bg-muted relative h-full w-full', className)}></div>
    );
  }

  // Generate inline style for custom gradient
  const gradientStyle = generateGradientStyle(gradient.from, gradient.to, gradient.direction);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        className
      )}
      style={{ background: gradientStyle }}
    >
      {title && !hideText && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span className={cn(
            'line-clamp-3 text-lg font-medium drop-shadow-md',
            textColor
          )}>
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
