/**
 * BaseLayout centers children inside a responsive container.
 * Width and padding options keep content readable at various screen sizes.
 */
import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

export interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// map width tokens to tailwind max-width utility classes
const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
};

// translate padding tokens into horizontal and vertical spacing
const paddingClasses = {
  none: '',
  sm: 'px-2 py-4',
  md: 'px-4 py-6',
  lg: 'px-6 py-8',
};

export function BaseLayout({
  children,
  className,
  containerClassName,
  maxWidth = '5xl',
  padding = 'md',
}: BaseLayoutProps) {
  return (
    // outer wrapper provides full-height background
    <div className={cn('min-h-screen', className)}>
      {/* inner container constrains width and applies spacing */}
      <div
        className={cn(
          'container mx-auto',
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          containerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
