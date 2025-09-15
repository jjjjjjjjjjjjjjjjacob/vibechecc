// Formatting utilities for vibechecc app

// Date formatting utilities
export const dateUtils = {
  // Format date for display
  formatDate: (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  },

  // Format date and time for display
  formatDateTime: (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime: (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    // Just now (< 1 minute)
    if (diffInSeconds < 60) {
      return 'Just now';
    }

    // Minutes ago
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    // Hours ago
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    // Days ago
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    // Weeks ago
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }

    // Months ago
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }

    // Years ago
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  },

  // Format time only
  formatTime: (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid time';

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  },

  // Check if date is today
  isToday: (date: Date | string | number): boolean => {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  },

  // Check if date is this week
  isThisWeek: (date: Date | string | number): boolean => {
    const d = new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return d >= startOfWeek && d <= endOfWeek;
  },
};

// Number formatting utilities
export const numberUtils = {
  // Format large numbers with K, M, B suffixes
  formatCount: (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    if (count < 1000000000) return `${(count / 1000000).toFixed(1)}M`;
    return `${(count / 1000000000).toFixed(1)}B`;
  },

  // Format rating (e.g., 4.2/5)
  formatRating: (rating: number, maxRating: number = 5): string => {
    return `${rating.toFixed(1)}/${maxRating}`;
  },

  // Format percentage
  formatPercentage: (value: number, total: number): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  },

  // Format duration in seconds to readable format
  formatDuration: (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  },
};

// Text formatting utilities
export const textUtils = {
  // Truncate text with ellipsis
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
  },

  // Truncate text at word boundaries
  truncateWords: (text: string, maxWords: number): string => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}...`;
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  // Convert to title case
  titleCase: (text: string): string => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Extract hashtags from text
  extractHashtags: (text: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  },

  // Extract mentions from text
  extractMentions: (text: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  },

  // Highlight hashtags and mentions in text
  highlightTags: (text: string): string => {
    return text
      .replace(/#([a-zA-Z0-9_]+)/g, '<span class="hashtag">#$1</span>')
      .replace(/@([a-zA-Z0-9_]+)/g, '<span class="mention">@$1</span>');
  },

  // Clean text for display
  cleanText: (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines with double newline
  },

  // Generate slug from text
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },

  // Get reading time estimate
  getReadingTime: (text: string): string => {
    const wordsPerMinute = 200;
    const wordCount = text.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  },
};

// User display utilities
export const userUtils = {
  // Get user display name
  getDisplayName: (user: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  }): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if (user.username) {
      return `@${user.username}`;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Anonymous User';
  },

  // Get user initials
  getInitials: (user: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  }): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }

    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }

    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return 'U';
  },

  // Format username with @ prefix
  formatUsername: (username?: string): string => {
    if (!username) return '';
    return username.startsWith('@') ? username : `@${username}`;
  },

  // Get user avatar URL or fallback
  getAvatarUrl: (user: { imageUrl?: string }, fallbackSize: number = 40): string => {
    if (user.imageUrl) {
      return user.imageUrl;
    }

    // Generate a placeholder avatar URL
    const initials = userUtils.getInitials(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${fallbackSize}&background=random`;
  },
};

// Color utilities
export const colorUtils = {
  // Generate consistent color for a string (useful for user avatars)
  getColorForString: (str: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  },

  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  // Get contrasting text color for background
  getContrastColor: (backgroundColor: string): string => {
    const rgb = colorUtils.hexToRgb(backgroundColor);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },
};

// URL utilities
export const urlUtils = {
  // Extract domain from URL
  getDomain: (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  },

  // Check if URL is valid
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Add protocol to URL if missing
  addProtocol: (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  },

  // Extract filename from URL
  getFilename: (url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || '';
    } catch {
      return '';
    }
  },
};

// Mobile-specific formatting utilities
export const mobileUtils = {
  // Format for mobile display (shorter text)
  formatForMobile: (text: string, maxLength: number = 50): string => {
    return textUtils.truncate(text, maxLength);
  },

  // Format count for mobile (more aggressive abbreviation)
  formatMobileCount: (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${Math.floor(count / 1000)}K`;
    return `${Math.floor(count / 1000000)}M`;
  },

  // Check if device is mobile (basic detection)
  isMobile: (): boolean => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  },

  // Format for touch-friendly display
  formatForTouch: (text: string): string => {
    // Add extra spacing or formatting for touch interfaces
    return text;
  },
};