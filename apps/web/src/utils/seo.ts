// Legacy SEO function - use enhanced-seo.ts for new implementations
import { generateSEOTags, type SEOConfig } from './enhanced-seo';

export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
}) => {
  // Convert to new SEO config format
  const config: SEOConfig = {
    title,
    description: description || '',
    keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
    image,
  };

  // Use the enhanced SEO function
  return generateSEOTags(config);
};

// Re-export enhanced utilities for easy migration
export * from './enhanced-seo';
