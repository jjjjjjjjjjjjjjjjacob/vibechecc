/**
 * Lightweight date utilities to replace date-fns
 * Targeting ~2KB vs 30KB from date-fns
 */

/**
 * Format a date to a human-readable distance from now
 * @param date - The date to format
 * @param options - Options object with addSuffix boolean
 * @returns Formatted string like "2 hours ago" or "in 3 days"
 */
export function formatDistanceToNow(
  date: Date,
  options: { addSuffix?: boolean } = {}
): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isPast = diffMs > 0;
  const { addSuffix = false } = options;

  let result: string;

  if (diffYears > 0) {
    result = `${diffYears} year${diffYears > 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    result = `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else if (diffWeeks > 0) {
    result = `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    result = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    result = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    result = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    result = 'less than a minute';
  }

  if (addSuffix) {
    return isPast ? `${result} ago` : `in ${result}`;
  }

  return result;
}

/**
 * Format a date according to the given format string
 * Supports common patterns used in the app
 * @param date - The date to format
 * @param formatStr - The format pattern
 * @returns Formatted date string
 */
export function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthName = monthNames[month];
  const paddedMonth = String(month + 1).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  switch (formatStr) {
    case 'yyyy-MM-dd':
      return `${year}-${paddedMonth}-${paddedDay}`;
    case 'MMM d, yyyy':
      return `${monthName} ${day}, ${year}`;
    case 'MMM d':
      return `${monthName} ${day}`;
    case 'd, yyyy':
      return `${day}, ${year}`;
    default:
      // Fallback to ISO string for unsupported formats
      return date.toISOString().split('T')[0];
  }
}

/**
 * Subtract the specified number of days from the given date
 * @param date - The date to subtract from
 * @param amount - Number of days to subtract
 * @returns New date with days subtracted
 */
export function subDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - amount);
  return result;
}

/**
 * Return the start of a week for the given date
 * @param date - The original date
 * @param options - Options object with weekStartsOn (0 = Sunday, 1 = Monday)
 * @returns New date set to the start of the week
 */
export function startOfWeek(
  date: Date,
  options: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = {}
): Date {
  const { weekStartsOn = 0 } = options;
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Return the start of a month for the given date
 * @param date - The original date
 * @returns New date set to the first day of the month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Return the start of a year for the given date
 * @param date - The original date
 * @returns New date set to the first day of the year
 */
export function startOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}
