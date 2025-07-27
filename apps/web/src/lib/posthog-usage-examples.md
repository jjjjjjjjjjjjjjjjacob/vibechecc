# PostHog Usage Examples

This document provides examples of how to use PostHog analytics throughout the viberater application.

## Environment Variables

Make sure your `.env.local` file contains the following PostHog configuration:

```env
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_API_HOST=https://app.posthog.com
VITE_POSTHOG_PROJECT_ID=your_project_id
VITE_POSTHOG_REGION=us
```

## Basic Usage

### Using the Hook

```tsx
import { usePostHog } from '@/hooks/usePostHog';

function MyComponent() {
  const { capture, trackEvents, isFeatureEnabled } = usePostHog();

  const handleClick = () => {
    // Custom event
    capture('button_clicked', {
      button_name: 'my_button',
      page: 'home',
    });

    // Pre-defined event
    trackEvents.vibeViewed('vibe_123');
  };

  // Feature flag usage
  const showNewFeature = isFeatureEnabled('new_feature_flag');

  return (
    <div>
      {showNewFeature && <NewFeature />}
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

### Direct Analytics Usage

```tsx
import { analytics } from '@/lib/posthog';

// Initialize (already done in PostHogProvider)
analytics.init(config);

// Track events
analytics.capture('custom_event', { property: 'value' });

// Identify users
analytics.identify('user_123', { email: 'user@example.com' });

// Page views
analytics.capturePageView('/custom-path');
```

## Pre-defined Event Tracking

The application includes pre-defined tracking events for common actions:

### User Events

```tsx
import { trackEvents } from '@/lib/posthog';

// User authentication
trackEvents.userSignedUp('user_123', 'email');
trackEvents.userSignedIn('user_123', 'google');
trackEvents.userSignedOut();
```

### Vibe Events

```tsx
// Vibe interactions
trackEvents.vibeCreated('vibe_123', ['tag1', 'tag2']);
trackEvents.vibeViewed('vibe_123');
trackEvents.vibeRated('vibe_123', 5);
trackEvents.vibeReacted('vibe_123', '😂');
```

### Navigation Events

```tsx
// Page tracking
trackEvents.pageViewed('/vibes/123', 'Vibe Details');
```

### Search Events

```tsx
// Search tracking
trackEvents.searchPerformed('funny vibes', 25);
```

### Error Events

```tsx
// Error tracking
trackEvents.errorOccurred('API Error', {
  endpoint: '/api/vibes',
  status: 500,
});
```

## Component Integration Examples

### Automatic Page Tracking

Page views are automatically tracked via the `PostHogPageTracker` component in the root layout.

### User Authentication Integration

User identification and authentication events are automatically handled via the `ClerkPostHogIntegration` component.

### Manual Event Tracking in Components

```tsx
// In a vibe card component
import { usePostHog } from '@/hooks/usePostHog';

function VibeCard({ vibe }) {
  const { trackEvents } = usePostHog();

  const handleVibeClick = () => {
    trackEvents.vibeViewed(vibe.id);
  };

  const handleReaction = (emoji: string) => {
    trackEvents.vibeReacted(vibe.id, emoji);
  };

  return (
    <div onClick={handleVibeClick}>
      {/* Vibe content */}
      <EmojiPicker onReact={handleReaction} />
    </div>
  );
}
```

### Form Tracking

```tsx
// In a create vibe form
function CreateVibeForm() {
  const { trackEvents, capture } = usePostHog();

  const handleSubmit = async (formData) => {
    try {
      const result = await createVibe(formData);

      // Track successful creation
      trackEvents.vibeCreated(result.id, formData.tags);
    } catch (error) {
      // Track errors
      trackEvents.errorOccurred('Vibe creation failed', {
        error: error.message,
        form_data: formData,
      });
    }
  };

  const handleFormStart = () => {
    capture('vibe_creation_started');
  };

  return (
    <form onSubmit={handleSubmit} onFocus={handleFormStart}>
      {/* Form fields */}
    </form>
  );
}
```

## Feature Flags

PostHog feature flags can be used to control feature rollouts:

```tsx
function MyComponent() {
  const { isFeatureEnabled, getFeatureFlag } = usePostHog();

  // Boolean flag
  const showBetaFeature = isFeatureEnabled('beta_feature');

  // String/multivariate flag
  const buttonColor = getFeatureFlag('button_color_test');

  return (
    <div>
      {showBetaFeature && <BetaFeature />}
      <button
        style={{
          backgroundColor: buttonColor === 'red' ? 'red' : 'blue',
        }}
      >
        Click me
      </button>
    </div>
  );
}
```

## Error Handling and Debugging

PostHog operations are wrapped in try-catch blocks and will fail silently if PostHog is not initialized or if there are network issues.

### Development Mode

In development mode, PostHog will log initialization status to the console.

### Checking Initialization Status

```tsx
import { analytics } from '@/lib/posthog';

if (analytics.isInitialized()) {
  // PostHog is ready
  analytics.capture('event');
} else {
  console.warn('PostHog not initialized');
}
```

## Best Practices

1. **Event Naming**: Use snake_case for event names and be consistent
2. **Properties**: Include relevant context in event properties
3. **User Privacy**: Respect user privacy and follow GDPR guidelines
4. **Performance**: PostHog operations are async and non-blocking
5. **Testing**: PostHog events won't fire in test environments

## Custom Events for viberater

Here are some custom events specific to the viberater application:

```tsx
// Vibe discovery
capture('vibe_discovered', {
  vibe_id: 'vibe_123',
  discovery_method: 'search', // 'search', 'browse', 'recommendation'
  category: 'funny',
});

// Social interactions
capture('user_followed', {
  followed_user_id: 'user_456',
  source: 'profile_page',
});

// Content engagement
capture('vibe_shared', {
  vibe_id: 'vibe_123',
  share_method: 'copy_link', // 'copy_link', 'social_media'
  platform: 'twitter',
});

// App usage patterns
capture('session_duration', {
  duration_seconds: 300,
  pages_visited: 5,
  vibes_viewed: 10,
});
```
