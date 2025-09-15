import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value by delaying updates for a specified amount of time.
 * Useful for search inputs and other scenarios where you want to reduce the
 * frequency of expensive operations.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay is reached
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function by delaying execution for a specified amount of time.
 * The callback will only be called once after the delay, even if called multiple times.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Clear the previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

/**
 * Hook that provides both immediate and debounced values.
 * Useful when you need to show immediate feedback but perform expensive operations with debouncing.
 */
export function useImmediateAndDebouncedValue<T>(
  value: T,
  delay: number
): {
  immediate: T;
  debounced: T;
  isPending: boolean;
} {
  const [immediateValue, setImmediateValue] = useState<T>(value);
  const debouncedValue = useDebouncedValue(value, delay);

  useEffect(() => {
    setImmediateValue(value);
  }, [value]);

  return {
    immediate: immediateValue,
    debounced: debouncedValue,
    isPending: immediateValue !== debouncedValue,
  };
}