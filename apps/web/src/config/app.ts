/**
 * App configuration that can be customized via environment variables
 * This allows building the app with different names/branding
 */

const appName = import.meta.env.VITE_APP_NAME || 'vibechecc';
const appDomain = import.meta.env.VITE_APP_DOMAIN || `${appName}.com`;
const appTwitterHandle =
  import.meta.env.VITE_APP_TWITTER_HANDLE || `@${appName}`;

export const APP_CONFIG = {
  name: appName,
  domain: appDomain,
  url: `https://${appDomain}`,
  twitterHandle: appTwitterHandle,

  // Display names
  displayName: appName,
  tagline: 'share and discover vibes',
  description: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,

  // SEO defaults
  seo: {
    defaultTitle: `${appName} | share and discover vibes`,
    titleTemplate: `%s | ${appName}`,
    defaultDescription: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,
  },

  // Legal/Policy pages
  legal: {
    privacyTitle: `privacy policy | ${appName}`,
    privacyDescription: `privacy policy and data protection practices for ${appName} platform`,
    termsTitle: `terms of service | ${appName}`,
    termsDescription: `terms of service and usage guidelines for ${appName} platform`,
  },
} as const;

// Export individual items for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_DOMAIN = APP_CONFIG.domain;
export const APP_URL = APP_CONFIG.url;
export const APP_TWITTER_HANDLE = APP_CONFIG.twitterHandle;
