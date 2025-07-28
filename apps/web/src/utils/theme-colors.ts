// Theme color system for user profiles

export interface ThemeColor {
  id: string;
  name: string;
}

export interface UserTheme {
  primaryColor: string;
  secondaryColor: string;
}

// Theme color definitions (rainbow order + slate)
export const THEME_COLORS: ThemeColor[] = [
  { id: 'red', name: 'crimson red' },
  { id: 'orange', name: 'warm orange' },
  { id: 'amber', name: 'golden amber' },
  { id: 'yellow', name: 'sunny yellow' },
  { id: 'lime', name: 'fresh lime' },
  { id: 'green', name: 'vibrant green' },
  { id: 'emerald', name: 'forest green' },
  { id: 'teal', name: 'deep teal' },
  { id: 'cyan', name: 'electric cyan' },
  { id: 'blue', name: 'ocean blue' },
  { id: 'indigo', name: 'midnight indigo' },
  { id: 'violet', name: 'soft violet' },
  { id: 'purple', name: 'deep purple' },
  { id: 'fuchsia', name: 'bright fuchsia' },
  { id: 'pink', name: 'rose pink' },
  { id: 'slate', name: 'cool slate' },
];

export const DEFAULT_USER_THEME: UserTheme = {
  primaryColor: 'pink',
  secondaryColor: 'orange',
};

export function getThemeById(id: string): ThemeColor {
  return THEME_COLORS.find((theme) => theme.id === id) || THEME_COLORS[1]; // fallback to pink
}

// CSS-only theme application via data attributes
export function applyUserTheme(
  userTheme: UserTheme,
  element: HTMLElement = document.documentElement
) {
  element.setAttribute('data-theme-primary', userTheme.primaryColor);
  element.setAttribute('data-theme-secondary', userTheme.secondaryColor);
}

// Legacy CSS injection functions for backward compatibility
export function injectUserThemeCSS(userTheme: UserTheme) {
  applyUserTheme(userTheme);
}

export function injectThemeCSS(theme: ThemeColor) {
  const userTheme: UserTheme = {
    primaryColor: theme.id,
    secondaryColor: theme.id,
  };
  applyUserTheme(userTheme);
}

// Static theme classes using CSS variables
export function getThemeGradientClasses() {
  return {
    background: `bg-background`,
    text: `themed-gradient-text`,
    button: `themed-gradient-button`,
    card: `themed-card`,
    hero: `themed-hero`,
    glow: `themed-glow`,
    pills: `themed-pills`,
    border: `themed-border`,
    accent: `themed-accent`,
    avatar: `themed-avatar`,
    avatarRing: `themed-avatar-ring`,
  };
}
