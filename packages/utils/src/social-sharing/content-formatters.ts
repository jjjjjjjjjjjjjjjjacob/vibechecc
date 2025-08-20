/**
 * Content formatters for different social media platforms
 */

import { PLATFORM_LIMITS, DEFAULT_HASHTAGS } from './platform-builders';

export interface VibeShareContent {
  title: string;
  description: string;
  creatorName?: string;
  tags?: string[];
  shareUrl: string;
}

export interface ProfileShareContent {
  username: string;
  displayName?: string;
  bio?: string;
  followerCount?: number;
  shareUrl: string;
}

export interface FormattedShareContent {
  text: string;
  hashtags: string[];
  url: string;
  truncated: boolean;
}

/**
 * Formats vibe content for Twitter sharing
 * @param content - Vibe content to format
 * @param options - Additional formatting options
 * @returns Formatted content for Twitter
 */
export function formatVibeForTwitter(
  content: VibeShareContent,
  options: {
    includeCreator?: boolean;
    customHashtags?: string[];
    customMessage?: string;
  } = {}
): FormattedShareContent {
  const { includeCreator = true, customHashtags = [], customMessage } = options;

  // Start with custom message or default template
  let text = customMessage || `Check out this vibe: "${content.title}"`;

  // Add creator attribution if requested and available
  if (includeCreator && content.creatorName) {
    text += ` by ${content.creatorName}`;
  }

  // Combine default hashtags with custom ones
  const hashtags = [
    ...DEFAULT_HASHTAGS.vibechecc,
    ...customHashtags,
    ...(content.tags?.slice(0, 2) || []), // Limit to 2 content tags
  ].slice(0, PLATFORM_LIMITS.TWITTER.HASHTAG_MAX);

  // Calculate available space for text (accounting for URL and hashtags)
  const urlLength = PLATFORM_LIMITS.TWITTER.URL_LENGTH;
  const hashtagLength = hashtags.reduce((sum, tag) => sum + tag.length + 2, 0); // +2 for "# "
  const availableTextLength =
    PLATFORM_LIMITS.TWITTER.TEXT_MAX - urlLength - hashtagLength - 2; // -2 for spacing

  let truncated = false;
  if (text.length > availableTextLength) {
    text = text.substring(0, availableTextLength - 3) + '...';
    truncated = true;
  }

  return {
    text,
    hashtags,
    url: content.shareUrl,
    truncated,
  };
}

/**
 * Formats vibe content for Instagram sharing
 * @param content - Vibe content to format
 * @param options - Additional formatting options
 * @returns Formatted content for Instagram
 */
export function formatVibeForInstagram(
  content: VibeShareContent,
  options: {
    includeDescription?: boolean;
    customHashtags?: string[];
    customMessage?: string;
  } = {}
): FormattedShareContent {
  const {
    includeDescription = true,
    customHashtags = [],
    customMessage,
  } = options;

  // Build the caption
  let text = customMessage || `✨ ${content.title} ✨`;

  if (includeDescription && content.description) {
    text += `\n\n${content.description}`;
  }

  if (content.creatorName) {
    text += `\n\nShared from @${content.creatorName} on vibechecc`;
  } else {
    text += `\n\nShared from vibechecc`;
  }

  // Add the share URL
  text += `\n\n🔗 ${content.shareUrl}`;

  // Combine hashtags
  const hashtags = [
    ...DEFAULT_HASHTAGS.vibechecc,
    ...DEFAULT_HASHTAGS.general,
    ...customHashtags,
    ...(content.tags || []),
  ].slice(0, PLATFORM_LIMITS.INSTAGRAM.HASHTAG_RECOMMENDED);

  // Add hashtags to text if there's space
  const hashtagText = '\n\n' + hashtags.map((tag) => `#${tag}`).join(' ');
  const totalLength = text.length + hashtagText.length;

  let truncated = false;
  if (totalLength > PLATFORM_LIMITS.INSTAGRAM.CAPTION_MAX) {
    const availableTextLength =
      PLATFORM_LIMITS.INSTAGRAM.CAPTION_MAX - hashtagText.length;
    text = text.substring(0, availableTextLength - 3) + '...';
    truncated = true;
  }

  return {
    text,
    hashtags,
    url: content.shareUrl,
    truncated,
  };
}

/**
 * Formats vibe content for TikTok sharing
 * @param content - Vibe content to format
 * @param options - Additional formatting options
 * @returns Formatted content for TikTok
 */
export function formatVibeForTikTok(
  content: VibeShareContent,
  options: {
    customHashtags?: string[];
    customMessage?: string;
  } = {}
): FormattedShareContent {
  const { customHashtags = [], customMessage } = options;

  // TikTok descriptions are typically shorter and more casual
  let text = customMessage || `Sharing this vibe: ${content.title}`;

  if (content.creatorName) {
    text += ` by ${content.creatorName}`;
  }

  text += ` 🔗 ${content.shareUrl}`;

  // Combine hashtags (TikTok loves hashtags)
  const hashtags = [
    ...DEFAULT_HASHTAGS.vibechecc,
    'fyp', // TikTok's "For You Page"
    'vibes',
    'mood',
    ...customHashtags,
    ...(content.tags?.slice(0, 5) || []),
  ].slice(0, PLATFORM_LIMITS.TIKTOK.HASHTAG_MAX);

  // TikTok descriptions are shorter
  let truncated = false;
  if (text.length > PLATFORM_LIMITS.TIKTOK.DESCRIPTION_MAX) {
    text =
      text.substring(0, PLATFORM_LIMITS.TIKTOK.DESCRIPTION_MAX - 3) + '...';
    truncated = true;
  }

  return {
    text,
    hashtags,
    url: content.shareUrl,
    truncated,
  };
}

/**
 * Formats profile content for Twitter sharing
 * @param content - Profile content to format
 * @param options - Additional formatting options
 * @returns Formatted content for Twitter
 */
export function formatProfileForTwitter(
  content: ProfileShareContent,
  options: {
    customMessage?: string;
    includeStats?: boolean;
  } = {}
): FormattedShareContent {
  const { customMessage, includeStats = true } = options;

  let text =
    customMessage ||
    `Check out ${content.displayName || content.username}'s profile on vibechecc!`;

  if (content.bio && text.length < 150) {
    // Add bio if there's space
    const bioPreview =
      content.bio.length > 100
        ? content.bio.substring(0, 97) + '...'
        : content.bio;
    text += `\n\n"${bioPreview}"`;
  }

  if (
    includeStats &&
    content.followerCount !== undefined &&
    content.followerCount > 0
  ) {
    text += `\n\n${content.followerCount} followers`;
  }

  const hashtags = ['vibechecc', 'profile', 'community'];

  // Ensure we don't exceed Twitter's limit
  const urlLength = PLATFORM_LIMITS.TWITTER.URL_LENGTH;
  const hashtagLength = hashtags.reduce((sum, tag) => sum + tag.length + 2, 0);
  const availableTextLength =
    PLATFORM_LIMITS.TWITTER.TEXT_MAX - urlLength - hashtagLength - 2;

  let truncated = false;
  if (text.length > availableTextLength) {
    text = text.substring(0, availableTextLength - 3) + '...';
    truncated = true;
  }

  return {
    text,
    hashtags,
    url: content.shareUrl,
    truncated,
  };
}

/**
 * Formats content for clipboard sharing (universal format)
 * @param content - Content to format for clipboard
 * @param type - Type of content being shared
 * @returns Formatted text for clipboard
 */
export function formatForClipboard(
  content: VibeShareContent | ProfileShareContent,
  type: 'vibe' | 'profile'
): string {
  if (type === 'vibe') {
    const vibeContent = content as VibeShareContent;
    let text = `${vibeContent.title}\n\n`;

    if (vibeContent.description) {
      text += `${vibeContent.description}\n\n`;
    }

    if (vibeContent.creatorName) {
      text += `by ${vibeContent.creatorName}\n\n`;
    }

    text += `Check it out on vibechecc: ${vibeContent.shareUrl}`;

    if (vibeContent.tags && vibeContent.tags.length > 0) {
      text += `\n\n#${vibeContent.tags.join(' #')}`;
    }

    return text;
  } else {
    const profileContent = content as ProfileShareContent;
    let text = `Check out ${profileContent.displayName || profileContent.username}'s profile on vibechecc!\n\n`;

    if (profileContent.bio) {
      text += `"${profileContent.bio}"\n\n`;
    }

    if (
      profileContent.followerCount !== undefined &&
      profileContent.followerCount > 0
    ) {
      text += `${profileContent.followerCount} followers\n\n`;
    }

    text += profileContent.shareUrl;

    return text;
  }
}

/**
 * Truncates text to a specific length while preserving word boundaries
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text;

  const availableLength = maxLength - suffix.length;
  let truncated = text.substring(0, availableLength);

  // Try to break on word boundary
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  if (lastSpaceIndex > availableLength * 0.8) {
    truncated = truncated.substring(0, lastSpaceIndex);
  }

  return truncated + suffix;
}

/**
 * Validates and cleans hashtags for social media
 * @param tags - Array of potential hashtags
 * @param maxCount - Maximum number of hashtags to return
 * @returns Cleaned and validated hashtags
 */
export function cleanHashtags(tags: string[], maxCount: number = 10): string[] {
  return tags
    .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, '')) // Remove special chars
    .filter((tag) => tag.length > 0 && tag.length <= 30) // Valid length
    .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
    .slice(0, maxCount);
}
