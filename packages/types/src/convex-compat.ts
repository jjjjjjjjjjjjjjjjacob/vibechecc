// Type compatibility layer for Convex database types
// This file bridges the gap between Convex types and frontend interfaces

// Base Convex document type with _id and _creationTime
export interface ConvexDoc {
  _id: string;
  _creationTime: number;
}

// Transform Convex user document to frontend User interface
export interface ConvexUser extends ConvexDoc {
  _id: string;
  externalId: string;
  username?: string;
  first_name?: string;
  last_name?: string;
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
  bio?: string;
  themeColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

// Transform Convex vibe document to frontend Vibe interface
export interface ConvexVibe extends ConvexDoc {
  _id: string;
  id: string;
  title: string;
  description: string;
  image?: string;
  imageStorageId?: string;
  createdById: string;
  createdAt: string;
  tags?: string[];
  visibility?: 'public' | 'deleted';
  updatedAt?: string;
}

// Transform Convex rating document to frontend Rating interface
export interface ConvexRating extends ConvexDoc {
  _id: string;
  vibeId: string;
  userId: string;
  emoji: string;
  value: number;
  review: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

// Transform Convex follow document to frontend Follow interface
export interface ConvexFollow extends ConvexDoc {
  _id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

// Type transformers to convert between Convex types and frontend interfaces
export function transformConvexUser(
  convexUser: ConvexUser
): import('./index').User {
  return {
    id: convexUser._id,
    externalId: convexUser.externalId,
    username: convexUser.username,
    first_name: convexUser.first_name,
    last_name: convexUser.last_name,
    full_name:
      convexUser.first_name && convexUser.last_name
        ? `${convexUser.first_name} ${convexUser.last_name}`.trim()
        : undefined,
    image_url: convexUser.image_url,
    profile_image_url: convexUser.profile_image_url,
    has_image: convexUser.has_image,
    primary_email_address_id: convexUser.primary_email_address_id,
    last_sign_in_at: convexUser.last_sign_in_at,
    last_active_at: convexUser.last_active_at,
    created_at: convexUser.created_at || convexUser._creationTime,
    updated_at: convexUser.updated_at,
    onboardingCompleted: convexUser.onboardingCompleted,
    interests: convexUser.interests,
  };
}

export function transformConvexVibe(
  convexVibe: ConvexVibe,
  createdBy?: import('./index').User | null
): import('./index').Vibe {
  return {
    id: convexVibe.id,
    title: convexVibe.title,
    description: convexVibe.description,
    image: convexVibe.image,
    imageStorageId: convexVibe.imageStorageId,
    createdBy: createdBy || null,
    createdById: convexVibe.createdById,
    createdAt: convexVibe.createdAt,
    ratings: [], // Will be populated separately
    tags: convexVibe.tags,
    viewCount: 0, // Default value
  };
}

export function transformConvexRating(
  convexRating: ConvexRating,
  user?: import('./index').User | null
): import('./index').Rating {
  return {
    user: user || null,
    value: convexRating.value,
    emoji: convexRating.emoji,
    review: convexRating.review,
    createdAt: convexRating.createdAt,
    tags: convexRating.tags,
    vibeId: convexRating.vibeId,
    userId: convexRating.userId,
  };
}

export function transformConvexFollow(
  convexFollow: ConvexFollow
): import('./index').Follow {
  return {
    followerId: convexFollow.followerId,
    followingId: convexFollow.followingId,
    createdAt: convexFollow.createdAt || convexFollow._creationTime,
  };
}

// Type guards to check if objects are Convex documents
export function isConvexDoc(obj: any): obj is ConvexDoc {
  return (
    obj && typeof obj._id === 'string' && typeof obj._creationTime === 'number'
  );
}

export function isConvexUser(obj: any): obj is ConvexUser {
  return isConvexDoc(obj) && typeof (obj as ConvexUser).externalId === 'string';
}

export function isConvexVibe(obj: any): obj is ConvexVibe {
  return (
    isConvexDoc(obj) &&
    typeof (obj as ConvexVibe).title === 'string' &&
    typeof (obj as ConvexVibe).description === 'string'
  );
}

export function isConvexRating(obj: any): obj is ConvexRating {
  return (
    isConvexDoc(obj) &&
    typeof (obj as ConvexRating).emoji === 'string' &&
    typeof (obj as ConvexRating).value === 'number'
  );
}

// Helper type for components that can accept either Convex or frontend types
export type CompatUser = import('./index').User | ConvexUser;
export type CompatVibe = import('./index').Vibe | ConvexVibe;
export type CompatRating = import('./index').Rating | ConvexRating;
