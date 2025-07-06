import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>('system');

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

  // Load saved theme from localStorage
  /*
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
      setMounted(true);
    }
  }, []);
  */

  // Save theme to localStorage
  const handleSetTheme = React.useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  }, []);

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
    }),
    [theme, handleSetTheme, resolvedTheme]
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
