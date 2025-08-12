import { useEffect, useState } from 'react';

/**
 * React hook that tracks whether a given CSS media query currently matches.
 *
 * @param query - the media query string to evaluate, e.g. '(min-width: 768px)'
 * @returns `true` if the query matches the current window dimensions
 */
export function useMediaQuery(query: string): boolean {
  // Track the match state; initialize synchronously on mount for SSR safety
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      // For client-side rendering, we can compute the initial value
      return window.matchMedia(query).matches;
    }
    // On the server we default to false since no window is available
    return false;
  });

  useEffect(() => {
    // If we somehow run in a non-browser environment, exit early
    if (typeof window === 'undefined') {
      return;
    }

    // Create a MediaQueryList object for the provided query
    const mediaQuery = window.matchMedia(query);
    // Update the state whenever the media query's evaluation result changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state in case it differs from the value computed in useState
    setMatches(mediaQuery.matches);

    // Modern browsers expose addEventListener/removeEventListener; use them
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Older browsers use addListener/removeListener; fall back to those
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  // Return whether the media query currently matches so components can respond
  return matches;
}
