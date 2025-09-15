// App constants and configuration for vibechecc

// App metadata
export const APP_INFO = {
  name: 'vibechecc',
  displayName: 'Vibechecc',
  version: '1.0.0',
  description: 'Share and rate life vibes',
  website: 'https://vibechecc.com',
  supportEmail: 'support@vibechecc.com',
} as const;

// API configuration
export const API_CONFIG = {
  defaultTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  vibesLimit: 20,
  usersLimit: 15,
  notificationsLimit: 25,
  searchResultsLimit: 20,
} as const;

// Content limits
export const CONTENT_LIMITS = {
  vibe: {
    titleMin: 1,
    titleMax: 100,
    contentMin: 10,
    contentMax: 2000,
    hashtagsMax: 10,
    hashtagLengthMax: 30,
  },
  user: {
    usernameMin: 3,
    usernameMax: 30,
    displayNameMax: 50,
    bioMax: 300,
    interestsMax: 20,
  },
  rating: {
    min: 1,
    max: 5,
    reviewMin: 10,
    reviewMax: 500,
  },
  search: {
    queryMax: 100,
    tagsMax: 10,
  },
  comment: {
    min: 1,
    max: 300,
  },
} as const;

// Rating system
export const RATING_SYSTEM = {
  minRating: 1,
  maxRating: 5,
  defaultRating: 3,
  ratingSteps: 1,
  emojiRatings: [
    { emoji: '😍', value: 5, label: 'Amazing' },
    { emoji: '😊', value: 4, label: 'Great' },
    { emoji: '😐', value: 3, label: 'Okay' },
    { emoji: '😕', value: 2, label: 'Meh' },
    { emoji: '😢', value: 1, label: 'Awful' },
  ],
  popularEmojis: ['❤️', '🔥', '👏', '😂', '😍', '🤔', '👍', '🎉'],
} as const;

// Theme configuration
export const THEME_CONFIG = {
  defaultTheme: 'system' as const,
  themes: ['light', 'dark', 'system'] as const,
  primaryColors: [
    'purple-primary',
    'pink-primary',
    'blue-primary',
    'emerald-primary',
    'orange-primary',
    'red-primary',
    'indigo-primary',
    'teal-primary',
    'slate-primary',
    'amber-primary',
    'lime-primary',
    'cyan-primary',
    'violet-primary',
    'fuchsia-primary',
    'green-primary',
    'yellow-primary',
  ] as const,
  defaultPrimaryColor: null,
} as const;

// Navigation configuration
export const NAVIGATION = {
  defaultRoute: '/',
  authRequiredRoutes: ['/profile', '/settings', '/create'],
  publicRoutes: ['/', '/vibes', '/search', '/auth'],
  tabRoutes: {
    home: '/',
    vibes: '/vibes',
    search: '/search',
    notifications: '/notifications',
    profile: '/profile',
  },
  maxHistoryItems: 50,
  maxTabHistory: 10,
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  debounceMs: 150,
  suggestionsDebounceMs: 300,
  maxRecentSearches: 20,
  maxSavedSearches: 50,
  maxFilterPresets: 10,
  trendingUpdateInterval: 30 * 60 * 1000, // 30 minutes
  validSortOptions: [
    'relevance',
    'recent',
    'rating_desc',
    'rating_asc',
    'top_rated',
    'most_rated',
    'name',
    'creation_date',
    'interaction_time',
    'oldest',
  ] as const,
  filters: {
    rating: {
      min: 1,
      max: 5,
      step: 0.1,
    },
    date: {
      presets: ['today', 'week', 'month', 'year', 'all'],
    },
  },
} as const;

// Notification configuration
export const NOTIFICATIONS = {
  types: [
    'rating',
    'new_rating',
    'new_vibe',
    'follow',
    'mention',
    'system',
  ] as const,
  maxNotifications: 100,
  markReadDelay: 2000, // 2 seconds
  batchSize: 25,
  defaultPreferences: {
    rating: true,
    new_rating: true,
    new_vibe: false,
    follow: true,
    mention: true,
    system: true,
  },
  pushNotifications: {
    requestDelay: 3000, // 3 seconds after app load
    reminderDelay: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// File upload configuration
export const FILE_UPLOAD = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  acceptedTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/webm'],
    documents: ['application/pdf', 'text/plain'],
  },
  imageQuality: 0.8,
  maxImageDimensions: {
    width: 1920,
    height: 1080,
  },
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  longTTL: 30 * 60 * 1000, // 30 minutes
  shortTTL: 1 * 60 * 1000, // 1 minute
  staleTime: {
    vibes: 2 * 60 * 1000, // 2 minutes
    users: 10 * 60 * 1000, // 10 minutes
    ratings: 5 * 60 * 1000, // 5 minutes
    search: 30 * 1000, // 30 seconds
    notifications: 1 * 60 * 1000, // 1 minute
  },
  gcTime: {
    default: 10 * 60 * 1000, // 10 minutes
    long: 30 * 60 * 1000, // 30 minutes
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  upload: 'File upload failed. Please try again.',
  generic: 'Something went wrong. Please try again.',
  offline: 'You are currently offline. Some features may not work.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  vibeCreated: 'Vibe created successfully! 🎉',
  vibeUpdated: 'Vibe updated successfully!',
  vibeDeleted: 'Vibe deleted successfully.',
  profileUpdated: 'Profile updated successfully!',
  ratingAdded: 'Rating added successfully!',
  followed: 'User followed successfully! 🎉',
  unfollowed: 'User unfollowed successfully.',
  saved: 'Saved successfully!',
  copied: 'Copied to clipboard!',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  enableEmojiRatings: true,
  enableVideoUpload: false,
  enablePushNotifications: true,
  enableAnalytics: true,
  enableBetaFeatures: false,
  enableOfflineMode: true,
  enableBiometricAuth: true,
  enableSocialLogin: true,
  enableWebPush: true,
  enableDarkMode: true,
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  // User events
  userSignUp: 'user_sign_up',
  userSignIn: 'user_sign_in',
  userSignOut: 'user_sign_out',
  profileView: 'profile_view',
  profileUpdate: 'profile_update',

  // Vibe events
  vibeCreate: 'vibe_create',
  vibeView: 'vibe_view',
  vibeUpdate: 'vibe_update',
  vibeDelete: 'vibe_delete',
  vibeShare: 'vibe_share',

  // Rating events
  ratingAdd: 'rating_add',
  ratingUpdate: 'rating_update',
  ratingView: 'rating_view',

  // Social events
  userFollow: 'user_follow',
  userUnfollow: 'user_unfollow',

  // Search events
  search: 'search',
  searchResultClick: 'search_result_click',

  // Navigation events
  pageView: 'page_view',
  linkClick: 'link_click',

  // Error events
  error: 'error',
  apiError: 'api_error',
} as const;

// Development configuration
export const DEV_CONFIG = {
  enableDevTools: process.env.NODE_ENV === 'development',
  enableMockData: false,
  enableDebugLogs: process.env.NODE_ENV === 'development',
  apiDelay: 0, // Artificial delay for testing
  mockUsers: 50,
  mockVibes: 100,
} as const;

// Mobile-specific configuration
export const MOBILE_CONFIG = {
  hapticFeedback: true,
  statusBarStyle: 'auto',
  orientation: 'portrait',
  tabBarHeight: 60,
  headerHeight: 56,
  bottomSheetSnapPoints: [0.3, 0.7, 1.0],
  swipeGestures: {
    enabled: true,
    threshold: 50,
  },
  pullToRefresh: {
    enabled: true,
    threshold: 80,
  },
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_-]+$/,
  hashtag: /#([a-zA-Z0-9_]+)/g,
  mention: /@([a-zA-Z0-9_]+)/g,
  url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  phoneNumber: /^\+?[\d\s\-\(\)]+$/,
} as const;

// Time constants
export const TIME_CONSTANTS = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
} as const;

// Export all constants
export default {
  APP_INFO,
  API_CONFIG,
  PAGINATION,
  CONTENT_LIMITS,
  RATING_SYSTEM,
  THEME_CONFIG,
  NAVIGATION,
  SEARCH_CONFIG,
  NOTIFICATIONS,
  FILE_UPLOAD,
  CACHE_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURE_FLAGS,
  ANALYTICS_EVENTS,
  DEV_CONFIG,
  MOBILE_CONFIG,
  REGEX_PATTERNS,
  TIME_CONSTANTS,
} as const;