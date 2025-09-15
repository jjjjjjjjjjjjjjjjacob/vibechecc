# @vibechecc/app-core

Shared business logic, hooks, stores, and utilities that work across both web and mobile platforms for the vibechecc application.

## Overview

This package provides a comprehensive set of platform-agnostic tools for building vibechecc applications:

- **React Query Hooks** - Pre-configured hooks for all Convex queries and mutations
- **Zustand Stores** - Centralized state management with mobile optimizations
- **Services** - Platform-agnostic services for Convex, auth, and notifications
- **Utilities** - Validation, formatting, and helper functions
- **Types** - Complete TypeScript type definitions

## Installation

```bash
# This package is part of the vibechecc monorepo
bun install @vibechecc/app-core
```

## Quick Start

### Basic Setup

```typescript
import {
  // Convex client setup
  initializeConvexWeb,
  initializeConvexMobile,

  // Hooks
  useCurrentUser,
  useVibes,
  useAuth,

  // Stores
  useAuthStore,
  useThemeStore,

  // Utilities
  validators,
  dateUtils,
  CONTENT_LIMITS,
} from '@vibechecc/app-core';

// Initialize Convex based on platform
const isMobile = /* platform detection */;
const { client, queryClient } = isMobile
  ? initializeConvexMobile({ deploymentUrl: process.env.CONVEX_URL! })
  : initializeConvexWeb({ deploymentUrl: process.env.CONVEX_URL! });
```

### React Query Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider } from 'convex/react';
import { createConvexQueryClient } from '@vibechecc/app-core';

const convexClient = createConvexClient({ deploymentUrl: process.env.CONVEX_URL! });
const queryClient = new QueryClient();

function App() {
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </ConvexProvider>
  );
}
```

## Core Features

### 1. Data Fetching Hooks

#### Vibes
```typescript
import { useVibes, useVibe, useCreateVibeMutation } from '@vibechecc/app-core';

function VibesComponent() {
  const { data: vibes, isLoading } = useVibes();
  const { data: vibe } = useVibe('vibe-id');
  const createVibe = useCreateVibeMutation();

  const handleCreate = (vibeData) => {
    createVibe.mutate(vibeData);
  };

  return (
    <div>
      {vibes?.map(vibe => (
        <div key={vibe._id}>{vibe.title}</div>
      ))}
    </div>
  );
}
```

#### Users & Authentication
```typescript
import { useCurrentUser, useAuth, useFollowUser } from '@vibechecc/app-core';

function UserProfile() {
  const { user, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const { followUser, unfollowUser } = useFollowUser();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.firstName} {user?.lastName}</h1>
      <button onClick={() => followUser({ targetUserId: 'user-id' })}>
        Follow
      </button>
    </div>
  );
}
```

#### Search
```typescript
import { useSearch, useSearchSuggestions } from '@vibechecc/app-core';

function SearchComponent() {
  const { query, results, search, isLoading } = useSearch({
    debounceMs: 150,
    filters: { tags: ['fun', 'awesome'] }
  });

  const { data: suggestions } = useSearchSuggestions(query);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search vibes..."
      />
      {suggestions?.map(suggestion => (
        <div key={suggestion}>{suggestion}</div>
      ))}
      {results?.vibes.map(vibe => (
        <div key={vibe._id}>{vibe.title}</div>
      ))}
    </div>
  );
}
```

### 2. State Management

#### Authentication Store
```typescript
import { useAuthStore, authStoreUtils } from '@vibechecc/app-core';

function AuthComponent() {
  const { user, isAuthenticated, setUser } = useAuthStore();

  // Utility functions
  const displayName = authStoreUtils.getUserDisplayName();
  const needsOnboarding = authStoreUtils.needsOnboarding();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {displayName}!</p>
      ) : (
        <button onClick={() => /* sign in logic */}>Sign In</button>
      )}
    </div>
  );
}
```

#### Theme Store
```typescript
import { useThemeStore, themeUtils } from '@vibechecc/app-core';

function ThemeToggle() {
  const { theme, setTheme, colorTheme, setColorTheme } = useThemeStore();

  return (
    <div>
      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>
      <button onClick={() => setColorTheme('purple-primary')}>
        Purple Theme
      </button>
    </div>
  );
}
```

#### Search Store
```typescript
import { useSearchStore, searchUtils } from '@vibechecc/app-core';

function SearchHistory() {
  const { recentSearches, savedSearches, addSavedSearch } = useSearchStore();

  return (
    <div>
      <h3>Recent Searches</h3>
      {recentSearches.map(search => (
        <div key={search.id}>{search.query}</div>
      ))}

      <h3>Saved Searches</h3>
      {savedSearches.map(search => (
        <div key={search.id}>
          {search.name}: {search.query}
        </div>
      ))}
    </div>
  );
}
```

### 3. Form Validation

```typescript
import { formValidators, validators } from '@vibechecc/app-core';

function CreateVibeForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    hashtags: []
  });

  const validation = formValidators.createVibe(formData);

  const handleSubmit = () => {
    if (validation.isValid) {
      // Submit form
    } else {
      // Show errors
      console.log(validation.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      {validation.errors.title && (
        <div className="error">{validation.errors.title[0]}</div>
      )}

      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      />
      {validation.errors.content && (
        <div className="error">{validation.errors.content[0]}</div>
      )}

      <button type="submit" disabled={!validation.isValid}>
        Create Vibe
      </button>
    </form>
  );
}
```

### 4. Utilities & Formatting

```typescript
import {
  dateUtils,
  numberUtils,
  textUtils,
  userUtils,
  CONTENT_LIMITS
} from '@vibechecc/app-core';

function UtilityExamples() {
  const user = { firstName: 'John', lastName: 'Doe' };
  const date = new Date();

  return (
    <div>
      {/* Date formatting */}
      <p>{dateUtils.formatRelativeTime(date)}</p>

      {/* Number formatting */}
      <p>{numberUtils.formatCount(1500)} likes</p>

      {/* Text utilities */}
      <p>{textUtils.truncate('Long text here...', 50)}</p>

      {/* User utilities */}
      <p>{userUtils.getDisplayName(user)}</p>

      {/* Constants */}
      <p>Max title length: {CONTENT_LIMITS.vibe.titleMax}</p>
    </div>
  );
}
```

## Platform-Specific Features

### Mobile Optimizations

The package includes mobile-specific optimizations:

- **Extended cache times** for offline support
- **Storage abstraction** (AsyncStorage/MMKV support)
- **Biometric authentication** utilities
- **Push notification** services
- **Haptic feedback** types
- **Gesture state** management

```typescript
import {
  initializeConvexMobile,
  BiometricInfo,
  HapticFeedbackType,
  notificationUtils
} from '@vibechecc/app-core';

// Mobile-specific initialization
const { client, queryClient } = initializeConvexMobile({
  deploymentUrl: process.env.CONVEX_URL!,
  offlineSupport: true,
  cacheConfig: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  }
});

// Push notifications
await notificationUtils.requestAndShow({
  title: 'New Vibe!',
  body: 'Someone rated your vibe',
  data: { vibeId: 'vibe-123' }
});
```

### Web Optimizations

Web-specific features include:

- **localStorage** integration
- **Service Worker** support for push notifications
- **Browser** capability detection
- **URL** handling utilities

## API Reference

### Hooks

#### Data Fetching
- `useVibes()` - Get all vibes
- `useVibe(id)` - Get single vibe
- `useUserVibes(userId)` - Get user's vibes
- `useCurrentUser()` - Get current user
- `useFollowUser()` - Follow/unfollow users
- `useSearch(options)` - Search functionality
- `useNotificationsQuery()` - Get notifications

#### Mutations
- `useCreateVibeMutation()` - Create vibe
- `useUpdateVibeMutation()` - Update vibe
- `useAddRatingMutation()` - Add rating
- `useFollowUserMutation()` - Follow user
- `useMarkNotificationAsReadMutation()` - Mark notification read

### Stores

#### AuthStore
- `user: AuthUser | null` - Current user
- `isAuthenticated: boolean` - Auth status
- `sessionToken: string | null` - Auth token
- `setUser(user)` - Set current user
- `setSession(token, refresh, expires)` - Set session

#### ThemeStore
- `theme: 'light' | 'dark' | 'system'` - Theme mode
- `colorTheme: string | null` - Primary color
- `setTheme(theme)` - Change theme
- `setColorTheme(color)` - Change color

#### SearchStore
- `query: string` - Current search query
- `results: SearchResults | null` - Search results
- `recentSearches: RecentSearch[]` - Search history
- `setQuery(query)` - Update search query

### Services

#### ConvexClient
- `createConvexClient(config)` - Create Convex client
- `initializeConvexWeb(config)` - Web initialization
- `initializeConvexMobile(config)` - Mobile initialization

#### AuthService
- `getToken()` - Get auth token
- `setToken(token)` - Store auth token
- `validateSession()` - Check session validity

#### NotificationService
- `showNotification(config)` - Show notification
- `requestPermission()` - Request permission
- `setBadgeCount(count)` - Update badge

### Validation

#### Form Validators
- `formValidators.createVibe(data)` - Validate vibe creation
- `formValidators.updateProfile(data)` - Validate profile update
- `formValidators.createRating(data)` - Validate rating

#### Field Validators
- `validators.required(value, field)` - Required validation
- `validators.email(value)` - Email validation
- `validators.username(value)` - Username validation

### Utilities

#### Date Utils
- `dateUtils.formatRelativeTime(date)` - "2 hours ago"
- `dateUtils.formatDate(date)` - "Jan 15, 2024"
- `dateUtils.isToday(date)` - Check if today

#### Number Utils
- `numberUtils.formatCount(1500)` - "1.5K"
- `numberUtils.formatRating(4.2)` - "4.2/5"
- `numberUtils.formatFileSize(bytes)` - "1.2 MB"

#### Text Utils
- `textUtils.truncate(text, length)` - Truncate text
- `textUtils.extractHashtags(text)` - Extract #hashtags
- `textUtils.slugify(text)` - Create URL-friendly slug

#### User Utils
- `userUtils.getDisplayName(user)` - User display name
- `userUtils.getInitials(user)` - User initials
- `userUtils.getAvatarUrl(user)` - Avatar URL

## Testing

The package includes comprehensive tests for all utilities and stores:

```bash
# Run tests
bun test

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  AuthUser,
  Vibe,
  Rating,
  SearchFilters,
  NavigationState,
  FormState,
  ValidationResult
} from '@vibechecc/app-core';
```

## Contributing

When adding new functionality:

1. **Add hooks** for new Convex queries/mutations
2. **Update stores** for new state requirements
3. **Add utilities** for common operations
4. **Include tests** for all new functionality
5. **Update types** for new data structures

## License

Private package for vibechecc application.