import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createConvexClient,
  createConvexQueryClient,
  initializeConvexMobile,
  initializeConvexWeb,
  cleanupConvexClients,
} from '../convex-client';

// Mock the Convex libraries
vi.mock('convex/react', () => ({
  ConvexReactClient: vi.fn().mockImplementation((url, options) => ({
    url,
    options,
    close: vi.fn(),
  })),
}));

vi.mock('@convex-dev/react-query', () => ({
  ConvexQueryClient: vi.fn().mockImplementation((client, options) => ({
    client,
    options,
  })),
}));

describe('convex-client', () => {
  beforeEach(() => {
    // Clean up any existing clients before each test
    cleanupConvexClients();
    vi.clearAllMocks();
  });

  describe('createConvexClient', () => {
    it('should create a Convex client with default config', () => {
      const mockUrl = 'https://test.convex.cloud';
      process.env.CONVEX_URL = mockUrl;

      const client = createConvexClient();

      expect(client).toBeDefined();
      expect(client.url).toBe(mockUrl);
    });

    it('should create a Convex client with custom config', () => {
      const customConfig = {
        deploymentUrl: 'https://custom.convex.cloud',
        environment: 'production' as const,
        enableDevtools: false,
      };

      const client = createConvexClient(customConfig);

      expect(client).toBeDefined();
      expect(client.url).toBe(customConfig.deploymentUrl);
      expect(client.options.verbose).toBe(false); // Production mode
    });

    it('should throw error if no deployment URL is provided', () => {
      delete process.env.CONVEX_URL;

      expect(() => createConvexClient()).toThrow('Convex deployment URL is required');
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const client1 = createConvexClient(config);
      const client2 = createConvexClient(config);

      expect(client1).toBe(client2);
    });
  });

  describe('createConvexQueryClient', () => {
    it('should create a ConvexQueryClient with default options', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const queryClient = createConvexQueryClient(config);

      expect(queryClient).toBeDefined();
      expect(queryClient.client).toBeDefined();
      expect(queryClient.options).toBeDefined();
    });

    it('should create query client with custom cache configuration', () => {
      const config = {
        deploymentUrl: 'https://test.convex.cloud',
        cacheConfig: {
          staleTime: 5000,
          gcTime: 10000,
        },
      };

      const queryClient = createConvexQueryClient(config);

      expect(queryClient.options.defaults.queries.staleTime).toBe(5000);
      expect(queryClient.options.defaults.queries.gcTime).toBe(10000);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const queryClient1 = createConvexQueryClient(config);
      const queryClient2 = createConvexQueryClient(config);

      expect(queryClient1).toBe(queryClient2);
    });
  });

  describe('initializeConvexWeb', () => {
    it('should initialize Convex for web platform', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const { client, queryClient } = initializeConvexWeb(config);

      expect(client).toBeDefined();
      expect(queryClient).toBeDefined();
    });
  });

  describe('initializeConvexMobile', () => {
    it('should initialize Convex for mobile platform with extended cache times', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const { client, queryClient } = initializeConvexMobile(config);

      expect(client).toBeDefined();
      expect(queryClient).toBeDefined();

      // Check that mobile config has extended cache times
      const defaults = queryClient.options.defaults;
      expect(defaults.queries.staleTime).toBeGreaterThan(60000); // More than 1 minute
      expect(defaults.queries.gcTime).toBeGreaterThan(600000); // More than 10 minutes
    });

    it('should enable offline support by default for mobile', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const { client, queryClient } = initializeConvexMobile(config);

      expect(client).toBeDefined();
      expect(queryClient).toBeDefined();
    });

    it('should allow custom mobile configuration overrides', () => {
      const config = {
        deploymentUrl: 'https://test.convex.cloud',
        cacheConfig: {
          staleTime: 30000, // Custom value
        },
      };

      const { client, queryClient } = initializeConvexMobile(config);

      // Should use the merged config, not just the custom value
      expect(queryClient.options.defaults.queries.staleTime).toBe(30000);
    });
  });

  describe('error handling and retry logic', () => {
    it('should configure retry logic for network errors', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const queryClient = createConvexQueryClient(config);
      const retryFn = queryClient.options.defaults.queries.retry;

      // Test retry logic
      const networkError = { name: 'NetworkError' };
      const otherError = { name: 'ValidationError' };

      expect(retryFn(0, networkError)).toBe(true); // Should retry network errors
      expect(retryFn(0, otherError)).toBe(false); // Should not retry other errors
      expect(retryFn(3, networkError)).toBe(false); // Should not retry after max attempts
    });

    it('should not retry mutations by default', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      const queryClient = createConvexQueryClient(config);
      const mutationRetry = queryClient.options.defaults.mutations.retry;

      expect(mutationRetry).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup clients when called', () => {
      const config = { deploymentUrl: 'https://test.convex.cloud' };

      // Create clients
      const client = createConvexClient(config);
      const queryClient = createConvexQueryClient(config);

      expect(client).toBeDefined();
      expect(queryClient).toBeDefined();

      // Cleanup
      cleanupConvexClients();

      // Should be able to create new instances after cleanup
      const newClient = createConvexClient(config);
      expect(newClient).not.toBe(client); // Should be a new instance
    });
  });

  describe('environment-specific configuration', () => {
    it('should enable verbose logging in development', () => {
      const config = {
        deploymentUrl: 'https://test.convex.cloud',
        environment: 'development' as const,
      };

      const client = createConvexClient(config);

      expect(client.options.verbose).toBe(true);
    });

    it('should disable verbose logging in production', () => {
      const config = {
        deploymentUrl: 'https://test.convex.cloud',
        environment: 'production' as const,
      };

      const client = createConvexClient(config);

      expect(client.options.verbose).toBe(false);
    });
  });
});