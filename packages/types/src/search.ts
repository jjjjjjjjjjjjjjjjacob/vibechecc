/**
 * Search-related type definitions shared across the viberater platform
 */

// Search result types
export type SearchResultType = 'vibe' | 'user' | 'tag' | 'action' | 'review';

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  image?: string;
  score?: number; // Relevance score
}

export interface VibeSearchResult extends BaseSearchResult {
  type: 'vibe';
  description: string;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
  createdBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface UserSearchResult extends BaseSearchResult {
  type: 'user';
  username: string;
  vibeCount?: number;
  followerCount?: number;
}

export interface TagSearchResult extends BaseSearchResult {
  type: 'tag';
  count: number; // Number of vibes with this tag
}

export interface ActionSearchResult extends BaseSearchResult {
  type: 'action';
  action: string; // e.g., 'create-vibe', 'view-profile'
  icon?: string;
}

export interface ReviewSearchResult extends BaseSearchResult {
  type: 'review';
  reviewText: string;
  emoji: string;
  rating: number; // 1-5 rating value
  vibeId: string;
  vibeTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  createdAt: number;
}

export type SearchResult =
  | VibeSearchResult
  | UserSearchResult
  | TagSearchResult
  | ActionSearchResult
  | ReviewSearchResult;

// Search filters
export interface SearchFilters {
  tags?: string[];
  minRating?: number;
  maxRating?: number;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  creators?: string[]; // User IDs
  sort?: SearchSortOption;
  emojiRatings?: {
    emojis?: string[]; // Filter by specific emojis
    minValue?: number; // Min emoji rating value (1-5)
  };
}

export type SearchSortOption =
  | 'relevance'
  | 'rating_desc'
  | 'rating_asc'
  | 'top_rated'
  | 'most_rated'
  | 'recent'
  | 'oldest'
  | 'name'
  | 'creation_date'
  | 'interaction_time';

// Search request/response
export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  cursor?: string; // For pagination
  includeTypes?: SearchResultType[]; // Which types to include
}

export interface SearchResponse {
  vibes: VibeSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions: ActionSearchResult[];
  reviews: ReviewSearchResult[];
  totalCount: number;
}

export interface SearchSuggestionsResponse {
  vibes: VibeSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions?: ActionSearchResult[];
  reviews?: ReviewSearchResult[];
  recentSearches?: string[];
  trendingSearches?: string[];
  popularTags?: string[];
}

// Search suggestions (for command palette)
export interface SearchSuggestion {
  term: string;
  type: 'recent' | 'trending' | 'recommended';
  metadata?: {
    lastUsed?: string;
    useCount?: number;
    trendingRank?: number;
  };
}

// Search history
export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  timestamp: number;
  resultCount: number;
  clickedResults?: string[]; // IDs of results user clicked
}
