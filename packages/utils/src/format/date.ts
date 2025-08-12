/**
 * Shared date formatting utilities
 */

/**
 * Formats a date string or Date object to a human-readable format
 * @param date - ISO string, timestamp, or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | number | Date): string {
  // convert primitive inputs into a Date instance
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  // guard against invalid date values
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  // format into a concise month/day/year string
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago")
 * @param date - ISO string, timestamp, or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | number | Date): string {
  // standardize input into a Date instance
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  // bail out on invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  // compute elapsed time between now and the given date
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // choose appropriate unit for relative description
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    // fall back to absolute formatting for older dates
    return formatDate(date);
  }
}

/**
 * Converts a date to ISO string format for consistent storage
 * @param date - Date object or date string
 * @returns ISO string
 */
export function toISOString(date: Date | string): string {
  // normalize string inputs to Date before converting
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
}
