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
import { useStoryCanvas, type LayoutOption } from '@/hooks/use-story-canvas';
import { useVibeImageUrl } from '@/hooks/use-vibe-image-url';
import { StoryImagePreview } from './story-image-preview';
import { InstagramManualShare } from './instagram-manual-share';
import { TikTokManualShare } from './tiktok-manual-share';
import { TwitterManualShare } from './twitter-manual-share';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { cn } from '@/utils/tailwind-utils';
import {
  Instagram,
  Music2,
  Twitter,
  Image,
  Type,
  ChevronRight,
  Info,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { api } from '@vibechecc/convex';
import { useConvexQuery } from '@convex-dev/react-query';
import { APP_URL } from '@/utils/bindings';
import { useFeatureFlagEnabled } from 'posthog-js/react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vibe: Vibe;
  author: User;
  ratings?: (EmojiRating | Rating)[];
}

type ShareStep = 'platform' | 'customize';
type StoryLayout = 'expanded' | 'minimal';
type Platform = 'twitter' | 'instagram' | 'tiktok';

const layoutOptions: LayoutOption[] = [
  {
    value: 'expanded',
    label: 'expanded',
    description: 'with image',
    includeImage: true,
    includeRatings: true,
    includeReview: false,
    includeTags: true,
  },
  {
    value: 'minimal',
    label: 'minimal',
    description: 'text focus',
    includeImage: false,
    includeRatings: true,
    includeReview: true,
    includeTags: true,
  },
];

export function ShareModal({
  open,
  onOpenChange,
  vibe,
  author,
  ratings = [],
}: ShareModalProps) {
  const [currentStep, setCurrentStep] = useState<ShareStep>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );
  const [previewUrls, setPreviewUrls] = useState<Map<StoryLayout, string>>(
    new Map()
  );
  const previewUrlsRef = useRef<Map<StoryLayout, string>>(new Map());
  const [selectedLayout, setSelectedLayout] = useState<StoryLayout>('expanded');
  const [showPreview, setShowPreview] = useState(false);
  const [allLayoutsReady, setAllLayoutsReady] = useState(false);

  // Get feature flags
  const _twitterDirectEnabled = useFeatureFlagEnabled(
    'social-twitter-direct-enabled'
  );
  const _instagramDirectEnabled = useFeatureFlagEnabled(
    'social-instagram-direct-enabled'
  );
  const _tiktokShareKitEnabled = useFeatureFlagEnabled(
    'social-tiktok-sharekit-enabled'
  );

  // Get social connections for current user
  const socialConnections = useConvexQuery(
    api.social.connections.getSocialConnections,
    {}
  );

  // Get resolved image URL for the vibe
  const { data: vibeImageUrl } = useVibeImageUrl(vibe);

  const { isGenerating, generatedBlob, generateCanvasImage, downloadImage } =
    useStoryCanvas({
      filename: `vibe-${vibe.id}-story.png`,
    });

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=${selectedPlatform || 'share'}&utm_medium=social&utm_campaign=social_share`;

  const _currentLayoutOption =
    layoutOptions.find((opt) => opt.value === selectedLayout) ||
    layoutOptions[0];
  const currentPreviewUrl = previewUrls.get(selectedLayout) || '';

  // Check if platforms are connected
  const isConnected = (platform: Platform) => {
    return socialConnections?.some(
      (conn) =>
        conn.platform === platform && conn.connectionStatus === 'connected'
    );
  };

  // Generate preview images when step changes to customize
  useEffect(() => {
    if (currentStep === 'customize' && !isGenerating && !allLayoutsReady) {
      setAllLayoutsReady(false);

      // Generate all layouts in parallel
      const generatePromises = layoutOptions.map(async (layout) => {
        const blob = await generateCanvasImage(
          vibe,
          author,
          ratings,
          shareUrl,
          vibeImageUrl,
          layout
        );
        if (blob) {
          const url = URL.createObjectURL(blob);
          return { layout: layout.value, url };
        }
        return null;
      });

      Promise.all(generatePromises).then((results) => {
        const newUrls = new Map<StoryLayout, string>();
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

    return () => {
      if (!open) {
        // Clean up all URLs when modal closes
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls(new Map());
        previewUrlsRef.current = new Map();
        setAllLayoutsReady(false);
        setCurrentStep('platform');
        setSelectedPlatform(null);
      }
    };
  }, [
    currentStep,
    open,
    vibe,
    author,
    ratings,
    shareUrl,
    vibeImageUrl,
    generateCanvasImage,
    isGenerating,
    allLayoutsReady,
  ]);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setCurrentStep('customize');
  };

  const platformConfig = {
    twitter: {
      icon: Twitter,
      label: 'x / twitter',
      description: 'share with tweet + image',
      color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
    },
    instagram: {
      icon: Instagram,
      label: 'instagram',
      description: 'download for story/post',
      color: 'hover:bg-[#E4405F]/10 hover:text-[#E4405F]',
    },
    tiktok: {
      icon: Music2,
      label: 'tiktok',
      description: 'download for video/story',
      color:
        'hover:bg-[#000000]/10 hover:text-[#000000] dark:hover:bg-[#FFFFFF]/10 dark:hover:text-[#FFFFFF]',
    },
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
            {currentStep === 'platform'
              ? 'share to social media'
              : `share to ${selectedPlatform}`}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'platform'
              ? 'choose where to share this vibe'
              : 'customize your story image'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'platform' ? (
          <div className="space-y-4">
            {/* Platform Selection */}
            <div className="grid gap-3">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const Icon = config.icon;
                const connected = isConnected(platform as Platform);

                return (
                  <button
                    key={platform}
                    onClick={() => handlePlatformSelect(platform as Platform)}
                    className={cn(
                      'border-border bg-background hover:bg-muted group relative flex items-center gap-4 rounded-lg border p-4 text-left transition-colors',
                      config.color
                    )}
                  >
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.label}</span>
                        {connected && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs">
                            connected
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {config.description}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  </button>
                );
              })}
            </div>

            {/* Connection Status Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {socialConnections?.some(
                  (conn) => conn.connectionStatus === 'connected'
                )
                  ? 'connected accounts will share directly. unconnected accounts will download the image.'
                  : 'connect your social accounts in settings for easier sharing'}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('platform')}
              className="mb-2"
            >
              ← back to platforms
            </Button>

            {/* Render platform-specific wrapper */}
            {selectedPlatform === 'twitter' ? (
              <TwitterManualShare
                vibe={vibe}
                author={author}
                ratings={ratings}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                {/* Existing preview content */}
                <div className="relative">
                  <TabsDraggable
                    defaultValue={selectedLayout}
                    onValueChange={(value) =>
                      setSelectedLayout(value as StoryLayout)
                    }
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
              </TwitterManualShare>
            ) : selectedPlatform === 'instagram' ? (
              <InstagramManualShare
                vibe={vibe}
                author={author}
                ratings={ratings}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                {/* Existing preview content */}
                <div className="relative">
                  <TabsDraggable
                    defaultValue={selectedLayout}
                    onValueChange={(value) =>
                      setSelectedLayout(value as StoryLayout)
                    }
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
              </InstagramManualShare>
            ) : selectedPlatform === 'tiktok' ? (
              <TikTokManualShare
                vibe={vibe}
                author={author}
                ratings={ratings}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                {/* Existing preview content */}
                <div className="relative">
                  <TabsDraggable
                    defaultValue={selectedLayout}
                    onValueChange={(value) =>
                      setSelectedLayout(value as StoryLayout)
                    }
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
                    <div className="relative">
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
              </TikTokManualShare>
            ) : null}
          </div>
        )}
      </DialogContent>

      {/* Image Preview Modal */}
      <StoryImagePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        imageUrl={currentPreviewUrl}
        title={`${vibe.title} - ${selectedLayout} layout`}
      />
    </Dialog>
  );
}
