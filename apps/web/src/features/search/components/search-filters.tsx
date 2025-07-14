import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagFilter } from './tag-filter';
import { RatingFilter } from './rating-filter';
import { DateRangeFilter } from './date-range-filter';
import type { SearchFilters as SearchFiltersType } from '@vibechecc/types';

interface SearchFiltersProps {
  filters: Partial<SearchFiltersType>;
  onChange: (filters: Partial<SearchFiltersType>) => void;
  availableTags?: string[];
}

export function SearchFilters({ filters, onChange, availableTags = [] }: SearchFiltersProps) {
  const hasActiveFilters = !!(
    filters.tags?.length ||
    filters.minRating ||
    filters.dateRange ||
    filters.sort !== 'relevance'
  );

  const handleClearAll = () => {
    onChange({});
  };

  const handleSortChange = (sort: string) => {
    onChange({ ...filters, sort: sort as SearchFiltersType['sort'] });
  };

  // Mock available tags if none provided
  const tags = availableTags.length > 0 ? availableTags : [
    'wholesome',
    'funny',
    'cringe',
    'embarrassing',
    'awkward',
    'relatable',
    'mood',
    'fail',
    'win',
    'random',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
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

      <TagFilter
        selected={filters.tags || []}
        available={tags}
        onChange={(tags) => onChange({ ...filters, tags })}
      />

      <Separator />

      <RatingFilter
        value={filters.minRating}
        onChange={(rating) => onChange({ ...filters, minRating: rating })}
      />

      <Separator />

      <DateRangeFilter
        value={filters.dateRange}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Sort By</h4>
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
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
        </p>
      </div>
    </div>
  );
}