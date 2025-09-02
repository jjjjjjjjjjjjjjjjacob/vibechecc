import { lazy, Suspense, type PropsWithChildren } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

// Lazy load heavy components that aren't needed immediately
// Note: These lazy components are for development/testing purposes
// In production, consider using proper component lazy loading
export const LazyRechartsComponents = lazy(() =>
  import('recharts').then((module) => ({
    default: module.LineChart as React.ComponentType<
      PropsWithChildren<Record<string, unknown>>
    >,
  }))
);

export const LazyEmojiPicker = lazy(() =>
  import('@/features/ratings/components/emoji-search-collapsible').then(
    (module) => ({
      default: module.EmojiSearchCollapsible as React.ComponentType<
        { onSelect: (emoji: string) => void } & Record<string, unknown>
      >,
    })
  )
);

// React Table doesn't export a default component, this is for development only
export const LazyDataTable = lazy(() =>
  Promise.resolve({
    default: (() => <div>Data Table Component</div>) as React.ComponentType<
      PropsWithChildren<Record<string, unknown>>
    >,
  })
);

// Admin components don't export a default component, this is for development only
export const LazyAdminComponents = lazy(() =>
  Promise.resolve({
    default: (() => (
      <div>Admin Components</div>
    )) as React.ComponentType<unknown>,
  })
);

// Loading fallbacks for different component types
export function ChartSkeleton() {
  return (
    <Card className="h-[300px] w-full animate-pulse">
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-[250px] w-[90%]" />
      </div>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-[100px]" />
        </div>
      ))}
    </div>
  );
}

export function EmojiPickerSkeleton() {
  return (
    <div className="grid grid-cols-8 gap-2 p-4">
      {Array.from({ length: 32 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded-full" />
      ))}
    </div>
  );
}

// Wrapper components with built-in suspense
export function LazyChart({
  children,
  ...props
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LazyRechartsComponents {...props}>{children}</LazyRechartsComponents>
    </Suspense>
  );
}

export function LazyTable({
  children,
  ...props
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <LazyDataTable {...props}>{children}</LazyDataTable>
    </Suspense>
  );
}

export function LazyEmojiPickerWrapper({
  onSelect,
  ...props
}: { onSelect: (emoji: string) => void } & Record<string, unknown>) {
  return (
    <Suspense fallback={<EmojiPickerSkeleton />}>
      <LazyEmojiPicker onSelect={onSelect} {...props} />
    </Suspense>
  );
}
