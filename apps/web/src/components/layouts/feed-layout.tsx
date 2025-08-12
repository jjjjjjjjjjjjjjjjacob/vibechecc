/**
 * FeedLayout composes BaseLayout with optional header, sticky navigation, and floating UI.
 * It arranges scrollable content for feed pages while keeping navigation pinned.
 */
import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';

export interface StickySection {
  id: string;
  content: React.ReactNode;
  className?: string;
}

export interface FeedLayoutProps {
  /** Main content area */
  children: React.ReactNode;
  /** Header content (title, description, etc.) */
  header?: React.ReactNode;
  /** Sticky navigation sections (tabs, filters, etc.) */
  stickyNavigation?: StickySection[];
  /** Additional floating elements */
  floatingElements?: React.ReactNode;
  /** Custom classes */
  className?: string;
  containerClassName?: string;
  /** Layout configuration */
  headerSpacing?: 'sm' | 'md' | 'lg';
  contentSpacing?: 'sm' | 'md' | 'lg';
}

// translate spacing tokens to bottom margin utilities
const spacingClasses = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
};

export function FeedLayout({
  children,
  header,
  stickyNavigation = [],
  floatingElements,
  className,
  containerClassName,
  headerSpacing = 'lg',
  contentSpacing = 'md',
}: FeedLayoutProps) {
  return (
    <BaseLayout className={className} containerClassName={containerClassName}>
      {/* Header Section */}
      {header && (
        <div className={cn('relative z-0', spacingClasses[headerSpacing])}>
          {header}
        </div>
      )}

      {/* Sticky Navigation Sections */}
      {stickyNavigation.map((section, index) => {
        // offset stacks each sticky section below the previous one
        const topOffset = 64 + index * 60;

        return (
          <div
            key={section.id}
            className={cn(
              'bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky z-40 backdrop-blur',
              '-mx-4 px-4 pt-4 pb-2',
              section.className
            )}
            style={{ top: `${topOffset}px` }}
          >
            {section.content}
          </div>
        );
      })}

      {/* Main Content Area */}
      <div className={cn('relative z-0', spacingClasses[contentSpacing])}>
        {children}
      </div>

      {/* Floating Elements */}
      {floatingElements && (
        <div className="pointer-events-none fixed inset-0 z-30">
          <div className="pointer-events-auto">{floatingElements}</div>
        </div>
      )}
    </BaseLayout>
  );
}
