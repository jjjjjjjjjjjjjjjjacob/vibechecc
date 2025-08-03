// Structured Data (JSON-LD) utilities for SEO

export interface BaseSchema {
  '@context': string;
  '@type': string;
}

interface PersonSchema extends BaseSchema {
  '@type': 'Person';
  name: string;
  alternateName?: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}

interface CreativeWorkSchema extends BaseSchema {
  '@type': 'CreativeWork';
  name: string;
  description?: string;
  author?: PersonSchema | string;
  dateCreated?: string;
  dateModified?: string;
  keywords?: string | string[];
  aggregateRating?: AggregateRatingSchema;
  image?: string | ImageObjectSchema;
  url?: string;
  genre?: string;
  inLanguage?: string;
}

interface AggregateRatingSchema extends BaseSchema {
  '@type': 'AggregateRating';
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  ratingCount: number;
  reviewCount?: number;
}

interface ImageObjectSchema extends BaseSchema {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: ImageObjectSchema | string;
  description?: string;
  sameAs?: string[];
  contactPoint?: ContactPointSchema[];
}

interface ContactPointSchema extends BaseSchema {
  '@type': 'ContactPoint';
  contactType: string;
  email?: string;
  url?: string;
}

interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: SearchActionSchema;
  publisher?: OrganizationSchema;
  inLanguage?: string;
}

interface SearchActionSchema extends BaseSchema {
  '@type': 'SearchAction';
  target: string;
  'query-input': string;
}

interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: ListItemSchema[];
}

interface ListItemSchema extends BaseSchema {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

// Type definitions for app data
interface VibeData {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  image?: string;
  createdAt: string;
  createdBy?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  ratings?: Array<{
    value: number;
    emoji?: string;
  }>;
  averageRating?: number;
}

interface UserData {
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
}

interface BreadcrumbItem {
  name: string;
  url?: string;
}

// Site configuration
const SITE_CONFIG = {
  name: 'viberater',
  url:
    process.env.NODE_ENV === 'production'
      ? 'https://viberater.com'
      : 'http://localhost:3000',
  description:
    'Share and discover vibes. Rate, react, and share your favorite vibes with the world.',
  logo: `${process.env.NODE_ENV === 'production' ? 'https://viberater.com' : 'http://localhost:3000'}/logo.png`,
  social: {
    twitter: 'https://twitter.com/viberater',
    // Add other social platforms as they become available
  },
} as const;

// Organization schema for the site
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    logo: SITE_CONFIG.logo,
    sameAs: Object.values(SITE_CONFIG.social),
    contactPoint: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: `${SITE_CONFIG.url}/contact`,
      },
    ],
  };
}

// Website schema with search functionality
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: 'en-US',
    publisher: generateOrganizationSchema(),
    potentialAction: {
      '@context': 'https://schema.org',
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// Creative work schema for vibes
export function generateVibeSchema(vibe: VibeData): CreativeWorkSchema {
  const author: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name:
      vibe.createdBy?.first_name && vibe.createdBy?.last_name
        ? `${vibe.createdBy.first_name} ${vibe.createdBy.last_name}`
        : vibe.createdBy?.username || 'Anonymous',
    alternateName: vibe.createdBy?.username,
    url: vibe.createdBy?.username
      ? `${SITE_CONFIG.url}/users/${vibe.createdBy.username}`
      : undefined,
  };

  const schema: CreativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: vibe.title,
    description: vibe.description,
    author,
    dateCreated: new Date(vibe.createdAt).toISOString(),
    url: `${SITE_CONFIG.url}/vibes/${vibe.id}`,
    inLanguage: 'en-US',
  };

  // Add keywords from tags
  if (vibe.tags && vibe.tags.length > 0) {
    schema.keywords = vibe.tags;
  }

  // Add image if available
  if (vibe.image) {
    schema.image = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      url: vibe.image,
      caption: vibe.title,
    };
  }

  // Add aggregate rating if ratings exist
  if (vibe.ratings && vibe.ratings.length > 0 && vibe.averageRating) {
    schema.aggregateRating = {
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      ratingValue: vibe.averageRating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: vibe.ratings.length,
    };
  }

  return schema;
}

// Person schema for user profiles
export function generateUserProfileSchema(user: UserData): PersonSchema {
  const schema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name:
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username,
    alternateName: user.username,
    url: `${SITE_CONFIG.url}/users/${user.username}`,
  };

  // Add description from bio
  if (user.bio) {
    schema.description = user.bio;
  }

  // Add profile image
  if (user.avatar) {
    schema.image = user.avatar;
  }

  // Add social media links
  if (user.socialLinks) {
    const sameAs: string[] = [];
    if (user.socialLinks.twitter) sameAs.push(user.socialLinks.twitter);
    if (user.socialLinks.instagram) sameAs.push(user.socialLinks.instagram);
    if (user.socialLinks.tiktok) sameAs.push(user.socialLinks.tiktok);

    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }
  }

  return schema;
}

// Breadcrumb schema for navigation
export function generateBreadcrumbSchema(
  breadcrumbs: BreadcrumbItem[]
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@context': 'https://schema.org',
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url ? `${SITE_CONFIG.url}${crumb.url}` : undefined,
    })),
  };
}

// Utility to combine multiple schemas
export function combineSchemas(...schemas: BaseSchema[]): string {
  const combined = schemas.length === 1 ? schemas[0] : schemas;
  return JSON.stringify(combined, null, 0);
}

// Common breadcrumb generators
export const breadcrumbGenerators = {
  vibe: (vibe: VibeData): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Vibes', url: '/vibes' },
    { name: vibe.title },
  ],

  userProfile: (username: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Users', url: '/users' },
    { name: `@${username}` },
  ],

  search: (query?: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: query ? `Search: ${query}` : 'Search' },
  ],

  tag: (tag: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Tags', url: '/tags' },
    { name: `#${tag}` },
  ],
};

// Helper to generate JSON-LD script tag content
export function generateStructuredDataScript(
  schema: BaseSchema | BaseSchema[]
): string {
  const content =
    typeof schema === 'string' ? schema : JSON.stringify(schema, null, 0);
  return content;
}

// Validation helper (for development)
export function validateSchema(schema: BaseSchema): boolean {
  try {
    // Basic validation - check required fields
    if (!schema['@context'] || !schema['@type']) {
      // eslint-disable-next-line no-console
      console.warn('Schema missing required @context or @type');
      return false;
    }

    // Additional type-specific validation can be added here
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Schema validation error:', error);
    return false;
  }
}
