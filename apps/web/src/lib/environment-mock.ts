/**
 * Environment mocking utilities for testing access control scenarios locally
 *
 * Usage:
 * - Add ?mock-env=dev to URL to simulate dev environment
 * - Add ?mock-env=pr-123 to simulate ephemeral environment
 * - Add ?mock-access=false to simulate no feature flag access
 * - Add ?mock-access=true to simulate feature flag access
 * - Add ?mock-reset to clear all mocks
 */

const MOCK_ENV_KEY = 'vibechecc-mock-env';
const MOCK_ACCESS_KEY = 'vibechecc-mock-access';

export interface MockEnvironmentConfig {
  subdomain?: string | null;
  hasDevAccess?: boolean | null;
  enabled: boolean;
}

/**
 * Gets mock configuration from URL params and localStorage
 */
export function getMockConfig(): MockEnvironmentConfig {
  if (typeof window === 'undefined') {
    return { enabled: false };
  }

  // Only enable mocking on localhost
  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0';

  if (!isLocalhost) {
    return { enabled: false };
  }

  const params = new URLSearchParams(window.location.search);

  // Check for reset
  if (params.has('mock-reset')) {
    localStorage.removeItem(MOCK_ENV_KEY);
    localStorage.removeItem(MOCK_ACCESS_KEY);
    // Remove the reset param from URL
    params.delete('mock-reset');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
    return { enabled: false };
  }

  // Check for new mock params in URL
  let subdomain: string | null | undefined;
  let hasDevAccess: boolean | null | undefined;

  if (params.has('mock-env')) {
    subdomain = params.get('mock-env');
    if (subdomain === 'production' || subdomain === 'null') {
      subdomain = null;
    }
    // Store in localStorage and remove from URL
    localStorage.setItem(MOCK_ENV_KEY, JSON.stringify(subdomain));
    params.delete('mock-env');
  }

  if (params.has('mock-access')) {
    const access = params.get('mock-access');
    hasDevAccess = access === 'true' ? true : access === 'false' ? false : null;
    // Store in localStorage and remove from URL
    localStorage.setItem(MOCK_ACCESS_KEY, JSON.stringify(hasDevAccess));
    params.delete('mock-access');
  }

  // Clean URL if we processed any params
  if (window.location.search && window.location.search.includes('mock-')) {
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }

  // Load from localStorage
  try {
    const storedEnv = localStorage.getItem(MOCK_ENV_KEY);
    const storedAccess = localStorage.getItem(MOCK_ACCESS_KEY);

    if (storedEnv !== null) {
      subdomain = JSON.parse(storedEnv);
    }

    if (storedAccess !== null) {
      hasDevAccess = JSON.parse(storedAccess);
    }
  } catch (e) {
    console.error('Failed to parse mock config from localStorage:', e);
  }

  const enabled = subdomain !== undefined || hasDevAccess !== undefined;

  if (enabled) {
    console.log('🧪 Environment mocking enabled:', {
      subdomain,
      hasDevAccess,
      instructions: 'Add ?mock-reset to URL to clear mocks',
    });
  }

  return {
    subdomain,
    hasDevAccess,
    enabled,
  };
}

/**
 * Gets mocked environment info for testing
 */
export function getMockedEnvironmentInfo(mockConfig?: MockEnvironmentConfig) {
  const config = mockConfig || getMockConfig();

  if (!config.enabled || config.subdomain === undefined) {
    return null;
  }

  const subdomain = config.subdomain;
  const isDevEnvironment = subdomain === 'dev';
  const isEphemeralEnvironment = subdomain?.startsWith('pr-') ?? false;
  const requiresDevAccess = isDevEnvironment || isEphemeralEnvironment;

  return {
    subdomain,
    isDevEnvironment,
    isEphemeralEnvironment,
    requiresDevAccess,
    isAllowlistedHost: true, // Always true when mocking (only works on allowlisted hosts)
  };
}

/**
 * Display mock status indicator for debugging
 */
export function MockStatusIndicator() {
  if (typeof window === 'undefined') {
    return null;
  }

  const config = getMockConfig();
  if (!config.enabled) {
    return null;
  }

  return {
    render: () => {
      const indicator = document.createElement('div');
      indicator.id = 'mock-status-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(255, 100, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        pointer-events: none;
      `;

      const lines = [
        '🧪 MOCK MODE',
        config.subdomain !== undefined
          ? `env: ${config.subdomain || 'production'}`
          : null,
        config.hasDevAccess !== undefined
          ? `access: ${config.hasDevAccess}`
          : null,
      ].filter(Boolean);

      indicator.innerHTML = lines.join('<br>');

      // Remove existing indicator if present
      const existing = document.getElementById('mock-status-indicator');
      if (existing) {
        existing.remove();
      }

      document.body.appendChild(indicator);
    },
  };
}
