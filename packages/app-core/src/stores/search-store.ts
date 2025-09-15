import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage } from './storage';
import type { SearchFilters } from '@vibechecc/types';

// Search state types
export interface SearchState {
  // Current search
  query: string;
  isSearching: boolean;
  searchError: string | null;

  // Search results
  results: SearchResults | null;
  hasMore: boolean;
  cursor: string | null;

  // Search history
  recentSearches: RecentSearch[];
  savedSearches: SavedSearch[];

  // Trending searches
  trendingSearches: TrendingSearch[];
  lastTrendingUpdate: number | null;

  // Search filters
  activeFilters: SearchFilters;
  filterPresets: FilterPreset[];

  // Search suggestions
  suggestions: string[];
  suggestionsLoading: boolean;

  // Search analytics (mobile-specific)
  searchStats: SearchStats;
}

export interface SearchResults {
  vibes: any[];
  users: any[];
  tags: string[];
  actions: any[];
  reviews: any[];
  totalCount: number;
  searchId: string;
  timestamp: number;
}

export interface RecentSearch {
  id: string;
  query: string;
  filters?: SearchFilters;
  timestamp: number;
  resultCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: SearchFilters;
  createdAt: number;
  notificationEnabled: boolean;
}

export interface TrendingSearch {
  query: string;
  searchCount: number;
  growthRate: number;
  category?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
  isDefault: boolean;
  createdAt: number;
}

export interface SearchStats {
  totalSearches: number;
  averageResultsPerSearch: number;
  mostSearchedTags: string[];
  searchFrequency: Record<string, number>;
  lastSearchDate: number | null;
}

export interface SearchActions {
  // Search actions
  setQuery: (query: string) => void;
  clearQuery: () => void;
  setSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;

  // Results actions
  setResults: (results: SearchResults | null) => void;
  appendResults: (newResults: Partial<SearchResults>) => void;
  clearResults: () => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor: string | null) => void;

  // History actions
  addRecentSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (id: string) => void;

  // Saved search actions
  addSavedSearch: (search: Omit<SavedSearch, 'id' | 'createdAt'>) => void;
  removeSavedSearch: (id: string) => void;
  updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => void;
  toggleSavedSearchNotifications: (id: string) => void;

  // Trending actions
  setTrendingSearches: (searches: TrendingSearch[]) => void;
  updateTrendingSearches: () => Promise<void>;

  // Filter actions
  setActiveFilters: (filters: SearchFilters) => void;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  resetFilters: () => void;

  // Filter preset actions
  addFilterPreset: (preset: Omit<FilterPreset, 'id' | 'createdAt'>) => void;
  removeFilterPreset: (id: string) => void;
  applyFilterPreset: (id: string) => void;
  setDefaultFilterPreset: (id: string) => void;

  // Suggestion actions
  setSuggestions: (suggestions: string[]) => void;
  setSuggestionsLoading: (loading: boolean) => void;
  clearSuggestions: () => void;

  // Analytics actions
  updateSearchStats: (query: string, resultCount: number) => void;
  resetSearchStats: () => void;

  // Utility actions
  getSearchById: (id: string) => RecentSearch | SavedSearch | null;
  isQueryInHistory: (query: string) => boolean;
  getPopularTags: () => string[];
}

export type SearchStore = SearchState & SearchActions;

const initialState: SearchState = {
  query: '',
  isSearching: false,
  searchError: null,
  results: null,
  hasMore: false,
  cursor: null,
  recentSearches: [],
  savedSearches: [],
  trendingSearches: [],
  lastTrendingUpdate: null,
  activeFilters: {},
  filterPresets: [],
  suggestions: [],
  suggestionsLoading: false,
  searchStats: {
    totalSearches: 0,
    averageResultsPerSearch: 0,
    mostSearchedTags: [],
    searchFrequency: {},
    lastSearchDate: null,
  },
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Search actions
      setQuery: (query) => set({ query }),

      clearQuery: () => set({
        query: '',
        results: null,
        searchError: null,
        hasMore: false,
        cursor: null,
      }),

      setSearching: (searching) => set({ isSearching: searching }),

      setSearchError: (error) => set({ searchError: error }),

      // Results actions
      setResults: (results) => set({ results }),

      appendResults: (newResults) => {
        const { results } = get();
        if (!results || !newResults) return;

        const updatedResults: SearchResults = {
          ...results,
          vibes: [...results.vibes, ...(newResults.vibes || [])],
          users: [...results.users, ...(newResults.users || [])],
          tags: [...new Set([...results.tags, ...(newResults.tags || [])])],
          actions: [...results.actions, ...(newResults.actions || [])],
          reviews: [...results.reviews, ...(newResults.reviews || [])],
          totalCount: newResults.totalCount || results.totalCount,
        };

        set({ results: updatedResults });
      },

      clearResults: () => set({
        results: null,
        hasMore: false,
        cursor: null
      }),

      setHasMore: (hasMore) => set({ hasMore }),

      setCursor: (cursor) => set({ cursor }),

      // History actions
      addRecentSearch: (search) => {
        const { recentSearches } = get();
        const newSearch: RecentSearch = {
          ...search,
          id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        // Remove duplicate if exists
        const filteredSearches = recentSearches.filter(s => s.query !== search.query);

        // Add to front and limit to 20 recent searches
        set({
          recentSearches: [newSearch, ...filteredSearches].slice(0, 20),
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      removeRecentSearch: (id) => {
        const { recentSearches } = get();
        set({
          recentSearches: recentSearches.filter(search => search.id !== id),
        });
      },

      // Saved search actions
      addSavedSearch: (search) => {
        const { savedSearches } = get();
        const newSearch: SavedSearch = {
          ...search,
          id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };

        set({
          savedSearches: [newSearch, ...savedSearches].slice(0, 50), // Limit saved searches
        });
      },

      removeSavedSearch: (id) => {
        const { savedSearches } = get();
        set({
          savedSearches: savedSearches.filter(search => search.id !== id),
        });
      },

      updateSavedSearch: (id, updates) => {
        const { savedSearches } = get();
        set({
          savedSearches: savedSearches.map(search =>
            search.id === id ? { ...search, ...updates } : search
          ),
        });
      },

      toggleSavedSearchNotifications: (id) => {
        const { savedSearches } = get();
        set({
          savedSearches: savedSearches.map(search =>
            search.id === id
              ? { ...search, notificationEnabled: !search.notificationEnabled }
              : search
          ),
        });
      },

      // Trending actions
      setTrendingSearches: (searches) => set({
        trendingSearches: searches,
        lastTrendingUpdate: Date.now(),
      }),

      updateTrendingSearches: async () => {
        // This would fetch trending searches from the API
        // For now, just a placeholder
        const { lastTrendingUpdate } = get();
        const now = Date.now();

        // Only update if it's been more than 30 minutes
        if (lastTrendingUpdate && now - lastTrendingUpdate < 30 * 60 * 1000) {
          return;
        }

        try {
          // const trending = await api.search.getTrendingSearches();
          // get().setTrendingSearches(trending);
        } catch (error) {
          console.error('Failed to update trending searches:', error);
        }
      },

      // Filter actions
      setActiveFilters: (filters) => set({ activeFilters: filters }),

      updateFilter: (key, value) => {
        const { activeFilters } = get();
        set({
          activeFilters: {
            ...activeFilters,
            [key]: value,
          },
        });
      },

      clearFilters: () => set({ activeFilters: {} }),

      resetFilters: () => {
        const { filterPresets } = get();
        const defaultPreset = filterPresets.find(preset => preset.isDefault);

        set({
          activeFilters: defaultPreset?.filters || {},
        });
      },

      // Filter preset actions
      addFilterPreset: (preset) => {
        const { filterPresets } = get();
        const newPreset: FilterPreset = {
          ...preset,
          id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };

        set({
          filterPresets: [newPreset, ...filterPresets].slice(0, 10), // Limit presets
        });
      },

      removeFilterPreset: (id) => {
        const { filterPresets } = get();
        set({
          filterPresets: filterPresets.filter(preset => preset.id !== id),
        });
      },

      applyFilterPreset: (id) => {
        const { filterPresets } = get();
        const preset = filterPresets.find(p => p.id === id);

        if (preset) {
          set({ activeFilters: preset.filters });
        }
      },

      setDefaultFilterPreset: (id) => {
        const { filterPresets } = get();
        set({
          filterPresets: filterPresets.map(preset => ({
            ...preset,
            isDefault: preset.id === id,
          })),
        });
      },

      // Suggestion actions
      setSuggestions: (suggestions) => set({ suggestions }),

      setSuggestionsLoading: (loading) => set({ suggestionsLoading: loading }),

      clearSuggestions: () => set({ suggestions: [] }),

      // Analytics actions
      updateSearchStats: (query, resultCount) => {
        const { searchStats } = get();
        const newStats: SearchStats = {
          totalSearches: searchStats.totalSearches + 1,
          averageResultsPerSearch: Math.round(
            ((searchStats.averageResultsPerSearch * searchStats.totalSearches) + resultCount) /
            (searchStats.totalSearches + 1)
          ),
          mostSearchedTags: searchStats.mostSearchedTags, // Would be updated based on query analysis
          searchFrequency: {
            ...searchStats.searchFrequency,
            [query]: (searchStats.searchFrequency[query] || 0) + 1,
          },
          lastSearchDate: Date.now(),
        };

        set({ searchStats: newStats });
      },

      resetSearchStats: () => set({
        searchStats: initialState.searchStats
      }),

      // Utility actions
      getSearchById: (id) => {
        const { recentSearches, savedSearches } = get();
        return [...recentSearches, ...savedSearches].find(search => search.id === id) || null;
      },

      isQueryInHistory: (query) => {
        const { recentSearches, savedSearches } = get();
        return [...recentSearches, ...savedSearches].some(search =>
          search.query.toLowerCase() === query.toLowerCase()
        );
      },

      getPopularTags: () => {
        const { searchStats, recentSearches } = get();

        // Extract tags from recent searches and combine with most searched tags
        const allTags = [
          ...searchStats.mostSearchedTags,
          ...recentSearches.flatMap(search =>
            search.filters?.tags || []
          ),
        ];

        // Count occurrences and return top tags
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag);
      },
    }),
    {
      name: 'search-storage',
      storage: createStorage(),
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        savedSearches: state.savedSearches,
        activeFilters: state.activeFilters,
        filterPresets: state.filterPresets,
        searchStats: state.searchStats,
        trendingSearches: state.trendingSearches,
        lastTrendingUpdate: state.lastTrendingUpdate,
      }),
    }
  )
);

// Search utilities
export const searchUtils = {
  // Build search query string
  buildSearchQuery: (query: string, filters: SearchFilters): string => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.append('q', query.trim());
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });

    return params.toString();
  },

  // Parse search query string
  parseSearchQuery: (queryString: string): { query: string; filters: SearchFilters } => {
    const params = new URLSearchParams(queryString);
    const query = params.get('q') || '';
    const filters: SearchFilters = {};

    params.forEach((value, key) => {
      if (key === 'q') return;

      if (filters[key as keyof SearchFilters]) {
        // Convert to array if multiple values
        const existing = filters[key as keyof SearchFilters];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          filters[key as keyof SearchFilters] = [existing, value] as any;
        }
      } else {
        filters[key as keyof SearchFilters] = value as any;
      }
    });

    return { query, filters };
  },

  // Get search suggestions based on query
  getQuerySuggestions: (query: string, recentSearches: RecentSearch[]): string[] => {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // Add matching recent searches
    recentSearches
      .filter(search => search.query.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .forEach(search => suggestions.add(search.query));

    // Add common search patterns
    const commonPatterns = [
      `${query} vibes`,
      `${query} user`,
      `${query} tag`,
      `popular ${query}`,
      `trending ${query}`,
    ];

    commonPatterns.forEach(pattern => suggestions.add(pattern));

    return Array.from(suggestions).slice(0, 8);
  },

  // Check if filters are active
  hasActiveFilters: (filters: SearchFilters): boolean => {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  },

  // Get filter summary for display
  getFilterSummary: (filters: SearchFilters): string => {
    const parts: string[] = [];

    if (filters.tags?.length) {
      parts.push(`${filters.tags.length} tags`);
    }
    if (filters.minRating !== undefined) {
      parts.push(`rating ≥ ${filters.minRating}`);
    }
    if (filters.maxRating !== undefined) {
      parts.push(`rating ≤ ${filters.maxRating}`);
    }
    if (filters.dateFrom || filters.dateTo) {
      parts.push('date filtered');
    }

    return parts.join(', ');
  },
};