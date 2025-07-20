import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SearchFilters } from './search-filters';
import type { SearchFilters as SearchFiltersType } from '@vibechecc/types';

interface MobileFilterDrawerProps {
  filters: Partial<SearchFiltersType>;
  onChange: (filters: Partial<SearchFiltersType>) => void;
  availableTags?: string[];
}

export function MobileFilterDrawer({
  filters,
  onChange,
  availableTags,
}: MobileFilterDrawerProps) {
  const activeFilterCount = [
    filters.tags?.length || 0,
    filters.minRating ? 1 : 0,
    filters.dateRange ? 1 : 0,
    filters.sort && filters.sort !== 'relevance' ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Results</DrawerTitle>
          <DrawerDescription>
            Narrow down your search results by applying filters
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
          <SearchFilters
            filters={filters}
            onChange={onChange}
            availableTags={availableTags?.map((tag) => ({
              name: tag,
              count: 0,
            }))}
          />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Apply Filters</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
