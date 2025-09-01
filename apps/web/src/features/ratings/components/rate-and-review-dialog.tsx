import * as React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import type {
  EmojiRating,
  EmojiRatingMetadata,
  CurrentUserRating,
} from '@vibechecc/types';
import { Circle } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { EmojiSearchCollapsible as EmojiSearchCommand } from './emoji-search-collapsible';
import { RatingScale } from './rating-scale';
import { FlipClockDigit } from './flip-clock-digit';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui';
import { Form } from '@/components/ui/form';
import toast from '@/utils/toast';
import { showPointsToast } from '@/utils/points-toast';
import { useCreateEmojiRatingMutation } from '@/queries';

type RatingFormData = {
  emoji: string;
  value: number;
  review: string;
  tags?: string[];
};

interface RateAndReviewDialogProps {
  // REQUIRED - validation will throw error if missing
  vibeId: string;
  children: React.ReactNode;
  existingUserRatings: CurrentUserRating[]; // Now required (no more queries)
  emojiMetadata: Record<string, EmojiRatingMetadata>; // Now required (no more queries)

  // Pre-selected data (from emoji click)
  preSelectedEmoji?: string;
  preSelectedValue?: number;

  // Optional callbacks
  onSuccess?: (data: { emoji: string; value: number; review: string }) => void;
  onError?: (error: Error) => void;

  // UI props
  vibeTitle?: string;
  isOwner?: boolean;
  pointsReward?: number; // Points awarded for rating (default: 10)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Legacy props for backward compatibility (will be deprecated)
  existingRating?: EmojiRating | null;
  isSubmitting?: boolean;
  onSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
}

// Creative placeholder templates
const REVIEW_PLACEHOLDERS = [
  'damn why does this deserve {value} {emoji}s',
  'is it actually {value} {emoji}s tho -_-',
  'why would you only give it {value} {emoji}s',
  '100% agree {value} {emoji}s',
  `if you think it's only {value} {emoji}s think again`,
  'thinking {value} {emoji}s might be overkill. or underkill?',
  'fuckit {value} {emoji}s',
  'is it giving {value} {emoji}s?',
];

export function RateAndReviewDialog({
  children,
  vibeId,
  existingUserRatings,
  emojiMetadata,
  vibeTitle,
  preSelectedEmoji,
  preSelectedValue,
  onSuccess,
  onError,
  open: controlledOpen,
  onOpenChange,
  isOwner = false,
  pointsReward = 10,
  // Legacy props for backward compatibility
  existingRating,
  isSubmitting: legacyIsSubmitting = false,
  onSubmit: legacyOnSubmit,
}: RateAndReviewDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Determine the open state first
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  // Internal mutations only (no queries)
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();

  // Use emoji metadata passed from parent (no processing needed)
  const emojiMetadataRecord = emojiMetadata;

  // Use user ratings passed from parent (no queries needed)
  const userRatings = existingUserRatings;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  const form = useForm<RatingFormData>({
    defaultValues: {
      emoji: preSelectedEmoji || existingRating?.emoji || '',
      value: preSelectedValue || existingRating?.value || 3,
      review: '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit: formHandleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting: formIsSubmitting },
    setError: setFormError,
    clearErrors,
  } = form;

  const selectedEmoji = watch('emoji');
  const selectedRatingValue = watch('value');
  const review = watch('review');

  // Safety check: ensure selectedEmoji is always a string
  const safeSelectedEmoji =
    typeof selectedEmoji === 'string' ? selectedEmoji : '';

  // Find existing rating based on currently selected emoji (not pre-selected)
  const currentExistingRating = React.useMemo(() => {
    // Always prioritize the currently selected emoji from the form
    if (safeSelectedEmoji) {
      return userRatings.find((rating) => rating.emoji === safeSelectedEmoji);
    }
    // Only use preSelectedEmoji fallback if no emoji is currently selected
    if (!safeSelectedEmoji && preSelectedEmoji) {
      return userRatings.find((rating) => rating.emoji === preSelectedEmoji);
    }
    // Final fallback to legacy existingRating
    return existingRating || undefined;
  }, [safeSelectedEmoji, userRatings, preSelectedEmoji, existingRating]);

  const [ratingValue, setRatingValue] = React.useState(preSelectedValue || 3);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [searchValue, setSearchValue] = React.useState('');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [hasSelectedRating, setHasSelectedRating] = React.useState(false);
  const [showRatingCTA, setShowRatingCTA] = React.useState(false);
  const [placeholderIndex, setPlaceholderIndex] = React.useState(
    Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
  );
  const [previousLockedValue, setPreviousLockedValue] = React.useState<
    number | null
  >(null);
  const [isLockingIn, setIsLockingIn] = React.useState(false);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingRatingData, setPendingRatingData] = React.useState<{
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  } | null>(null);

  // Emoji confirmation state (for any emoji with existing rating)
  const [showEmojiConfirm, setShowEmojiConfirm] = React.useState(false);
  const [currentEmojiExistingRating, setCurrentEmojiExistingRating] =
    React.useState<CurrentUserRating | null>(null);

  // Determine if we should use internal or legacy submission logic
  const isSubmitting =
    legacyIsSubmitting ||
    createEmojiRatingMutation.isPending ||
    formIsSubmitting;

  // Initialize emoji picker state based on current selections
  React.useEffect(() => {
    if (open) {
      const hasSelectedEmoji = safeSelectedEmoji.length > 0;

      // Show emoji picker only if no emoji is selected
      setShowEmojiPicker(!hasSelectedEmoji);
    }
  }, [open, safeSelectedEmoji]);

  // Update form values when currentExistingRating changes
  React.useEffect(() => {
    if (currentExistingRating && open) {
      if (!preSelectedEmoji && currentExistingRating.emoji) {
        setValue('emoji', currentExistingRating.emoji);
      }
      if (!preSelectedValue && currentExistingRating.value !== undefined) {
        setValue('value', currentExistingRating.value);
        setRatingValue(currentExistingRating.value);
      }
    }
  }, [
    currentExistingRating,
    preSelectedEmoji,
    preSelectedValue,
    setValue,
    open,
  ]);

  // Update when preSelectedEmoji or preSelectedValue changes
  React.useEffect(() => {
    if (open) {
      if (preSelectedEmoji) {
        // Check if this pre-selected emoji already exists in user ratings
        const existingRating = userRatings.find(
          (rating) => rating.emoji === preSelectedEmoji
        );

        if (existingRating) {
          // Show confirmation dialog for pre-selected emoji that already exists
          setCurrentEmojiExistingRating(existingRating);
          setShowEmojiConfirm(true);
          return;
        }

        setValue('emoji', preSelectedEmoji);
        setShowEmojiPicker(false);
      }
      if (preSelectedValue) {
        setValue('value', preSelectedValue);
        setRatingValue(preSelectedValue);
      }
    }
  }, [preSelectedEmoji, preSelectedValue, open, setValue, userRatings]);

  const MAX_REVIEW_LENGTH = 3000;

  const selectedEmojiMetadata = safeSelectedEmoji
    ? emojiMetadataRecord[safeSelectedEmoji] || null
    : null;

  // Get dynamic placeholder text
  const getPlaceholderText = React.useCallback(() => {
    const template = REVIEW_PLACEHOLDERS[placeholderIndex];
    const emojiString = safeSelectedEmoji || '?';
    return template
      .replace(/{value}/g, selectedRatingValue.toFixed(1))
      .replace(/{emoji}/g, emojiString);
  }, [placeholderIndex, selectedRatingValue, safeSelectedEmoji]);

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value.length > MAX_REVIEW_LENGTH) {
      return;
    }

    setValue('review', value);
    setCharacterCount(value.length);
    clearErrors('review');
  };

  const handleEmojiSelect = (emoji: string) => {
    // Check if user already has a rating with this emoji
    const existingEmojiRating = userRatings.find(
      (rating) => rating.emoji === emoji
    );

    if (existingEmojiRating) {
      // Show confirmation dialog for selected emoji that already exists
      setCurrentEmojiExistingRating(existingEmojiRating);
      setShowEmojiConfirm(true);
      setShowEmojiPicker(false); // Close emoji picker
      return;
    }

    setValue('emoji', emoji);
    setShowEmojiPicker(false);
    setSearchValue('');
    clearErrors('emoji');
    setPlaceholderIndex(Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length));
  };

  const handleFormSubmit = async (data: RatingFormData) => {
    if (!data.emoji) {
      setFormError('emoji', { message: 'please select an emoji' });
      return;
    }

    if (!data.review || data.review.trim().length === 0) {
      setFormError('review', { message: 'please write a review' });
      return;
    }

    if (data.review.length > MAX_REVIEW_LENGTH) {
      setFormError('review', {
        message: `review must be under ${MAX_REVIEW_LENGTH} characters`,
      });
      return;
    }

    // Always use automatic confirmation logic (no conditional showConfirmation prop)
    // Check if user already has a rating with this emoji
    const existingRating = userRatings.find((r) => r.emoji === data.emoji);

    if (existingRating) {
      // User is updating their existing rating - proceed directly
      await proceedWithSubmit(data);
      return;
    }

    // Check if user has any other ratings for this vibe
    const hasOtherRatings = userRatings && userRatings.length > 0;

    if (hasOtherRatings) {
      // Show confirmation dialog for adding new rating
      setPendingRatingData(data);
      setShowConfirmDialog(true);
      return;
    }

    // No existing ratings, proceed directly
    await proceedWithSubmit(data);
  };

  const proceedWithSubmit = async (data: RatingFormData) => {
    try {
      const submissionData = {
        emoji: data.emoji,
        value: data.value,
        review: data.review.trim(),
        tags: selectedEmojiMetadata?.tags,
      };

      // Use legacy submission if provided, otherwise use internal logic
      if (legacyOnSubmit) {
        await legacyOnSubmit(submissionData);
      } else {
        // Internal submission logic
        const result = await createEmojiRatingMutation.mutateAsync({
          vibeId,
          emoji: data.emoji,
          value: data.value,
          review: data.review.trim(),
        });

        // Check if the submission was actually successful
        if (
          result === false ||
          (typeof result === 'object' && result?.success === false)
        ) {
          toast.info(
            'rating not changed - this is the same as your existing rating',
            {
              duration: 3000,
              icon: '📝',
            }
          );
          return;
        }
      }

      // Call success callback if provided
      onSuccess?.(submissionData);

      setOpen(false);

      // Success toast 1: User rated the vibe
      const ratingText = `${data.value.toFixed(1)} ${data.emoji}${data.value !== 1 ? 's' : ''}`;
      toast.success(
        vibeTitle
          ? `rated "${vibeTitle}" ${ratingText}`
          : `rated vibe ${ratingText}`,
        {
          duration: 4000,
          icon: data.emoji,
        }
      );

      // Success toast 2: Standardized points reward (slight delay for better UX)
      setTimeout(() => {
        showPointsToast('earned', pointsReward, 'reviewing a vibe', {
          duration: 3000,
        });
      }, 1000);

      // Reset form
      setValue('emoji', '');
      setValue('value', 3);
      setValue('review', '');
      setRatingValue(3);
      setCharacterCount(0);
      setShowEmojiPicker(true);
    } catch (error) {
      // Call error callback if provided
      onError?.(error instanceof Error ? error : new Error(String(error)));

      // Check if this is a validation error for redundant rating
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes('already rated') ||
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('redundant')
      ) {
        toast.info("you've already submitted this exact rating", {
          duration: 4000,
          icon: '📝',
        });
        return;
      }

      setFormError('root', {
        message: 'Failed to submit rating. Please try again.',
      });
      console.error('Emoji rating submission error:', error);
    }
  };

  // Confirmation dialog handlers
  const handleConfirmNewRating = async () => {
    if (pendingRatingData) {
      await proceedWithSubmit(pendingRatingData);
      setPendingRatingData(null);
    }
    setShowConfirmDialog(false);
  };

  const handleUpdateExisting = () => {
    setShowConfirmDialog(false);
    setPendingRatingData(null);
  };

  // Emoji confirmation handlers
  const handleUpdateExistingEmojiRating = () => {
    // Use the emoji from the current confirmation dialog (the one user selected)
    const emojiToUse = currentEmojiExistingRating?.emoji;

    if (emojiToUse) {
      setValue('emoji', emojiToUse);
      setShowEmojiPicker(false);
    }
    // Use the existing rating's value and update the rating value state
    if (currentEmojiExistingRating?.value !== undefined) {
      setValue('value', currentEmojiExistingRating.value);
      setRatingValue(currentEmojiExistingRating.value);
    }
    setShowEmojiConfirm(false);
    setCurrentEmojiExistingRating(null);
  };

  const handleChangeEmoji = () => {
    setValue('emoji', '');
    setValue('review', '');
    setRatingValue(3);
    setCharacterCount(0);
    setShowEmojiPicker(true);
    setShowEmojiConfirm(false);
    setCurrentEmojiExistingRating(null);
    setSearchValue('');
    clearErrors();
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent opening if user is owner
    if (newOpen && isOwner) {
      toast.error('you cannot rate your own vibe', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      clearErrors();
      setShowEmojiPicker(true);
      setHasSelectedRating(false);
      setShowRatingCTA(false);
      setShowEmojiConfirm(false);
      setCurrentEmojiExistingRating(null);
    } else {
      setPlaceholderIndex(
        Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
      );
    }
  };

  // Shared form content
  const formContent = (
    <Form {...form}>
      <form
        id="rating-form"
        onSubmit={formHandleSubmit(handleFormSubmit)}
        className={cn('flex w-full flex-col space-y-8 p-4')}
      >
        <Dialog
          open={showEmojiPicker && open}
          onOpenChange={setShowEmojiPicker}
        >
          <DialogContent showCloseButton={false}>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="m-auto flex w-full justify-between">
                <p className="text-muted-foreground text-left text-sm">
                  select an emoji
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEmojiPicker(false);
                  }}
                  className="h-6"
                >
                  back
                </Button>
              </div>
              <EmojiSearchCommand
                searchValue={searchValue}
                open={true}
                onSearchChange={setSearchValue}
                onSelect={handleEmojiSelect}
                showCategories={true}
                pageSize={200}
                perLine={isMobile ? 9 : 7}
                className="pointer-events-auto h-full max-h-[80vh] w-full"
                data-testid="emoji-search-command"
                expandButtonVariant="none"
              />
              <div className="text-muted-foreground inline text-xs">
                <span>{getPlaceholderText()}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex flex-col justify-center space-y-4">
          <div className="relative flex flex-col items-center space-y-8">
            <div className="flex w-fit flex-col items-center justify-center gap-2">
              <div className="flex w-full items-center justify-between">
                <Label className="text-base">your rating</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEmojiPicker(true);
                  }}
                >
                  change emoji
                </Button>
              </div>
              <div
                className="relative flex flex-col items-center justify-center gap-3 py-4"
                data-rating-container
              >
                <div
                  className={cn(
                    'bg-theme-primary/10 shadow-theme-primary/10 flex items-center justify-between gap-4 rounded-3xl px-5 py-4 shadow-lg transition-all duration-300',
                    hasSelectedRating &&
                      'animate-pulse-scale bg-theme-primary/20 shadow-theme-primary/30 shadow-3xl',
                    isMouseDown &&
                      'bg-theme-primary/15 shadow-theme-secondary/20 shadow-2xl'
                  )}
                >
                  <button
                    data-mouse-down={isMouseDown ? 'true' : 'false'}
                    className="flex items-center font-sans text-[5.5rem] leading-none opacity-[0.99] drop-shadow-lg transition-transform duration-4000"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEmojiPicker(true);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setShowEmojiPicker(true);
                    }}
                    style={
                      isMouseDown
                        ? {
                            animation: 'shimmy 1.0s ease-in-out infinite',
                          }
                        : hasSelectedRating
                          ? {
                              animation: 'bounce 1s ease-in-out 1',
                            }
                          : undefined
                    }
                  >
                    <span>{safeSelectedEmoji}</span>
                  </button>
                  <div
                    data-mouse-down={isMouseDown ? 'true' : 'false'}
                    className={cn(
                      'font-doto text-primary text-7xl',
                      hasSelectedRating &&
                        'drop-shadow-[0_0_20px_var(--theme-primary)]',
                      isMouseDown &&
                        'drop-shadow-[0_0_30px_var(--theme-secondary)]'
                    )}
                    style={{
                      textShadow: isMouseDown
                        ? '0 0 20px var(--theme-secondary), 0 2px 4px rgba(0,0,0,0.2)'
                        : '0 0 10px var(--theme-primary), 0 2px 4px rgba(0,0,0,0.2)',
                      perspective: '300px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <FlipClockDigit
                      value={ratingValue.toFixed(1)}
                      className="inline-block"
                      onLockIn={isLockingIn}
                      previousLockedValue={
                        previousLockedValue?.toFixed(1) || '0.0'
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Rating CTA */}
              {showRatingCTA && (
                <div className="animate-fade-in-down pointer-events-none absolute top-9">
                  <div className="relative">
                    <div className="from-theme-primary to-theme-secondary rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white shadow-lg">
                      <span className="drop-shadow-sm">rating locked in!</span>
                      <span className="ml-1.5 inline-block animate-pulse">
                        ✨
                      </span>
                    </div>
                    <div className="text-theme-secondary absolute -top-1 -left-1 animate-ping">
                      ✦
                    </div>
                    <div className="animation-delay-200 text-theme-primary absolute -right-1 -bottom-1 animate-ping">
                      ✦
                    </div>
                    <div className="animation-delay-400 text-theme-secondary absolute top-0 right-2 animate-ping">
                      ✦
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 font-[500]">
                {safeSelectedEmoji ? (
                  <div
                    onMouseLeave={() => setRatingValue(selectedRatingValue)}
                    role="group"
                    className="w-full text-left focus:outline-none"
                    aria-label="Emoji rating scale"
                  >
                    <RatingScale
                      emoji={safeSelectedEmoji}
                      value={selectedRatingValue}
                      onChange={setRatingValue}
                      onClick={(value) => {
                        setPreviousLockedValue(selectedRatingValue);

                        setValue('value', value);
                        setHasSelectedRating(true);
                        setShowRatingCTA(true);

                        setIsLockingIn(true);
                        setTimeout(() => {
                          setIsLockingIn(false);
                        }, 250);

                        setPlaceholderIndex(
                          Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
                        );

                        const container = document.querySelector(
                          '[data-rating-container]'
                        );
                        if (container) {
                          container.classList.add('animate-pulse-scale');
                          setTimeout(() => {
                            container.classList.remove('animate-pulse-scale');
                          }, 500);
                        }

                        setTimeout(() => {
                          setShowRatingCTA(false);
                        }, 2500);

                        setTimeout(() => {
                          setHasSelectedRating(false);
                        }, 500);
                      }}
                      size="lg"
                      showTooltip={false}
                      onPointerDown={() => setIsMouseDown(true)}
                      onPointerUp={() => {
                        setIsMouseDown(false);
                        setIsLockingIn(true);
                        setTimeout(() => {
                          setIsLockingIn(false);
                        }, 250);
                      }}
                      mobileSlider={true}
                      maintainValueOnLeave={true}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    please select an emoji first
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedRatingValue.toFixed(1)} out of 5
              </p>
            </div>
            {selectedEmojiMetadata?.tags && (
              <div className="flex flex-wrap gap-1">
                {selectedEmojiMetadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review" className="text-base">
              your review
              <span className="text-muted-foreground ml-1 font-normal">
                (required)
              </span>
            </Label>
            <Textarea
              id="review"
              value={review}
              onChange={handleReviewChange}
              placeholder={getPlaceholderText()}
              rows={4}
              maxLength={MAX_REVIEW_LENGTH}
              className={cn(
                'resize-none',
                errors.review &&
                  'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!errors.review}
              aria-describedby={errors.review ? 'review-error' : undefined}
            />
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs">
                {characterCount} / {MAX_REVIEW_LENGTH.toLocaleString()}{' '}
                characters
              </div>
              {(errors.review || errors.root) && (
                <p id="review-error" className="text-destructive text-xs">
                  {errors.review?.message || errors.root?.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={cn('flex gap-2 border-t', 'pt-3')}>
          <Button
            type="submit"
            form="rating-form"
            disabled={
              isSubmitting ||
              !safeSelectedEmoji ||
              review.length === 0 ||
              showEmojiPicker
            }
            className="h-10 flex-1"
            onClick={() => {
              const form = document.getElementById(
                'rating-form'
              ) as HTMLFormElement;
              if (form && !isSubmitting) {
                if (form.requestSubmit) {
                  form.requestSubmit();
                } else {
                  form.dispatchEvent(
                    new Event('submit', { bubbles: true, cancelable: true })
                  );
                }
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Circle className="mr-2 h-4 w-4 animate-spin" />
                {currentExistingRating ? 'updating...' : 'submitting...'}
              </>
            ) : currentExistingRating ? (
              'update rating'
            ) : (
              'submit rating'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  const existingEmojis = userRatings?.map((r) => r.emoji) || [];
  const existingEmojisDisplay = existingEmojis.join(' ');

  if (isMobile) {
    return (
      <>
        <Drawer
          open={open}
          onOpenChange={handleOpenChange}
          shouldScaleBackground
        >
          <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
            {children}
          </DrawerTrigger>
          <DrawerContent
            className={cn('bg-background/90 min-h-[92vh] backdrop-blur')}
            onWheel={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
          >
            <DrawerHeader className="relative p-4 pb-0">
              <DrawerTitle className="flex items-center justify-between">
                {currentExistingRating
                  ? 'update your rating'
                  : 'rate this vibe'}
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground text-left font-semibold">
                {currentExistingRating ? (
                  <div className="space-y-1">
                    <p>
                      you previously rated this with{' '}
                      {currentExistingRating.emoji} (
                      {currentExistingRating.value.toFixed(1)}/5)
                    </p>
                    <p className="text-xs">
                      continuing will update your existing review
                    </p>
                  </div>
                ) : vibeTitle ? (
                  `"${vibeTitle}"`
                ) : (
                  'Share your thoughts with an emoji rating and review'
                )}
              </DrawerDescription>
              <Separator className="border-0.5, mt-4 w-full" />
            </DrawerHeader>
            <ScrollArea className="max-h-[92vh] overflow-y-auto">
              {formContent}
            </ScrollArea>
          </DrawerContent>
        </Drawer>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>you've already rated this vibe</DialogTitle>
              <DialogDescription className="space-y-3">
                <p>
                  you've already rated this vibe with:{' '}
                  <span className="text-2xl">{existingEmojisDisplay}</span>
                </p>
                <p>you can either:</p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>
                    submit a new review with {pendingRatingData?.emoji}{' '}
                    (recommended)
                  </li>
                  <li>update one of your existing reviews</li>
                </ul>
                <p className="text-muted-foreground text-xs">
                  having multiple emoji ratings helps show the complexity of
                  this vibe!
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleUpdateExisting}>
                update existing
              </Button>
              <Button onClick={handleConfirmNewRating}>
                add new {pendingRatingData?.emoji} rating
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Emoji Confirmation Dialog */}
        <Dialog open={showEmojiConfirm} onOpenChange={setShowEmojiConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>you've already rated with this emoji</DialogTitle>
              <DialogDescription className="space-y-3">
                <p>
                  you previously rated this vibe with{' '}
                  <span className="text-2xl">
                    {currentEmojiExistingRating?.emoji}
                  </span>{' '}
                  ({currentEmojiExistingRating?.value.toFixed(1)}/5)
                </p>
                <p>you can either:</p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>
                    update your existing {currentEmojiExistingRating?.emoji}{' '}
                    rating
                  </li>
                  <li>choose a different emoji to rate with</li>
                </ul>
                <p className="text-muted-foreground text-xs">
                  updating will replace your previous review for this emoji
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleChangeEmoji}>
                choose different emoji
              </Button>
              <Button onClick={handleUpdateExistingEmojiRating}>
                update existing {currentEmojiExistingRating?.emoji} rating
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          {children}
        </DialogTrigger>
        <DialogContent
          className="bg-background/95 border-border max-h-[90vh] w-94 gap-0 overflow-y-auto border backdrop-blur-md duration-300 data-[state=closed]:translate-y-[calc(-50%_+2rem)]"
          showCloseButton={false}
          data-testid="dialog-content"
          shouldScaleBackground
          scaleFactor={0.5}
          scaleOffset={'5px'}
          onWheel={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            const target = e.target as Element;
            if (target?.closest('#rating-form')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="p-4 pb-0 text-center">
            <DialogTitle className="flex items-center justify-between">
              {currentExistingRating ? 'update your rating' : 'rate this vibe'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-semibold">
              {currentExistingRating ? (
                <div className="space-y-1 text-center">
                  <p>
                    you previously rated this with {currentExistingRating.emoji}{' '}
                    ({currentExistingRating.value.toFixed(1)}/5)
                  </p>
                  <p className="text-xs">
                    continuing will update your existing review
                  </p>
                </div>
              ) : vibeTitle ? (
                `"${vibeTitle}"`
              ) : (
                'Share your thoughts with an emoji rating and review'
              )}
            </DialogDescription>
            <Separator className="border-0.5, mt-4 w-full" />
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>you've already rated this vibe</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                you've already rated this vibe with:{' '}
                <span className="text-2xl">{existingEmojisDisplay}</span>
              </p>
              <p>you can either:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  submit a new review with {pendingRatingData?.emoji}{' '}
                  (recommended)
                </li>
                <li>update one of your existing reviews</li>
              </ul>
              <p className="text-muted-foreground text-xs">
                having multiple emoji ratings helps show the complexity of this
                vibe!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleUpdateExisting}>
              update existing
            </Button>
            <Button onClick={handleConfirmNewRating}>
              add new {pendingRatingData?.emoji} rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Confirmation Dialog */}
      <Dialog open={showEmojiConfirm} onOpenChange={setShowEmojiConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>you've already rated with this emoji</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                you previously rated this vibe with{' '}
                <span className="text-2xl">
                  {currentEmojiExistingRating?.emoji}
                </span>{' '}
                ({currentEmojiExistingRating?.value.toFixed(1)}/5)
              </p>
              <p>you can either:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  update your existing {currentEmojiExistingRating?.emoji}{' '}
                  rating
                </li>
                <li>choose a different emoji to rate with</li>
              </ul>
              <p className="text-muted-foreground text-xs">
                updating will replace your previous review for this emoji
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleChangeEmoji}>
              choose different emoji
            </Button>
            <Button onClick={handleUpdateExistingEmojiRating}>
              update existing {currentEmojiExistingRating?.emoji} rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
