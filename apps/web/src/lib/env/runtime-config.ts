import { z } from 'zod';

/**
 * Public environment variables that are safe to expose to the client.
 * These use the VITE_ prefix and can be included in client bundles.
 */
const PublicEnvSchema = z.object({
  // App branding configuration
  VITE_APP_NAME: z.string(),
  VITE_APP_DOMAIN: z.string(),
  VITE_APP_URL: z.string().url().optional(), // Optional since we can derive from domain
  VITE_APP_TWITTER_HANDLE: z.string(),

  // Public API endpoints
  VITE_CONVEX_URL: z.string().url(),

  // Public API keys (safe for client-side)
  VITE_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  VITE_POSTHOG_API_KEY: z.string().startsWith('phc_'), // Project keys are public-safe
  VITE_POSTHOG_API_HOST: z.string().url().default('https://us.i.posthog.com'),
  VITE_POSTHOG_PROJECT_ID: z.string().optional(),
  VITE_POSTHOG_REGION: z.string().default('US Cloud'),
});

/**
 * Private environment variables that must NEVER be exposed to the client.
 * These are only accessible server-side.
 */
const PrivateEnvSchema = z.object({
  // Authentication secrets
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  // Deployment keys
  CONVEX_DEPLOY_KEY: z.string().optional(),
  CONVEX_DEPLOYMENT: z.string().optional(),

  // Never expose personal API keys (phx_ prefix)
  // or any other secrets
});

/**
 * Combined environment schema
 */
const EnvironmentSchema = PublicEnvSchema.merge(PrivateEnvSchema);

export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type PrivateEnv = z.infer<typeof PrivateEnvSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Get environment source based on runtime
 */
function getEnvSource(): Record<string, string | undefined> {
  // In production Cloudflare Workers, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env as Record<string, string | undefined>;
  }

  // In development or client-side, use import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env as Record<string, string | undefined>;
  }

  return {};
}

/**
 * Server-only: Get all environment variables with validation
 * This function should NEVER be called from client code
 */
export function getServerEnvironment(): Environment {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnvironment() cannot be called from client code');
  }

  const env = getEnvSource();

  try {
    return EnvironmentSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter((e) => e.code === 'invalid_type' && e.received === 'undefined')
        .map((e) => e.path.join('.'));

      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}`
        );
      }

      throw new Error(`Invalid environment configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Client-safe: Get only public environment variables
 * This can be safely called from client code
 */
export function getPublicEnvironment(): PublicEnv {
  const env = getEnvSource();

  // Filter to only VITE_ prefixed variables
  const publicEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      publicEnv[key] = value;
    }
  }

  try {
    return PublicEnvSchema.parse(publicEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // In development, provide helpful error messages but don't fail
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          'Missing or invalid environment variables, using defaults:',
          error.errors.map((e) => e.path.join('.')).join(', ')
        );
      }

      // Build partial config with available values and defaults
      const partialConfig: Partial<PublicEnv> = {};

      // Add any successfully parsed values
      for (const [key, value] of Object.entries(publicEnv)) {
        if (value !== undefined) {
          (partialConfig as Record<string, unknown>)[key] = value;
        }
      }

      // Use safe parse to get partial results with defaults
      const result = PublicEnvSchema.safeParse(partialConfig);
      if (result.success) {
        return result.data;
      }

      // For required variables, throw error
      if (!publicEnv.VITE_APP_NAME || !publicEnv.VITE_APP_DOMAIN) {
        throw new Error(
          'VITE_APP_NAME and VITE_APP_DOMAIN are required environment variables'
        );
      }

      // Return config with required values
      return {
        VITE_APP_NAME: publicEnv.VITE_APP_NAME,
        VITE_APP_DOMAIN: publicEnv.VITE_APP_DOMAIN,
        VITE_APP_URL:
          publicEnv.VITE_APP_URL || `https://${publicEnv.VITE_APP_DOMAIN}`,
        VITE_APP_TWITTER_HANDLE:
          publicEnv.VITE_APP_TWITTER_HANDLE || `@${publicEnv.VITE_APP_NAME}`,
        VITE_CONVEX_URL: publicEnv.VITE_CONVEX_URL || '',
        VITE_CLERK_PUBLISHABLE_KEY: publicEnv.VITE_CLERK_PUBLISHABLE_KEY || '',
        VITE_POSTHOG_API_KEY: publicEnv.VITE_POSTHOG_API_KEY || '',
        VITE_POSTHOG_API_HOST:
          publicEnv.VITE_POSTHOG_API_HOST || 'https://us.i.posthog.com',
        VITE_POSTHOG_PROJECT_ID: publicEnv.VITE_POSTHOG_PROJECT_ID,
        VITE_POSTHOG_REGION: publicEnv.VITE_POSTHOG_REGION || 'US Cloud',
      };
    }
    throw error;
  }
}

/**
 * Runtime configuration that can be updated from Cloudflare Worker environment
 */
let runtimeConfig: PublicEnv | null = null;

/**
 * Set runtime configuration (server-side only)
 */
export function setRuntimeConfig(config: PublicEnv) {
  if (typeof window !== 'undefined') {
    throw new Error('setRuntimeConfig() cannot be called from client code');
  }
  runtimeConfig = config;
}

/**
 * Get runtime configuration with fallback to static env
 */
export function getRuntimeConfig(): PublicEnv {
  // If we have runtime config set by the server, use it
  if (runtimeConfig) {
    return runtimeConfig;
  }

  // Otherwise fall back to static environment
  return getPublicEnvironment();
}

/**
 * Validate that a value is a public-safe API key
 */
export function isPublicApiKey(key: string): boolean {
  // PostHog project keys (phc_) are safe
  if (key.startsWith('phc_')) return true;

  // Clerk publishable keys (pk_) are safe
  if (key.startsWith('pk_')) return true;

  // Anything else should be treated as private
  return false;
}

/**
 * Security audit function to ensure no private keys in public config
 */
export function auditPublicConfig(config: PublicEnv): void {
  const entries = Object.entries(config);

  for (const [key, value] of entries) {
    if (typeof value !== 'string') continue;

    // Check for common secret key patterns
    if (value.startsWith('sk_') || value.startsWith('phx_')) {
      throw new Error(
        `SECURITY: Private key detected in public config for ${key}`
      );
    }

    // Check for Bearer tokens
    if (value.toLowerCase().includes('bearer ')) {
      throw new Error(
        `SECURITY: Bearer token detected in public config for ${key}`
      );
    }

    // Check for base64 encoded secrets (common pattern)
    if (value.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(value)) {
      // eslint-disable-next-line no-console
      console.warn(
        `WARNING: Possible encoded secret in ${key} - please verify this is safe`
      );
    }
  }
}
