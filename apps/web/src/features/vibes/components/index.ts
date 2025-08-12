/**
 * Barrel exports for vibe-related UI components.
 * Grouping exports here allows consumers to import from a single location.
 */

// Core components that render vibes
export { VibeCard } from './vibe-card'; // individual vibe presentation
export { VibeGrid } from './vibe-grid'; // responsive grid of vibes

// Trigger for creating a new vibe
export { CreateVibeButton } from './create-vibe-button'; // navigates to the creation form

// Placeholder shown when vibe content has yet to load
export { SimpleVibePlaceholder } from './simple-vibe-placeholder';
