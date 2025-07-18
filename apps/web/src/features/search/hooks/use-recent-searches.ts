import { useState, useCallback, useEffect } from 'react';
import type { SearchSuggestion } from '@vibechecc/types';

const RECENT_SEARCHES_KEY = 'vibechecc:recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Save a new search term
  const addRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;

    setRecentSearches((current) => {
      // Remove duplicates and add new term at the beginning
      const filtered = current.filter((s) => s.term !== term);
      const newSearches: SearchSuggestion[] = [
        {
          term,
          type: 'recent',
          metadata: {
            lastUsed: new Date().toISOString(),
          },
        },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }

      return newSearches;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  // Remove a specific search term
  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((current) => {
      const filtered = current.filter((s) => s.term !== term);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.error('Error updating recent searches:', error);
      }

      return filtered;
    });
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
