import { Env } from 'bun';
import {
  getPublicEnvironment,
  getServerEnvironment,
  type PublicEnv,
} from '@/lib/env/runtime-config';

let cachedEnv: Env | null = null;
let cachedRuntimeConfig: PublicEnv | null = null;

// This gets called once at startup when running locally
const initDevEnv = async () => {
  const { getPlatformProxy } = await import('wrangler');
  const proxy = await getPlatformProxy();
  cachedEnv = proxy.env as unknown as Env;
};

if (import.meta.env.DEV) {
  await initDevEnv();
}

/**
 * Will only work when being accessed on the server. Obviously, CF bindings are not available in the browser.
 * @returns
 */
export function getBindings(): Env {
  if (import.meta.env.DEV) {
    if (!cachedEnv) {
      throw new Error(
        'Dev bindings not initialized yet. Call initDevEnv() first.'
      );
    }
    return cachedEnv;
  }

  return process.env as unknown as Env;
}

/**
 * Get runtime configuration from Cloudflare Worker environment
 * This merges build-time and runtime environment variables
 * @returns Public environment configuration safe for client use
 */
export function getRuntimeBindings(): PublicEnv {
  // Return cached config if available
  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig;
  }

  // Server-side: get from process.env or Worker bindings
  if (typeof window === 'undefined') {
    try {
      // In production, process.env should have Worker environment variables
      // when nodejs_compat_populate_process_env is enabled
      const publicConfig = getPublicEnvironment();
      cachedRuntimeConfig = publicConfig;
      return publicConfig;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get runtime bindings:', error);
      // Fall back to build-time values
      return getPublicEnvironment();
    }
  }

  // Client-side: use static build-time values
  return getPublicEnvironment();
}

/**
 * Server-only: Get all environment variables including secrets
 * NEVER expose the result of this function to the client
 */
export function getServerBindings() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerBindings() cannot be called from client code');
  }

  return getServerEnvironment();
}
