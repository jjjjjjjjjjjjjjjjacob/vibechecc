import { cn } from '@/utils/tailwind-utils'; // helper for conditional class names

/**
 * Simple rectangular skeleton placeholder.
 * @param className optional Tailwind classes to size or style the skeleton
 * @param props forwarded to the underlying `div`
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton" // mark element for styling hooks or tests
      className={cn('bg-accent animate-pulse rounded-md', className)} // pulsing gray box
      {...props} // allow consumers to pass additional attributes
    />
  );
}

export { Skeleton }; // named export for consistency with other ui primitives
