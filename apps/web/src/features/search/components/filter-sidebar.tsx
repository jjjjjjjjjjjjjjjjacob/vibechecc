import { Card } from '@/components/ui/card';
import { SearchFilters } from './search-filters';
import type { SearchFilters as SearchFiltersType } from '@vibechecc/types';

interface FilterSidebarProps {
  filters: Partial<SearchFiltersType>;
  onChange: (filters: Partial<SearchFiltersType>) => void;
  availableTags?: string[];
  className?: string;
}

export function FilterSidebar({ filters, onChange, availableTags, className }: FilterSidebarProps) {
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