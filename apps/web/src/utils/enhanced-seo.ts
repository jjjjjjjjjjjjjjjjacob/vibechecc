import { createOGImageUrl, generateOGImageConfig } from './og-image-generator';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'video.other';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  canonical?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  ogImageUrl?: string; // Dynamic OG image URL
  emoji?: string; // For OG image generation
}

interface MetaTag {
  title?: string;
  name?: string;
  property?: string;
  rel?: string;
  href?: string;
  content?: string;
}

// Site configuration
const SITE_CONFIG = {
  name: 'viberater',
  description:
    'Share and discover vibes. Rate, react, and share your favorite vibes with the world.',
  url:
    process.env.NODE_ENV === 'production'
      ? 'https://viberater.com'
      : 'http://localhost:3000',
  twitter: '@viberater',
  creator: '@viberater',
  locale: 'en_US',
} as const;

export function generateSEOTags(config: SEOConfig): MetaTag[] {
  const tags: MetaTag[] = [
    // Basic meta tags
    { title: config.title },
    { name: 'description', content: config.description },

    // Keywords
    ...(config.keywords && config.keywords.length > 0
      ? [{ name: 'keywords', content: config.keywords.join(', ') }]
      : []),

    // Open Graph
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { property: 'og:type', content: config.type || 'website' },
    { property: 'og:site_name', content: SITE_CONFIG.name },
    { property: 'og:locale', content: SITE_CONFIG.locale },

    // Twitter Card
    {
      name: 'twitter:card',
      content: config.twitterCard || 'summary_large_image',
    },
    { name: 'twitter:title', content: config.title },
    { name: 'twitter:description', content: config.description },
    { name: 'twitter:site', content: SITE_CONFIG.twitter },
    {
      name: 'twitter:creator',
      content: config.author ? `@${config.author}` : SITE_CONFIG.creator,
    },

    // Additional meta
    { name: 'application-name', content: SITE_CONFIG.name },
    { name: 'apple-mobile-web-app-title', content: SITE_CONFIG.name },
    { name: 'format-detection', content: 'telephone=no' },
  ];

  // URL
  if (config.url) {
    tags.push({ property: 'og:url', content: config.url });
  }

  // Images - prefer dynamic OG image over static image
  const imageUrl = config.ogImageUrl || config.image;
  if (imageUrl) {
    tags.push(
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl }
    );

    // Add image dimensions for dynamic OG images
    if (config.ogImageUrl) {
      tags.push(
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' }
      );
    }

    const imageAlt = config.imageAlt || `${config.title} - ${SITE_CONFIG.name}`;
    tags.push(
      { property: 'og:image:alt', content: imageAlt },
      { name: 'twitter:image:alt', content: imageAlt }
    );
  }

  // Article-specific meta
  if (config.type === 'article') {
    if (config.author) {
      tags.push({ property: 'article:author', content: config.author });
    }
    if (config.publishedTime) {
      tags.push({
        property: 'article:published_time',
        content: config.publishedTime,
      });
    }
    if (config.modifiedTime) {
      tags.push({
        property: 'article:modified_time',
        content: config.modifiedTime,
      });
    }
    if (config.section) {
      tags.push({ property: 'article:section', content: config.section });
    }
    if (config.tags && config.tags.length > 0) {
      config.tags.forEach((tag) => {
        tags.push({ property: 'article:tag', content: tag });
      });
    }
  }

  // Canonical URL
  if (config.canonical) {
    tags.push({ rel: 'canonical', href: config.canonical });
  }

  // Robots meta
  if (config.noindex) {
    tags.push({ name: 'robots', content: 'noindex, nofollow' });
  } else {
    tags.push({ name: 'robots', content: 'index, follow' });
  }

  // Filter out undefined values
  return tags.filter((tag) =>
    Object.values(tag).every((value) => value !== undefined && value !== null)
  );
}

// Utility functions for common SEO configurations with dynamic OG images
export const seoConfigs = {
  home: (): SEOConfig => {
    const baseConfig: SEOConfig = {
      title: `${SITE_CONFIG.name} - ${SITE_CONFIG.description}`,
      description: SITE_CONFIG.description,
      keywords: [
        'vibes',
        'social',
        'rating',
        'community',
        'sharing',
        'discover',
      ],
      type: 'website',
      url: SITE_CONFIG.url,
    };

    const ogConfig = generateOGImageConfig(baseConfig, 'home');
    return {
      ...baseConfig,
      ogImageUrl: createOGImageUrl(ogConfig, SITE_CONFIG.url),
    };
  },

  vibe: (vibe: {
    title: string;
    description: string;
    tags?: string[];
    createdBy?: { username: string };
    image?: string;
    createdAt: string;
  }): SEOConfig => {
    const baseConfig: SEOConfig = {
      title: `${vibe.title} - ${SITE_CONFIG.name}`,
      description:
        vibe.description.length > 155
          ? `${vibe.description.substring(0, 152)}...`
          : vibe.description,
      keywords: vibe.tags || [],
      image: vibe.image,
      imageAlt: `Vibe: ${vibe.title}`,
      type: 'article',
      author: vibe.createdBy?.username,
      publishedTime: new Date(vibe.createdAt).toISOString(),
      section: 'vibes',
      tags: vibe.tags,
    };

    const ogConfig = generateOGImageConfig(baseConfig, 'vibe');
    return {
      ...baseConfig,
      ogImageUrl: createOGImageUrl(ogConfig, SITE_CONFIG.url),
    };
  },

  profile: (user: {
    username: string;
    bio?: string;
    first_name?: string;
    last_name?: string;
  }): SEOConfig => {
    const displayName =
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username;

    const baseConfig: SEOConfig = {
      title: `${displayName} (@${user.username}) - ${SITE_CONFIG.name}`,
      description: user.bio
        ? `${user.bio} - View ${displayName}'s vibes and ratings on ${SITE_CONFIG.name}`
        : `View ${displayName}'s vibes and ratings on ${SITE_CONFIG.name}`,
      type: 'profile',
      author: user.username,
    };

    const ogConfig = generateOGImageConfig(baseConfig, 'profile');
    return {
      ...baseConfig,
      ogImageUrl: createOGImageUrl(ogConfig, SITE_CONFIG.url),
    };
  },

  search: (query: string, resultCount?: number): SEOConfig => {
    const baseConfig: SEOConfig = {
      title: `Search: "${query}" - ${SITE_CONFIG.name}`,
      description:
        resultCount !== undefined
          ? `${resultCount} vibes found for "${query}". Discover and rate vibes on ${SITE_CONFIG.name}`
          : `Search results for "${query}" on ${SITE_CONFIG.name}`,
      noindex: true, // Don't index search result pages
    };

    const ogConfig = generateOGImageConfig(baseConfig, 'search');
    return {
      ...baseConfig,
      ogImageUrl: createOGImageUrl(ogConfig, SITE_CONFIG.url),
    };
  },

  tag: (tag: string, vibeCount?: number): SEOConfig => ({
    title: `#${tag} - ${SITE_CONFIG.name}`,
    description:
      vibeCount !== undefined
        ? `Discover ${vibeCount} vibes tagged with #${tag}. Rate and share your favorite vibes.`
        : `Discover vibes tagged with #${tag} on ${SITE_CONFIG.name}`,
    keywords: [tag, 'vibes', 'tag', 'discover'],
    type: 'website',
  }),

  error: (errorCode: number): SEOConfig => {
    const baseConfig: SEOConfig = {
      title: `Error ${errorCode} - ${SITE_CONFIG.name}`,
      description:
        errorCode === 404
          ? 'The page you are looking for could not be found.'
          : 'An error occurred while loading this page.',
      noindex: true,
    };

    const ogConfig = generateOGImageConfig(baseConfig, 'error');
    return {
      ...baseConfig,
      ogImageUrl: createOGImageUrl(ogConfig, SITE_CONFIG.url),
    };
  },
};

// Helper to generate page title with proper hierarchy
export function generatePageTitle(title: string, includePrefix = true): string {
  if (!includePrefix) return title;
  return title.includes(SITE_CONFIG.name)
    ? title
    : `${title} - ${SITE_CONFIG.name}`;
}

// Helper to truncate description to ideal length
export function truncateDescription(
  description: string,
  maxLength = 155
): string {
  if (description.length <= maxLength) return description;
  return `${description.substring(0, maxLength - 3).trim()}...`;
}

// Helper to generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}
