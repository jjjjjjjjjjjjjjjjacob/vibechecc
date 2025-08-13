import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
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

type ColorTheme = PrimaryColorTheme;

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  colorTheme: ColorTheme | null;
  secondaryColorTheme: SecondaryColorTheme | null;
  setColorTheme: (colorTheme: ColorTheme | null) => void;
  setSecondaryColorTheme: (
    secondaryColorTheme: SecondaryColorTheme | null
  ) => void;
  initializeTheme: () => void;
  applyThemeToDocument: () => void;
  isInitialized: boolean;
  isUserSignedIn: boolean;
  setUserSignedIn: (isSignedIn: boolean) => void;
  // Get the effective color theme (only returns custom theme if user is signed in)
  getEffectiveColorTheme: () => ColorTheme | null;
  getEffectiveSecondaryColorTheme: () => SecondaryColorTheme | null;
  // Theme loading state management
  isThemeLoaded: boolean;
  isLocalStorageLoaded: boolean;
  loadThemeFromLocalStorage: () => void;
  syncUserThemePreferences: (
    userTheme?: Theme,
    userColorTheme?: ColorTheme | null,
    userSecondaryColorTheme?: SecondaryColorTheme | null
  ) => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

const colorThemes: ColorTheme[] = [
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

const secondaryThemes: SecondaryColorTheme[] = [
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
      isUserSignedIn: false,
      isThemeLoaded: false,
      isLocalStorageLoaded: false,

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

      setUserSignedIn: (isSignedIn) => {
        set({ isUserSignedIn: isSignedIn });
        // Re-apply theme when sign-in status changes
        get().applyThemeToDocument();
      },

      getEffectiveColorTheme: () => {
        const state = get();
        // Only return custom color theme if user is signed in
        return state.isUserSignedIn ? state.colorTheme : null;
      },

      getEffectiveSecondaryColorTheme: () => {
        const state = get();
        // Only return custom secondary color theme if user is signed in
        return state.isUserSignedIn ? state.secondaryColorTheme : null;
      },

      initializeTheme: () => {
        const state = get();
        const resolvedTheme =
          state.theme === 'system' ? getSystemTheme() : state.theme;
        set({ resolvedTheme, isInitialized: true });
        state.applyThemeToDocument();

        if (typeof window !== 'undefined' && state.theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const newResolvedTheme = getSystemTheme();
            set({ resolvedTheme: newResolvedTheme });
            get().applyThemeToDocument();
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },

      applyThemeToDocument: () => {
        if (typeof window === 'undefined') return;

        const state = get();
        const root = window.document.documentElement;

        // Apply light/dark mode
        root.classList.remove('light', 'dark');
        root.classList.add(state.resolvedTheme);

        // Clear all color themes
        root.classList.remove(...colorThemes, ...secondaryThemes);

        // Only apply custom color themes if user is signed in
        const effectiveColorTheme = state.getEffectiveColorTheme();
        const effectiveSecondaryColorTheme =
          state.getEffectiveSecondaryColorTheme();

        if (effectiveColorTheme) {
          root.classList.add(effectiveColorTheme);
        }
        if (effectiveSecondaryColorTheme) {
          root.classList.add(effectiveSecondaryColorTheme);
        }
      },

      loadThemeFromLocalStorage: () => {
        if (typeof window === 'undefined') return;

        try {
          const stored = localStorage.getItem('theme-storage');
          if (stored) {
            const parsedData = JSON.parse(stored);
            const { theme, colorTheme, secondaryColorTheme } =
              parsedData.state || {};

            // Apply localStorage data immediately
            if (theme) {
              const resolvedTheme =
                theme === 'system' ? getSystemTheme() : theme;
              set({
                theme,
                colorTheme: colorTheme || null,
                secondaryColorTheme: secondaryColorTheme || null,
                resolvedTheme,
                isLocalStorageLoaded: true,
              });
              // Apply theme immediately
              get().applyThemeToDocument();
            }
          } else {
            // No localStorage data, mark as loaded with defaults
            set({ isLocalStorageLoaded: true });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load theme from localStorage:', error);
          set({ isLocalStorageLoaded: true });
        }
      },

      syncUserThemePreferences: (
        userTheme,
        userColorTheme,
        userSecondaryColorTheme
      ) => {
        const state = get();

        // If localStorage already has data, localStorage is source of truth
        if (
          state.isLocalStorageLoaded &&
          (state.colorTheme !== null || state.secondaryColorTheme !== null)
        ) {
          set({ isThemeLoaded: true });
          return;
        }

        // If no localStorage data but user has preferences, use user preferences and update localStorage
        if (userTheme || userColorTheme || userSecondaryColorTheme) {
          const newTheme = userTheme || state.theme;
          const resolvedTheme =
            newTheme === 'system' ? getSystemTheme() : newTheme;

          set({
            theme: newTheme,
            colorTheme: userColorTheme || null,
            secondaryColorTheme: userSecondaryColorTheme || null,
            resolvedTheme,
            isThemeLoaded: true,
          });

          get().applyThemeToDocument();

          // Update localStorage with user preferences
          try {
            const currentStorage = localStorage.getItem('theme-storage');
            const storageData = currentStorage
              ? JSON.parse(currentStorage)
              : { state: {} };
            storageData.state = {
              ...storageData.state,
              theme: newTheme,
              colorTheme: userColorTheme || null,
              secondaryColorTheme: userSecondaryColorTheme || null,
            };
            localStorage.setItem('theme-storage', JSON.stringify(storageData));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(
              'Failed to update localStorage with user preferences:',
              error
            );
          }
        } else {
          // No user preferences, use defaults
          set({ isThemeLoaded: true });
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        secondaryColorTheme: state.secondaryColorTheme,
        // Note: isUserSignedIn is NOT persisted - it's determined by Clerk auth state
      }),
    }
  )
);
