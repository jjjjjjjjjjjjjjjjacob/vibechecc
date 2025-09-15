import { useState, useEffect, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation
} from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';

// Platform-agnostic auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  error: Error | null;
}

// Auth event types
export type AuthEvent =
  | 'signIn'
  | 'signOut'
  | 'userUpdated'
  | 'sessionChanged';

// Auth event listener type
export type AuthEventListener = (event: AuthEvent, data?: any) => void;

// Platform-agnostic auth hook interface
export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  error: Error | null;

  // Actions
  signIn: (credentials?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;

  // Event handling
  addEventListener: (event: AuthEvent, listener: AuthEventListener) => void;
  removeEventListener: (event: AuthEvent, listener: AuthEventListener) => void;

  // Utility
  getToken: () => Promise<string | null>;
  refreshSession: () => Promise<void>;
}

// Event emitter for auth events
class AuthEventEmitter {
  private listeners = new Map<AuthEvent, Set<AuthEventListener>>();

  addEventListener(event: AuthEvent, listener: AuthEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  removeEventListener(event: AuthEvent, listener: AuthEventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: AuthEvent, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(event, data));
    }
  }
}

// Global auth event emitter instance
const authEmitter = new AuthEventEmitter();

// Default auth implementation for web (Clerk)
export function useWebAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const queryClient = useQueryClient();

  // Get current user from Convex
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useQuery({
    ...convexQuery(api.users.current, {}),
  });

  // Ensure user exists mutation
  const ensureUserMutation = useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
  });

  // Update auth state when user data changes
  useEffect(() => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: !!currentUser,
      isLoading: isUserLoading,
      user: currentUser,
      error: userError as Error | null,
    }));

    if (currentUser) {
      authEmitter.emit('userUpdated', currentUser);
    }
  }, [currentUser, isUserLoading, userError]);

  const signIn = useCallback(async (credentials?: any) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Platform-specific sign in logic would go here
      // For web, this would integrate with Clerk
      // For mobile, this would integrate with the mobile auth provider

      await ensureUserMutation.mutateAsync({});
      authEmitter.emit('signIn');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
      throw error;
    }
  }, [ensureUserMutation]);

  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Platform-specific sign out logic would go here

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });

      // Clear all cached data
      queryClient.clear();

      authEmitter.emit('signOut');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
      throw error;
    }
  }, [queryClient]);

  const updateUser = useCallback(async (data: any) => {
    try {
      // Update user via Convex
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      authEmitter.emit('userUpdated', data);
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  const getToken = useCallback(async (): Promise<string | null> => {
    // Platform-specific token retrieval
    // For web, this would get the Clerk token
    // For mobile, this would get the stored auth token
    return null;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      authEmitter.emit('sessionChanged');
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  return {
    ...authState,
    signIn,
    signOut,
    updateUser,
    addEventListener: authEmitter.addEventListener.bind(authEmitter),
    removeEventListener: authEmitter.removeEventListener.bind(authEmitter),
    getToken,
    refreshSession,
  };
}

// Mobile auth hook (to be implemented with platform-specific auth)
export function useMobileAuth(): UseAuthReturn {
  // This would implement mobile-specific authentication
  // using React Native's auth libraries (e.g., @clerk/clerk-expo)
  return useWebAuth(); // Fallback to web auth for now
}

// Platform-agnostic auth hook
export function useAuth(): UseAuthReturn {
  // Detect platform and use appropriate auth implementation
  const isMobile = typeof window !== 'undefined' &&
    (window as any).ReactNativeWebView !== undefined;

  if (isMobile) {
    return useMobileAuth();
  }

  return useWebAuth();
}

// Helper hooks for specific auth operations
export function useAuthUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

export function useAuthActions() {
  const { signIn, signOut, updateUser } = useAuth();
  return { signIn, signOut, updateUser };
}

export function useAuthStatus() {
  const { isAuthenticated, isLoading, error } = useAuth();
  return { isAuthenticated, isLoading, error };
}