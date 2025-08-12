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

      initializeTheme: () => {
        const state = get();
        const resolvedTheme =
          state.theme === 'system' ? getSystemTheme() : state.theme;
        set({ resolvedTheme });
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

        root.classList.remove('light', 'dark');
        root.classList.add(state.resolvedTheme);

        root.classList.remove(...colorThemes, ...secondaryThemes);

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
