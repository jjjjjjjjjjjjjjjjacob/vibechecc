import { ClassValue } from 'clsx';

/**
 * Combines multiple class names with proper Tailwind CSS merging
 * @param inputs - Class names or conditional class values
 * @returns Merged and deduplicated class string
 */
declare function cn(...inputs: ClassValue[]): string;

export { cn };
