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
interface Rating {
    user: User | null;
    rating: number;
    review?: string;
    date: string;
}
interface EmojiReaction {
    emoji: string;
    count: number;
    users: string[];
}
interface Vibe {
    id: string;
    title: string;
    description: string;
    image?: string;
    createdBy: User | null;
    createdAt: string;
    ratings: Rating[];
    tags?: string[];
    reactions?: EmojiReaction[];
}

export type { EmojiReaction, Rating, User, Vibe };
