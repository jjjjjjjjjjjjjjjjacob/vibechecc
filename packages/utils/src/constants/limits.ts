/**
 * Shared limits and defaults used across the viberatr platform
 */

// Pagination limits
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20, // fallback when callers don't specify a page size
  MAX_PAGE_SIZE: 100, // hard cap to prevent overwhelming queries
  VIBES_DEFAULT: 50, // default number of vibes to fetch on initial load
  RATINGS_PER_VIBE: 10, // limit ratings per vibe to keep pages light
  REACTIONS_PER_VIBE: 50, // maximum emoji reactions shown for a vibe
  TAGS_PER_PAGE: 10, // paginate tag lists to avoid huge payloads
} as const;

// Content limits
export const CONTENT_LIMITS = {
  VIBE_TITLE_MAX: 100, // maximum characters allowed in a vibe title
  VIBE_DESCRIPTION_MAX: 500, // cap description length to maintain readability
  TAG_MAX_LENGTH: 30, // keep individual tags short for UX
  TAGS_PER_VIBE_MAX: 5, // limit number of tags per vibe to prevent clutter
  USERNAME_MAX: 30, // enforce reasonable username length
  REVIEW_MAX_LENGTH: 1000, // allow detailed reviews without being excessive
} as const;

// Rating constraints
export const RATING = {
  MIN: 1, // lowest allowed rating
  MAX: 5, // highest allowed rating
  MIN_RATINGS_FOR_TOP: 2, // minimum ratings to be considered "top rated"
} as const;
