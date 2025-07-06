// Shared utility functions for the vibechecc workspace

// Placeholder for shared utilities
// TODO: Extract common utilities from browser app like:
// - PostHog configuration
// - Emoji database utilities
// - Common helper functions

// Define User interface locally to avoid circular dependencies during build
interface User {
  externalId: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  image_url?: string;
  profile_image_url?: string;
  has_image?: boolean;
  primary_email_address_id?: string;
  last_sign_in_at?: number;
  last_active_at?: number;
  created_at?: number;
  updated_at?: number;
  onboardingCompleted?: boolean;
  interests?: string[];
}

// Re-export the User type for convenience
export type { User };

// User utility functions
/**
 * Computes a display name for a user based on available data
 * Priority order:
 * 1. username (if available)
 * 2. first_name + last_name (if available)
 * 3. legacy name field (for backward compatibility)
 * 4. "Unknown User" as fallback
 *
 * @param user - The user object from the database
 * @returns A computed display name
 */
export function computeUserDisplayName(user: User | null | undefined): string {
  if (!user) {
    return 'Unknown User';
  }

  // Priority 1: username
  if (user.username?.trim()) {
    return user.username.trim();
  }

  // Priority 2: first_name + last_name
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  // Priority 3: legacy name field (for backward compatibility)
  if (user.full_name?.trim()) {
    return user.full_name.trim();
  }

  // Fallback
  return 'Unknown User';
}

/**
 * Gets the best available avatar URL for a user
 * @param user - The user object from the database
 * @returns Avatar URL or undefined
 */
export function getUserAvatarUrl(
  user: User | null | undefined
): string | undefined {
  if (!user) {
    return undefined;
  }

  // Prefer Clerk image URLs
  if (user.image_url) {
    return user.image_url;
  }

  if (user.profile_image_url) {
    return user.profile_image_url;
  }

  return undefined;
}

/**
 * Gets user initials for avatar fallback
 * @param user - The user object from the database
 * @returns Two character initials
 */
export function getUserInitials(user: User | null | undefined): string {
  const displayName = computeUserDisplayName(user);

  // Handle normal names
  const parts = displayName.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return displayName.substring(0, 2).toUpperCase();
}

// SEO utility functions
export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
}) => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@tannerlinsley' },
    { name: 'twitter:site', content: '@tannerlinsley' },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image
      ? [
          { name: 'twitter:image', content: image },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'og:image', content: image },
        ]
      : []),
  ];

  return tags;
};

export function placeholder(): void {
  // This will be populated with actual shared utilities
}
