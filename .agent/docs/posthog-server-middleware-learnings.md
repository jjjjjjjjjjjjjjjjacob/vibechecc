# PostHog Server-Side Middleware Learnings

## Overview

Implemented server-side PostHog feature flag evaluation to fix inconsistent client-side behavior in environment access guard.

## Key Components Created

### 1. PostHog Server Client (`/apps/web/src/lib/posthog-server.ts`)

- Singleton pattern for PostHog Node.js client
- Server-side feature flag evaluation
- Integration with Clerk auth for user identification
- Graceful fallback when PostHog is not configured

### 2. Access Control Server Functions (`/apps/web/src/lib/env/access-control.ts`)

- `checkEnvironmentAccess`: Server function for environment access checks
- `getFeatureFlags`: Server function to fetch all user feature flags
- Automatic development environment bypass (always allows access in dev)
- Proper error handling with fallback to deny access in production

### 3. Server Feature Flags Hook (`/apps/web/src/hooks/use-server-feature-flags.ts`)

- Fetches feature flags from server on mount
- Bootstraps PostHog client with server-side values
- Uses `posthog.featureFlags.overrideFeatureFlags()` API

### 4. Updated Environment Access Guard

- Now uses server-side access check via `checkEnvironmentAccess()`
- Removed dependency on client-side PostHog hooks
- Maintains existing animation states and UI flow

## Important Patterns

### Server-Side PostHog Initialization

```typescript
const client = new PostHog(apiKey, {
  host: apiHost,
  flushAt: 1, // Flush immediately for server-side
  flushInterval: 0, // Don't batch requests
});
```

### Feature Flag Override in Client

```typescript
if (posthog.featureFlags) {
  posthog.featureFlags.overrideFeatureFlags(serverFlags);
}
```

### TanStack Start Server Functions

- Use `createServerFn({ method: 'GET' }).handler()`
- Access request via `getWebRequest()`
- Return structured data with timestamps for caching

## Gotchas & Solutions

### Issue 1: TypeScript Import Errors

- TanStack Start doesn't export `Request` type directly
- Solution: Use plain `Request` type or import from optimized-auth module

### Issue 2: PostHog Override API

- `posthog.overrideFeatureFlags()` doesn't exist on main object
- Solution: Use `posthog.featureFlags.overrideFeatureFlags()`

### Issue 3: Server Client Singleton

- Multiple PostHog instances can cause issues
- Solution: Implement singleton pattern with null checks

## Benefits

1. **Consistency**: Feature flags evaluated server-side ensure consistent behavior
2. **Performance**: Reduces client-side API calls and flag evaluation time
3. **Security**: Access control happens server-side, harder to bypass
4. **Reliability**: Server-side evaluation with proper fallbacks

## When to Use This Pattern

- Authentication/authorization checks
- Feature flag-gated content that affects initial render
- Preventing client-side flag manipulation
- Reducing PostHog API calls from client

## Testing Considerations

- Always test with PostHog disabled (no API key)
- Test production vs development environment behavior
- Verify fallback behavior when PostHog is unavailable
- Check user state changes trigger re-evaluation
