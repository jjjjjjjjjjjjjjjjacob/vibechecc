import { createServerFn } from '@tanstack/react-start';
import { getRuntimeBindings } from '@/utils/bindings';
import { auditPublicConfig, type PublicEnv } from './runtime-config';

/**
 * Server function to fetch runtime configuration
 * This runs on the server and returns only public-safe environment variables
 */
export const fetchRuntimeConfig = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ config: PublicEnv; timestamp: number }> => {
    try {
      // Get runtime configuration from Worker environment
      const config = getRuntimeBindings();

      // Security audit to ensure no private keys leaked
      auditPublicConfig(config);

      return {
        config,
        timestamp: Date.now(),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch runtime config:', error);

      // Return safe defaults on error
      return {
        config: {
          VITE_APP_NAME: 'vibechecc',
          VITE_APP_DOMAIN: 'vibechecc.com',
          VITE_APP_TWITTER_HANDLE: '@vibechecc',
          VITE_CONVEX_URL: '',
          VITE_CLERK_PUBLISHABLE_KEY: '',
          VITE_POSTHOG_API_KEY: '',
          VITE_POSTHOG_API_HOST: 'https://us.i.posthog.com',
          VITE_POSTHOG_PROJECT_ID: undefined,
          VITE_POSTHOG_REGION: 'US Cloud',
        },
        timestamp: Date.now(),
      };
    }
  }
);

/**
 * Server function to validate environment configuration
 * Useful for debugging and ensuring proper setup
 */
export const validateEnvironment = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    isValid: boolean;
    missingVars: string[];
    warnings: string[];
  }> => {
    const missingVars: string[] = [];
    const warnings: string[] = [];

    try {
      const config = getRuntimeBindings();

      // Check required variables
      if (!config.VITE_CONVEX_URL) {
        missingVars.push('VITE_CONVEX_URL');
      }
      if (!config.VITE_CLERK_PUBLISHABLE_KEY) {
        missingVars.push('VITE_CLERK_PUBLISHABLE_KEY');
      }

      // Check for common issues
      if (
        config.VITE_POSTHOG_API_KEY &&
        !config.VITE_POSTHOG_API_KEY.startsWith('phc_')
      ) {
        warnings.push(
          'VITE_POSTHOG_API_KEY should start with phc_ for project keys'
        );
      }
      if (
        config.VITE_CLERK_PUBLISHABLE_KEY &&
        !config.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
      ) {
        warnings.push('VITE_CLERK_PUBLISHABLE_KEY should start with pk_');
      }

      return {
        isValid: missingVars.length === 0,
        missingVars,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        missingVars: ['Unable to validate - error occurred'],
        warnings: [String(error)],
      };
    }
  }
);
