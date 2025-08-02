import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';

export interface ProfileLayoutProps {
  /** Profile header/hero section */
  profileHeader: React.ReactNode;
  /** Main content tabs or sections */
  children: React.ReactNode;
  /** Sticky navigation (tabs, filters) */
  stickyNavigation?: React.ReactNode;
  /** Background variant */
  variant?: 'default' | 'gradient' | 'themed';
  /** Custom classes */
  className?: string;
  containerClassName?: string;
  /** Scoped theme styles for viewing other users */
  scopedTheme?: boolean;
  themeStyles?: React.CSSProperties;
}

const backgroundVariants = {
  default: 'from-background via-background to-muted/10',
  gradient: 'from-background via-background to-theme-primary/10',
  themed: 'from-background via-background to-theme-primary/10',
};

export function ProfileLayout({
  profileHeader,
  children,
  stickyNavigation,
  variant = 'gradient',
  className,
  containerClassName,
  scopedTheme = false,
  themeStyles = {},
}: ProfileLayoutProps) {
  const containerStyles = scopedTheme ? themeStyles : {};

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br',
        backgroundVariants[variant],
        className
      )}
      style={containerStyles}
    >
      <BaseLayout containerClassName={containerClassName}>
        {/* Profile Header Section */}
        <div className="mb-8">{profileHeader}</div>

        {/* Sticky Navigation */}
        {stickyNavigation && (
          <div className="bg-background/95 border-border/10 sticky top-16 z-40 -mx-4 mb-6 border-b px-4 pt-2 pb-2 backdrop-blur-sm">
            {stickyNavigation}
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-0">{children}</div>
      </BaseLayout>
    </div>
  );
}
