import { StateStorage } from 'zustand/middleware';

// Platform-agnostic storage interface
export interface PlatformStorage extends StateStorage {
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<Array<[string, string | null]>>;
  multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

// Web storage implementation using localStorage
class WebStorage implements PlatformStorage {
  getItem(name: string): string | null | Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  setItem(name: string, value: string): void | Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  removeItem(name: string): void | Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    if (typeof window === 'undefined') return keys.map(key => [key, null]);
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      console.error('Error reading multiple items from localStorage:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('Error writing multiple items to localStorage:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error removing multiple items from localStorage:', error);
    }
  }
}

// Mobile storage implementation using AsyncStorage or MMKV
class MobileStorage implements PlatformStorage {
  // AsyncStorage lazy import to avoid errors when not in React Native
  private async getAsyncStorage() {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return AsyncStorage.default;
    } catch (error) {
      console.error('AsyncStorage not available:', error);
      return null;
    }
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return null;
      return await AsyncStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from mobile storage:', error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to mobile storage:', error);
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from mobile storage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing mobile storage:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return [];
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting mobile storage keys:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return keys.map(key => [key, null]);
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error reading multiple items from mobile storage:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error writing multiple items to mobile storage:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items from mobile storage:', error);
    }
  }
}

// Factory function to create appropriate storage based on platform
export function createStorage(): PlatformStorage {
  // Detect if we're in React Native environment
  // In React Native, window exists but localStorage doesn't
  const isReactNative = typeof window !== 'undefined' &&
    typeof localStorage === 'undefined';

  if (isReactNative) {
    return new MobileStorage();
  }

  return new WebStorage();
}

// Storage utilities
export const storageUtils = {
  // Clear all app data
  async clearAllData(): Promise<void> {
    const storage = createStorage();
    await storage.clear();
  },

  // Get storage size (web only)
  getStorageSize(): number {
    if (typeof window === 'undefined') return 0;

    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  },

  // Check if storage is available
  isStorageAvailable(): boolean {
    if (typeof window === 'undefined') {
      // For mobile, assume storage is available
      return true;
    }

    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Migrate data between storage versions
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    // Implementation would handle data migration between app versions
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
  },
};