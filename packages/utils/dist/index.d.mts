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
declare function computeUserDisplayName(user: User | null | undefined): string;
/**
 * Gets the best available avatar URL for a user
 * @param user - The user object from the database
 * @returns Avatar URL or undefined
 */
declare function getUserAvatarUrl(user: User | null | undefined): string | undefined;
/**
 * Gets user initials for avatar fallback
 * @param user - The user object from the database
 * @returns Two character initials
 */
declare function getUserInitials(user: User | null | undefined): string;
declare const seo: ({ title, description, keywords, image, }: {
    title: string;
    description?: string;
    image?: string;
    keywords?: string;
}) => ({
    title: string;
    name?: undefined;
    content?: undefined;
} | {
    name: string;
    content: string | undefined;
    title?: undefined;
})[];
declare function placeholder(): void;

export { type User, computeUserDisplayName, getUserAvatarUrl, getUserInitials, placeholder, seo };
