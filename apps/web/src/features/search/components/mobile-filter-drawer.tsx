/**
 * mobile filter drawer module.
 * enhanced documentation for clarity and maintenance.
 */
import { Filter } from 'lucide-react';
// standard button and badge primitives for trigger and count display
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// drawer primitives compose the slide-up filter panel
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
import type { SearchFilters as SearchFiltersType } from '@viberatr/types';

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
  // count how many filter categories are currently active
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
          filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>filter results</DrawerTitle>
          <DrawerDescription>
            narrow down your search results by applying filters
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
            {/* confirm filter selection and close drawer */}
            <Button>apply filters</Button>
          </DrawerClose>
          <DrawerClose asChild>
            {/* discard changes and close drawer */}
            <Button variant="outline">cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
