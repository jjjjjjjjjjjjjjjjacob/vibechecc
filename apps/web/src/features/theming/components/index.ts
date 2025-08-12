/**
 * index module.
 * enhanced documentation for clarity and maintenance.
 */
/**
 * Barrel exports for theming-related components and utilities.
 * Consumers can import theme helpers from this single entry point.
 */

// Core providers and hooks for reading/updating theme state
export {
  ThemeProvider, // context provider for theme state
  useTheme, // hook to access theme state
  type PrimaryColorTheme, // type for primary color tokens
  type SecondaryColorTheme, // type for secondary color tokens
} from './theme-provider';
export { ThemeToggle } from './theme-toggle'; // dropdown menu to switch themes

// Tools for selecting custom color themes
export { ThemeColorPicker } from './theme-color-picker'; // single palette picker
export { DualThemeColorPicker } from './dual-theme-color-picker'; // dual palette editor
