/**
 * Converts CSS color values to hex or rgb format for canvas rendering
 * Handles oklch, hsl, rgb, and hex colors
 */

export function getComputedColor(
  element: HTMLElement,
  property: string
): string {
  // Create a temporary element to compute the color
  const tempEl = document.createElement('div');
  tempEl.style.display = 'none';
  document.body.appendChild(tempEl);

  // Apply the CSS variable or color
  const computedStyle = getComputedStyle(element);
  const value = computedStyle.getPropertyValue(property);
  tempEl.style.color =
    value || (computedStyle[property as keyof CSSStyleDeclaration] as string);

  // Get computed RGB value
  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);

  // Convert rgb(a) to hex
  const match = computedColor.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (match) {
    const [, r, g, b, a] = match;
    if (a && parseFloat(a) < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
  }

  return computedColor;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function getCSSVariableValue(variableName: string): string {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName).trim();

  // If it's an oklch value, we need to convert it
  if (value.startsWith('oklch')) {
    const tempEl = document.createElement('div');
    tempEl.style.display = 'none';
    tempEl.style.color = value;
    document.body.appendChild(tempEl);
    const computedColor = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match;
      return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
    }
  }

  return value;
}

export interface ThemeColors {
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
}

export function getThemeColors(): ThemeColors {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  // Helper to convert CSS variable to usable color
  const getColor = (varName: string): string => {
    // Remove the -- prefix if passed, we'll add it back
    const cssVarName = varName.startsWith('--') ? varName : `--${varName}`;
    let value = style.getPropertyValue(cssVarName).trim();

    // If empty, try to get it from the element directly
    if (!value) {
      // Try getting computed style on body or root
      const bodyStyle = getComputedStyle(document.body);
      value = bodyStyle.getPropertyValue(varName).trim();
    }

    // Default fallback colors if variable not found
    const fallbacks: Record<string, string> = {
      '--primary': '#3b82f6',
      '--primary-foreground': '#ffffff',
      '--secondary': '#64748b',
      '--secondary-foreground': '#ffffff',
      '--background': '#ffffff',
      '--foreground': '#0f172a',
      '--card': '#ffffff',
      '--card-foreground': '#0f172a',
      '--muted': '#f1f5f9',
      '--muted-foreground': '#64748b',
      '--accent': '#f1f5f9',
      '--accent-foreground': '#0f172a',
      '--border': '#e2e8f0',
    };

    if (!value || value === '') {
      return fallbacks[varName] || '#000000';
    }

    // Handle oklch colors
    if (value.includes('oklch')) {
      const tempEl = document.createElement('div');
      tempEl.style.display = 'none';
      tempEl.style.color = value;
      document.body.appendChild(tempEl);
      const computed = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);

      // Extract RGB values
      const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return rgbToHex(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );
      }
      return fallbacks[varName] || '#000000';
    }

    // Handle hsl colors
    if (value.includes('hsl')) {
      const tempEl = document.createElement('div');
      tempEl.style.display = 'none';
      tempEl.style.color = value;
      document.body.appendChild(tempEl);
      const computed = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);

      const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return rgbToHex(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );
      }
      return fallbacks[varName] || '#000000';
    }

    // Handle rgb colors
    if (value.includes('rgb')) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return rgbToHex(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );
      }
      return fallbacks[varName] || '#000000';
    }

    // If it's already a hex color, return it
    if (value.startsWith('#')) {
      return value;
    }

    return fallbacks[varName] || '#000000';
  };

  return {
    primary: getColor('primary'),
    primaryForeground: getColor('primary-foreground'),
    secondary: getColor('secondary'),
    secondaryForeground: getColor('secondary-foreground'),
    background: getColor('background'),
    foreground: getColor('foreground'),
    card: getColor('card'),
    cardForeground: getColor('card-foreground'),
    muted: getColor('muted'),
    mutedForeground: getColor('muted-foreground'),
    accent: getColor('accent'),
    accentForeground: getColor('accent-foreground'),
    border: getColor('border'),
  };
}

// Convert hex to rgba
export function hexToRgba(hex: string, alpha: number = 1): string {
  // Validate hex color
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    console.warn(`Invalid hex color: ${hex}, using fallback`);
    return `rgba(59, 130, 246, ${alpha})`; // Default blue color
  }

  // Handle 3-digit hex
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Validate parsed values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn(`Failed to parse hex color: ${hex}, using fallback`);
    return `rgba(59, 130, 246, ${alpha})`; // Default blue color
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
