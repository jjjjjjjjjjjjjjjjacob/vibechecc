import { useEffect } from 'react';
import { useThemeStore } from './theme-store';

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return <>{children}</>;
}

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const colorTheme = useThemeStore((state) => state.colorTheme);
  const secondaryColorTheme = useThemeStore(
    (state) => state.secondaryColorTheme
  );
  const setColorTheme = useThemeStore((state) => state.setColorTheme);
  const setSecondaryColorTheme = useThemeStore(
    (state) => state.setSecondaryColorTheme
  );

  return {
    theme,
    setTheme,
    resolvedTheme,
    colorTheme,
    secondaryColorTheme,
    setColorTheme,
    setSecondaryColorTheme,
  };
}
