import { PostHog } from 'posthog-node';

let posthogServerClient: PostHog | null = null;

/**
 * Initialize PostHog server client
 * This is a singleton to avoid creating multiple instances
 */
function getPostHogServerClient(): PostHog | null {
  if (typeof window !== 'undefined') {
    // Don't initialize on client side
    return null;
  }

  if (!posthogServerClient) {
    const apiKey = process.env.VITE_POSTHOG_API_KEY;
    const apiHost =
      process.env.VITE_POSTHOG_API_HOST || 'https://us.i.posthog.com';

    if (!apiKey) {
      console.warn('PostHog API key not found in environment variables');
      return null;
    }

    posthogServerClient = new PostHog(apiKey, {
      host: apiHost,
      flushAt: 1, // Flush immediately for server-side usage
      flushInterval: 0, // Don't batch requests
    });
  }

  return posthogServerClient;
}

/**
 * Get user ID from Clerk session in the request
 */
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { getOptimizedAuth } = await import('@/lib/optimized-auth');
    const authData = await getOptimizedAuth(request);
    return authData.userId;
  } catch {
    return null;
  }
}

/**
 * Check if a user has access to the dev environment via PostHog feature flag
 */
export async function checkDevEnvironmentAccess(request: Request): Promise<{
  hasAccess: boolean;
  userId: string | null;
  isFeatureFlagLoaded: boolean;
}> {
  const client = getPostHogServerClient();

  if (!client) {
    // If PostHog is not configured, default to allowing access
    console.warn(
      'PostHog server client not initialized, defaulting to allow access'
    );
    return {
      hasAccess: true,
      userId: null,
      isFeatureFlagLoaded: false,
    };
  }

  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    // No authenticated user, deny access
    return {
      hasAccess: false,
      userId: null,
      isFeatureFlagLoaded: true,
    };
  }

  try {
    // Check the feature flag for this user
    const hasAccess = await client.isFeatureEnabled(
      'dev-environment-access',
      userId
    );

    return {
      hasAccess: hasAccess ?? false,
      userId,
      isFeatureFlagLoaded: true,
    };
  } catch {
    // On error, default to denying access
    return {
      hasAccess: false,
      userId,
      isFeatureFlagLoaded: false,
    };
  }
}

/**
 * Get all feature flags for a user
 */
export async function getUserFeatureFlags(request: Request): Promise<{
  flags: Record<string, boolean | string>;
  userId: string | null;
  isLoaded: boolean;
}> {
  const client = getPostHogServerClient();

  if (!client) {
    return {
      flags: {},
      userId: null,
      isLoaded: false,
    };
  }

  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    return {
      flags: {},
      userId: null,
      isLoaded: true,
    };
  }

  try {
    const flags = await client.getAllFlags(userId);

    return {
      flags: flags || {},
      userId,
      isLoaded: true,
    };
  } catch {
    return {
      flags: {},
      userId,
      isLoaded: false,
    };
  }
}

/**
 * Identify a user in PostHog with properties
 */
export async function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServerClient();

  if (!client) {
    return;
  }

  try {
    client.identify({
      distinctId: userId,
      properties,
    });
  } catch {
    // Silently ignore PostHog errors to prevent disrupting user experience
  }
}

/**
 * Capture an event in PostHog
 */
export async function captureEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServerClient();

  if (!client) {
    return;
  }

  try {
    client.capture({
      distinctId: userId,
      event,
      properties,
    });
  } catch {
    // Silently ignore PostHog errors to prevent disrupting user experience
  }
}

/**
 * Shutdown PostHog client gracefully
 * Call this when the server is shutting down
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogServerClient) {
    await posthogServerClient.shutdown();
    posthogServerClient = null;
  }
}
