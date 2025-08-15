# Testing Environment Access Guard

The environment access guard can now be tested locally using URL parameters to mock different scenarios.

## How It Works

When running on localhost, you can simulate different environments and feature flag states using URL parameters. These parameters are stored in localStorage and persist across page refreshes.

## Testing Scenarios

### 1. Test Dev Environment Access Denied

Simulate being on dev.vibechecc.io without the feature flag:

```
http://localhost:3000/?mock-env=dev&mock-access=false
```

This should show the "access restricted" page.

### 2. Test Dev Environment Access Granted

Simulate being on dev.vibechecc.io with the feature flag enabled:

```
http://localhost:3000/?mock-env=dev&mock-access=true
```

This should allow access to the application.

### 3. Test Ephemeral Environment (PR Preview)

Simulate being on a PR preview environment:

```
http://localhost:3000/?mock-env=pr-123&mock-access=false
```

This should show the "access restricted" page for the preview environment.

### 4. Test Production Environment

Simulate being on production (no subdomain):

```
http://localhost:3000/?mock-env=production
```

This should allow access since production doesn't require the dev access flag.

### 5. Reset All Mocks

Clear all mock settings and return to normal localhost behavior:

```
http://localhost:3000/?mock-reset
```

## Visual Indicator

When mocking is active, you'll see an orange indicator in the bottom-left corner showing:

- 🧪 MOCK MODE
- Current mocked environment
- Current mocked access state

## How Mock Settings Work

1. **URL Parameters**: Add parameters to the URL to set mock values
2. **localStorage**: Values are stored in localStorage for persistence
3. **Clean URLs**: Parameters are automatically removed from the URL after processing
4. **Reset**: Use `?mock-reset` to clear all mock settings

## Mock Parameters

- `mock-env`: Set the environment subdomain
  - `dev` - Development environment
  - `pr-123` - Ephemeral/PR environment (any `pr-` prefix)
  - `production` or `null` - Production environment
  - Any other value - Custom subdomain

- `mock-access`: Set the feature flag state
  - `true` - User has dev environment access
  - `false` - User doesn't have dev environment access
  - Not set - Use actual PostHog feature flag

- `mock-reset`: Clear all mock settings

## Important Notes

1. Mocking only works on localhost (127.0.0.1, ::1, 0.0.0.0)
2. Mock settings persist in localStorage until cleared
3. The mock indicator shows when mocking is active
4. Mock settings override real PostHog feature flags for testing

## Testing Workflow

1. Start with a clean state: `http://localhost:3000/?mock-reset`
2. Test access denied: `http://localhost:3000/?mock-env=dev&mock-access=false`
3. Verify the access restricted page appears
4. Test access granted: `http://localhost:3000/?mock-access=true` (updates existing mock)
5. Verify the application loads
6. Reset when done: `http://localhost:3000/?mock-reset`
