// Re-export types from @vibechecc/types for convenience
export * from '@vibechecc/types';

// Platform-specific types
export interface PlatformInfo {
  platform: 'web' | 'mobile';
  os?: 'ios' | 'android' | 'windows' | 'macos' | 'linux';
  version?: string;
  userAgent?: string;
}

// Mobile-specific types
export interface MobileDeviceInfo {
  deviceId: string;
  deviceName: string;
  systemName: string;
  systemVersion: string;
  brand: string;
  model: string;
  isTablet: boolean;
  hasNotch: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

// Offline state
export interface OfflineState {
  isOnline: boolean;
  lastOnlineAt: Date | null;
  pendingActions: PendingAction[];
  syncInProgress: boolean;
  syncErrors: SyncError[];
}

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'vibe' | 'rating' | 'user' | 'follow';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncError {
  id: string;
  action: PendingAction;
  error: Error;
  timestamp: Date;
}

// Performance monitoring
export interface PerformanceMetrics {
  appLaunchTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  largestContentfulPaint: number;
  memoryUsage?: number;
  batteryLevel?: number;
}

// Analytics event
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  platform: PlatformInfo;
}

// Cache entry
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  ttl: number;
  key: string;
  size?: number;
}

// Query state
export interface QueryState<T = any> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
}

// Infinite query state
export interface InfiniteQueryState<T = any> {
  pages: T[];
  pageParams: any[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
}

// Form state
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

// Theme state
export interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string | null;
  secondaryColor: string | null;
  resolvedMode: 'light' | 'dark';
  isHighContrast: boolean;
  reducedMotion: boolean;
}

// Navigation state
export interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  params: Record<string, any>;
  history: NavigationHistoryItem[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface NavigationHistoryItem {
  route: string;
  params: Record<string, any>;
  timestamp: Date;
  title?: string;
}

// Modal/Sheet state
export interface ModalState {
  id: string;
  component: string;
  props?: Record<string, any>;
  isOpen: boolean;
  canDismiss: boolean;
  onDismiss?: () => void;
}

export interface SheetState extends ModalState {
  snapPoints: number[];
  currentSnap?: number;
}

// Notification state
export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isVisible: boolean;
  duration?: number;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'default' | 'destructive';
}

// Search state
export interface SearchState {
  query: string;
  results: SearchResults | null;
  isSearching: boolean;
  suggestions: string[];
  recentSearches: string[];
  savedSearches: SavedSearch[];
  filters: SearchFilters;
}

export interface SearchResults {
  vibes: any[];
  users: any[];
  tags: string[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
  notificationEnabled: boolean;
}

// API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    cursor?: string;
  };
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

// Feature flag
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  description?: string;
}

// A/B test
export interface ABTest {
  id: string;
  name: string;
  variant: string;
  isControl: boolean;
  startDate: Date;
  endDate?: Date;
  conversionGoal?: string;
}

// User preferences
export interface UserPreferences {
  theme: ThemeState;
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationPreferences {
  rating: boolean;
  newRating: boolean;
  newVibe: boolean;
  follow: boolean;
  mention: boolean;
  system: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showActivity: boolean;
  allowFollows: boolean;
  allowMentions: boolean;
  dataCollection: boolean;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  colorBlindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// Biometric authentication (mobile)
export interface BiometricInfo {
  isAvailable: boolean;
  supportedTypes: BiometricType[];
  isEnrolled: boolean;
  securityLevel: 'weak' | 'strong';
}

export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'voice';

// Deep linking
export interface DeepLinkInfo {
  url: string;
  route: string;
  params: Record<string, any>;
  isHandled: boolean;
  timestamp: Date;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  category?: string;
  threadId?: string;
}

// File upload state
export interface FileUploadState {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

// Gesture state (mobile)
export interface GestureState {
  isPanning: boolean;
  isScaling: boolean;
  isRotating: boolean;
  velocity: { x: number; y: number };
  translation: { x: number; y: number };
  scale: number;
  rotation: number;
}

// Haptic feedback type (mobile)
export type HapticFeedbackType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Platform detection utilities
export type Platform = 'web' | 'ios' | 'android';

export interface PlatformCapabilities {
  hasCamera: boolean;
  hasGps: boolean;
  hasBiometrics: boolean;
  hasNfc: boolean;
  hasBluetooth: boolean;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  supportsBackgroundTasks: boolean;
  supportsPushNotifications: boolean;
  supportsFileSystem: boolean;
}