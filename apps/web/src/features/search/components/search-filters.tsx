import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import { TagFilterEnhanced } from './filters/tag-filter-enhanced';
import { RatingSlider } from './filters/rating-slider';
import { DateRangePicker } from './filters/date-range-picker';
import { ActiveFiltersBar } from './filters/active-filters-bar';
import type { SearchFilters as SearchFiltersType } from '@viberater/types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSearchTracking } from '@/hooks/use-enhanced-analytics';

interface SearchFiltersProps {
  filters: Partial<SearchFiltersType>;
  onChange: (filters: Partial<SearchFiltersType>) => void;
  availableTags?: Array<{ name: string; count: number }>;
  showActiveFilters?: boolean;
}

export function SearchFilters({
  filters,
  onChange,
  availableTags = [],
  showActiveFilters = true,
}: SearchFiltersProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { trackFilterApplied } = useSearchTracking();

  const hasActiveFilters = !!(
    filters.tags?.length ||
    filters.minRating ||
    filters.dateRange ||
    (filters.sort && filters.sort !== 'relevance')
  );

  // Calculate result count for tracking (placeholder - would be passed from parent in real implementation)
  const getResultCount = () => {
    // In a real implementation, this would be passed from the parent component
    // For now, we'll estimate based on active filters
    return hasActiveFilters ? Math.floor(Math.random() * 50) + 1 : 0;
  };

  const handleClearAll = () => {
    trackFilterApplied('clear_all', 'all_filters', 0);
    onChange({});
  };

  const handleSortChange = (sort: string) => {
    const resultCount = getResultCount();
    trackFilterApplied('sort', sort, resultCount);
    onChange({ ...filters, sort: sort as SearchFiltersType['sort'] });
  };

  // Mock available tags if none provided
  const tags =
    availableTags.length > 0
      ? availableTags
      : [
          { name: 'wholesome', count: 45 },
          { name: 'funny', count: 38 },
          { name: 'cringe', count: 27 },
          { name: 'embarrassing', count: 23 },
          { name: 'awkward', count: 19 },
          { name: 'relatable', count: 42 },
          { name: 'mood', count: 31 },
          { name: 'fail', count: 15 },
          { name: 'win', count: 22 },
          { name: 'random', count: 18 },
        ];

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      <TagFilterEnhanced
        selected={filters.tags ?? []}
        available={tags}
        onChange={(tags) => {
          const resultCount = getResultCount();
          trackFilterApplied('tags', tags, resultCount);
          onChange({ ...filters, tags });
        }}
      />

      <Separator />

      <RatingSlider
        min={filters.minRating}
        max={filters.maxRating}
        onChange={(range) => {
          const resultCount = getResultCount();
          trackFilterApplied(
            'rating_range',
            { min: range?.min, max: range?.max },
            resultCount
          );
          onChange({
            ...filters,
            minRating: range?.min,
            maxRating: range?.max,
          });
        }}
      />

      <Separator />

      <DateRangePicker
        value={filters.dateRange}
        onChange={(dateRange) => {
          const resultCount = getResultCount();
          trackFilterApplied('date_range', dateRange, resultCount);
          onChange({ ...filters, dateRange });
        }}
      />

      <Separator />

      <div>
        <h4 className="mb-3 font-medium">Sort By</h4>
        <Select
          value={filters.sort || 'relevance'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Most Relevant</SelectItem>
            <SelectItem value="rating_desc">Highest Rated</SelectItem>
            <SelectItem value="rating_asc">Lowest Rated</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
        </p>
      </div>
    </div>
  );

  // Mobile view with drawer
  if (isMobile) {
    return (
      <>
        {showActiveFilters && hasActiveFilters && (
          <ActiveFiltersBar
            filters={filters}
            onChange={onChange}
            className="mb-4"
          />
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground ml-1 rounded-full px-2 py-0.5 text-xs">
                  {Object.keys(filters).filter((k) => k !== 'query').length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop view
  return (
    <>
      {showActiveFilters && hasActiveFilters && (
        <ActiveFiltersBar
          filters={filters}
          onChange={onChange}
          className="mb-4"
        />
      )}
      {filterContent}
    </>
  );
}
