import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

export interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

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

const paddingClasses = {
  none: 'px-0 py-0',
  sm: 'px-2 py-4',
  md: 'px-4 py-6',
  lg: 'px-6 py-8',
};

export function BaseLayout({
  children,
  className,
  containerClassName,
  maxWidth = 'full',
  padding = 'none',
}: BaseLayoutProps) {
  return (
    <div className={cn('min-h-screen', className)}>
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
