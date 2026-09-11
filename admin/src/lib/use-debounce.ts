import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a rapidly changing value (e.g. search inputs).
 * Delays updating the returned value until the specified delay has passed
 * without any new changes.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
