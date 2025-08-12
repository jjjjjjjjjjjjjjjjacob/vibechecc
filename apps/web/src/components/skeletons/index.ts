/**
 * Barrel exports for skeleton loading components used throughout the app.
 * Importing from this file keeps skeleton references centralized.
 */

// Page-level placeholders rendered while entire pages load
export { HeroSectionSkeleton } from './hero-section-skeleton'; // hero section shimmer
export { HomepageSkeleton } from './homepage-skeleton'; // homepage layout skeleton

// Smaller skeletons used by individual components
export { VibeCardSkeleton } from './vibe-card-skeleton'; // placeholder for a single vibe card
export { VibeGridSkeleton } from './vibe-grid-skeleton'; // grid of vibe card placeholders
export { VibeCategoryRowSkeleton } from './vibe-category-row-skeleton'; // horizontal scrolling row of skeletons
export { VibeDetailSkeleton } from './vibe-detail-skeleton'; // detailed view placeholder
