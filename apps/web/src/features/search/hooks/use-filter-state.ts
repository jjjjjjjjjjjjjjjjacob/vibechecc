import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from '@tanstack/react-router';
import type { SearchFilters } from '@vibechecc/types';

interface UseFilterStateOptions {
  defaultFilters?: Partial<SearchFilters>;
  syncWithUrl?: boolean;
}

export function useFilterState(options: UseFilterStateOptions = {}) {
  const { defaultFilters = {}, syncWithUrl = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filtersFromUrl = useMemo((): Partial<SearchFilters> => {
    if (!syncWithUrl) return defaultFilters;

    const filters: Partial<SearchFilters> = {};
    
    // Query
    const q = searchParams.get('q');
    if (q) {
      filters.query = q;
    }

    // Tags
    const tags = searchParams.get('tags');
    if (tags) {
      filters.tags = tags.split(',').filter(Boolean);
    }

    // Rating
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    if (minRating) {
      filters.minRating = parseFloat(minRating);
    }
    if (maxRating) {
      filters.maxRating = parseFloat(maxRating);
    }

    // Date range
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    if (dateFrom || dateTo) {
      filters.dateRange = {
        start: dateFrom || new Date(0).toISOString().split('T')[0],
        end: dateTo || new Date().toISOString().split('T')[0],
      };
    }

    // Creators
    const creators = searchParams.get('creators');
    if (creators) {
      filters.creators = creators.split(',').filter(Boolean);
    }

    // Sort
    const sort = searchParams.get('sort') as SearchFilters['sort'];
    if (sort && ['relevance', 'rating_desc', 'rating_asc', 'recent', 'oldest'].includes(sort)) {
      filters.sort = sort;
    }

    // Types
    const types = searchParams.get('types');
    if (types) {
      filters.types = types.split(',').filter(Boolean) as SearchFilters['types'];
    }

    // Limit
    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    return { ...defaultFilters, ...filters };
  }, [searchParams, defaultFilters, syncWithUrl]);

  // Update URL with filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();

    // Query
    if (newFilters.query) {
      params.set('q', newFilters.query);
    }

    // Tags
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    }

    // Rating
    if (newFilters.minRating !== undefined) {
      params.set('minRating', newFilters.minRating.toString());
    }
    if (newFilters.maxRating !== undefined) {
      params.set('maxRating', newFilters.maxRating.toString());
    }

    // Date range
    if (newFilters.dateRange) {
      params.set('from', newFilters.dateRange.start);
      params.set('to', newFilters.dateRange.end);
    }

    // Creators
    if (newFilters.creators && newFilters.creators.length > 0) {
      params.set('creators', newFilters.creators.join(','));
    }

    // Sort
    if (newFilters.sort && newFilters.sort !== 'relevance') {
      params.set('sort', newFilters.sort);
    }

    // Types
    if (newFilters.types && newFilters.types.length > 0) {
      params.set('types', newFilters.types.join(','));
    }

    // Limit
    if (newFilters.limit && newFilters.limit !== 20) {
      params.set('limit', newFilters.limit.toString());
    }

    // Update URL
    setSearchParams(params);
  }, [setSearchParams, syncWithUrl]);

  // Clear specific filter
  const clearFilter = useCallback((filterKey: keyof SearchFilters) => {
    const newFilters = { ...filtersFromUrl };
    delete newFilters[filterKey];
    updateFilters(newFilters);
  }, [filtersFromUrl, updateFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    updateFilters({ query: filtersFromUrl.query }); // Keep query if present
  }, [filtersFromUrl, updateFilters]);

  // Toggle array filter (for tags, creators, types)
  const toggleArrayFilter = useCallback((
    filterKey: 'tags' | 'creators' | 'types',
    value: string
  ) => {
    const currentValues = filtersFromUrl[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({
      ...filtersFromUrl,
      [filterKey]: newValues.length > 0 ? newValues : undefined,
    });
  }, [filtersFromUrl, updateFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filtersFromUrl.tags?.length ||
      filtersFromUrl.minRating !== undefined ||
      filtersFromUrl.maxRating !== undefined ||
      filtersFromUrl.dateRange ||
      filtersFromUrl.creators?.length ||
      (filtersFromUrl.sort && filtersFromUrl.sort !== 'relevance') ||
      filtersFromUrl.types?.length
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