import iconsHref from './icons.svg?url';

/**
 * Render an SVG sprite icon from the shared `icons.svg` sheet.
 * The sprite technique keeps bundle size small by loading a single
 * SVG file and referencing symbols within it.
 */
export function Icon({
  name,
  size = 'md',
  spin = false,
}: {
  name: string; // symbol id inside the sprite
  size?: 'md' | 'xl'; // control rendered dimensions
  spin?: boolean; // apply CSS rotation animation
}) {
  // Map logical size values to Tailwind classes
  const classNames = {
    md: 'w-4 h-4',
    xl: 'w-8 h-8',
  } as const;

  return (
    <svg
      // Compose size, optional spin animation, and alignment classes
      className={`${classNames[size]} inline self-center ${
        spin ? 'animate-spin' : ''
      }`}
    >
      {/* Reference the sprite symbol by name */}
      <use href={`${iconsHref}#${name}`} />
    </svg>
  );
}

/**
 * Specific icon components for common auth actions. These wrappers
 * ensure consistent styling without repeating className strings.
 */
export function LoginIcon() {
  return (
    <svg className="inline h-8 w-8 scale-x-[-1] transform self-center text-white">
      <use href={`${iconsHref}#login`} />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg className="inline h-8 w-8 self-center text-white">
      <use href={`${iconsHref}#logout`} />
    </svg>
  );
}
