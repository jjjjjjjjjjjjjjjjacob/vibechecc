import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
} from '@/components/ui/tabs-draggable';
import {
  ArrowRight,
  Share2,
  Trophy,
  Instagram,
  Twitter,
  Music2,
  Image,
  Type,
  ChevronRight,
  Check,
} from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { useStoryCanvas, type LayoutOption } from '@/hooks/use-story-canvas';
import { useVibeImageUrl } from '@/hooks/use-vibe-image-url';
import { StoryImagePreview } from '@/components/social/story-image-preview';
import { InstagramManualShare } from '@/components/social/instagram-manual-share';
import { TikTokManualShare } from '@/components/social/tiktok-manual-share';
import { TwitterManualShare } from '@/components/social/twitter-manual-share';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { api } from '@vibechecc/convex';
import { useConvexQuery } from '@convex-dev/react-query';
import { APP_URL } from '@/utils/bindings';

interface VibeCreatedCelebrationV2Props {
  isOpen: boolean;
  onClose: () => void;
  vibe: Vibe;
  author: User;
  ratings?: (EmojiRating | Rating)[];
  isFirstVibe?: boolean;
}

type CelebrationStep = 'celebrate' | 'share' | 'customize';
type StoryLayout = 'expanded' | 'minimal' | 'square';
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
  {
    value: 'square',
    label: 'square',
    description: 'for instagram',
    includeImage: true,
    includeRatings: true,
    includeReview: true,
    includeTags: true,
  },
];

export function VibeCreatedCelebrationV2({
  isOpen,
  onClose,
  vibe,
  author,
  ratings = [],
  isFirstVibe = false,
}: VibeCreatedCelebrationV2Props) {
  const [currentStep, setCurrentStep] =
    React.useState<CelebrationStep>('celebrate');
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform | null>(null);
  const [previewUrls, setPreviewUrls] = React.useState<
    Map<StoryLayout, string>
  >(new Map());
  const [selectedLayout, setSelectedLayout] =
    React.useState<StoryLayout>('expanded');
  const [showPreview, setShowPreview] = React.useState(false);
  const [allLayoutsReady, setAllLayoutsReady] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [animationPhase, setAnimationPhase] = React.useState(0);
  const previewUrlsRef = React.useRef<Map<StoryLayout, string>>(new Map());

  // Get social connections for current user
  const socialConnections = useConvexQuery(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Complex Convex types cause deep instantiation errors
    api.social.connections.getSocialConnections,
    {}
  );

  // Get resolved image URL for the vibe
  const { data: vibeImageUrl } = useVibeImageUrl(vibe);

  const { isGenerating, generatedBlob, generateCanvasImage, downloadImage } =
    useStoryCanvas({
      filename: `vibe-${vibe.id}-story.png`,
    });

  const shareUrl = `${APP_URL}/vibes/${vibe.id}?utm_source=${selectedPlatform || 'share'}&utm_medium=social&utm_campaign=vibe_created`;

  const currentPreviewUrl = previewUrls.get(selectedLayout) || '';

  // Check if platforms are connected
  const isConnected = (platform: Platform) => {
    return socialConnections?.some(
      (conn) =>
        conn.platform === platform && conn.connectionStatus === 'connected'
    );
  };

  // Trigger animations in sequence
  React.useEffect(() => {
    if (isOpen) {
      // Start confetti and animations quickly
      const confettiTimer = setTimeout(() => setShowConfetti(true), 200);
      const animationTimer = setTimeout(() => setAnimationPhase(1), 300);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(animationTimer);
      };
    } else {
      setShowConfetti(false);
      setAnimationPhase(0);
      setCurrentStep('celebrate');
    }
  }, [isOpen]);

  // Generate preview images when step changes to customize
  React.useEffect(() => {
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
      if (!isOpen) {
        // Clean up all URLs when modal closes
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls(new Map());
        previewUrlsRef.current = new Map();
        setAllLayoutsReady(false);
      }
    };
  }, [
    currentStep,
    isOpen,
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
      color: 'hover:bg-foreground/10 hover:text-foreground',
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-4 sm:w-full sm:p-6',
          currentStep === 'celebrate' &&
            'animate-in fade-in-0 zoom-in-95 duration-500'
        )}
        shouldScaleBackground
        scaleFactor={0.85}
        scaleOffset="20px"
      >
        {currentStep === 'celebrate' ? (
          <>
            {/* Subtle Floating Elements */}
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(isFirstVibe ? 12 : 8)].map((_, i) => {
                  const isCircle = i % 3 === 0;
                  const randomX = 20 + Math.random() * 60; // More centered
                  const randomDelay = Math.random() * 3;
                  const randomDuration = 8 + Math.random() * 4; // Much slower, elegant float

                  return (
                    <div
                      key={i}
                      className="absolute opacity-30"
                      style={{
                        left: `${randomX}%`,
                        top: '-20px',
                        animation: `elegantFloat ${randomDuration}s ease-in-out ${randomDelay}s infinite`,
                      }}
                    >
                      {isCircle ? (
                        <div className="bg-theme-primary/20 h-2 w-2 rounded-full" />
                      ) : (
                        <div className="bg-theme-secondary/20 h-1 w-4 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <DialogHeader className="space-y-6 text-center">
              {/* Sophisticated Success Icon */}
              <div className="mx-auto flex h-24 w-24 items-center justify-center">
                <div className="relative">
                  {/* Subtle gradient ring */}
                  <div
                    className={cn(
                      'from-theme-primary/20 to-theme-secondary/20 absolute inset-0 rounded-full bg-gradient-to-r transition-opacity duration-500',
                      animationPhase >= 1
                        ? 'animate-pulse opacity-100'
                        : 'opacity-0'
                    )}
                    style={{
                      animationDuration: '3s',
                    }}
                  />

                  {/* Main success indicator */}
                  <div
                    className={cn(
                      'bg-background relative flex h-full w-full items-center justify-center rounded-full border-2 transition-all duration-500',
                      isFirstVibe
                        ? 'border-theme-primary'
                        : 'border-theme-secondary',
                      animationPhase >= 1
                        ? 'scale-100 opacity-100'
                        : 'scale-95 opacity-0'
                    )}
                  >
                    {isFirstVibe ? (
                      <Trophy className="text-theme-primary h-10 w-10" />
                    ) : (
                      <Check className="text-theme-secondary h-12 w-12" />
                    )}
                  </div>

                  {/* Elegant radiating lines for first vibe */}
                  {isFirstVibe && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'bg-theme-primary/30 absolute h-px w-8 origin-left transition-opacity duration-700',
                            animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
                          )}
                          style={{
                            transform: `rotate(${i * 60}deg) translateX(32px)`,
                            transitionDelay: `${i * 100}ms`,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <DialogTitle
                  className={cn(
                    'from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent transition-all duration-700',
                    animationPhase >= 1
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                >
                  {isFirstVibe ? 'your first vibe! 🎊' : 'vibe created! 🎉'}
                </DialogTitle>
                <DialogDescription
                  className={cn(
                    'text-lg transition-all duration-700',
                    animationPhase >= 1
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                  style={{ transitionDelay: '100ms' }}
                >
                  {isFirstVibe ? (
                    <>
                      <span className="text-theme-primary font-semibold">
                        congratulations!
                      </span>{' '}
                      you've just shared your first vibe with the world
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{vibe.title}</span> is now
                      live and ready to be discovered
                    </>
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Vibe Card Preview */}
            <div
              className={cn(
                'mx-auto my-6 max-w-md transition-all duration-700',
                animationPhase >= 1
                  ? 'scale-100 opacity-100'
                  : 'scale-95 opacity-0'
              )}
              style={{ transitionDelay: '200ms' }}
            >
              <VibeCard
                vibe={{
                  ...vibe,
                  createdBy: author,
                  ratings: ratings.filter((r): r is Rating => 'review' in r),
                }}
                variant="compact"
                className="shadow-xl"
              />
            </div>

            {/* Elegant Success Message for First Vibe */}
            {isFirstVibe && (
              <div
                className={cn(
                  'border-theme-primary/30 from-theme-primary/5 to-theme-secondary/5 rounded-lg border bg-gradient-to-r p-4 text-center backdrop-blur-sm transition-opacity duration-700',
                  animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
                )}
                style={{ transitionDelay: '300ms' }}
              >
                <div className="text-sm font-medium">
                  <span className="text-theme-primary">congratulations</span> —{' '}
                  you've joined the vibechecc community
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-col">
              {/* Primary Actions */}
              <div className="flex gap-3">
                <Link
                  to="/vibes/$vibeId"
                  params={{ vibeId: vibe.id }}
                  className={cn(
                    'flex-1 transition-all duration-700',
                    animationPhase >= 1
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                  style={{ transitionDelay: '400ms' }}
                >
                  <Button
                    className="from-theme-primary to-theme-secondary hover:from-theme-primary/90 hover:to-theme-secondary/90 w-full bg-gradient-to-r text-white shadow-lg transition-all hover:scale-105"
                    size="lg"
                  >
                    view your vibe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentStep('share')}
                  className={cn(
                    'flex-1 border-2 transition-all duration-700 hover:scale-105',
                    animationPhase >= 1
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                  style={{ transitionDelay: '500ms' }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  share vibe
                </Button>
              </div>

              {/* Secondary Action */}
              <Button
                variant="ghost"
                onClick={onClose}
                className={cn(
                  'w-full transition-opacity duration-700',
                  animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
                )}
                style={{ transitionDelay: '600ms' }}
              >
                create another vibe
              </Button>
            </DialogFooter>
          </>
        ) : currentStep === 'share' ? (
          <>
            <DialogHeader>
              <DialogTitle>share your vibe</DialogTitle>
              <DialogDescription>
                choose how you want to share this vibe with the world
              </DialogDescription>
            </DialogHeader>

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
                        'border-border bg-background hover:bg-muted group relative flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:scale-[1.02]',
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

              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => setCurrentStep('celebrate')}
                className="w-full"
              >
                ← go back
              </Button>
            </div>
          </>
        ) : currentStep === 'customize' && selectedPlatform ? (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('share')}
              className="mb-2"
            >
              ← back to platforms
            </Button>

            {/* Platform-specific content with preview */}
            {selectedPlatform === 'twitter' ? (
              <TwitterManualShare
                vibe={vibe}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                <RenderPreviewTabs />
              </TwitterManualShare>
            ) : selectedPlatform === 'instagram' ? (
              <InstagramManualShare
                vibe={vibe}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                <RenderPreviewTabs />
              </InstagramManualShare>
            ) : selectedPlatform === 'tiktok' ? (
              <TikTokManualShare
                vibe={vibe}
                generatedBlob={generatedBlob}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
              >
                <RenderPreviewTabs />
              </TikTokManualShare>
            ) : null}
          </div>
        ) : null}
      </DialogContent>

      {/* Image Preview Modal */}
      <StoryImagePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        imageUrl={currentPreviewUrl}
        title={`${vibe.title} - ${selectedLayout} layout`}
      />

      <style>{`
        @keyframes elegantFloat {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: translateY(100px) translateX(10px) rotate(5deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(200px) translateX(-5px) rotate(-3deg);
            opacity: 0.2;
          }
          75% {
            transform: translateY(300px) translateX(15px) rotate(8deg);
            opacity: 0.3;
          }
          100% {
            transform: translateY(450px) translateX(0) rotate(0deg);
            opacity: 0;
          }
        }
      `}</style>
    </Dialog>
  );

  // Inner component for rendering preview tabs
  function RenderPreviewTabs() {
    return (
      <div className="relative">
        <TabsDraggable
          defaultValue={selectedLayout}
          onValueChange={(value) => setSelectedLayout(value as StoryLayout)}
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
                    className="h-auto max-h-[300px] w-auto cursor-pointer select-none sm:max-h-[400px]"
                    onClick={() => setShowPreview(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowPreview(true);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-[300px] w-full items-center justify-center sm:h-[400px]">
                    <div className="text-center">
                      <div className="text-muted-foreground">
                        generating preview...
                      </div>
                    </div>
                  </div>
                )}
              </TabsDraggableContent>
            ))}
          </TabsDraggableContentContainer>
        </TabsDraggable>
      </div>
    );
  }
}
