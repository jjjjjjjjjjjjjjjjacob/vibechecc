import { useEffect } from 'react';
import { generateSEOTags, type SEOConfig } from '@/utils/enhanced-seo';
import {
  generateStructuredDataScript,
  type BaseSchema,
} from '@/utils/structured-data';

interface SEOHeadProps {
  config: SEOConfig;
  structuredData?: BaseSchema | BaseSchema[];
  children?: React.ReactNode;
}

export function SEOHead({
  config,
  structuredData,
  children: _children,
}: SEOHeadProps) {
  const metaTags = generateSEOTags(config);

  useEffect(() => {
    // Update document title
    const titleTag = metaTags.find((tag) => tag.title);
    if (titleTag?.title) {
      document.title = titleTag.title;
    }

    // Update meta tags
    metaTags.forEach((tag) => {
      // Skip title tag since we handle it above
      if (tag.title) return;

      // Handle canonical links
      if (tag.rel && tag.href) {
        let linkElement = document.querySelector(
          `link[rel="${tag.rel}"]`
        ) as HTMLLinkElement;
        if (!linkElement) {
          linkElement = document.createElement('link');
          linkElement.rel = tag.rel;
          document.head.appendChild(linkElement);
        }
        linkElement.href = tag.href;
        return;
      }

      // Handle meta tags
      if (tag.name || tag.property) {
        const selector = tag.name
          ? `meta[name="${tag.name}"]`
          : `meta[property="${tag.property}"]`;
        let metaElement = document.querySelector(selector) as HTMLMetaElement;

        if (!metaElement) {
          metaElement = document.createElement('meta');
          if (tag.name) metaElement.name = tag.name;
          if (tag.property) metaElement.setAttribute('property', tag.property);
          document.head.appendChild(metaElement);
        }

        if (tag.content) {
          metaElement.content = tag.content;
        }
      }
    });

    // Handle structured data
    if (structuredData) {
      const scriptId = 'structured-data-script';
      let scriptElement = document.getElementById(
        scriptId
      ) as HTMLScriptElement;

      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }

      scriptElement.innerHTML = generateStructuredDataScript(structuredData);
    }
  }, [metaTags, structuredData]);

  return null;
}

// Prebuilt components for common SEO patterns
export function VibeSEO({
  vibe,
  children,
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
    url: `${process.env.NODE_ENV === 'production' ? 'https://viberater.com' : 'http://localhost:3000'}/vibes/${vibe.id}`,
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: vibe.title,
    description: vibe.description,
    author: {
      '@type': 'Person',
      name:
        vibe.createdBy?.first_name && vibe.createdBy?.last_name
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
  children,
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
  const displayName =
    user.first_name && user.last_name
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
  children,
}: {
  query: string;
  resultCount?: number;
  children?: React.ReactNode;
}) {
  const config: SEOConfig = {
    title: `Search: "${query}" - viberater`,
    description:
      resultCount !== undefined
        ? `${resultCount} vibes found for "${query}". Discover and rate vibes on viberater`
        : `Search results for "${query}" on viberater`,
    noindex: true, // Don't index search result pages
  };

  return <SEOHead config={config}>{children}</SEOHead>;
}

export default SEOHead;
