/**
 * Barrel exports for reusable page layouts and their typing helpers.
 */
export { BaseLayout } from './base-layout'; // minimal container layout
export { FeedLayout } from './feed-layout'; // layout for scrolling feed pages
export { ProfileLayout } from './profile-layout'; // layout for user profile pages

// Re-export prop types so callers can type their components
export type { BaseLayoutProps } from './base-layout';
export type { FeedLayoutProps, StickySection } from './feed-layout';
export type { ProfileLayoutProps } from './profile-layout';

// Shared configuration interface used by multiple layouts for width/padding options
export interface LayoutConfig {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | 'full'; // max content width
  padding?: 'none' | 'sm' | 'md' | 'lg'; // horizontal padding size
  spacing?: 'sm' | 'md' | 'lg'; // vertical spacing between sections
}
