/**
 * Social platform URL builders for sharing content
 */

export interface TwitterShareOptions {
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
  related?: string[];
}

export interface InstagramShareOptions {
  url?: string;
  text?: string;
}

export interface TikTokShareOptions {
  url?: string;
  title?: string;
  description?: string;
}

export interface ClipboardShareData {
  url: string;
  title?: string;
  text?: string;
}

/**
 * Platform-specific URL patterns and limits
 */
export const PLATFORM_LIMITS = {
  TWITTER: {
    TEXT_MAX: 280,
    URL_LENGTH: 23, // Twitter's t.co URL length
    HASHTAG_MAX: 2, // Recommended max hashtags for engagement
  },
  INSTAGRAM: {
    CAPTION_MAX: 2200,
    HASHTAG_MAX: 30,
    HASHTAG_RECOMMENDED: 11, // Optimal for engagement
  },
  TIKTOK: {
    DESCRIPTION_MAX: 300,
    HASHTAG_MAX: 10,
  },
} as const;

/**
 * Default hashtags for vibechecc content
 */
export const DEFAULT_HASHTAGS = {
  vibechecc: ['vibechecc', 'vibes'],
  general: ['mood', 'feelings', 'experience'],
} as const;

/**
 * Builds a Twitter/X share URL with the provided options
 * @param options - Twitter share options
 * @returns Complete Twitter share URL
 */
export function buildTwitterShareUrl(
  options: TwitterShareOptions = {}
): string {
  const { text, url, hashtags = [], via, related = [] } = options;

  const shareUrl = new URL('https://twitter.com/intent/tweet');

  if (text) {
    shareUrl.searchParams.set('text', text);
  }

  if (url) {
    shareUrl.searchParams.set('url', url);
  }

  if (hashtags.length > 0) {
    shareUrl.searchParams.set('hashtags', hashtags.join(','));
  }

  if (via) {
    shareUrl.searchParams.set('via', via);
  }

  if (related.length > 0) {
    shareUrl.searchParams.set('related', related.join(','));
  }

  return shareUrl.toString();
}

/**
 * Builds an Instagram share deep link for mobile apps
 * Since Instagram doesn't have a web sharing API, this prepares data for mobile sharing
 * @param options - Instagram share options
 * @returns Instagram app deep link or null if not on mobile
 */
export function buildInstagramShareUrl(
  options: InstagramShareOptions = {}
): string | null {
  // Instagram doesn't support web-based sharing URLs
  // This would typically open the Instagram app on mobile
  const { url } = options;

  if (typeof window !== 'undefined' && isMobileDevice()) {
    // Instagram deep link format for mobile
    return `instagram://share?url=${encodeURIComponent(url || '')}`;
  }

  return null;
}

/**
 * Builds a TikTok share deep link for mobile apps
 * @param options - TikTok share options
 * @returns TikTok share URL or deep link
 */
export function buildTikTokShareUrl(
  options: TikTokShareOptions = {}
): string | null {
  const { url, title } = options;

  if (typeof window !== 'undefined' && isMobileDevice()) {
    // TikTok deep link for mobile sharing
    const params = new URLSearchParams();
    if (url) params.set('url', url);
    if (title) params.set('title', title);

    return `tiktok://share?${params.toString()}`;
  }

  return null;
}

/**
 * Prepares data for clipboard copying with fallback text
 * @param data - Clipboard share data
 * @returns Formatted text for clipboard
 */
export function prepareClipboardShare(data: ClipboardShareData): string {
  const { url, title, text } = data;

  let shareText = '';

  if (title) {
    shareText += `${title}\n\n`;
  }

  if (text) {
    shareText += `${text}\n\n`;
  }

  shareText += `Check it out: ${url}`;

  return shareText;
}

/**
 * Opens native sharing dialog on mobile devices
 * @param data - Share data for native sharing
 * @returns Promise that resolves when sharing is complete or rejects if not supported
 */
export async function openNativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<void> {
  if (typeof window === 'undefined' || !navigator.share) {
    throw new Error('Native sharing not supported');
  }

  await navigator.share(data);
}

/**
 * Copies text to clipboard with fallback for older browsers
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves when copying is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Clipboard API not available');
  }

  // Modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to legacy method
    }
  }

  // Legacy clipboard method
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err);
    }
  });
}

/**
 * Detects if the current device is mobile
 * @returns True if on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Checks if a specific social app is likely installed on mobile
 * @param platform - Platform to check
 * @returns True if the app is likely available
 */
export function isPlatformAppAvailable(
  _platform: 'instagram' | 'tiktok' | 'twitter'
): boolean {
  // This is a best-guess approach since we can't definitively detect installed apps
  return isMobileDevice();
}

/**
 * Gets the appropriate sharing strategy for the current environment
 * @param platform - Target platform
 * @returns Recommended sharing strategy
 */
export function getShareStrategy(
  platform: 'twitter' | 'instagram' | 'tiktok' | 'clipboard' | 'native'
): 'web' | 'app' | 'clipboard' | 'native' {
  if (platform === 'clipboard') return 'clipboard';
  if (platform === 'native') return 'native';

  if (isMobileDevice()) {
    switch (platform) {
      case 'twitter':
        return 'web'; // Twitter web sharing works well on mobile
      case 'instagram':
      case 'tiktok':
        return 'app'; // These platforms prefer app-based sharing
      default:
        return 'clipboard';
    }
  }

  // Desktop
  switch (platform) {
    case 'twitter':
      return 'web';
    case 'instagram':
    case 'tiktok':
      return 'clipboard'; // No web sharing available
    default:
      return 'clipboard';
  }
}
