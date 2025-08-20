/**
 * URL generation utilities for social sharing
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
}

export interface ShareUrlOptions {
  baseUrl: string;
  utmParams?: UtmParams;
  additionalParams?: Record<string, string>;
}

export function generateShareUrl(options: ShareUrlOptions): string {
  const url = new URL(options.baseUrl);

  if (options.utmParams) {
    url.searchParams.set('utm_source', options.utmParams.source);
    url.searchParams.set('utm_medium', options.utmParams.medium);
    if (options.utmParams.campaign) {
      url.searchParams.set('utm_campaign', options.utmParams.campaign);
    }
    if (options.utmParams.content) {
      url.searchParams.set('utm_content', options.utmParams.content);
    }
  }

  if (options.additionalParams) {
    Object.entries(options.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}
