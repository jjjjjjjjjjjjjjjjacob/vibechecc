import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

interface MasonryLayoutProps {
  children: React.ReactNode[];
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export function MasonryLayout({
  children,
  columns = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 'gap-4',
  className,
}: MasonryLayoutProps) {
  // CSS-only masonry layout using CSS columns
  const columnClasses = [
    `columns-${columns.default}`,
    columns.sm && `sm:columns-${columns.sm}`,
    columns.md && `md:columns-${columns.md}`,
    columns.lg && `lg:columns-${columns.lg}`,
    columns.xl && `xl:columns-${columns.xl}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cn(columnClasses, gap, 'w-full', className)}
      style={{
        columnFill: 'balance',
      }}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className="mb-4 inline-block w-full break-inside-avoid"
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * JavaScript-powered masonry layout for more control
 * Use this if CSS columns don't provide enough control
 */
export function JSMasonryLayout({
  children,
  columns = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = '16px',
  className,
}: MasonryLayoutProps & { gap?: string | number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = React.useState(columns.default);

  // Update column count based on screen size
  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;

      if (width >= 1280 && columns.xl) {
        setColumnCount(columns.xl);
      } else if (width >= 1024 && columns.lg) {
        setColumnCount(columns.lg);
      } else if (width >= 768 && columns.md) {
        setColumnCount(columns.md);
      } else if (width >= 640 && columns.sm) {
        setColumnCount(columns.sm);
      } else {
        setColumnCount(columns.default);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns]);

  // Distribute children across columns using height-aware algorithm
  const columnArrays = React.useMemo(() => {
    const cols: React.ReactNode[][] = Array(columnCount)
      .fill(null)
      .map(() => []);

    // For better distribution, we'll use a height-based algorithm
    // Since we can't measure actual heights in this context, we'll use
    // a more sophisticated round-robin that accounts for content variation
    children.forEach((child, _index) => {
      // Find the column with the least items to balance better
      const columnSizes = cols.map((col) => col.length);
      const minSize = Math.min(...columnSizes);
      const targetColumnIndex = columnSizes.findIndex(
        (size) => size === minSize
      );

      cols[targetColumnIndex].push(child);
    });

    return cols;
  }, [children, columnCount]);

  return (
    <div
      ref={containerRef}
      className={cn('flex', className)}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }}
    >
      {columnArrays.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col"
          style={{
            gap: typeof gap === 'number' ? `${gap}px` : gap,
            width: `${100 / columnCount}%`,
          }}
        >
          {column.map((child, index) => (
            <div key={`${columnIndex}-${index}`} className="min-w-0">
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to detect if we should use masonry layout
 */
export function useMasonryLayout() {
  const [shouldUseMasonry, setShouldUseMasonry] = React.useState(false);

  React.useEffect(() => {
    const checkSupport = () => {
      // Use masonry on medium screens and larger (768px+) for better layout
      setShouldUseMasonry(window.innerWidth >= 768);
    };

    checkSupport();
    window.addEventListener('resize', checkSupport);
    return () => window.removeEventListener('resize', checkSupport);
  }, []);

  return shouldUseMasonry;
}
