import * as React from 'react';

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

type ColorTheme = PrimaryColorTheme;

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

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  colorTheme: ColorTheme | null;
  secondaryColorTheme: SecondaryColorTheme | null;
  setColorTheme: (colorTheme: ColorTheme | null) => void;
  setSecondaryColorTheme: (
    secondaryColorTheme: SecondaryColorTheme | null
  ) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>('system');
  const [colorTheme, setColorTheme] = React.useState<ColorTheme | null>(null);
  const [secondaryColorTheme, setSecondaryColorTheme] =
    React.useState<SecondaryColorTheme | null>(null);

  // Get system theme preference
  const getSystemTheme = React.useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  }, []);

  // Resolve the actual theme to apply
  const resolvedTheme = React.useMemo(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme as 'light' | 'dark';
  }, [theme, getSystemTheme]);

  // Apply theme to document
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Apply color theme to document
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      // Remove all possible color theme classes
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

      root.classList.remove(...colorThemes, ...secondaryThemes);

      // Add current color themes if set
      if (colorTheme) {
        root.classList.add(colorTheme);
      }
      if (secondaryColorTheme) {
        root.classList.add(secondaryColorTheme);
      }
    }
  }, [colorTheme, secondaryColorTheme]);

  // Load saved themes from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load light/dark theme
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }

      // Load color theme
      const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
      const validColorThemes: ColorTheme[] = [
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
      if (savedColorTheme && validColorThemes.includes(savedColorTheme)) {
        setColorTheme(savedColorTheme);
      }

      // Load secondary color theme
      const savedSecondaryTheme = localStorage.getItem(
        'secondaryColorTheme'
      ) as SecondaryColorTheme;
      const validSecondaryThemes: SecondaryColorTheme[] = [
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
      if (
        savedSecondaryTheme &&
        validSecondaryThemes.includes(savedSecondaryTheme)
      ) {
        setSecondaryColorTheme(savedSecondaryTheme);
      }
    }
  }, []);

  // Save theme to localStorage
  const handleSetTheme = React.useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  }, []);

  // Save color theme to localStorage
  const handleSetColorTheme = React.useCallback(
    (newColorTheme: ColorTheme | null) => {
      setColorTheme(newColorTheme);
      if (typeof window !== 'undefined') {
        if (newColorTheme) {
          localStorage.setItem('colorTheme', newColorTheme);
        } else {
          localStorage.removeItem('colorTheme');
        }
      }
    },
    []
  );

  // Save secondary color theme to localStorage
  const handleSetSecondaryColorTheme = React.useCallback(
    (newSecondaryColorTheme: SecondaryColorTheme | null) => {
      setSecondaryColorTheme(newSecondaryColorTheme);
      if (typeof window !== 'undefined') {
        if (newSecondaryColorTheme) {
          localStorage.setItem('secondaryColorTheme', newSecondaryColorTheme);
        } else {
          localStorage.removeItem('secondaryColorTheme');
        }
      }
    },
    []
  );

  // Listen for system theme changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Force re-render when system theme changes
        setTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Always provide context value, even during SSR
  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
      resolvedTheme,
      colorTheme,
      secondaryColorTheme,
      setColorTheme: handleSetColorTheme,
      setSecondaryColorTheme: handleSetSecondaryColorTheme,
    }),
    [
      theme,
      handleSetTheme,
      resolvedTheme,
      colorTheme,
      secondaryColorTheme,
      handleSetColorTheme,
      handleSetSecondaryColorTheme,
    ]
  );

  /*
  if (!mounted) {
    return (
      <ThemeContext.Provider value={contextValue}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }
    */

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
