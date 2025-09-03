/**
 * Robust theme color extraction that handles oklch and other color formats
 */

export interface ExtractedColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  themePrimary: string;
  themeSecondary: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function parseColorValue(colorValue: string): string | null {
  if (!colorValue || colorValue === 'none' || colorValue === 'transparent') {
    return null;
  }

  // Already a hex color
  if (colorValue.startsWith('#')) {
    return colorValue;
  }

  // RGB/RGBA format
  const rgbMatch = colorValue.match(
    /rgba?\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)/
  );
  if (rgbMatch) {
    return rgbToHex(
      parseFloat(rgbMatch[1]),
      parseFloat(rgbMatch[2]),
      parseFloat(rgbMatch[3])
    );
  }

  return null;
}

export function extractThemeColors(): ExtractedColors {
  const warn = (..._args: unknown[]) => {};
  const root = document.documentElement;

  // Create a test element to compute colors
  const testEl = document.createElement('div');
  testEl.style.position = 'fixed';
  testEl.style.visibility = 'hidden';
  testEl.style.pointerEvents = 'none';
  document.body.appendChild(testEl);

  const getComputedColorValue = (varName: string): string => {
    const cssVar = varName.startsWith('--') ? varName : `--${varName}`;

    // Get the CSS variable value
    const rawValue = getComputedStyle(root).getPropertyValue(cssVar).trim();

    if (!rawValue) {
      warn(`CSS variable ${cssVar} not found`);
      return '#000000';
    }

    // Apply the color to our test element
    testEl.style.color = rawValue;

    // Get the computed color (browser will convert oklch/hsl/etc to rgb)
    const computedColor = getComputedStyle(testEl).color;

    // Parse the computed color
    const hexColor = parseColorValue(computedColor);

    if (!hexColor) {
      warn(
        `Failed to parse color for ${cssVar}: ${rawValue} -> ${computedColor}`
      );
      return '#000000';
    }

    return hexColor;
  };

  // Extract all theme colors
  const colors: ExtractedColors = {
    primary: getComputedColorValue('primary'),
    primaryForeground: getComputedColorValue('primary-foreground'),
    secondary: getComputedColorValue('secondary'),
    secondaryForeground: getComputedColorValue('secondary-foreground'),
    background: getComputedColorValue('background'),
    foreground: getComputedColorValue('foreground'),
    card: getComputedColorValue('card'),
    cardForeground: getComputedColorValue('card-foreground'),
    muted: getComputedColorValue('muted'),
    mutedForeground: getComputedColorValue('muted-foreground'),
    accent: getComputedColorValue('accent'),
    accentForeground: getComputedColorValue('accent-foreground'),
    border: getComputedColorValue('border'),
    themePrimary: getComputedColorValue('theme-primary'),
    themeSecondary: getComputedColorValue('theme-secondary'),
  };

  // Clean up test element
  document.body.removeChild(testEl);

  return colors;
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const warn = (..._args: unknown[]) => {};
  // Validate hex color
  if (!hex || !hex.startsWith('#')) {
    warn(`Invalid hex color: ${hex}`);
    return `rgba(0, 0, 0, ${alpha})`;
  }

  // Handle 3-digit hex
  let fullHex = hex;
  if (hex.length === 4) {
    fullHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  // Ensure we have a valid 6-digit hex
  if (fullHex.length !== 7) {
    warn(`Invalid hex length: ${hex}`);
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const r = parseInt(fullHex.slice(1, 3), 16);
  const g = parseInt(fullHex.slice(3, 5), 16);
  const b = parseInt(fullHex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    warn(`Failed to parse hex: ${hex}`);
    return `rgba(0, 0, 0, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
