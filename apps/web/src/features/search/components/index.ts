/**
 * index module.
 * enhanced documentation for clarity and maintenance.
 */
/**
 * Barrel exports for search UI components covering results, filters, and commands.
 */
// Search result components
export { SearchResultsGrid } from './search-results-grid'; // grid layout for results
export { SearchResultsList } from './search-results-list'; // list layout for results
export { SearchResultCard } from './search-result-card'; // individual result card
export { SearchResultListCard } from './search-result-list-card'; // list-style result item
export { SearchPagination } from './search-pagination'; // pagination controls
export { SearchEmptyState } from './search-empty-state'; // message when no results found
export { SearchError } from './search-error'; // error display for failed searches
export { SearchLoading } from './search-loading'; // skeletons during loading

// Search filter components
export { SearchFilters } from './search-filters'; // wrapper containing all filters
export { FilterSidebar } from './filter-sidebar'; // desktop filter sidebar
export { MobileFilterDrawer } from './mobile-filter-drawer'; // mobile filter drawer
export { TagFilter } from './tag-filter'; // tag-based filtering UI
export { RatingFilter } from './rating-filter'; // rating threshold filter
export { DateRangeFilter } from './date-range-filter'; // filter by created date

// Search command components
export { InstantSearchPreview } from './instant-search-preview'; // command palette preview
