/**
 * Shared limits and defaults used across the viberater platform
 */

// Pagination limits
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  VIBES_DEFAULT: 50,
  RATINGS_PER_VIBE: 10,
  REACTIONS_PER_VIBE: 50,
  TAGS_PER_PAGE: 10,
} as const;

// Content limits
export const CONTENT_LIMITS = {
  VIBE_TITLE_MAX: 100,
  VIBE_DESCRIPTION_MAX: 500,
  TAG_MAX_LENGTH: 30,
  TAGS_PER_VIBE_MAX: 5,
  USERNAME_MAX: 30,
  REVIEW_MAX_LENGTH: 1000,
} as const;

// Rating constraints
export const RATING = {
  MIN: 1,
  MAX: 5,
  MIN_RATINGS_FOR_TOP: 2, // Minimum ratings to be considered "top rated"
} as const;
