import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import { cn } from '@/utils/tailwind-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableServerPagination } from './data-table-server-pagination';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Filtering
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
  // Server-side pagination
  totalCount?: number;
  currentPage?: number;
  pageCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Actions
  onRowClick?: (row: TData) => void;
  onRowSelect?: (selectedRows: TData[]) => void;
  bulkActions?: Array<{
    label: string;
    action: (selectedRows: TData[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  // Export
  onExport?: () => void;
  exportLabel?: string;
  // Styling
  className?: string;
  // Loading state
  isLoading?: boolean;
  // Empty state
  emptyMessage?: string;
  // Row selection
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'search...',
  searchValue,
  onSearchValueChange,
  filters = [],
  totalCount,
  currentPage,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onRowSelect,
  bulkActions = [],
  onExport,
  exportLabel = 'export',
  className,
  isLoading = false,
  emptyMessage = 'no results.',
  enableRowSelection = true,
  enableMultiRowSelection = true,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Use server-side pagination if provided, otherwise use client-side
  const isServerPagination = onPageChange !== undefined;
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: enableRowSelection,
    enableMultiRowSelection: enableMultiRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: isServerPagination ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServerPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: isServerPagination ? undefined : getSortedRowModel(),
    manualPagination: isServerPagination,
    manualFiltering: isServerPagination,
    manualSorting: isServerPagination,
    pageCount: pageCount || -1,
    filterFns: {
      fuzzy: (row, columnId, value, addMeta) => {
        const itemValue = row.getValue(columnId) as string;
        return itemValue?.toLowerCase().includes(value.toLowerCase()) ?? false;
      },
    },
  });

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelect) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onRowSelect(selectedRows);
    }
  }, [rowSelection, onRowSelect, table]);

  return (
    <div className={cn('flex flex-col h-full space-y-4', className)}>
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchValueChange={onSearchValueChange}
        filters={filters}
        bulkActions={bulkActions}
        onExport={onExport}
        exportLabel={exportLabel}
        totalCount={totalCount}
      />
      
      <div className="rounded-md border bg-card flex-1 min-h-0 flex flex-col">
        <div className="relative overflow-auto flex-1">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                    )}
                    onClick={() => onRowClick && onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <p>{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {isServerPagination && totalCount !== undefined && currentPage !== undefined ? (
        <DataTableServerPagination
          totalCount={totalCount}
          currentPage={currentPage}
          pageCount={pageCount || 1}
          pageSize={pageSize || 10}
          onPageChange={onPageChange!}
          onPageSizeChange={onPageSizeChange!}
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          rowCount={data.length}
        />
      ) : (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}