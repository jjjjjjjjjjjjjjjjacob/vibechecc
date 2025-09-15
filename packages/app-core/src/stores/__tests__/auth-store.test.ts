import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, authStoreUtils, type AuthUser } from '../auth-store';

// Mock storage
vi.mock('../storage', () => ({
  createStorage: () => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().reset();
  });

  describe('user management', () => {
    it('should set user and mark as authenticated', () => {
      const user: AuthUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      useAuthStore.getState().setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should update user properties', () => {
      const user: AuthUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };

      useAuthStore.getState().setUser(user);
      useAuthStore.getState().updateUser({
        firstName: 'John',
        lastName: 'Doe',
      });

      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe('John');
      expect(state.user?.lastName).toBe('Doe');
      expect(state.user?.email).toBe('test@example.com'); // Should preserve existing data
    });

    it('should clear user and mark as unauthenticated', () => {
      const user: AuthUser = {
        id: '1',
        email: 'test@example.com',
      };

      useAuthStore.getState().setUser(user);
      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('session management', () => {
    it('should set session with token and expiration', () => {
      const token = 'test-token';
      const refreshToken = 'refresh-token';
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      useAuthStore.getState().setSession(token, refreshToken, expiresAt);

      const state = useAuthStore.getState();
      expect(state.sessionToken).toBe(token);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.tokenExpiresAt).toEqual(expiresAt);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should validate session correctly', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      // Valid session
      useAuthStore.getState().setSession('token', undefined, futureDate);
      expect(useAuthStore.getState().isSessionValid()).toBe(true);

      // Expired session
      useAuthStore.getState().updateSessionToken('token', pastDate);
      expect(useAuthStore.getState().isSessionValid()).toBe(false);

      // No expiration date (assume valid)
      useAuthStore.getState().updateSessionToken('token', undefined);
      expect(useAuthStore.getState().isSessionValid()).toBe(true);

      // No token
      useAuthStore.getState().clearSession();
      expect(useAuthStore.getState().isSessionValid()).toBe(false);
    });

    it('should clear session', () => {
      useAuthStore.getState().setSession('token', 'refresh', new Date());
      useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.sessionToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiresAt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('onboarding management', () => {
    it('should manage onboarding state', () => {
      expect(useAuthStore.getState().onboardingCompleted).toBe(false);
      expect(useAuthStore.getState().onboardingStep).toBe(0);

      useAuthStore.getState().nextOnboardingStep();
      expect(useAuthStore.getState().onboardingStep).toBe(1);

      useAuthStore.getState().setOnboardingStep(3);
      expect(useAuthStore.getState().onboardingStep).toBe(3);

      useAuthStore.getState().setOnboardingCompleted(true);
      expect(useAuthStore.getState().onboardingCompleted).toBe(true);

      useAuthStore.getState().resetOnboarding();
      expect(useAuthStore.getState().onboardingCompleted).toBe(false);
      expect(useAuthStore.getState().onboardingStep).toBe(0);
    });
  });

  describe('device management', () => {
    it('should manage device-specific settings', () => {
      const deviceId = 'device-123';
      const pushToken = 'push-token-456';

      useAuthStore.getState().setDeviceId(deviceId);
      useAuthStore.getState().setPushToken(pushToken);
      useAuthStore.getState().setBiometricEnabled(true);

      const state = useAuthStore.getState();
      expect(state.deviceId).toBe(deviceId);
      expect(state.pushToken).toBe(pushToken);
      expect(state.biometricEnabled).toBe(true);
    });
  });

  describe('state management', () => {
    it('should manage loading and error states', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');

      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should reset all state', () => {
      // Set up some state
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
      });
      useAuthStore.getState().setSession('token');
      useAuthStore.getState().setOnboardingStep(3);
      useAuthStore.getState().setDeviceId('device-123');

      // Reset
      useAuthStore.getState().reset();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.sessionToken).toBeNull();
      expect(state.onboardingStep).toBe(0);
      expect(state.deviceId).toBeUndefined();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});

describe('authStoreUtils', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const user: AuthUser = {
        id: '1',
        email: 'test@example.com',
      };

      useAuthStore.getState().setUser(user);
      expect(authStoreUtils.getCurrentUser()).toEqual(user);

      useAuthStore.getState().clearUser();
      expect(authStoreUtils.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should check authentication status with session validation', () => {
      // Not authenticated
      expect(authStoreUtils.isAuthenticated()).toBe(false);

      // Authenticated with valid session
      useAuthStore.getState().setAuthenticated(true);
      useAuthStore.getState().setSession('token', undefined, new Date(Date.now() + 3600000));
      expect(authStoreUtils.isAuthenticated()).toBe(true);

      // Authenticated but expired session
      useAuthStore.getState().updateSessionToken('token', new Date(Date.now() - 3600000));
      expect(authStoreUtils.isAuthenticated()).toBe(false);
    });
  });

  describe('getSessionToken', () => {
    it('should return token only if session is valid', () => {
      const token = 'test-token';

      // Valid session
      useAuthStore.getState().setSession(token, undefined, new Date(Date.now() + 3600000));
      expect(authStoreUtils.getSessionToken()).toBe(token);

      // Expired session
      useAuthStore.getState().updateSessionToken(token, new Date(Date.now() - 3600000));
      expect(authStoreUtils.getSessionToken()).toBeNull();
    });
  });

  describe('needsOnboarding', () => {
    it('should determine if onboarding is needed', () => {
      // No user
      expect(authStoreUtils.needsOnboarding()).toBe(false);

      // User not onboarded in store
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
      });
      expect(authStoreUtils.needsOnboarding()).toBe(true);

      // User onboarded in store
      useAuthStore.getState().setOnboardingCompleted(true);
      expect(authStoreUtils.needsOnboarding()).toBe(false);

      // User onboarded in user object
      useAuthStore.getState().setOnboardingCompleted(false);
      useAuthStore.getState().updateUser({ isOnboarded: true });
      expect(authStoreUtils.needsOnboarding()).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return appropriate display name', () => {
      // No user
      expect(authStoreUtils.getUserDisplayName()).toBe('Guest');

      // Full name
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(authStoreUtils.getUserDisplayName()).toBe('John Doe');

      // Username only
      useAuthStore.getState().updateUser({
        firstName: undefined,
        lastName: undefined,
        username: 'johndoe',
      });
      expect(authStoreUtils.getUserDisplayName()).toBe('@johndoe');

      // Email only
      useAuthStore.getState().updateUser({
        username: undefined,
      });
      expect(authStoreUtils.getUserDisplayName()).toBe('test');
    });
  });

  describe('canUseBiometrics', () => {
    it('should check biometric availability', () => {
      // No device ID or biometrics disabled
      expect(authStoreUtils.canUseBiometrics()).toBe(false);

      // Device ID but biometrics disabled
      useAuthStore.getState().setDeviceId('device-123');
      expect(authStoreUtils.canUseBiometrics()).toBe(false);

      // Both device ID and biometrics enabled
      useAuthStore.getState().setBiometricEnabled(true);
      expect(authStoreUtils.canUseBiometrics()).toBe(true);
    });
  });

  describe('getUserAvatar', () => {
    it('should return avatar URL when available', () => {
      const imageUrl = 'https://example.com/avatar.jpg';
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        imageUrl,
      });

      const avatar = authStoreUtils.getUserAvatar();
      expect(avatar.type).toBe('url');
      expect(avatar.value).toBe(imageUrl);
    });

    it('should return initials when no image URL', () => {
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const avatar = authStoreUtils.getUserAvatar();
      expect(avatar.type).toBe('initials');
      expect(avatar.value).toBe('JD');
    });

    it('should return guest initials when no user', () => {
      const avatar = authStoreUtils.getUserAvatar();
      expect(avatar.type).toBe('initials');
      expect(avatar.value).toBe('G');
    });
  });
});