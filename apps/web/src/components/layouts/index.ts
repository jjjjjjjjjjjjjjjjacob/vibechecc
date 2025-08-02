export { BaseLayout } from './base-layout';
export { FeedLayout } from './feed-layout';
export { ProfileLayout } from './profile-layout';

// Layout Types
export type { BaseLayoutProps } from './base-layout';
export type { FeedLayoutProps, StickySection } from './feed-layout';
export type { ProfileLayoutProps } from './profile-layout';

// Common layout configuration interface
export interface LayoutConfig {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'sm' | 'md' | 'lg';
}
