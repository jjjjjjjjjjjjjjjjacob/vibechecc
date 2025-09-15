import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage } from './storage';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  isOnboarded?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Session state
  sessionToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;

  // Onboarding state
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Device state (mobile-specific)
  deviceId?: string;
  biometricEnabled: boolean;
  pushToken?: string;
}

export interface AuthActions {
  // User actions
  setUser: (user: AuthUser | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearUser: () => void;

  // Auth state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;

  // Session actions
  setSession: (token: string, refreshToken?: string, expiresAt?: Date) => void;
  clearSession: () => void;
  updateSessionToken: (token: string, expiresAt?: Date) => void;
  isSessionValid: () => boolean;

  // Onboarding actions
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  resetOnboarding: () => void;

  // Device actions (mobile-specific)
  setDeviceId: (deviceId: string) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPushToken: (token: string) => void;

  // Utility actions
  reset: () => void;
  hydrate: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  onboardingCompleted: false,
  onboardingStep: 0,
  deviceId: undefined,
  biometricEnabled: false,
  pushToken: undefined,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // User actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Auth state actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

      // Session actions
      setSession: (token, refreshToken, expiresAt) => {
        set({
          sessionToken: token,
          refreshToken,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true,
          error: null,
        });
      },

      clearSession: () => {
        set({
          sessionToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
        });
      },

      updateSessionToken: (token, expiresAt) => {
        set({
          sessionToken: token,
          tokenExpiresAt: expiresAt,
        });
      },

      isSessionValid: () => {
        const { sessionToken, tokenExpiresAt } = get();

        if (!sessionToken) return false;

        if (tokenExpiresAt) {
          return new Date() < new Date(tokenExpiresAt);
        }

        // If no expiration date, assume token is valid
        return true;
      },

      // Onboarding actions
      setOnboardingCompleted: (completed) => {
        set({ onboardingCompleted: completed });
      },

      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      nextOnboardingStep: () => {
        const currentStep = get().onboardingStep;
        set({ onboardingStep: currentStep + 1 });
      },

      resetOnboarding: () => {
        set({
          onboardingCompleted: false,
          onboardingStep: 0,
        });
      },

      // Device actions (mobile-specific)
      setDeviceId: (deviceId) => {
        set({ deviceId });
      },

      setBiometricEnabled: (enabled) => {
        set({ biometricEnabled: enabled });
      },

      setPushToken: (token) => {
        set({ pushToken: token });
      },

      // Utility actions
      reset: () => {
        set(initialState);
      },

      hydrate: () => {
        // This is called after rehydration from storage
        const { tokenExpiresAt, sessionToken } = get();

        // Check if session is still valid after rehydration
        if (sessionToken && tokenExpiresAt) {
          const isValid = new Date() < new Date(tokenExpiresAt);
          if (!isValid) {
            get().clearSession();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createStorage(),
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        onboardingCompleted: state.onboardingCompleted,
        onboardingStep: state.onboardingStep,
        deviceId: state.deviceId,
        biometricEnabled: state.biometricEnabled,
        pushToken: state.pushToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate();
        }
      },
    }
  )
);

// Auth store utilities
export const authStoreUtils = {
  // Get current user safely
  getCurrentUser: (): AuthUser | null => {
    return useAuthStore.getState().user;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const state = useAuthStore.getState();
    return state.isAuthenticated && state.isSessionValid();
  },

  // Get session token
  getSessionToken: (): string | null => {
    const state = useAuthStore.getState();
    return state.isSessionValid() ? state.sessionToken : null;
  },

  // Check if onboarding is needed
  needsOnboarding: (): boolean => {
    const state = useAuthStore.getState();
    const user = state.user;
    return !!(user && !state.onboardingCompleted && !user.isOnboarded);
  },

  // Get user display name
  getUserDisplayName: (): string => {
    const user = useAuthStore.getState().user;
    if (!user) return 'Guest';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if (user.username) {
      return `@${user.username}`;
    }

    return user.email.split('@')[0];
  },

  // Check if biometrics can be used
  canUseBiometrics: (): boolean => {
    const state = useAuthStore.getState();
    return state.biometricEnabled && !!state.deviceId;
  },

  // Get user avatar URL or initials
  getUserAvatar: (): { type: 'url' | 'initials'; value: string } => {
    const user = useAuthStore.getState().user;
    if (!user) return { type: 'initials', value: 'G' };

    if (user.imageUrl) {
      return { type: 'url', value: user.imageUrl };
    }

    const displayName = authStoreUtils.getUserDisplayName();
    const initials = displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return { type: 'initials', value: initials || 'U' };
  },
};

// Selectors for common use cases
export const authSelectors = {
  user: (state: AuthStore) => state.user,
  isAuthenticated: (state: AuthStore) => state.isAuthenticated && state.isSessionValid(),
  isLoading: (state: AuthStore) => state.isLoading,
  error: (state: AuthStore) => state.error,
  onboardingStep: (state: AuthStore) => state.onboardingStep,
  needsOnboarding: (state: AuthStore) =>
    !!(state.user && !state.onboardingCompleted && !state.user.isOnboarded),
};