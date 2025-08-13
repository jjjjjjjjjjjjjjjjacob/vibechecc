import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  flexRender,
  type ColumnDef,
  type HeaderContext,
  type CellContext,
} from '@tanstack/react-table';
import { cn } from '@/utils/tailwind-utils';

interface VirtualDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  containerHeight?: number;
  rowHeight?: number;
  className?: string;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
}

export function VirtualDataTable<TData>({
  data,
  columns,
  containerHeight = 400,
  rowHeight = 50,
  className,
  onRowClick,
  getRowId,
}: VirtualDataTableProps<TData>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // Don't use virtualization for small datasets
  if (data.length < 100) {
    return (
      <div className={cn('rounded-md border', className)}>
        <div className="overflow-auto" style={{ maxHeight: containerHeight }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>
                    {flexRender(column.header, {
                      column,
                    } as unknown as HeaderContext<TData, unknown>)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={getRowId ? getRowId(row) : index}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && 'hover:bg-muted/50 cursor-pointer'
                  )}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {flexRender(column.cell, {
                        row: { original: row },
                        getValue: () =>
                          (row as Record<string, unknown>)[column.id || ''],
                        cell: {} as CellContext<TData, unknown>['cell'],
                        column: {} as CellContext<TData, unknown>['column'],
                        table: {} as CellContext<TData, unknown>['table'],
                        renderValue: () => null,
                      } as CellContext<TData, unknown>)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Use virtual scrolling for large datasets
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalHeight - (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0;

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {flexRender(column.header, {
                  column,
                } as unknown as HeaderContext<TData, unknown>)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <Table>
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <TableRow
                  key={getRowId ? getRowId(row) : virtualRow.index}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && 'hover:bg-muted/50 cursor-pointer'
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {flexRender(column.cell, {
                        row: { original: row },
                        getValue: () =>
                          (row as Record<string, unknown>)[column.id || ''],
                        cell: {} as CellContext<TData, unknown>['cell'],
                        column: {} as CellContext<TData, unknown>['column'],
                        table: {} as CellContext<TData, unknown>['table'],
                        renderValue: () => null,
                      } as CellContext<TData, unknown>)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
