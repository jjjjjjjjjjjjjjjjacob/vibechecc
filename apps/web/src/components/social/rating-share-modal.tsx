import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
} from '@/components/ui/tabs-draggable';
import {
  useRatingShareCanvas,
  type RatingShareLayoutOption,
} from '@/hooks/use-rating-share-canvas';
import { StoryImagePreview } from './story-image-preview';
import type { Rating, Vibe } from '@vibechecc/types';
import { cn } from '@/utils/tailwind-utils';
import {
  Share,
  Download,
  Copy,
  Image,
  Type,
  Maximize2,
  Loader2,
  Info,
  Square,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { APP_URL } from '@/utils/bindings';

interface RatingShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: Rating;
  vibe: Vibe;
}

type RatingShareStep = 'layout' | 'customize';
type LayoutType = 'detailed' | 'compact' | 'story';

const layoutOptions: RatingShareLayoutOption[] = [
  {
    value: 'detailed',
    label: 'detailed',
    description: 'full review with vibe context',
    includeVibePreview: true,
    includeReviewText: true,
    includeVibeAuthor: true,
    aspectRatio: '1:1',
  },
  {
    value: 'compact',
    label: 'compact',
    description: 'rating focus, minimal context',
    includeVibePreview: false,
    includeReviewText: true,
    includeVibeAuthor: false,
    aspectRatio: '1:1',
  },
  {
    value: 'story',
    label: 'story',
    description: 'vertical format for stories',
    includeVibePreview: true,
    includeReviewText: true,
    includeVibeAuthor: true,
    aspectRatio: '9:16',
  },
];

export function RatingShareModal({
  open,
  onOpenChange,
  rating,
  vibe,
}: RatingShareModalProps) {
  const [currentStep, setCurrentStep] = useState<RatingShareStep>('layout');
  const [previewUrls, setPreviewUrls] = useState<Map<LayoutType, string>>(
    new Map()
  );
  const previewUrlsRef = useRef<Map<LayoutType, string>>(new Map());
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('detailed');
  const [showPreview, setShowPreview] = useState(false);
  const [allLayoutsReady, setAllLayoutsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    isGenerating,
    generatedBlob,
    generateRatingShareImage,
    downloadImage,
    shareImage,
  } = useRatingShareCanvas({
    filename: `rating-${rating.emoji}-${vibe.title.slice(0, 20)}.png`,
  });

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=rating_share&utm_medium=social&utm_campaign=rating_share`;

  const currentLayoutOption =
    layoutOptions.find((opt) => opt.value === selectedLayout) ||
    layoutOptions[0];
  const currentPreviewUrl = previewUrls.get(selectedLayout) || '';

  // Generate thumbnails immediately when modal opens
  useEffect(() => {
    if (open && !isGenerating && !allLayoutsReady && previewUrls.size === 0) {
      setAllLayoutsReady(false);

      // Generate all layouts in parallel
      const generatePromises = layoutOptions.map(async (layout) => {
        const blob = await generateRatingShareImage(
          rating,
          vibe,
          shareUrl,
          layout
        );
        if (blob) {
          const url = URL.createObjectURL(blob);
          return { layout: layout.value, url };
        }
        return null;
      });

      Promise.all(generatePromises).then((results) => {
        const newUrls = new Map<LayoutType, string>();
        results.forEach((result) => {
          if (result) {
            newUrls.set(result.layout, result.url);
          }
        });
        setPreviewUrls(newUrls);
        previewUrlsRef.current = newUrls;
        setAllLayoutsReady(true);
      });
    }

    // Clean up when modal closes
    if (!open && previewUrls.size > 0) {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls(new Map());
      previewUrlsRef.current = new Map();
      setAllLayoutsReady(false);
      setCurrentStep('layout');
      setCopySuccess(false);
    }
  }, [
    open,
    rating,
    vibe,
    shareUrl,
    generateRatingShareImage,
    isGenerating,
    allLayoutsReady,
    previewUrls.size,
  ]);

  const handleLayoutSelect = (layout: LayoutType) => {
    setSelectedLayout(layout);
    setCurrentStep('customize');
  };

  const handleShare = async () => {
    if (!generatedBlob) return;

    const raterName = rating.rater?.username || rating.user?.username || 'someone';
    const shareData = {
      title: `${rating.emoji} ${rating.value}/5 rating by @${raterName}`,
      text: `Check out this ${rating.emoji} ${rating.value}/5 rating for "${vibe.title}"`,
      url: shareUrl,
    };

    const shared = await shareImage(generatedBlob, shareData);
    if (!shared) {
      // Fallback to download if native sharing fails
      downloadImage(generatedBlob);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const layoutIcons = {
    detailed: Square,
    compact: Square,
    story: Smartphone,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto p-4 sm:w-full sm:p-6"
        shouldScaleBackground
        scaleFactor={0.8}
        scaleOffset="10px"
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'layout'
              ? 'share your rating'
              : `customize ${selectedLayout} layout`}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'layout'
              ? `share your ${rating.emoji} ${rating.value}/5 rating for "${vibe.title}"`
              : 'preview and share your rating image'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'layout' ? (
          <div className="space-y-4">
            {/* Layout Selection */}
            <div className="grid gap-3">
              {layoutOptions.map((layout) => {
                const Icon = layoutIcons[layout.value];
                return (
                  <button
                    key={layout.value}
                    onClick={() => handleLayoutSelect(layout.value)}
                    className={cn(
                      'border-border bg-background hover:bg-muted group relative flex items-center gap-4 rounded-lg border p-4 text-left transition-colors'
                    )}
                  >
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{layout.label}</span>
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs">
                          {layout.aspectRatio}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {layout.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {layout.includeVibePreview && (
                        <div className="bg-secondary/50 text-secondary-foreground rounded px-1.5 py-0.5 text-xs">
                          vibe
                        </div>
                      )}
                      {layout.includeReviewText && (
                        <div className="bg-secondary/50 text-secondary-foreground rounded px-1.5 py-0.5 text-xs">
                          review
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                choose a layout style for your rating share image. you can
                preview and customize before sharing.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('layout')}
              className="mb-2"
            >
              ← back to layouts
            </Button>

            {/* Preview Section */}
            <div className="relative">
              <TabsDraggable
                defaultValue={selectedLayout}
                onValueChange={(value) =>
                  setSelectedLayout(value as LayoutType)
                }
                className="h-[400px] sm:h-[500px]"
              >
                <TabsDraggableList className="mb-4">
                  {layoutOptions.map((option) => {
                    const Icon = layoutIcons[option.value];
                    return (
                      <TabsDraggableTrigger
                        key={option.value}
                        value={option.value}
                        icon={<Icon className="h-4 w-4" />}
                      >
                        {option.label}
                      </TabsDraggableTrigger>
                    );
                  })}
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
                            alt="Rating share preview"
                            role="button"
                            tabIndex={0}
                            className="h-auto max-h-[300px] w-auto cursor-pointer select-none sm:max-h-[400px]"
                            onClick={() => setShowPreview(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setShowPreview(true);
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
                    onClick={() => setShowPreview(true)}
                    className="bg-background/80 border-border hover:bg-background/90 absolute top-4 right-4 z-10 rounded-lg border p-1.5 backdrop-blur-sm transition-colors"
                    aria-label="Maximize preview"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </TabsDraggable>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleShare}
                disabled={!allLayoutsReady || !generatedBlob}
                className="flex-1"
              >
                <Share className="mr-2 h-4 w-4" />
                share image
              </Button>
              <Button
                variant="outline"
                onClick={() => generatedBlob && downloadImage(generatedBlob)}
                disabled={!allLayoutsReady || !generatedBlob}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                download
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="sm:w-auto"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copySuccess ? 'copied!' : 'copy link'}
              </Button>
            </div>

            {/* Info about sharing */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                on mobile devices, the share button will use your device's
                native sharing options. on desktop, the image will download for
                you to share manually.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>

      {/* Image Preview Modal */}
      <StoryImagePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        imageUrl={currentPreviewUrl}
        title={`${rating.emoji} ${rating.value}/5 rating - ${selectedLayout} layout`}
      />
    </Dialog>
  );
}