import * as React from 'react'; // react primitives for state and effects
import { cn } from '@/utils/tailwind-utils'; // helper to conditionally join tailwind class names

/**
 * Shared props for both masonry layout implementations.
 * - `children`: the items to position in the masonry grid
 * - `columns`: responsive column counts keyed by breakpoint
 * - `gap`: tailwind gap utility controlling space between items
 * - `className`: additional classes applied to the container
 */
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

/**
 * Masonry layout implemented purely with CSS columns.
 * This is lightweight but offers less control over item placement.
 */
export function MasonryLayout({
  children,
  columns = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 }, // default responsive column counts
  gap = 'gap-4', // tailwind class controlling vertical and horizontal gaps
  className,
}: MasonryLayoutProps) {
  // Build a string of responsive `columns-*` utilities based on provided config
  const columnClasses = [
    `columns-${columns.default}`,
    columns.sm && `sm:columns-${columns.sm}`,
    columns.md && `md:columns-${columns.md}`,
    columns.lg && `lg:columns-${columns.lg}`,
    columns.xl && `xl:columns-${columns.xl}`,
  ]
    .filter(Boolean) // remove undefined entries
    .join(' '); // join into a single string that cn can consume

  return (
    <div
      className={cn(columnClasses, gap, 'w-full', className)} // apply layout and spacing classes
      style={{
        columnFill: 'balance', // let browser balance column heights automatically
      }}
    >
      {children.map((child, index) => (
        <div
          key={index} // key each child for React reconciliation
          className="mb-4 inline-block w-full break-inside-avoid" // prevent items from splitting across columns
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
  columns = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 }, // same responsive defaults as CSS version
  gap = '16px', // pixel gap between items
  className,
}: MasonryLayoutProps & { gap?: string | number }) {
  const containerRef = React.useRef<HTMLDivElement>(null); // reference to the flex container
  const [columnCount, setColumnCount] = React.useState(columns.default); // track how many columns to render

  // adjust column count whenever the viewport width changes
  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth; // current viewport width

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

    updateColumns(); // initialize on mount
    window.addEventListener('resize', updateColumns); // listen for resizes
    return () => window.removeEventListener('resize', updateColumns); // clean up listener
  }, [columns]);

  // distribute children among columns in a balanced way
  const columnArrays = React.useMemo(() => {
    const cols: React.ReactNode[][] = Array(columnCount)
      .fill(null) // create empty buckets for each column
      .map(() => []);

    // choose the column with the fewest items for each child
    children.forEach((child, _index) => {
      const columnSizes = cols.map((col) => col.length);
      const minSize = Math.min(...columnSizes);
      const targetColumnIndex = columnSizes.findIndex(
        (size) => size === minSize
      );

      cols[targetColumnIndex].push(child); // place child into the shortest column
    });

    return cols; // array of columns each containing its children
  }, [children, columnCount]);

  return (
    <div
      ref={containerRef} // expose container for potential future measurements
      className={cn('flex', className)}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }} // apply configurable gap between columns
    >
      {columnArrays.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col" // each column is a flex column that can shrink
          style={{
            gap: typeof gap === 'number' ? `${gap}px` : gap,
            width: `${100 / columnCount}%`, // split container width evenly between columns
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
  const [shouldUseMasonry, setShouldUseMasonry] = React.useState(false); // whether caller should render masonry version

  React.useEffect(() => {
    const checkSupport = () => {
      // enable masonry layout on medium screens and larger (768px+)
      setShouldUseMasonry(window.innerWidth >= 768);
    };

    checkSupport(); // run once on mount
    window.addEventListener('resize', checkSupport); // update on viewport changes
    return () => window.removeEventListener('resize', checkSupport); // clean up listener on unmount
  }, []);

  return shouldUseMasonry; // expose boolean flag to caller
}
