import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Star, Calendar, Tag } from '@/components/ui/icons';
import type { SearchFilters } from '@viberatr/types';

interface ActiveFiltersBarProps {
  filters: Partial<SearchFilters>;
  onChange: (filters: Partial<SearchFilters>) => void;
  className?: string;
}

export function ActiveFiltersBar({
  filters,
  onChange,
  className,
}: ActiveFiltersBarProps) {
  const activeFilters: Array<{
    type: string;
    label: string;
    icon: React.ElementType;
    onRemove: () => void;
  }> = [];

  // Tags
  filters.tags?.forEach((tag: string) => {
    activeFilters.push({
      type: 'tag',
      label: tag,
      icon: Tag,
      onRemove: () => {
        const newTags = filters.tags?.filter((t: string) => t !== tag) ?? [];
        onChange({
          ...filters,
          tags: newTags.length > 0 ? newTags : undefined,
        });
      },
    });
  });

  // Rating
  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    let label = '';
    if (filters.minRating !== undefined && filters.maxRating !== undefined) {
      label = `${filters.minRating}-${filters.maxRating} stars`;
    } else if (filters.minRating !== undefined) {
      label = `${filters.minRating}+ stars`;
    } else if (filters.maxRating !== undefined) {
      label = `Up to ${filters.maxRating} stars`;
    }

    activeFilters.push({
      type: 'rating',
      label,
      icon: Star,
      onRemove: () => {
        onChange({ ...filters, minRating: undefined, maxRating: undefined });
      },
    });
  }

  // Date range
  if (filters.dateRange) {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const label =
      filters.dateRange.start === filters.dateRange.end
        ? formatDate(filters.dateRange.start)
        : `${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`;

    activeFilters.push({
      type: 'date',
      label,
      icon: Calendar,
      onRemove: () => {
        onChange({ ...filters, dateRange: undefined });
      },
    });
  }

  // Sort
  if (filters.sort && filters.sort !== 'relevance') {
    const sortLabels: Record<string, string> = {
      rating_desc: 'Highest rated',
      rating_asc: 'Lowest rated',
      recent: 'Most recent',
      oldest: 'Oldest first',
    };

    activeFilters.push({
      type: 'sort',
      label: sortLabels[filters.sort] || filters.sort,
      icon: () => <span className="text-xs">↕</span>,
      onRemove: () => {
        onChange({ ...filters, sort: undefined });
      },
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  const handleClearAll = () => {
    onChange({});
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">
          Active filters:
        </span>

        {activeFilters.map((filter, index) => {
          const Icon = filter.icon;
          return (
            <Badge
              key={`${filter.type}-${filter.label}-${index}`}
              variant="secondary"
              className="hover:bg-secondary/80 gap-1.5 pr-1 transition-colors"
            >
              <Icon className="h-3 w-3" />
              <span>{filter.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={filter.onRemove}
                className="h-auto w-auto p-0.5 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>

      <div className="text-muted-foreground mt-2 text-xs">
        {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''}{' '}
        applied
      </div>
    </div>
  );
}
