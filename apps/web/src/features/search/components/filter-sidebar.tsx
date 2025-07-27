import { Card } from '@/components/ui/card';
import { SearchFilters } from './search-filters';
import type { SearchFilters as SearchFiltersType } from '@viberater/types';

interface FilterSidebarProps {
  filters: Partial<SearchFiltersType>;
  onChange: (filters: Partial<SearchFiltersType>) => void;
  availableTags?: Array<{ name: string; count: number }>;
  className?: string;
}

export function FilterSidebar({
  filters,
  onChange,
  availableTags,
  className,
}: FilterSidebarProps) {
  return (
    <Card className={className}>
      <div className="p-6">
        <SearchFilters
          filters={filters}
          onChange={onChange}
          availableTags={availableTags}
        />
      </div>
    </Card>
  );
}
