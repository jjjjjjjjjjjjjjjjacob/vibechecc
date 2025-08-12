import { useEffect, useRef, useCallback } from 'react';

/**
 * Options to configure the `useInfiniteScroll` hook.
 *
 * @property hasNextPage - whether there are more pages to load
 * @property isFetchingNextPage - whether a fetch is currently in progress
 * @property fetchNextPage - function that loads the next page of data
 * @property rootMargin - margin around the root for the intersection observer
 * @property threshold - percentage of the target's visibility to trigger fetch
 */
interface UseInfiniteScrollOptions {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
  threshold?: number;
}

/**
 * React hook that observes a DOM element and triggers `fetchNextPage` when the
 * element enters the viewport.
 *
 * It uses the Intersection Observer API under the hood and exposes a ref that
 * should be attached to a sentinel div placed at the end of a list.
 */
export function useInfiniteScroll({
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  rootMargin = '100px',
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  // Hold a reference to the observer so it can be disconnected later
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Expose a ref for the element that should trigger loading more items
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Callback that fires whenever the observer detects intersection changes
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries; // only observing a single element
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        // If the sentinel is visible and we can load more, request next page
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return; // do nothing if no target element is attached

    // Create the observer with the provided options
    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });

    // Begin observing the target element
    observerRef.current.observe(element);

    // Clean up observer when dependencies change or component unmounts
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, rootMargin, threshold]);

  // Return the ref so consumers can attach it to their sentinel element
  return elementRef;
}
