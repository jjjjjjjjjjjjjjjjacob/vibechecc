import { QueryClient } from '@tanstack/react-query';

// Platform-agnostic auth token interface
export interface AuthToken {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

// Auth service interface
export interface AuthService {
  // Token management
  getToken(): Promise<string | null>;
  setToken(token: AuthToken): Promise<void>;
  clearToken(): Promise<void>;
  isTokenValid(): Promise<boolean>;
  refreshToken(): Promise<AuthToken | null>;

  // User session
  getUser(): Promise<any | null>;
  setUser(user: any): Promise<void>;
  clearUser(): Promise<void>;

  // Session management
  startSession(token: AuthToken, user: any): Promise<void>;
  endSession(): Promise<void>;
  validateSession(): Promise<boolean>;

  // Event handling
  onAuthStateChanged(callback: (isAuthenticated: boolean) => void): () => void;
}

// Storage interface for different platforms
export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Web storage implementation (localStorage)
export class WebAuthStorage implements AuthStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}

// Mobile storage implementation (would use AsyncStorage or MMKV)
export class MobileAuthStorage implements AuthStorage {
  async getItem(key: string): Promise<string | null> {
    // Implementation would use @react-native-async-storage/async-storage
    // or react-native-mmkv for better performance
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    // Implementation would use @react-native-async-storage/async-storage
    // or react-native-mmkv for better performance
  }

  async removeItem(key: string): Promise<void> {
    // Implementation would use @react-native-async-storage/async-storage
    // or react-native-mmkv for better performance
  }

  async clear(): Promise<void> {
    // Implementation would use @react-native-async-storage/async-storage
    // or react-native-mmkv for better performance
  }
}

// Auth service implementation
export class ConvexAuthService implements AuthService {
  private storage: AuthStorage;
  private authStateListeners: Set<(isAuthenticated: boolean) => void> = new Set();
  private queryClient?: QueryClient;

  constructor(storage: AuthStorage, queryClient?: QueryClient) {
    this.storage = storage;
    this.queryClient = queryClient;
  }

  async getToken(): Promise<string | null> {
    try {
      const tokenData = await this.storage.getItem('auth_token');
      if (!tokenData) return null;

      const parsed: AuthToken = JSON.parse(tokenData);

      // Check if token is expired
      if (new Date() >= new Date(parsed.expiresAt)) {
        await this.clearToken();
        return null;
      }

      return parsed.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async setToken(token: AuthToken): Promise<void> {
    try {
      await this.storage.setItem('auth_token', JSON.stringify(token));
      this.notifyAuthStateChanged(true);
    } catch (error) {
      console.error('Error setting auth token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await this.storage.removeItem('auth_token');
      this.notifyAuthStateChanged(false);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  async isTokenValid(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async refreshToken(): Promise<AuthToken | null> {
    try {
      const tokenData = await this.storage.getItem('auth_token');
      if (!tokenData) return null;

      const parsed: AuthToken = JSON.parse(tokenData);
      if (!parsed.refreshToken) return null;

      // Platform-specific token refresh logic would go here
      // For Clerk, this would use their refresh token endpoint
      // For custom auth, this would call your refresh endpoint

      return null; // Placeholder
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  async getUser(): Promise<any | null> {
    try {
      const userData = await this.storage.getItem('auth_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async setUser(user: any): Promise<void> {
    try {
      await this.storage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user data:', error);
      throw error;
    }
  }

  async clearUser(): Promise<void> {
    try {
      await this.storage.removeItem('auth_user');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  async startSession(token: AuthToken, user: any): Promise<void> {
    await Promise.all([
      this.setToken(token),
      this.setUser(user),
    ]);
  }

  async endSession(): Promise<void> {
    await Promise.all([
      this.clearToken(),
      this.clearUser(),
    ]);

    // Clear React Query cache
    if (this.queryClient) {
      this.queryClient.clear();
    }
  }

  async validateSession(): Promise<boolean> {
    const [isTokenValid, user] = await Promise.all([
      this.isTokenValid(),
      this.getUser(),
    ]);

    return isTokenValid && user !== null;
  }

  onAuthStateChanged(callback: (isAuthenticated: boolean) => void): () => void {
    this.authStateListeners.add(callback);

    // Return cleanup function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  private notifyAuthStateChanged(isAuthenticated: boolean): void {
    this.authStateListeners.forEach(callback => {
      try {
        callback(isAuthenticated);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

// Factory functions for different platforms
export function createWebAuthService(queryClient?: QueryClient): AuthService {
  return new ConvexAuthService(new WebAuthStorage(), queryClient);
}

export function createMobileAuthService(queryClient?: QueryClient): AuthService {
  return new ConvexAuthService(new MobileAuthStorage(), queryClient);
}

// Platform-agnostic factory
export function createAuthService(queryClient?: QueryClient): AuthService {
  const isMobile = typeof window !== 'undefined' &&
    (window as any).ReactNativeWebView !== undefined;

  if (isMobile) {
    return createMobileAuthService(queryClient);
  }

  return createWebAuthService(queryClient);
}

// Singleton auth service instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(queryClient?: QueryClient): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = createAuthService(queryClient);
  }
  return authServiceInstance;
}

// Auth utilities
export const authUtils = {
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const authService = getAuthService();
    return authService.validateSession();
  },

  // Get current auth token
  async getCurrentToken(): Promise<string | null> {
    const authService = getAuthService();
    return authService.getToken();
  },

  // Get current user
  async getCurrentUser(): Promise<any | null> {
    const authService = getAuthService();
    return authService.getUser();
  },

  // Sign out user
  async signOut(): Promise<void> {
    const authService = getAuthService();
    await authService.endSession();
  },
};