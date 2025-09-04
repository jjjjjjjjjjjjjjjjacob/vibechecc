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
import type { Vibe } from '@vibechecc/types';
import { APP_NAME, APP_URL } from '@/utils/bindings';

interface InstagramManualShareProps {
  vibe: Vibe;
  generatedBlob: Blob | null;
  isGenerating: boolean;
  downloadImage: (blob: Blob) => void;
  children: React.ReactNode; // The existing preview content
}

export function InstagramManualShare({
  vibe,
  generatedBlob,
  isGenerating,
  downloadImage,
  children,
}: InstagramManualShareProps) {
  const [hasCopiedCaption, setHasCopiedCaption] = useState(false);
  const [hasCopiedHashtags, setHasCopiedHashtags] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=instagram&utm_medium=social&utm_campaign=manual_share`;

  // Generate Instagram hashtags
  const generateHashtags = useCallback(() => {
    const hashtags = [
      APP_NAME.toLowerCase(),
      'vibes',
      'mood',
      'relatable',
      'aesthetic',
      'storytime',
      ...(vibe.tags?.slice(0, 5) || []),
    ];

    return hashtags.map((tag) => `#${tag.replace(/\s+/g, '')}`).join(' ');
  }, [vibe]);

  // Generate Instagram-optimized caption (without hashtags)
  const generateCaption = useCallback(() => {
    return `${vibe.title}\n\n${vibe.description}`;
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
      toast('hashtags copied - use in first comment for better reach');
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
      toast('link copied');
    } catch {
      toast.error('failed to copy link');
    }
  }, [shareUrl]);

  // Handle Instagram deep link
  const handleOpenInstagram = useCallback(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open Instagram app
      window.location.href = 'instagram://camera';
      // Fallback to web after a delay
      setTimeout(() => {
        window.open('https://instagram.com', '_blank');
      }, 1000);
    } else {
      // Open Instagram web
      window.open('https://instagram.com', '_blank');
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Existing preview content (expanded/minimal tabs) */}
      {children}

      {/* Instagram-specific actions */}
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
            onClick={handleOpenInstagram}
            className="w-full bg-gradient-to-r from-[#E4405F] to-[#C13584] hover:opacity-90"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            open instagram
          </Button>
        )}
      </div>

      {/* Instagram suggested hashtags preview */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Hash className="h-4 w-4" />
          suggested hashtags
        </div>
        <div className="flex flex-wrap gap-1.5">
          {generateHashtags()
            .split(' ')
            .slice(0, 10)
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

      {/* Instagram-specific instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">instagram sharing tips:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>download your 9:16 story image</li>
              <li>copy caption & hashtags separately</li>
              <li>open instagram & tap your story icon</li>
              <li>select the downloaded image</li>
              <li>add a link sticker with the vibe url</li>
              <li>paste caption, then hashtags in first comment</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
