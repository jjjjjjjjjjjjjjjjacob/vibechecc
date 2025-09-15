import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import * as SecureStore from 'expo-secure-store';

// Conditionally import GestureHandlerRootView
let GestureHandlerRootView: React.ComponentType<any>;
try {
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
} catch {
  // Fallback if gesture handler is not available
  GestureHandlerRootView = ({ children }: { children: React.ReactNode }) => children as any;
}

import '../styles/global.css';

// TODO: Move to env vars
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Initialize Convex client
const convex = new ConvexReactClient(CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Connect ConvexQueryClient to QueryClient
convexQueryClient.connect(queryClient);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <ConvexProvider client={convex}>
            <QueryClientProvider client={queryClient}>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false }}
                />
              </Stack>
            </QueryClientProvider>
          </ConvexProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
