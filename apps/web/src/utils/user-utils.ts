import type { User } from '../types';

/**
 * Compute a friendly display name for a user.
 *
 * The logic checks several fields in priority order and returns the
 * first non-empty value:
 * 1. `username`
 * 2. `first_name` + `last_name`
 * 3. legacy `full_name`
 * 4. a generic fallback string
 *
 * @param user - Potential user record from the database
 * @returns Readable name or fallback
 */
export function computeUserDisplayName(user: User | null | undefined): string {
  // Immediately fall back when the user object is missing
  if (!user) {
    return 'unknown user';
  }

  // Use the username when available
  if (user.username?.trim()) {
    return user.username.trim();
  }

  // Otherwise try combining first and last names
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  // Fall back to the legacy full_name field
  if (user.full_name?.trim()) {
    return user.full_name.trim();
  }

  // Final fallback when no identifying data exists
  return 'unknown user';
}

/**
 * Determine the most appropriate avatar URL for a user.
 * Prefers Clerk-managed image fields and returns `undefined`
 * when no avatar is available.
 *
 * @param user - Potential user record from the database
 * @returns URL string or `undefined`
 */
export function getUserAvatarUrl(
  user: User | null | undefined
): string | undefined {
  // No user means no avatar
  if (!user) {
    return undefined;
  }

  // Primary image field provided by Clerk
  if (user.image_url) {
    return user.image_url;
  }

  // Legacy profile image field as fallback
  if (user.profile_image_url) {
    return user.profile_image_url;
  }

  // Nothing to return
  return undefined;
}

/**
 * Create a two-letter uppercase fallback based on the user's name.
 *
 * @param user - Potential user record from the database
 * @returns Two-character initials
 */
export function getUserInitials(user: User | null | undefined): string {
  // Compute the best display name first
  const displayName = computeUserDisplayName(user);

  // Split the name to detect multi-word names
  const parts = displayName.split(/\s+/);
  if (parts.length >= 2) {
    // Use first letters of the first two words
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  // Otherwise take the first two characters of the single word
  return displayName.substring(0, 2).toUpperCase();
}
