import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Info,
  Hash,
} from 'lucide-react';
import toast from '@/utils/toast';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { APP_NAME, APP_URL } from '@/config/app';

interface TikTokManualShareProps {
  vibe: Vibe;
  author: User;
  ratings?: (EmojiRating | Rating)[];
  generatedBlob: Blob | null;
  isGenerating: boolean;
  downloadImage: (blob: Blob) => void;
  children: React.ReactNode; // The existing preview content
}

export function TikTokManualShare({
  vibe,
  author: _author,
  ratings: _ratings = [],
  generatedBlob,
  isGenerating,
  downloadImage,
  children,
}: TikTokManualShareProps) {
  const [hasCopiedCaption, setHasCopiedCaption] = useState(false);
  const [hasCopiedHashtags, setHasCopiedHashtags] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=tiktok&utm_medium=social&utm_campaign=manual_share`;

  // Generate TikTok-optimized caption
  const generateCaption = useCallback(() => {
    return `${vibe.title}\n\n${vibe.description}\n\nLink in bio 👆`;
  }, [vibe]);

  // Generate TikTok trending hashtags
  const generateHashtags = useCallback(() => {
    const trendingHashtags = ['fyp', 'foryou', 'foryoupage', 'viral'];
    const vibeHashtags = [
      APP_NAME.toLowerCase(),
      'vibes',
      'relatable',
      'storytime',
      ...(vibe.tags?.slice(0, 4) || []),
    ];

    return [...vibeHashtags, ...trendingHashtags]
      .map((tag) => `#${tag.replace(/\s+/g, '')}`)
      .join(' ');
  }, [vibe]);

  // Handle image download
  const handleDownload = useCallback(async () => {
    if (!generatedBlob) {
      toast.error('no image to download');
      return;
    }

    downloadImage(generatedBlob);
    setHasDownloaded(true);
  }, [generatedBlob, downloadImage]);

  // Handle caption copy
  const handleCopyCaption = useCallback(async () => {
    const caption = generateCaption();
    try {
      await navigator.clipboard.writeText(caption);
      setHasCopiedCaption(true);
      setTimeout(() => setHasCopiedCaption(false), 3000);
      toast('caption copied');
    } catch {
      toast.error('failed to copy caption');
    }
  }, [generateCaption]);

  // Handle hashtags copy
  const handleCopyHashtags = useCallback(async () => {
    const hashtags = generateHashtags();
    try {
      await navigator.clipboard.writeText(hashtags);
      setHasCopiedHashtags(true);
      setTimeout(() => setHasCopiedHashtags(false), 3000);
      toast('hashtags copied - paste in comments for better reach');
    } catch {
      toast.error('failed to copy hashtags');
    }
  }, [generateHashtags]);

  // Handle link copy
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 3000);
      toast('link copied - add to bio');
    } catch {
      toast.error('failed to copy link');
    }
  }, [shareUrl]);

  // Handle TikTok deep link
  const handleOpenTikTok = useCallback(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open TikTok app
      window.location.href = 'snssdk1128://';
      // Fallback to web after a delay
      setTimeout(() => {
        window.open('https://tiktok.com', '_blank');
      }, 1000);
    } else {
      // Open TikTok web
      window.open('https://tiktok.com', '_blank');
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Existing preview content (expanded/minimal tabs) */}
      {children}

      {/* TikTok-specific actions */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownload}
            disabled={isGenerating || !generatedBlob}
            variant={hasDownloaded ? 'outline' : 'default'}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : hasDownloaded ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {hasDownloaded ? 'downloaded' : 'download'}
          </Button>

          <Button
            onClick={handleCopyCaption}
            variant="outline"
            className="w-full"
          >
            {hasCopiedCaption ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            copy caption
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleCopyHashtags}
            variant="outline"
            className="w-full"
          >
            {hasCopiedHashtags ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Hash className="mr-2 h-4 w-4" />
            )}
            copy hashtags
          </Button>

          <Button onClick={handleCopyLink} variant="outline" className="w-full">
            {hasCopiedLink ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            copy link
          </Button>
        </div>

        {hasDownloaded && (
          <Button
            onClick={handleOpenTikTok}
            className="w-full bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] hover:opacity-90"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            open tiktok
          </Button>
        )}
      </div>

      {/* TikTok trending hashtags preview */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Hash className="h-4 w-4" />
          trending hashtags for fyp
        </div>
        <div className="flex flex-wrap gap-1.5">
          {generateHashtags()
            .split(' ')
            .slice(0, 8)
            .map((tag) => (
              <span
                key={tag}
                className="bg-background rounded-full px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>

      {/* TikTok-specific instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">tiktok sharing tips:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>download your 9:16 story image</li>
              <li>copy caption & hashtags separately</li>
              <li>open tiktok & tap the + button</li>
              <li>select "upload" and choose the image</li>
              <li>add trending sounds for better reach</li>
              <li>paste caption, then hashtags in first comment</li>
              <li>add link to bio for traffic</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
