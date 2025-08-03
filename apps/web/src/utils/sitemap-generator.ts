/**
 * XML Sitemap Generation Service
 *
 * Generates dynamic XML sitemaps for improved SEO and search engine crawling.
 * Supports multiple sitemap types and automatic content discovery.
 */

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
  alternateUrls?: { hreflang: string; href: string }[];
}

export interface SitemapOptions {
  baseUrl: string;
  includeImages?: boolean;
  includeAlternates?: boolean;
  maxEntries?: number;
  excludeNoIndex?: boolean;
}

// Site configuration for sitemap generation
const SITEMAP_CONFIG = {
  maxEntriesPerSitemap: 50000, // Google's limit
  defaultChangeFreq: 'weekly' as const,
  defaultPriority: 0.5,
  staticPages: [
    { path: '/', priority: 1.0, changefreq: 'daily' as const },
    { path: '/discover', priority: 0.9, changefreq: 'daily' as const },
    { path: '/search', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/privacy', priority: 0.3, changefreq: 'monthly' as const },
    { path: '/terms', priority: 0.3, changefreq: 'monthly' as const },
    { path: '/data', priority: 0.3, changefreq: 'monthly' as const },
  ],
} as const;

/**
 * Generate XML for a single sitemap entry
 */
export function generateSitemapEntry(entry: SitemapEntry): string {
  const { url, lastmod, changefreq, priority, alternateUrls } = entry;

  let xml = `  <url>\n`;
  xml += `    <loc>${escapeXml(url)}</loc>\n`;

  if (lastmod) {
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  }

  if (changefreq) {
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
  }

  if (priority !== undefined && priority >= 0 && priority <= 1) {
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  }

  // Add alternate language URLs (for internationalization)
  if (alternateUrls && alternateUrls.length > 0) {
    alternateUrls.forEach((alt) => {
      xml += `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />\n`;
    });
  }

  xml += `  </url>\n`;
  return xml;
}

/**
 * Generate complete XML sitemap
 */
export function generateSitemap(
  entries: SitemapEntry[],
  options: SitemapOptions = { baseUrl: '' }
): string {
  const limitedEntries = entries.slice(
    0,
    options.maxEntries || SITEMAP_CONFIG.maxEntriesPerSitemap
  );

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

  // Add namespace for alternate language support if needed
  const hasAlternates = limitedEntries.some(
    (entry) => entry.alternateUrls?.length
  );
  if (hasAlternates) {
    xml += ` xmlns:xhtml="http://www.w3.org/1999/xhtml"`;
  }

  xml += `>\n`;

  // Add all entries
  limitedEntries.forEach((entry) => {
    xml += generateSitemapEntry(entry);
  });

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Generate sitemap index (for multiple sitemaps)
 */
export function generateSitemapIndex(
  sitemapUrls: { url: string; lastmod?: string }[]
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  sitemapUrls.forEach((sitemap) => {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(sitemap.url)}</loc>\n`;
    if (sitemap.lastmod) {
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    }
    xml += `  </sitemap>\n`;
  });

  xml += `</sitemapindex>\n`;
  return xml;
}

/**
 * Generate static pages sitemap entries
 */
export function generateStaticPageEntries(baseUrl: string): SitemapEntry[] {
  const now = new Date().toISOString();

  return SITEMAP_CONFIG.staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastmod: now,
    changefreq: page.changefreq,
    priority: page.priority,
  }));
}

/**
 * Generate vibe entries for sitemap
 */
export function generateVibeEntries(
  vibes: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt?: string;
    tags?: string[];
    visibility?: string;
  }>,
  baseUrl: string
): SitemapEntry[] {
  return vibes
    .filter((vibe) => vibe.visibility !== 'deleted') // Exclude deleted vibes
    .map((vibe) => ({
      url: `${baseUrl}/vibes/${vibe.id}`,
      lastmod: vibe.updatedAt || vibe.createdAt,
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));
}

/**
 * Generate user profile entries for sitemap
 */
export function generateUserEntries(
  users: Array<{
    username: string;
    updated_at?: number;
    created_at?: number;
  }>,
  baseUrl: string
): SitemapEntry[] {
  return users.map((user) => ({
    url: `${baseUrl}/users/${user.username}`,
    lastmod: user.updated_at
      ? new Date(user.updated_at).toISOString()
      : user.created_at
        ? new Date(user.created_at).toISOString()
        : new Date().toISOString(),
    changefreq: 'monthly' as const,
    priority: 0.6,
  }));
}

/**
 * Generate tag-based entries for sitemap
 */
export function generateTagEntries(
  tags: Array<{
    name: string;
    count: number;
    updated_at?: string;
  }>,
  baseUrl: string
): SitemapEntry[] {
  return tags
    .filter((tag) => tag.count > 0) // Only include tags with content
    .map((tag) => ({
      url: `${baseUrl}/search?q=${encodeURIComponent(`#${tag.name}`)}`,
      lastmod: tag.updated_at || new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: Math.min(0.7, 0.3 + (tag.count / 100) * 0.4), // Priority based on tag usage
    }));
}

/**
 * Split large sitemaps into multiple files
 */
export function splitSitemap(
  entries: SitemapEntry[],
  maxEntriesPerSitemap: number = SITEMAP_CONFIG.maxEntriesPerSitemap
) {
  const sitemaps: SitemapEntry[][] = [];

  for (let i = 0; i < entries.length; i += maxEntriesPerSitemap) {
    sitemaps.push(entries.slice(i, i + maxEntriesPerSitemap));
  }

  return sitemaps;
}

/**
 * Generate comprehensive sitemap data for viberater
 */
export interface SitemapData {
  vibes?: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt?: string;
    tags?: string[];
    visibility?: string;
  }>;
  users?: Array<{
    username: string;
    updated_at?: number;
    created_at?: number;
  }>;
  tags?: Array<{
    name: string;
    count: number;
    updated_at?: string;
  }>;
}

export function generateComprehensiveSitemap(
  data: SitemapData,
  options: SitemapOptions
): {
  sitemap?: string;
  sitemaps?: string[];
  sitemapIndex?: string;
  needsIndex: boolean;
} {
  const allEntries: SitemapEntry[] = [];

  // Add static pages
  allEntries.push(...generateStaticPageEntries(options.baseUrl));

  // Add dynamic content
  if (data.vibes) {
    allEntries.push(...generateVibeEntries(data.vibes, options.baseUrl));
  }

  if (data.users) {
    allEntries.push(...generateUserEntries(data.users, options.baseUrl));
  }

  if (data.tags) {
    allEntries.push(...generateTagEntries(data.tags, options.baseUrl));
  }

  // Sort by priority (highest first) and then by URL
  allEntries.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.url.localeCompare(b.url);
  });

  // Check if we need multiple sitemaps
  const maxEntries = options.maxEntries || SITEMAP_CONFIG.maxEntriesPerSitemap;
  if (allEntries.length <= maxEntries) {
    // Single sitemap is sufficient
    return {
      sitemap: generateSitemap(allEntries, options),
      needsIndex: false,
    };
  }

  // Need multiple sitemaps
  const sitemapChunks = splitSitemap(allEntries, maxEntries);
  const sitemaps = sitemapChunks.map((chunk) =>
    generateSitemap(chunk, options)
  );

  // Generate sitemap index
  const sitemapUrls = sitemaps.map((_, index) => ({
    url: `${options.baseUrl}/sitemap-${index + 1}.xml`,
    lastmod: new Date().toISOString(),
  }));

  const sitemapIndex = generateSitemapIndex(sitemapUrls);

  return {
    sitemaps,
    sitemapIndex,
    needsIndex: true,
  };
}

/**
 * Helper function to escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate robots.txt content with sitemap references
 */
export function generateRobotsTxt(
  baseUrl: string,
  hasSitemapIndex: boolean = false
): string {
  let robots = `User-agent: *\n`;
  robots += `Allow: /\n\n`;

  // Disallow specific paths that shouldn't be crawled
  robots += `# Disallow API routes and admin pages\n`;
  robots += `Disallow: /api/\n`;
  robots += `Disallow: /admin/\n`;
  robots += `Disallow: /_next/\n`;
  robots += `Disallow: /static/\n\n`;

  // Disallow search result pages with parameters (prevent duplicate content)
  robots += `# Disallow parameterized search pages\n`;
  robots += `Disallow: /search?*\n\n`;

  // Add sitemap references
  robots += `# Sitemaps\n`;
  if (hasSitemapIndex) {
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
  } else {
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
  }

  return robots;
}

/**
 * Check if URL should be included in sitemap
 */
export function shouldIncludeInSitemap(
  url: string,
  excludePatterns: string[] = []
): boolean {
  // Default exclude patterns
  const defaultExcludes = [
    '/api/',
    '/admin/',
    '/_next/',
    '/static/',
    '/search?', // Parameterized search pages
  ];

  const allExcludes = [...defaultExcludes, ...excludePatterns];

  return !allExcludes.some((pattern) => url.includes(pattern));
}

/**
 * Calculate priority based on content metrics
 */
export function calculatePriority(metrics: {
  type: 'vibe' | 'user' | 'tag' | 'static';
  engagementScore?: number;
  recency?: number;
  popularity?: number;
}): number {
  const { type, engagementScore = 0, recency = 0, popularity = 0 } = metrics;

  // Base priorities by content type
  const basePriorities = {
    static: 0.8,
    vibe: 0.7,
    user: 0.6,
    tag: 0.5,
  };

  let priority = basePriorities[type];

  // Adjust based on metrics (each can add up to 0.2 to priority)
  priority += Math.min(0.2, (engagementScore / 5) * 0.2);
  priority += Math.min(0.2, recency * 0.2);
  priority += Math.min(0.2, (popularity / 10) * 0.2);

  // Ensure priority stays within valid range
  return Math.max(0.1, Math.min(1.0, priority));
}
