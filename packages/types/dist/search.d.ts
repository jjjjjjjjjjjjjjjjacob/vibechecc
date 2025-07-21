/**
 * Search-related type definitions shared across the vibechecc platform
 */
export type SearchResultType = 'vibe' | 'user' | 'tag' | 'action';
export interface BaseSearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    image?: string;
    score?: number;
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
    count: number;
}
export interface ActionSearchResult extends BaseSearchResult {
    type: 'action';
    action: string;
    icon?: string;
}
export type SearchResult = VibeSearchResult | UserSearchResult | TagSearchResult | ActionSearchResult;
export interface SearchFilters {
    tags?: string[];
    minRating?: number;
    maxRating?: number;
    dateRange?: {
        start: string;
        end: string;
    };
    creators?: string[];
    sort?: SearchSortOption;
}
export type SearchSortOption = 'relevance' | 'rating_desc' | 'rating_asc' | 'recent' | 'oldest';
export interface SearchRequest {
    query: string;
    filters?: SearchFilters;
    limit?: number;
    cursor?: string;
    includeTypes?: SearchResultType[];
}
export interface SearchResponse {
    vibes: VibeSearchResult[];
    users: UserSearchResult[];
    tags: TagSearchResult[];
    actions: ActionSearchResult[];
    totalCount: number;
}
export interface SearchSuggestionsResponse {
    vibes: VibeSearchResult[];
    users: UserSearchResult[];
    tags: TagSearchResult[];
    actions?: ActionSearchResult[];
    recentSearches?: string[];
    trendingSearches?: string[];
    popularTags?: string[];
}
export interface SearchSuggestion {
    term: string;
    type: 'recent' | 'trending' | 'recommended';
    metadata?: {
        lastUsed?: string;
        useCount?: number;
        trendingRank?: number;
    };
}
export interface SearchHistoryEntry {
    id: string;
    userId: string;
    query: string;
    timestamp: number;
    resultCount: number;
    clickedResults?: string[];
}
