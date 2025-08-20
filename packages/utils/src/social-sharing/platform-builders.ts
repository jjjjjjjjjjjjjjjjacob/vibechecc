/**
 * Platform-specific URL builders for social sharing
 */

export const PLATFORM_LIMITS = {
  TWITTER: {
    TEXT_MAX: 280,
    HASHTAG_MAX: 10,
    URL_LENGTH: 23, // Twitter shortens all URLs to ~23 chars
    maxLength: 280,
    maxHashtags: 10,
  },
  INSTAGRAM: {
    TEXT_MAX: 2200,
    HASHTAG_MAX: 30,
    HASHTAG_RECOMMENDED: 11,
    CAPTION_MAX: 2200,
    maxLength: 2200,
    maxHashtags: 30,
  },
  TIKTOK: {
    TEXT_MAX: 2200,
    HASHTAG_MAX: 100,
    DESCRIPTION_MAX: 2200,
    maxLength: 2200,
    maxHashtags: 100,
  },
  twitter: {
    maxLength: 280,
    maxHashtags: 10,
  },
  instagram: {
    maxLength: 2200,
    maxHashtags: 30,
  },
  tiktok: {
    maxLength: 2200,
    maxHashtags: 100,
  },
};

export const DEFAULT_HASHTAGS = {
  vibechecc: ['vibechecc'],
  general: ['mood', 'vibes'],
  vibe: ['vibechecc', 'vibes', 'mood', 'rateMyVibe'],
  profile: ['vibechecc', 'profile', 'social'],
  rating: ['vibechecc', 'rating', 'review'],
};

export interface TwitterShareOptions {
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
}

export interface InstagramShareOptions {
  imageUrl?: string;
  caption?: string;
}

export interface TikTokShareOptions {
  text?: string;
  hashtags?: string[];
}

export interface ClipboardShareData {
  text: string;
  url?: string;
}

export function buildTwitterShareUrl(options: TwitterShareOptions): string {
  const url = new URL('https://twitter.com/intent/tweet');

  if (options.text) {
    url.searchParams.set('text', options.text);
  }
  if (options.url) {
    url.searchParams.set('url', options.url);
  }
  if (options.hashtags && options.hashtags.length > 0) {
    url.searchParams.set('hashtags', options.hashtags.join(','));
  }
  if (options.via) {
    url.searchParams.set('via', options.via);
  }

  return url.toString();
}

export function buildInstagramShareData(
  options: InstagramShareOptions
): ClipboardShareData {
  const parts: string[] = [];

  if (options.caption) {
    parts.push(options.caption);
  }

  if (options.imageUrl) {
    parts.push('');
    parts.push(`View image: ${options.imageUrl}`);
  }

  return {
    text: parts.join('\n'),
    url: options.imageUrl,
  };
}

export function buildTikTokShareData(
  options: TikTokShareOptions
): ClipboardShareData {
  const parts: string[] = [];

  if (options.text) {
    parts.push(options.text);
  }

  if (options.hashtags && options.hashtags.length > 0) {
    parts.push('');
    parts.push(options.hashtags.map((tag) => `#${tag}`).join(' '));
  }

  return {
    text: parts.join('\n'),
  };
}
