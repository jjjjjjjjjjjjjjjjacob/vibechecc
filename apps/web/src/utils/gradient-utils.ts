// import { cn } from './tailwind-utils';

// Predefined gradient presets
export const gradientPresets = [
  {
    name: 'sunset',
    from: '#FF6B6B',
    to: '#FFA500',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'ocean',
    from: '#00C9FF',
    to: '#92FE9D',
    direction: 'to-br',
    textContrast: 'light',
  },
  {
    name: 'forest',
    from: '#11998E',
    to: '#38EF7D',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'lavender',
    from: '#667EEA',
    to: '#764BA2',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'peach',
    from: '#FFEAA7',
    to: '#FDB7AF',
    direction: 'to-br',
    textContrast: 'light',
  },
  {
    name: 'mint',
    from: '#00B09B',
    to: '#96C93D',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'cherry',
    from: '#EB3349',
    to: '#F45C43',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'purple',
    from: '#667EEA',
    to: '#F093FB',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'candy',
    from: '#FF6FD8',
    to: '#3813C2',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'sunshine',
    from: '#FFE000',
    to: '#FF6C00',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'sky',
    from: '#74B9FF',
    to: '#0984E3',
    direction: 'to-br',
    textContrast: 'dark',
  },
  {
    name: 'coral',
    from: '#FF6B9D',
    to: '#FFC600',
    direction: 'to-br',
    textContrast: 'dark',
  },
];

// Gradient direction options
export const gradientDirections = [
  { value: 'to-t', label: 'Top', icon: '↑' },
  { value: 'to-tr', label: 'Top Right', icon: '↗' },
  { value: 'to-r', label: 'Right', icon: '→' },
  { value: 'to-br', label: 'Bottom Right', icon: '↘' },
  { value: 'to-b', label: 'Bottom', icon: '↓' },
  { value: 'to-bl', label: 'Bottom Left', icon: '↙' },
  { value: 'to-l', label: 'Left', icon: '←' },
  { value: 'to-tl', label: 'Top Left', icon: '↖' },
];

// Generate random gradient colors
export function generateRandomGradient() {
  const colors = [
    '#FF6B6B',
    '#4CA1AF',
    '#667EEA',
    '#00B09B',
    '#EB3349',
    '#FF6FD8',
    '#FFE000',
    '#FF6B9D',
    '#FFA500',
    '#2C3E50',
    '#134E5E',
    '#764BA2',
    '#FFEAA7',
    '#96C93D',
    '#F45C43',
    '#232526',
    '#3813C2',
    '#FF6C00',
    '#FFC600',
    '#71B280',
  ];

  const from = colors[Math.floor(Math.random() * colors.length)];
  let to = colors[Math.floor(Math.random() * colors.length)];

  // Make sure we don't get the same color
  while (to === from) {
    to = colors[Math.floor(Math.random() * colors.length)];
  }

  const directions = ['to-br', 'to-r', 'to-tr', 'to-b'];
  const direction = directions[Math.floor(Math.random() * directions.length)];

  return { from, to, direction };
}

// Convert hex to RGB
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Generate CSS gradient string
export function generateGradientStyle(
  from?: string,
  to?: string,
  direction?: string
) {
  if (!from || !to) {
    return '';
  }

  const dir = direction || 'to-br';
  const directionMap: { [key: string]: string } = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left',
  };

  const cssDirection = directionMap[dir] || 'to bottom right';
  return `linear-gradient(${cssDirection}, ${from}, ${to})`;
}

// Generate Tailwind gradient classes
export function generateGradientClasses(
  from?: string,
  to?: string,
  direction?: string
) {
  if (!from || !to) {
    return '';
  }

  // For custom colors, we'll use inline styles
  // This function returns the direction class only
  const dir = direction || 'to-br';
  return `bg-gradient-${dir}`;
}

// Get a consistent gradient based on a string (like title)
export function getConsistentGradient(seed?: string) {
  if (!seed) {
    // Return a random preset instead of generateRandomGradient()
    const randomIndex = Math.floor(Math.random() * gradientPresets.length);
    return gradientPresets[randomIndex];
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % gradientPresets.length);
  return gradientPresets[index];
}

// Check if a gradient is light or dark
export function isLightGradient(from: string, to: string) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  if (!fromRgb || !toRgb) {
    return true; // Default to light
  }

  // Calculate luminance
  const fromLuminance =
    (0.299 * fromRgb.r + 0.587 * fromRgb.g + 0.114 * fromRgb.b) / 255;
  const toLuminance =
    (0.299 * toRgb.r + 0.587 * toRgb.g + 0.114 * toRgb.b) / 255;

  const avgLuminance = (fromLuminance + toLuminance) / 2;
  return avgLuminance > 0.82;
}
