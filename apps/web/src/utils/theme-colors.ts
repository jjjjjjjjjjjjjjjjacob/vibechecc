// Theme color system for user profiles

export interface ThemeColor {
  id: string;
  name: string;
}

export type ColorTheme =
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

// Legacy interface for backward compatibility
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

export const DEFAULT_COLOR_THEME: ColorTheme = 'pink-primary';

// Legacy constant for backward compatibility
export const DEFAULT_USER_THEME: UserTheme = {
  primaryColor: 'pink',
  secondaryColor: 'orange',
};

/**
 * Retrieve a theme color definition by its identifier.
 *
 * Falls back to the "pink" theme if the requested `id` is unknown to ensure
 * callers always receive a valid color configuration.
 */
export function getThemeById(id: string): ThemeColor {
  // look for a matching theme; default to index 14 (pink) when not found
  return THEME_COLORS.find((theme) => theme.id === id) || THEME_COLORS[14];
}

// Convert old theme color ID to new CSS class name
/**
 * Convert a legacy color identifier to the new `*-primary` class name.
 */
export function getColorThemeClass(colorId: string): ColorTheme {
  // mapping from historical identifiers to current theme class names
  const mapping: Record<string, ColorTheme> = {
    purple: 'purple-primary',
    pink: 'pink-primary',
    blue: 'blue-primary',
    emerald: 'emerald-primary',
    orange: 'orange-primary',
    red: 'red-primary',
    indigo: 'indigo-primary',
    teal: 'teal-primary',
    slate: 'slate-primary',
    amber: 'amber-primary',
    lime: 'lime-primary',
    cyan: 'cyan-primary',
    violet: 'violet-primary',
    fuchsia: 'fuchsia-primary',
    green: 'green-primary',
    yellow: 'yellow-primary',
  };

  // return mapped class name or fall back to default theme
  return mapping[colorId] || DEFAULT_COLOR_THEME;
}

// Extract color ID from CSS class name
/**
 * Extract the plain color identifier from a `*-primary` theme class.
 */
export function getColorIdFromThemeClass(themeClass: ColorTheme): string {
  return themeClass.replace('-primary', '');
}

// Legacy functions for backward compatibility (deprecated - use theme provider instead)
/**
 * Produce a collection of gradient-based class names for legacy theming.
 *
 * New code should rely on the theme provider, but this utility remains for
 * backward compatibility with older components.
 */
export function getThemeGradientClasses() {
  return {
    background: `bg-background`,
    text: `bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent`,
    button: `bg-gradient-to-r from-theme-primary to-theme-secondary`,
    card: `bg-background/80 border-theme-primary/20`,
    hero: `bg-gradient-to-br from-background via-background to-theme-primary/10`,
    glow: `bg-theme-primary/20`,
    pills: `bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30`,
    border: `border-theme-primary/30`,
    accent: `text-theme-primary`,
    avatar: `border-theme-primary/50`,
    avatarRing: `border-theme-primary/40`,
  };
}

export function applyUserTheme(_userTheme: UserTheme) {
  // Legacy function - now handled by theme provider
  // console.warn('applyUserTheme is deprecated. Use theme provider instead.');
}

export function applyScopedUserTheme(
  _userTheme: UserTheme,
  _element: HTMLElement
) {
  // Legacy function - now handled by theme provider
  // console.warn(
  //   'applyScopedUserTheme is deprecated. Use theme provider instead.'
  // );
}

export function injectUserThemeCSS(_userTheme: UserTheme) {
  // Legacy function - now handled by theme provider
  // console.warn('injectUserThemeCSS is deprecated. Use theme provider instead.');
}

// Get the actual HSL color value for a theme color
/**
 * Resolve the HSL color value associated with a theme identifier.
 */
export function getThemeColorValue(colorId: string): string {
  // mapping from identifier to actual CSS HSL color values
  const colorValues: Record<string, string> = {
    purple: 'hsl(262 83% 48%)',
    pink: 'hsl(330 81% 50%)',
    blue: 'hsl(217 91% 50%)',
    emerald: 'hsl(160 84% 35%)',
    orange: 'hsl(25 95% 48%)',
    red: 'hsl(0 84% 50%)',
    indigo: 'hsl(239 84% 57%)',
    teal: 'hsl(173 80% 35%)',
    slate: 'hsl(215 28% 25%)',
    amber: 'hsl(45 93% 42%)',
    lime: 'hsl(84 81% 39%)',
    cyan: 'hsl(188 95% 32%)',
    violet: 'hsl(262 90% 65%)',
    fuchsia: 'hsl(292 84% 51%)',
    green: 'hsl(142 76% 31%)',
    yellow: 'hsl(54 92% 50%)',
  };

  // return specific color or fall back to pink if unknown
  return colorValues[colorId] || colorValues.pink;
}
