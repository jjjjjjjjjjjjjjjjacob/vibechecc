import { useEffect, useState } from 'react';

/**
 * React hook that returns a debounced version of a value.
 *
 * The hook updates the debounced value only after the specified delay has
 * elapsed without the value changing.  This is useful for delaying expensive
 * operations like API calls until a user stops typing.
 *
 * @param value - the current value that should be debounced
 * @param delay - milliseconds to wait before updating, defaults to 300ms
 * @returns the most recent value after the debounce delay has passed
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  // Hold the value that will be exposed to consumers after the debounce delay
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Start a timer that will update the state after the delay; if the effect
    // runs again before the delay finishes, the previous timer is cleared
    const timer = setTimeout(() => {
      // When the timer completes, sync the debounced value with the latest input
      setDebouncedValue(value);
    }, delay);

    // Cleanup function runs when value or delay changes or component unmounts;
    // it cancels the pending timer to avoid updating with stale values
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  // Expose the debounced value so callers can use it in place of the raw input
  return debouncedValue;
}
