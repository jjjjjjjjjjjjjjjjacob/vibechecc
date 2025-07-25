import { useCallback, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { SearchFilters, SearchResultType } from '@vibechecc/types';

// Extended filters that include both SearchFilters and SearchRequest properties
interface ExtendedFilters extends SearchFilters {
  query?: string;
  types?: SearchResultType[];
  limit?: number;
}

interface UseFilterStateOptions {
  defaultFilters?: Partial<SearchFilters>;
  syncWithUrl?: boolean;
}

export function useFilterState(options: UseFilterStateOptions = {}) {
  const { defaultFilters = {}, syncWithUrl = true } = options;
  const navigate = useNavigate();
  const search = useSearch({ from: '/search' }) as {
    q?: string;
    tags?: string[];
    minRating?: string;
    maxRating?: string;
    dateStart?: string;
    dateEnd?: string;
    sort?: string;
    page?: string;
    from?: string;
    to?: string;
    creators?: string | string[];
    types?: string | string[];
    limit?: string | number;
  };

  // Parse filters from URL
  const filtersFromUrl = useMemo((): Partial<ExtendedFilters> => {
    if (!syncWithUrl) return defaultFilters;

    const filters: Partial<ExtendedFilters> = {};

    // Query
    const q = search.q;
    if (q) {
      filters.query = q;
    }

    // Tags
    const tags = search.tags;
    if (tags) {
      filters.tags = Array.isArray(tags) ? tags : [tags];
    }

    // Rating
    const minRating = search.minRating;
    const maxRating = search.maxRating;
    if (minRating) {
      filters.minRating = parseFloat(minRating);
    }
    if (maxRating) {
      filters.maxRating = parseFloat(maxRating);
    }

    // Date range
    const dateFrom = search.from;
    const dateTo = search.to;
    if (dateFrom || dateTo) {
      filters.dateRange = {
        start: dateFrom || new Date(0).toISOString().split('T')[0],
        end: dateTo || new Date().toISOString().split('T')[0],
      };
    }

    // Creators
    const creators = search.creators;
    if (creators) {
      filters.creators = Array.isArray(creators) ? creators : [creators];
    }

    // Sort
    const sort = search.sort as SearchFilters['sort'];
    if (
      sort &&
      ['relevance', 'rating_desc', 'rating_asc', 'recent', 'oldest'].includes(
        sort
      )
    ) {
      filters.sort = sort;
    }

    // Types
    const types = search.types;
    if (types) {
      filters.types = (
        Array.isArray(types) ? types : [types]
      ) as SearchResultType[];
    }

    // Limit
    const limit = search.limit;
    if (limit) {
      filters.limit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    }

    return { ...defaultFilters, ...filters };
  }, [search, defaultFilters, syncWithUrl]);

  // Update URL with filters
  const updateFilters = useCallback(
    (newFilters: Partial<ExtendedFilters>) => {
      if (!syncWithUrl) return;

      const params: Record<string, string | string[] | number> = {};

      // Query
      if (newFilters.query) {
        params.q = newFilters.query;
      }

      // Tags
      if (newFilters.tags && newFilters.tags.length > 0) {
        params.tags = newFilters.tags;
      }

      // Rating
      if (newFilters.minRating !== undefined) {
        params.minRating = newFilters.minRating;
      }
      if (newFilters.maxRating !== undefined) {
        params.maxRating = newFilters.maxRating;
      }

      // Date range
      if (newFilters.dateRange) {
        params.from = newFilters.dateRange.start;
        params.to = newFilters.dateRange.end;
      }

      // Creators
      if (newFilters.creators && newFilters.creators.length > 0) {
        params.creators = newFilters.creators;
      }

      // Sort
      if (newFilters.sort && newFilters.sort !== 'relevance') {
        params.sort = newFilters.sort;
      }

      // Types
      if (newFilters.types && newFilters.types.length > 0) {
        params.types = newFilters.types;
      }

      // Limit
      if (newFilters.limit && newFilters.limit !== 20) {
        params.limit = newFilters.limit;
      }

      // Update URL
      navigate({ to: '/search', search: params });
    },
    [navigate, syncWithUrl]
  );

  // Clear specific filter
  const clearFilter = useCallback(
    (filterKey: keyof SearchFilters) => {
      const newFilters = { ...filtersFromUrl };
      delete newFilters[filterKey];
      updateFilters(newFilters);
    },
    [filtersFromUrl, updateFilters]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    updateFilters({}); // Clear all filters
  }, [updateFilters]);

  // Toggle array filter (for tags, creators, types)
  const toggleArrayFilter = useCallback(
    (filterKey: 'tags' | 'creators', value: string) => {
      const currentValues = filtersFromUrl[filterKey] ?? [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      updateFilters({
        ...filtersFromUrl,
        [filterKey]: newValues.length > 0 ? newValues : undefined,
      });
    },
    [filtersFromUrl, updateFilters]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filtersFromUrl.tags?.length ||
      filtersFromUrl.minRating !== undefined ||
      filtersFromUrl.maxRating !== undefined ||
      filtersFromUrl.dateRange ||
      filtersFromUrl.creators?.length ||
      (filtersFromUrl.sort && filtersFromUrl.sort !== 'relevance')
    );
  }, [filtersFromUrl]);

  // Build shareable URL
  const getShareableUrl = useCallback(() => {
    const url = new URL(window.location.href);
    return url.toString();
  }, []);

  return {
    filters: filtersFromUrl,
    updateFilters,
    clearFilter,
    clearAllFilters,
    toggleArrayFilter,
    hasActiveFilters,
    getShareableUrl,
  };
}
