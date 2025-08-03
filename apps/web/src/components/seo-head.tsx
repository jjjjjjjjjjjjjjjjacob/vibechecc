import { createHead } from '@unhead/react';
import { generateSEOTags, type SEOConfig } from '@/utils/enhanced-seo';
import { generateStructuredDataScript, type BaseSchema } from '@/utils/structured-data';

interface SEOHeadProps {
  config: SEOConfig;
  structuredData?: BaseSchema | BaseSchema[];
  children?: React.ReactNode;
}

// Create the head instance (this should be done once in your app)
export const head = createHead();

export function SEOHead({ config, structuredData, children }: SEOHeadProps) {
  const metaTags = generateSEOTags(config);

  return (
    <>
      {/* Render meta tags */}
      {metaTags.map((tag, index) => {
        // Title tag
        if (tag.title) {
          head.push({
            title: tag.title,
          });
          return null;
        }

        // Link tags (canonical, etc.)
        if (tag.rel && tag.href) {
          head.push({
            link: [
              {
                rel: tag.rel,
                href: tag.href,
              },
            ],
          });
          return null;
        }

        // Meta tags
        if (tag.name || tag.property) {
          head.push({
            meta: [
              {
                ...(tag.name && { name: tag.name }),
                ...(tag.property && { property: tag.property }),
                content: tag.content || '',
              },
            ],
          });
        }

        return null;
      })}

      {/* Structured data */}
      {structuredData && (
        <>
          {head.push({
            script: [
              {
                type: 'application/ld+json',
                innerHTML: generateStructuredDataScript(structuredData),
              },
            ],
          })}
        </>
      )}

      {/* Additional custom head content */}
      {children}
    </>
  );
}

// Hook for easy SEO management in components
export function useSEO(config: SEOConfig, structuredData?: BaseSchema | BaseSchema[]) {
  const metaTags = generateSEOTags(config);
  
  // Update head tags
  head.push({
    title: config.title,
    meta: metaTags
      .filter(tag => tag.name || tag.property)
      .map(tag => ({
        ...(tag.name && { name: tag.name }),
        ...(tag.property && { property: tag.property }),
        content: tag.content || '',
      })),
    link: metaTags
      .filter(tag => tag.rel && tag.href)
      .map(tag => ({
        rel: tag.rel!,
        href: tag.href!,
      })),
    ...(structuredData && {
      script: [
        {
          type: 'application/ld+json',
          innerHTML: generateStructuredDataScript(structuredData),
        },
      ],
    }),
  });

  return {
    title: config.title,
    description: config.description,
    metaTags,
  };
}

// Component for structured data only
export function StructuredData({ data }: { data: BaseSchema | BaseSchema[] }) {
  head.push({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: generateStructuredDataScript(data),
      },
    ],
  });

  return null;
}

// HOC for pages that need SEO
export function withSEO<P extends object>(
  Component: React.ComponentType<P>,
  seoConfig: SEOConfig | ((props: P) => SEOConfig),
  structuredData?: BaseSchema | BaseSchema[] | ((props: P) => BaseSchema | BaseSchema[])
) {
  return function SEOEnhancedComponent(props: P) {
    const config = typeof seoConfig === 'function' ? seoConfig(props) : seoConfig;
    const schema = typeof structuredData === 'function' ? structuredData(props) : structuredData;

    useSEO(config, schema);

    return <Component {...props} />;
  };
}

// Prebuilt components for common SEO patterns
export function VibeSEO({ 
  vibe, 
  children 
}: { 
  vibe: {
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
  };
  children?: React.ReactNode;
}) {
  const config: SEOConfig = {
    title: `${vibe.title} - viberater`,
    description: vibe.description.length > 155 
      ? `${vibe.description.substring(0, 152)}...` 
      : vibe.description,
    keywords: vibe.tags || [],
    image: vibe.image,
    imageAlt: `Vibe: ${vibe.title}`,
    type: 'article',
    author: vibe.createdBy?.username,
    publishedTime: new Date(vibe.createdAt).toISOString(),
    url: `${process.env.NODE_ENV === 'production' ? 'https://viberater.com' : 'http://localhost:3000'}/vibes/${vibe.id}`,
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: vibe.title,
    description: vibe.description,
    author: {
      '@type': 'Person',
      name: vibe.createdBy?.first_name && vibe.createdBy?.last_name
        ? `${vibe.createdBy.first_name} ${vibe.createdBy.last_name}`
        : vibe.createdBy?.username || 'Anonymous',
      alternateName: vibe.createdBy?.username,
    },
    dateCreated: new Date(vibe.createdAt).toISOString(),
    keywords: vibe.tags?.join(', '),
    url: config.url,
  };

  return (
    <SEOHead config={config} structuredData={structuredData}>
      {children}
    </SEOHead>
  );
}

export function ProfileSEO({ 
  user, 
  children 
}: { 
  user: {
    username: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    avatar?: string;
  };
  children?: React.ReactNode;
}) {
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.username;

  const config: SEOConfig = {
    title: `${displayName} (@${user.username}) - viberater`,
    description: user.bio 
      ? `${user.bio} - View ${displayName}'s vibes and ratings on viberater`
      : `View ${displayName}'s vibes and ratings on viberater`,
    type: 'profile',
    author: user.username,
    image: user.avatar,
    url: `${process.env.NODE_ENV === 'production' ? 'https://viberater.com' : 'http://localhost:3000'}/users/${user.username}`,
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    alternateName: user.username,
    description: user.bio,
    image: user.avatar,
    url: config.url,
  };

  return (
    <SEOHead config={config} structuredData={structuredData}>
      {children}
    </SEOHead>
  );
}

export function SearchSEO({ 
  query, 
  resultCount,
  children 
}: { 
  query: string;
  resultCount?: number;
  children?: React.ReactNode;
}) {
  const config: SEOConfig = {
    title: `Search: "${query}" - viberater`,
    description: resultCount !== undefined
      ? `${resultCount} vibes found for "${query}". Discover and rate vibes on viberater`
      : `Search results for "${query}" on viberater`,
    noindex: true, // Don't index search result pages
  };

  return (
    <SEOHead config={config}>
      {children}
    </SEOHead>
  );
}

export default SEOHead;