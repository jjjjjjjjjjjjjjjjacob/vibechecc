import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
} from '@/components/ui/tabs-draggable';
import { type LayoutOption } from '@/hooks/use-story-canvas';
import {
  Download,
  Copy,
  Share,
  Image,
  Type,
  Maximize2,
  Loader2,
  Info,
  Smartphone,
  Monitor,
} from '@/components/ui/icons';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { APP_URL } from '@/utils/bindings';
import toast from '@/utils/toast';

interface GenericShareProps {
  vibe: Vibe;
  author: User;
  ratings?: (EmojiRating | Rating)[];
  generatedBlob?: Blob | null;
  isGenerating: boolean;
  downloadImage: (blob: Blob) => void;
  previewUrls: Map<string, string>;
  selectedLayout: string;
  onLayoutChange: (layout: string) => void;
  onShowPreview: () => void;
  layoutOptions: LayoutOption[];
}

export function GenericShare({
  vibe,
  author: _author,
  ratings: _ratings = [],
  generatedBlob,
  isGenerating,
  downloadImage,
  previewUrls,
  selectedLayout,
  onLayoutChange,
  onShowPreview,
  layoutOptions,
}: GenericShareProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=generic_share&utm_medium=social&utm_campaign=quick_share`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      toast.success('link copied to clipboard!');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error('failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vibe.title,
          text: `check out "${vibe.title}" on vibechecc`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyUrl();
      }
    } else {
      // Fallback to copy
      handleCopyUrl();
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">quick actions</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleNativeShare}
            className="flex-1 gap-2"
            variant="outline"
          >
            <Share className="h-4 w-4" />
            share link
          </Button>
          <Button
            onClick={handleCopyUrl}
            className="flex-1 gap-2"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
            {copiedUrl ? 'copied!' : 'copy link'}
          </Button>
        </div>
      </div>

      {/* Story Image Generation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">story image</h3>
          <Button
            onClick={() => generatedBlob && downloadImage(generatedBlob)}
            disabled={isGenerating || !generatedBlob}
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'generating...' : 'download'}
          </Button>
        </div>

        {/* Layout Selector and Preview */}
        <div className="relative">
          <TabsDraggable
            defaultValue={selectedLayout}
            onValueChange={onLayoutChange}
            className="h-[400px] sm:h-[500px]"
          >
            <TabsDraggableList className="mb-4">
              {layoutOptions.map((option) => (
                <TabsDraggableTrigger
                  key={option.value}
                  value={option.value}
                  icon={
                    option.value === 'expanded' ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <Type className="h-4 w-4" />
                    )
                  }
                >
                  {option.label}
                </TabsDraggableTrigger>
              ))}
            </TabsDraggableList>
            <div className="relative flex flex-col">
              <TabsDraggableContentContainer className="bg-muted/10 relative w-full overflow-hidden rounded-lg border">
                {layoutOptions.map((option) => (
                  <TabsDraggableContent
                    key={option.value}
                    value={option.value}
                    className="p-4"
                  >
                    {previewUrls.get(option.value) ? (
                      <img
                        src={previewUrls.get(option.value)}
                        alt="Story preview"
                        role="button"
                        tabIndex={0}
                        className="h-auto max-h-[300px] w-auto cursor-pointer select-none sm:max-h-[400px]"
                        onClick={onShowPreview}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onShowPreview();
                          }
                        }}
                        draggable={false}
                        aria-label="Click to expand preview"
                      />
                    ) : (
                      <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 select-none sm:h-[400px]">
                        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin sm:h-8 sm:w-8" />
                        <span className="text-muted-foreground text-sm select-none sm:text-base">
                          generating {option.label} layout...
                        </span>
                      </div>
                    )}
                  </TabsDraggableContent>
                ))}
              </TabsDraggableContentContainer>
              <button
                onClick={onShowPreview}
                className="bg-background/80 border-border hover:bg-background/90 absolute top-4 right-4 z-10 rounded-lg border p-1.5 backdrop-blur-sm transition-colors"
                aria-label="Maximize preview"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </TabsDraggable>
        </div>
      </div>

      {/* Universal Instructions */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">sharing instructions</h3>

        {/* Mobile Instructions */}
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">on mobile:</p>
              <ul className="ml-2 space-y-1 text-sm">
                <li>• tap "share link" to share directly</li>
                <li>• or download the image and post manually</li>
                <li>• add the link in your caption or bio</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Desktop Instructions */}
        <Alert>
          <Monitor className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">on desktop:</p>
              <ul className="ml-2 space-y-1 text-sm">
                <li>• download the story image</li>
                <li>• copy the link to share</li>
                <li>• post to your favorite social platform</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* General Tips */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">pro tips:</p>
              <ul className="ml-2 space-y-1 text-sm">
                <li>• expanded layout works great for posts</li>
                <li>• minimal layout is perfect for stories</li>
                <li>• include the link for people to discover more vibes</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Share URL Display */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">share url</h3>
        <div className="bg-muted flex items-center justify-between rounded-lg p-3">
          <code className="text-muted-foreground flex-1 truncate pr-2 text-sm">
            {shareUrl}
          </code>
          <Button
            onClick={handleCopyUrl}
            size="sm"
            variant="ghost"
            className="shrink-0 gap-1"
          >
            <Copy className="h-3 w-3" />
            {copiedUrl ? 'copied!' : 'copy'}
          </Button>
        </div>
      </div>
    </div>
  );
}
