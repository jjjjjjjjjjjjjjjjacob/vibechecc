// Global type definitions for window extensions and external libraries

declare global {
  interface Window {
    convex?: {
      mutation: (
        name: string,
        args: Record<string, unknown>
      ) => Promise<unknown>;
      action: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, properties?: Record<string, unknown>) => void;
      setPersonProperties: (properties: Record<string, unknown>) => void;
    };
  }
}

// Feature flag payload types
export interface AuthFeatureFlagPayload {
  message?: string;
  variant?: string;
}

// Analytics event types
export interface AuthEvent {
  context?: string;
  apple_id_only?: boolean;
  variant?: string;
  timestamp: number;
}

export interface AuthRequiredEvent {
  action: string;
  target_id?: string;
  session_id?: string;
  preserved?: boolean;
  timestamp: number;
}

export interface AnonymousActionMigrationEvent {
  session_id: string;
  processed_actions: number;
  total_actions: number;
  user_id: string;
  timestamp: number;
}

// Community member type
export interface CommunityMember {
  user: {
    _id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
  joinedAt: string;
  vibeCount: number;
  ratingCount: number;
}

// Leaderboard entry types
export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
  points: number;
  badges?: string[];
}

// Anonymous action result type
export interface AnonymousActionResult {
  processed: number;
  errors: Array<{ message: string }>;
}

// Component prop helper types
export type ComponentPropsWithChildren<T = object> = T & {
  children?: React.ReactNode;
};

export {};
