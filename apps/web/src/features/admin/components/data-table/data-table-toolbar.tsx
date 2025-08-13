import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { X, Download, Settings2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  filters?: Array<{
    key: string;
    title: string;
    options: Array<{
      label: string;
      value: string;
    }>;
    value?: string;
    onChange?: (value: string) => void;
  }>;
  bulkActions?: Array<{
    label: string;
    action: (selectedRows: TData[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  onExport?: () => void;
  exportLabel?: string;
  totalCount?: number;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = 'search...',
  searchValue,
  onSearchValueChange,
  filters = [],
  bulkActions = [],
  onExport,
  exportLabel = 'export',
  totalCount,
}: DataTableToolbarProps<TData>) {
  const isServerMode =
    searchValue !== undefined || filters.some((f) => f.value !== undefined);
  const isFiltered = isServerMode
    ? (searchValue || '') !== '' ||
      filters.some((f) => f.value && f.value !== 'all')
    : table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row - Search and Export */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Search input - supports both server and client mode */}
          {(searchKey || onSearchValueChange) && (
            <Input
              placeholder={searchPlaceholder}
              value={
                isServerMode && searchValue !== undefined
                  ? searchValue
                  : ((table
                      .getColumn(searchKey || '')
                      ?.getFilterValue() as string) ?? '')
              }
              onChange={(event) => {
                if (onSearchValueChange) {
                  onSearchValueChange(event.target.value);
                } else if (searchKey) {
                  table
                    .getColumn(searchKey)
                    ?.setFilterValue(event.target.value);
                }
              }}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}

          {/* Filter dropdowns - supports both server and client mode */}
          {filters.map((filter) => {
            if (isServerMode) {
              // Server mode - use provided value and onChange
              return (
                <Select
                  key={filter.key}
                  value={filter.value || 'all'}
                  onValueChange={(value) => {
                    if (filter.onChange) {
                      filter.onChange(value);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder={filter.title} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            } else {
              // Client mode - use table column filters
              const column = table.getColumn(filter.key);
              if (!column) return null;

              return (
                <Select
                  key={filter.key}
                  value={(column.getFilterValue() as string) ?? ''}
                  onValueChange={(value) =>
                    column.setFilterValue(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder={filter.title} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      all {filter.title.toLowerCase()}
                    </SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }
          })}

          {/* Clear filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                if (isServerMode) {
                  // In server mode, call the onChange handlers with default values
                  if (onSearchValueChange) onSearchValueChange('');
                  filters.forEach((filter) => {
                    if (filter.onChange) filter.onChange('all');
                  });
                } else {
                  // In client mode, reset table filters
                  table.resetColumnFilters();
                }
              }}
              className="h-8 px-2 lg:px-3"
            >
              reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Export button */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportLabel}
            </Button>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <Settings2 className="mr-2 h-4 w-4" />
                view
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom row - Bulk actions and active filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Selection counter */}
          {selectedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedRows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </Badge>

              {/* Bulk actions */}
              {bulkActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() =>
                    action.action(selectedRows.map((row) => row.original))
                  }
                  className="h-8"
                >
                  {action.label}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetRowSelection()}
                className="h-8"
              >
                clear selection
              </Button>
            </div>
          )}
        </div>

        {/* Results counter */}
        {totalCount !== undefined && (
          <div className="text-muted-foreground text-xs">
            {totalCount} result(s)
          </div>
        )}
      </div>
    </div>
  );
}
