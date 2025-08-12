/**
 * Barrel exports for user profile components.
 * Centralizing exports keeps import paths concise for profile pages.
 */

// Components that display a user's profile information
export { UserProfileView } from './user-profile-view'; // full profile page wrapper
export { UserProfileHero } from './user-profile-hero'; // top banner with avatar and stats

// Editing and management widgets
export { ProfileContent } from './profile-content'; // sections with editable profile fields
export { ManageInterestsSection } from './manage-interests-section'; // UI to pick interests

// Subsections for user-generated content
export { UserVibesSection } from './user-vibes-section'; // user's posted vibes
export { UserReviewsSection } from './user-reviews-section'; // reviews left by the user
export { UserInterestsSection } from './user-interests-section'; // list of interests
export { EditableText } from '@/components/editable-text'; // inline editing helper
