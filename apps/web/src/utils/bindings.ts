import { Env } from 'bun';

// Cache of environment bindings for development to avoid repeated proxy calls
let cachedEnv: Env | null = null;

/**
 * Initialize Cloudflare bindings when running locally.
 * This mirrors the production `Env` object using wrangler's platform proxy
 * so server code can access bindings in development.
 */
const initDevEnv = async () => {
  // Dynamically import wrangler only when needed in dev
  const { getPlatformProxy } = await import('wrangler');
  // Create a proxy to the local Cloudflare worker environment
  const proxy = await getPlatformProxy();
  // Store the env so subsequent calls can reuse it without extra overhead
  cachedEnv = proxy.env as unknown as Env;
};

// During development we eagerly initialize the dev bindings at startup
if (import.meta.env.DEV) {
  await initDevEnv();
}

/**
 * Get the Cloudflare bindings for the current environment.
 * In production this returns the process environment; in development it
 * returns the cached proxy env from `wrangler`.
 *
 * @returns fully typed environment bindings
 */
export function getBindings(): Env {
  if (import.meta.env.DEV) {
    // Ensure development bindings have been initialized before use
    if (!cachedEnv) {
      throw new Error(
        'dev bindings not initialized yet. call initDevEnv() first.'
      );
    }
    return cachedEnv;
  }

  // In production simply cast the process env to the expected type
  return process.env as unknown as Env;
}
