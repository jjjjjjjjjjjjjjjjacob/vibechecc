# PostHog Analytics Setup

## Overview

We use PostHog's native React SDK directly, avoiding unnecessary abstraction layers. This provides better performance, type safety, and access to all PostHog features.

## Architecture

### Core Components

1. **PostHogProvider** (`apps/web/src/components/posthog-provider.tsx`)
   - Initializes PostHog client with configuration from environment variables
   - Wraps the app with PostHog's native React provider
   - Handles client-side initialization only

2. **Track Events** (`apps/web/src/lib/track-events.ts`)
   - Centralized project-specific event definitions
   - Ensures consistent event naming and properties
   - Wraps `posthog.capture()` with type-safe functions

3. **Clerk Integration** (`apps/web/src/features/auth/components/clerk-posthog-integration.tsx`)
   - Automatically identifies users on sign-in
   - Sets user properties from Clerk profile
   - Handles user reset on sign-out

## Usage Guidelines

### Use Native PostHog Hooks

```typescript
// ✅ Good: Use native hooks directly
import { usePostHog, useFeatureFlagEnabled } from 'posthog-js/react';

function MyComponent() {
  const posthog = usePostHog();
  const isFeatureEnabled = useFeatureFlagEnabled('new-feature');

  // Use posthog.capture() for custom events
  posthog.capture('custom_event', { property: 'value' });
}
```

### Use Track Events for Project Events

```typescript
// ✅ Good: Use centralized event helpers
import { trackEvents } from '@/lib/track-events';

function VibeCard({ vibe }) {
  const handleClick = () => {
    trackEvents.vibeViewed(vibe.id);
  };
}
```

### Don't Create Wrapper Hooks

```typescript
// ❌ Bad: Unnecessary abstraction
export function useAnalytics() {
  return { capture: posthog.capture };
}

// ✅ Good: Use PostHog directly
import { usePostHog } from 'posthog-js/react';
```

## Environment Variables

Configure in `.env.local` for development and Cloudflare dashboard for production:

- `VITE_POSTHOG_API_KEY` - Your PostHog project API key (phc\_\*)
- `VITE_POSTHOG_API_HOST` - PostHog instance URL (default: https://us.i.posthog.com)
- `VITE_POSTHOG_PROJECT_ID` - Optional project ID
- `VITE_POSTHOG_REGION` - Region identifier (default: US Cloud)

## Migration from Old Setup

If you see deprecation warnings from `usePostHog()` custom hook:

1. Replace `import { usePostHog } from '@/hooks/use-posthog'` with `import { usePostHog } from 'posthog-js/react'`
2. Replace `const { trackEvents } = usePostHog()` with direct import: `import { trackEvents } from '@/lib/track-events'`
3. Remove any custom analytics wrappers and use PostHog directly

## Benefits of This Approach

1. **No redundancy** - Single source of truth for analytics
2. **Better performance** - No extra abstraction layers
3. **Full feature access** - All PostHog features available
4. **Type safety** - Native TypeScript support from PostHog SDK
5. **Easier upgrades** - Direct dependency on PostHog, no wrapper maintenance
6. **Clear separation** - Project events in one file, PostHog SDK for everything else
