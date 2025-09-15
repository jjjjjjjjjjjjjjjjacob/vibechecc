import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage } from './storage';

export type Theme = 'light' | 'dark' | 'system';

export type PrimaryColorTheme =
  | 'purple-primary'
  | 'pink-primary'
  | 'blue-primary'
  | 'emerald-primary'
  | 'orange-primary'
  | 'red-primary'
  | 'indigo-primary'
  | 'teal-primary'
  | 'slate-primary'
  | 'amber-primary'
  | 'lime-primary'
  | 'cyan-primary'
  | 'violet-primary'
  | 'fuchsia-primary'
  | 'green-primary'
  | 'yellow-primary';

export type SecondaryColorTheme =
  | 'purple-secondary'
  | 'pink-secondary'
  | 'blue-secondary'
  | 'emerald-secondary'
  | 'orange-secondary'
  | 'red-secondary'
  | 'indigo-secondary'
  | 'teal-secondary'
  | 'slate-secondary'
  | 'amber-secondary'
  | 'lime-secondary'
  | 'cyan-secondary'
  | 'violet-secondary'
  | 'fuchsia-secondary'
  | 'green-secondary'
  | 'yellow-secondary';

export type ColorTheme = PrimaryColorTheme;

export interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  colorTheme: ColorTheme | null;
  secondaryColorTheme: SecondaryColorTheme | null;
  setColorTheme: (colorTheme: ColorTheme | null) => void;
  setSecondaryColorTheme: (
    secondaryColorTheme: SecondaryColorTheme | null
  ) => void;
  applyThemeToDocument: () => void;
  isInitialized: boolean;
  initialize: (params: {
    isSignedIn: boolean;
    userTheme?: Theme;
    userColorTheme?: ColorTheme | null;
    userSecondaryColorTheme?: SecondaryColorTheme | null;
  }) => void;
  // Mobile-specific methods
  getSystemTheme: () => 'light' | 'dark';
  syncWithServer: (userId?: string) => Promise<void>;
  resetToDefaults: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  // Web implementation
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // Mobile implementation would check React Native's Appearance API
  // import { Appearance } from 'react-native';
  // return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

  return 'light';
};

export const colorThemes: ColorTheme[] = [
  'purple-primary',
  'pink-primary',
  'blue-primary',
  'emerald-primary',
  'orange-primary',
  'red-primary',
  'indigo-primary',
  'teal-primary',
  'slate-primary',
  'amber-primary',
  'lime-primary',
  'cyan-primary',
  'violet-primary',
  'fuchsia-primary',
  'green-primary',
  'yellow-primary',
];

export const secondaryThemes: SecondaryColorTheme[] = [
  'purple-secondary',
  'pink-secondary',
  'blue-secondary',
  'emerald-secondary',
  'orange-secondary',
  'red-secondary',
  'indigo-secondary',
  'teal-secondary',
  'slate-secondary',
  'amber-secondary',
  'lime-secondary',
  'cyan-secondary',
  'violet-secondary',
  'fuchsia-secondary',
  'green-secondary',
  'yellow-secondary',
];

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      colorTheme: null,
      secondaryColorTheme: null,
      resolvedTheme: 'light',
      isInitialized: false,

      setTheme: (theme) => {
        set({ theme });
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme });
        get().applyThemeToDocument();
      },

      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        get().applyThemeToDocument();
      },

      setSecondaryColorTheme: (secondaryColorTheme) => {
        set({ secondaryColorTheme });
        get().applyThemeToDocument();
      },

      getSystemTheme,

      initialize: (params) => {
        if (get().isInitialized) return;

        // Step 1: Load from localStorage/AsyncStorage
        let localTheme: Theme = 'system';
        let localColorTheme: ColorTheme | null = null;
        let localSecondaryColorTheme: SecondaryColorTheme | null = null;

        // Storage loading is handled by zustand persist middleware

        // Step 2: Determine final theme values
        let finalTheme = localTheme;
        let finalColorTheme = localColorTheme;
        let finalSecondaryColorTheme = localSecondaryColorTheme;

        // If user is signed in and has theme preferences, use them
        if (
          params.isSignedIn &&
          (params.userTheme ||
            params.userColorTheme ||
            params.userSecondaryColorTheme)
        ) {
          // For mode, always prefer localStorage (user can change it locally)
          finalTheme = localTheme;

          // For colors, use user preferences if they exist
          if (params.userColorTheme !== undefined) {
            finalColorTheme = params.userColorTheme;
          }
          if (params.userSecondaryColorTheme !== undefined) {
            finalSecondaryColorTheme = params.userSecondaryColorTheme;
          }
        }

        // If not signed in, clear color themes
        if (!params.isSignedIn) {
          finalColorTheme = null;
          finalSecondaryColorTheme = null;
        }

        // Step 3: Calculate resolved theme
        const resolvedTheme =
          finalTheme === 'system' ? getSystemTheme() : finalTheme;

        // Step 4: Set state once
        set({
          theme: finalTheme,
          colorTheme: finalColorTheme,
          secondaryColorTheme: finalSecondaryColorTheme,
          resolvedTheme,
          isInitialized: true,
        });

        // Step 5: Apply to document
        get().applyThemeToDocument();
      },

      applyThemeToDocument: () => {
        // Web implementation
        if (typeof window !== 'undefined') {
          const state = get();
          const root = window.document.documentElement;

          // Apply light/dark mode
          root.classList.remove('light', 'dark');
          root.classList.add(state.resolvedTheme);

          // Clear all color themes
          root.classList.remove(...colorThemes, ...secondaryThemes);

          // Apply color themes if they exist
          if (state.colorTheme) {
            root.classList.add(state.colorTheme);
          }
          if (state.secondaryColorTheme) {
            root.classList.add(state.secondaryColorTheme);
          }
        }

        // Mobile implementation would update React Native's StatusBar and theme context
        // This would be handled by a mobile-specific theme provider
      },

      syncWithServer: async (userId?: string) => {
        if (!userId) return;

        try {
          const state = get();

          // This would sync theme preferences with Convex
          // await api.users.updateThemePreferences.call({
          //   theme: state.theme,
          //   colorTheme: state.colorTheme,
          //   secondaryColorTheme: state.secondaryColorTheme,
          // });
        } catch (error) {
          console.error('Failed to sync theme with server:', error);
        }
      },

      resetToDefaults: () => {
        set({
          theme: 'system',
          colorTheme: null,
          secondaryColorTheme: null,
          resolvedTheme: getSystemTheme(),
        });
        get().applyThemeToDocument();
      },
    }),
    {
      name: 'theme-storage',
      storage: createStorage(),
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        secondaryColorTheme: state.secondaryColorTheme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate resolved theme after rehydration
          const resolvedTheme = state.theme === 'system' ? getSystemTheme() : state.theme;
          state.resolvedTheme = resolvedTheme;
          state.applyThemeToDocument();
        }
      },
    }
  )
);

// Theme utilities
export const themeUtils = {
  // Get random color theme
  getRandomColorTheme(): ColorTheme {
    return colorThemes[Math.floor(Math.random() * colorThemes.length)];
  },

  // Get random secondary theme
  getRandomSecondaryTheme(): SecondaryColorTheme {
    return secondaryThemes[Math.floor(Math.random() * secondaryThemes.length)];
  },

  // Check if theme is dark
  isDarkTheme(theme: Theme): boolean {
    if (theme === 'system') {
      return getSystemTheme() === 'dark';
    }
    return theme === 'dark';
  },

  // Get contrast color for readability
  getContrastColor(colorTheme: ColorTheme | null): 'light' | 'dark' {
    if (!colorTheme) return 'dark';

    // Determine if the color theme is light or dark
    const lightThemes = ['yellow-primary', 'lime-primary', 'amber-primary'];
    return lightThemes.includes(colorTheme) ? 'dark' : 'light';
  },
};