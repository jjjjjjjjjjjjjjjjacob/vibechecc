import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';

// Platform-specific configuration interface
export interface ConvexClientConfig {
  deploymentUrl: string;
  authProvider?: 'clerk' | 'custom' | null;
  environment?: 'development' | 'production';
  enableDevtools?: boolean;
  offlineSupport?: boolean;
  cacheConfig?: {
    maxAge?: number;
    staleTime?: number;
    gcTime?: number;
  };
}

// Default configuration
const defaultConfig: ConvexClientConfig = {
  deploymentUrl: process.env.CONVEX_URL || '',
  authProvider: 'clerk',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  enableDevtools: process.env.NODE_ENV === 'development',
  offlineSupport: true,
  cacheConfig: {
    maxAge: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  },
};

// Singleton Convex client instance
let convexClient: ConvexReactClient | null = null;
let convexQueryClient: ConvexQueryClient | null = null;

// Create and configure Convex client
export function createConvexClient(config: Partial<ConvexClientConfig> = {}): ConvexReactClient {
  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.deploymentUrl) {
    throw new Error('Convex deployment URL is required');
  }

  if (convexClient) {
    return convexClient;
  }

  // Create Convex React client
  convexClient = new ConvexReactClient(finalConfig.deploymentUrl, {
    // Add any additional client options here
    verbose: finalConfig.environment === 'development',
  });

  return convexClient;
}

// Create Convex Query client for React Query integration
export function createConvexQueryClient(config: Partial<ConvexClientConfig> = {}): ConvexQueryClient {
  if (convexQueryClient) {
    return convexQueryClient;
  }

  const finalConfig = { ...defaultConfig, ...config };
  const client = createConvexClient(config);

  convexQueryClient = new ConvexQueryClient(client, {
    defaults: {
      queries: {
        staleTime: finalConfig.cacheConfig?.staleTime,
        gcTime: finalConfig.cacheConfig?.gcTime,
        retry: (failureCount, error) => {
          // Retry logic for network errors
          if (failureCount < 3 && isNetworkError(error)) {
            return true;
          }
          return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false, // Don't retry mutations by default
        onError: (error) => {
          console.error('Convex mutation error:', error);
        },
      },
    },
  });

  return convexQueryClient;
}

// Get the singleton Convex client
export function getConvexClient(): ConvexReactClient {
  if (!convexClient) {
    return createConvexClient();
  }
  return convexClient;
}

// Get the singleton Convex Query client
export function getConvexQueryClient(): ConvexQueryClient {
  if (!convexQueryClient) {
    return createConvexQueryClient();
  }
  return convexQueryClient;
}

// Initialize Convex for web platform
export function initializeConvexWeb(config: Partial<ConvexClientConfig> = {}) {
  return {
    client: createConvexClient(config),
    queryClient: createConvexQueryClient(config),
  };
}

// Initialize Convex for mobile platform with offline support
export function initializeConvexMobile(config: Partial<ConvexClientConfig> = {}) {
  const mobileConfig = {
    ...config,
    offlineSupport: true,
    cacheConfig: {
      ...defaultConfig.cacheConfig,
      ...config.cacheConfig,
      // Extended cache times for mobile
      maxAge: 1000 * 60 * 15, // 15 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  };

  return {
    client: createConvexClient(mobileConfig),
    queryClient: createConvexQueryClient(mobileConfig),
  };
}

// Utility to check if error is a network error
function isNetworkError(error: any): boolean {
  return (
    error?.name === 'NetworkError' ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    error?.code === 'NETWORK_ERROR'
  );
}

// Connection state management
export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectionTime: Date | null;
  retryCount: number;
}

// Connection state hook
export function useConvexConnection() {
  const client = getConvexClient();

  // This would integrate with Convex's connection state
  // For now, return a basic implementation
  return {
    isConnected: true, // client.connectionState?.isConnected ?? false,
    isReconnecting: false,
    lastConnectionTime: new Date(),
    retryCount: 0,
  };
}

// Cleanup function
export function cleanupConvexClients() {
  if (convexClient) {
    convexClient.close();
    convexClient = null;
  }
  convexQueryClient = null;
}

// Export types
export type { ConvexReactClient, ConvexQueryClient };