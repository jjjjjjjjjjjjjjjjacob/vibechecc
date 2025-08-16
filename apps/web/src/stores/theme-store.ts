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
  applyThemeToDocument: () => void;
  isInitialized: boolean;
  initialize: (params: {
    isSignedIn: boolean;
    userTheme?: Theme;
    userColorTheme?: ColorTheme | null;
    userSecondaryColorTheme?: SecondaryColorTheme | null;
  }) => void;
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

      initialize: (params) => {
        if (typeof window === 'undefined') return;

        // Prevent re-initialization
        if (get().isInitialized) return;

        // Step 1: Load from localStorage
        let localTheme: Theme = 'system';
        let localColorTheme: ColorTheme | null = null;
        let localSecondaryColorTheme: SecondaryColorTheme | null = null;

        try {
          const stored = localStorage.getItem('theme-storage');
          if (stored) {
            const parsedData = JSON.parse(stored);
            const storedState = parsedData.state || {};
            localTheme = storedState.theme || 'system';
            localColorTheme = storedState.colorTheme || null;
            localSecondaryColorTheme = storedState.secondaryColorTheme || null;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load theme from localStorage:', error);
        }

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

          // Update localStorage with merged preferences
          try {
            const storageData = {
              state: {
                theme: finalTheme,
                colorTheme: finalColorTheme,
                secondaryColorTheme: finalSecondaryColorTheme,
              },
            };
            localStorage.setItem('theme-storage', JSON.stringify(storageData));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Failed to update localStorage:', error);
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

        // Step 6: Setup system theme listener if needed
        /*
        if (finalTheme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const newResolvedTheme = getSystemTheme();
            set({ resolvedTheme: newResolvedTheme });
            get().applyThemeToDocument();
          };
          mediaQuery.addEventListener('change', handleChange);
        }
        */
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

        // Apply color themes if they exist
        if (state.colorTheme) {
          root.classList.add(state.colorTheme);
        }
        if (state.secondaryColorTheme) {
          root.classList.add(state.secondaryColorTheme);
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        secondaryColorTheme: state.secondaryColorTheme,
      }),
    }
  )
);
