import type { SEOConfig } from './enhanced-seo';

export interface OGImageConfig {
  title: string;
  description?: string;
  author?: string;
  emoji?: string;
  tags?: string[];
  image?: string;
  type: 'vibe' | 'profile' | 'home' | 'search' | 'error';
  theme?: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
}

export interface OGImageTemplate {
  width: number;
  height: number;
  background: string;
  elements: OGImageElement[];
}

export interface OGImageElement {
  type: 'text' | 'image' | 'shape' | 'emoji';
  content?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  maxLines?: number;
  lineHeight?: number;
}

// Brand colors for viberater
export const BRAND_COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  dark: '#2C3E50',
  light: '#ECF0F1',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
} as const;

// OG Image templates for different content types
export const OG_TEMPLATES: Record<string, OGImageTemplate> = {
  vibe: {
    width: 1200,
    height: 630,
    background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,
    elements: [
      // Background overlay
      {
        type: 'shape',
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      // Logo/Brand area
      {
        type: 'text',
        content: 'viberater',
        x: 60,
        y: 60,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      // Main title
      {
        type: 'text',
        content: '{title}',
        x: 60,
        y: 180,
        width: 1080,
        fontSize: 64,
        fontWeight: 'bold',
        color: '#FFFFFF',
        maxLines: 2,
        lineHeight: 1.2,
      },
      // Description
      {
        type: 'text',
        content: '{description}',
        x: 60,
        y: 380,
        width: 800,
        fontSize: 28,
        color: 'rgba(255, 255, 255, 0.9)',
        maxLines: 2,
        lineHeight: 1.4,
      },
      // Author info
      {
        type: 'text',
        content: 'by {author}',
        x: 60,
        y: 520,
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.8)',
      },
      // Tags
      {
        type: 'text',
        content: '{tags}',
        x: 60,
        y: 560,
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      // Emoji decoration
      {
        type: 'emoji',
        content: '{emoji}',
        x: 1000,
        y: 300,
        fontSize: 120,
        opacity: 0.8,
      },
    ],
  },

  profile: {
    width: 1200,
    height: 630,
    background: `linear-gradient(135deg, ${BRAND_COLORS.accent} 0%, ${BRAND_COLORS.primary} 100%)`,
    elements: [
      {
        type: 'shape',
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      },
      {
        type: 'text',
        content: 'viberater',
        x: 60,
        y: 60,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      // Profile picture placeholder
      {
        type: 'shape',
        x: 60,
        y: 150,
        width: 200,
        height: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100,
      },
      // Profile name
      {
        type: 'text',
        content: '{title}',
        x: 300,
        y: 200,
        width: 800,
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
        maxLines: 1,
      },
      // Bio/Description
      {
        type: 'text',
        content: '{description}',
        x: 300,
        y: 280,
        width: 800,
        fontSize: 28,
        color: 'rgba(255, 255, 255, 0.9)',
        maxLines: 3,
        lineHeight: 1.4,
      },
      // User stats indicator
      {
        type: 'text',
        content: 'Profile on viberater',
        x: 60,
        y: 520,
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.8)',
      },
    ],
  },

  home: {
    width: 1200,
    height: 630,
    background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, ${BRAND_COLORS.accent} 50%, ${BRAND_COLORS.primary} 100%)`,
    elements: [
      {
        type: 'shape',
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
      },
      // Main logo/title
      {
        type: 'text',
        content: 'viberater',
        x: 60,
        y: 200,
        fontSize: 96,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      // Tagline
      {
        type: 'text',
        content: '{description}',
        x: 60,
        y: 320,
        width: 1080,
        fontSize: 36,
        color: 'rgba(255, 255, 255, 0.9)',
        maxLines: 2,
        lineHeight: 1.3,
      },
      // Decorative emojis
      {
        type: 'emoji',
        content: '✨',
        x: 900,
        y: 150,
        fontSize: 80,
        opacity: 0.7,
      },
      {
        type: 'emoji',
        content: '🎉',
        x: 1000,
        y: 400,
        fontSize: 80,
        opacity: 0.7,
      },
      {
        type: 'emoji',
        content: '💫',
        x: 800,
        y: 450,
        fontSize: 60,
        opacity: 0.6,
      },
    ],
  },

  search: {
    width: 1200,
    height: 630,
    background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.primary} 100%)`,
    elements: [
      {
        type: 'shape',
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      },
      {
        type: 'text',
        content: 'viberater',
        x: 60,
        y: 60,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      // Search icon placeholder
      {
        type: 'emoji',
        content: '🔍',
        x: 60,
        y: 180,
        fontSize: 80,
      },
      // Search query
      {
        type: 'text',
        content: '{title}',
        x: 180,
        y: 200,
        width: 900,
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
        maxLines: 1,
      },
      // Results info
      {
        type: 'text',
        content: '{description}',
        x: 60,
        y: 320,
        width: 1000,
        fontSize: 32,
        color: 'rgba(255, 255, 255, 0.9)',
        maxLines: 2,
      },
    ],
  },

  error: {
    width: 1200,
    height: 630,
    background: `linear-gradient(135deg, ${BRAND_COLORS.error} 0%, ${BRAND_COLORS.dark} 100%)`,
    elements: [
      {
        type: 'shape',
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      {
        type: 'text',
        content: 'viberater',
        x: 60,
        y: 60,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      // Error emoji
      {
        type: 'emoji',
        content: '⚠️',
        x: 60,
        y: 180,
        fontSize: 100,
      },
      // Error title
      {
        type: 'text',
        content: '{title}',
        x: 200,
        y: 220,
        width: 900,
        fontSize: 64,
        fontWeight: 'bold',
        color: '#FFFFFF',
        maxLines: 1,
      },
      // Error description
      {
        type: 'text',
        content: '{description}',
        x: 60,
        y: 350,
        width: 1000,
        fontSize: 36,
        color: 'rgba(255, 255, 255, 0.9)',
        maxLines: 2,
      },
    ],
  },
};

/**
 * Generate OG image configuration from SEO config
 */
export function generateOGImageConfig(
  seoConfig: SEOConfig,
  type: OGImageConfig['type']
): OGImageConfig {
  return {
    title: seoConfig.title,
    description: seoConfig.description,
    author: seoConfig.author,
    tags: seoConfig.tags,
    image: seoConfig.image,
    type,
    theme: 'light', // Default theme
    primaryColor: BRAND_COLORS.primary,
    secondaryColor: BRAND_COLORS.secondary,
  };
}

/**
 * Create OG image URL for given configuration
 */
export function createOGImageUrl(
  config: OGImageConfig,
  baseUrl: string = ''
): string {
  const params = new URLSearchParams();

  params.set('title', config.title);
  params.set('type', config.type);

  if (config.description) params.set('description', config.description);
  if (config.author) params.set('author', config.author);
  if (config.emoji) params.set('emoji', config.emoji);
  if (config.tags?.length) params.set('tags', config.tags.join(','));
  if (config.image) params.set('image', config.image);
  if (config.theme) params.set('theme', config.theme);
  if (config.primaryColor) params.set('primaryColor', config.primaryColor);
  if (config.secondaryColor)
    params.set('secondaryColor', config.secondaryColor);

  return `${baseUrl}/api/og?${params.toString()}`;
}

/**
 * Render OG image template with data
 */
export function renderOGImageTemplate(
  template: OGImageTemplate,
  data: Record<string, string>
): OGImageTemplate {
  const renderedTemplate: OGImageTemplate = {
    ...template,
    elements: template.elements.map((element) => {
      if (element.content) {
        let content = element.content;

        // Replace placeholders with actual data
        Object.entries(data).forEach(([key, value]) => {
          content = content.replace(
            new RegExp(`\\{${key}\\}`, 'g'),
            value || ''
          );
        });

        // Handle special cases
        if (data.tags && element.content.includes('{tags}')) {
          const tags = data.tags.split(',').filter(Boolean);
          content = tags.length > 0 ? `#${tags.slice(0, 3).join(' #')}` : '';
        }

        return {
          ...element,
          content,
        };
      }
      return element;
    }),
  };

  return renderedTemplate;
}

/**
 * Generate SVG for OG image (fallback for environments without Canvas/ImageResponse)
 */
export function generateOGImageSVG(config: OGImageConfig): string {
  const template = OG_TEMPLATES[config.type] || OG_TEMPLATES.home;
  const data = {
    title: config.title || 'viberater',
    description: config.description || '',
    author: config.author || '',
    emoji: config.emoji || '✨',
    tags: config.tags?.join(',') || '',
  };

  const renderedTemplate = renderOGImageTemplate(template, data);

  // Generate SVG elements
  const elements = renderedTemplate.elements
    .map((element, _index) => {
      if (element.type === 'text' && element.content) {
        const fontSize = element.fontSize || 16;
        const x = element.x || 0;
        const y = (element.y || 0) + fontSize; // SVG text baseline adjustment
        const color = element.color || '#000000';
        const fontWeight = element.fontWeight || 'normal';
        const textAnchor =
          element.textAlign === 'center'
            ? 'middle'
            : element.textAlign === 'right'
              ? 'end'
              : 'start';

        // Handle multi-line text
        if (element.maxLines && element.maxLines > 1) {
          const words = element.content.split(' ');
          const maxWidth = element.width || 800;
          const lineHeight = element.lineHeight || 1.2;
          const lines: string[] = [];
          let currentLine = '';

          // Simple word wrapping (approximate)
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            // Rough character width estimation (adjust based on font)
            const approxWidth = testLine.length * (fontSize * 0.6);

            if (approxWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          });
          if (currentLine) lines.push(currentLine);

          return lines
            .slice(0, element.maxLines)
            .map(
              (line, lineIndex) =>
                `<text x="${x}" y="${y + lineIndex * fontSize * lineHeight}" 
                 font-size="${fontSize}" 
                 font-weight="${fontWeight}" 
                 fill="${color}" 
                 text-anchor="${textAnchor}">${line}</text>`
            )
            .join('\n');
        }

        return `<text x="${x}" y="${y}" 
                    font-size="${fontSize}" 
                    font-weight="${fontWeight}" 
                    fill="${color}" 
                    text-anchor="${textAnchor}">${element.content}</text>`;
      }

      if (element.type === 'shape') {
        const x = element.x || 0;
        const y = element.y || 0;
        const width = element.width || 100;
        const height = element.height || 100;
        const fill = element.backgroundColor || '#cccccc';
        const borderRadius = element.borderRadius || 0;
        const opacity = element.opacity || 1;

        if (borderRadius > 0) {
          return `<rect x="${x}" y="${y}" width="${width}" height="${height}" 
                      fill="${fill}" rx="${borderRadius}" opacity="${opacity}" />`;
        }
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" 
                    fill="${fill}" opacity="${opacity}" />`;
      }

      if (element.type === 'emoji' && element.content) {
        const x = element.x || 0;
        const y = (element.y || 0) + (element.fontSize || 16);
        const fontSize = element.fontSize || 16;
        const opacity = element.opacity || 1;

        return `<text x="${x}" y="${y}" 
                    font-size="${fontSize}" 
                    opacity="${opacity}">${element.content}</text>`;
      }

      return '';
    })
    .filter(Boolean);

  // Create gradient definitions
  const gradientId = `gradient-${Date.now()}`;
  const backgroundGradient = template.background.includes('linear-gradient')
    ? template.background.match(/linear-gradient\(([^)]+)\)/)?.[1] || ''
    : '';

  let gradientDef = '';
  if (backgroundGradient) {
    // Parse gradient (simple parsing for common cases)
    const parts = backgroundGradient.split(',').map((s) => s.trim());
    const _direction = parts[0];
    const stops = parts.slice(1);

    // Convert to SVG gradient stops
    const svgStops = stops
      .map((stop, index) => {
        const color = stop.split(' ')[0];
        const percentage =
          stop.split(' ')[1] || `${(index / (stops.length - 1)) * 100}%`;
        return `<stop offset="${percentage}" style="stop-color:${color}" />`;
      })
      .join('\n');

    gradientDef = `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          ${svgStops}
        </linearGradient>
      </defs>`;
  }

  const backgroundColor = template.background.includes('linear-gradient')
    ? `url(#${gradientId})`
    : template.background;

  return `
    <svg width="${template.width}" height="${template.height}" 
         xmlns="http://www.w3.org/2000/svg">
      ${gradientDef}
      <rect width="100%" height="100%" fill="${backgroundColor}" />
      ${elements.join('\n')}
    </svg>
  `.trim();
}

/**
 * Enhanced SEO configs with OG image integration
 */
export const enhancedSeoConfigs = {
  vibe: (
    vibe: {
      title: string;
      description: string;
      tags?: string[];
      createdBy?: { username: string };
      image?: string;
      createdAt: string;
    },
    baseUrl: string = ''
  ) => {
    const ogConfig = generateOGImageConfig(
      {
        title: `${vibe.title} - viberater`,
        description: vibe.description,
        author: vibe.createdBy?.username,
        tags: vibe.tags,
        image: vibe.image,
        type: 'article',
        publishedTime: new Date(vibe.createdAt).toISOString(),
      },
      'vibe'
    );

    return {
      ...ogConfig,
      ogImageUrl: createOGImageUrl(ogConfig, baseUrl),
    };
  },

  profile: (
    user: {
      username: string;
      bio?: string;
      first_name?: string;
      last_name?: string;
    },
    baseUrl: string = ''
  ) => {
    const displayName =
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username;

    const ogConfig = generateOGImageConfig(
      {
        title: `${displayName} (@${user.username}) - viberater`,
        description:
          user.bio || `View ${displayName}'s vibes and ratings on viberater`,
        author: user.username,
        type: 'profile',
      },
      'profile'
    );

    return {
      ...ogConfig,
      ogImageUrl: createOGImageUrl(ogConfig, baseUrl),
    };
  },

  home: (baseUrl: string = '') => {
    const ogConfig = generateOGImageConfig(
      {
        title: 'viberater - Share and discover vibes',
        description:
          'Share and discover vibes. Rate, react, and share your favorite vibes with the world.',
        type: 'website',
      },
      'home'
    );

    return {
      ...ogConfig,
      ogImageUrl: createOGImageUrl(ogConfig, baseUrl),
    };
  },

  search: (query: string, resultCount?: number, baseUrl: string = '') => {
    const description =
      resultCount !== undefined
        ? `${resultCount} vibes found for "${query}". Discover and rate vibes on viberater`
        : `Search results for "${query}" on viberater`;

    const ogConfig = generateOGImageConfig(
      {
        title: `Search: "${query}" - viberater`,
        description,
        type: 'website',
        noindex: true,
      },
      'search'
    );

    return {
      ...ogConfig,
      ogImageUrl: createOGImageUrl(ogConfig, baseUrl),
    };
  },

  error: (errorCode: number, baseUrl: string = '') => {
    const title = `Error ${errorCode} - viberater`;
    const description =
      errorCode === 404
        ? 'The page you are looking for could not be found.'
        : 'An error occurred while loading this page.';

    const ogConfig = generateOGImageConfig(
      {
        title,
        description,
        type: 'website',
        noindex: true,
      },
      'error'
    );

    return {
      ...ogConfig,
      ogImageUrl: createOGImageUrl(ogConfig, baseUrl),
    };
  },
};
