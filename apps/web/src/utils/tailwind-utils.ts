import { clsx, type ClassValue } from 'clsx'; // utility for conditionally joining class names
import { twMerge } from 'tailwind-merge'; // intelligently merge Tailwind classes

/**
 * Combine an arbitrary number of Tailwind class values into a single string.
 *
 * `clsx` handles truthy/falsy inputs while `twMerge` resolves conflicting
 * utility classes, ensuring the final string has the right precedence.
 */
export function cn(...inputs: ClassValue[]) {
  // first join the inputs using clsx then resolve Tailwind conflicts
  return twMerge(clsx(inputs));
}
