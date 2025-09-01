import * as React from 'react';
import { useLocation, useRouter } from '@tanstack/react-router';
import { useUser } from '@clerk/tanstack-react-start';
import { useIsMobile } from '@/hooks/use-mobile';
import { trackEvents as _trackEvents } from '@/lib/track-events';
import type {
  Vibe,
  EmojiRatingMetadata,
  CurrentUserRating,
} from '@vibechecc/types';
import type { RatingDisplayMode } from '@/components/vibe-category-row';

// Layout components
import { DefaultLayout } from './layouts/default-layout';
import { SearchResultLayout } from './layouts/search-result-layout';
import { ListLayout } from './layouts/list-layout';
import { MobileStoryLayout } from './layouts/mobile-story-layout';
import { MobileSquareLayout } from './layouts/mobile-square-layout';

type VibeCardVariant =
  | 'default'
  | 'compact'
  | 'feed-grid'
  | 'feed-masonry'
  | 'feed-single'
  | 'list'
  | 'search-result'
  | 'search-default'
  | 'mobile-story'
  | 'mobile-square'
  | 'mobile-optimized';

interface VibeCardV2Props {
  vibe?: Vibe;
  variant?: VibeCardVariant;
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
  delay?: number;
  loading?: boolean;
  error?: Error;
  enableFadeIn?: boolean;
  optimizeForTouch?: boolean;
  // Data props to avoid N+1 queries
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  currentUserRatings?: CurrentUserRating[];
  onEmojiRating?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  // Legacy props for backward compatibility
  compact?: boolean;
  layout?: 'masonry' | 'grid' | 'single';
}

export interface VibeCardSharedProps {
  vibe: Vibe;
  variant: VibeCardVariant;
  className?: string;
  loading?: boolean;
  enableFadeIn?: boolean;
  optimizeForTouch?: boolean;
  delay?: number;

  // Computed data
  imageUrl?: string;
  isImageLoading: boolean;
  imageError: boolean;
  usePlaceholder: boolean;
  isMobile: boolean;
  isVisible: boolean;

  // Rating data (passed from parent)
  primaryEmojiRating: {
    emoji: string;
    value: number;
    count: number;
  } | null;
  emojiRatings: Array<{
    emoji: string;
    value: number;
    count: number;
    tags: string[];
  }>;
  emojiReactions: Array<{
    emoji: string;
    count: number;
    users: never[];
  }>;
  emojiMetadataRecord: Record<string, EmojiRatingMetadata>;
  currentUserRatings: CurrentUserRating[];
  isRatingsLoading?: boolean;

  // State
  isExpanded: boolean;
  hasBeenClicked: boolean;
  showRatingDialog: boolean;
  showAuthDialog: boolean;
  selectedEmojiForRating: string | null;
  preselectedRatingValue: number | null;

  // Callbacks
  handleCardClick: (e: React.MouseEvent) => void;
  handleEmojiRating: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  handleEmojiRatingClick: (emoji: string, value?: number) => void;
  handleQuickReact: (emoji: string) => Promise<void>;
  setImageError: (error: boolean) => void;
  setShowRatingDialog: (show: boolean) => void;
  setShowAuthDialog: (show: boolean) => void;
  setSelectedEmojiForRating: (emoji: string | null) => void;
  setPreselectedRatingValue: (value: number | null) => void;
}

export function VibeCardV2({
  vibe,
  variant = 'default',
  ratingDisplayMode = 'most-rated',
  className,
  delay = 0,
  loading = false,
  error,
  enableFadeIn = false,
  optimizeForTouch = false,
  emojiMetadata = {},
  currentUserRatings,
  onEmojiRating,
  // Legacy prop support
  compact,
  layout,
}: VibeCardV2Props) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const router = useRouter();
  const { user } = useUser();

  // Use resolved image URL from vibe data (no query needed)
  const imageUrl = vibe?.resolvedImageUrl || vibe?.image;
  const isImageLoading = loading;

  // Extract feed type from URL for analytics
  const _feedType = React.useMemo(() => {
    const path = location.pathname.split('/');
    if (path[1] === 'feed' && path[2]) {
      return path[2];
    }
    return undefined;
  }, [location.pathname]);

  // Determine final variant with legacy support
  const finalVariant = React.useMemo(() => {
    // Auto-select mobile variants when on mobile and no specific variant is set
    if (variant === 'default' && isMobile) {
      return 'mobile-optimized';
    }

    // If new variant prop is provided, use it
    if (variant !== 'default') return variant;

    // Handle legacy props
    if (compact) return 'compact';
    if (layout === 'masonry') return 'feed-masonry';
    if (layout === 'grid') return 'feed-grid';
    if (layout === 'single') return 'feed-single';

    return 'default';
  }, [variant, compact, layout, isMobile]);

  // Component state
  const [imageError, setImageError] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showRatingDialog, setShowRatingDialog] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(!enableFadeIn);

  // Card expansion state
  // Removed expand behavior

  // Fade-in animation effect
  React.useEffect(() => {
    if (enableFadeIn && delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [enableFadeIn, delay]);

  // Use data from vibe object (no queries needed)
  // Transform backend emojiRatings to frontend format
  const topEmojiRatings = React.useMemo(() => {
    if (!vibe?.emojiRatings) return [];

    // Backend returns GroupedEmojiRating[], transform to expected format
    return vibe.emojiRatings.map((rating) => ({
      emoji: rating.emoji,
      averageValue: rating.averageValue,
      count: rating.count,
      tags: [], // Backend doesn't include tags in GroupedEmojiRating
      category: undefined,
      sentiment: undefined,
    }));
  }, [vibe?.emojiRatings]);

  const mostInteractedEmojiData = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) return null;

    // Find the emoji with the highest count (most interactions)
    const mostInteracted = topEmojiRatings.reduce((max, current) =>
      current.count > max.count ? current : max
    );

    return {
      emoji: mostInteracted.emoji,
      value: mostInteracted.averageValue,
      count: mostInteracted.count,
    };
  }, [topEmojiRatings]);

  // Computed values
  const usePlaceholder = !imageUrl || imageError || isImageLoading;

  // Transform emoji ratings
  const emojiRatings = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    return topEmojiRatings.map((rating) => ({
      emoji: rating.emoji,
      value: rating.averageValue,
      count: rating.count,
      tags: rating.tags,
    }));
  }, [topEmojiRatings]);

  // Primary emoji rating based on display mode
  const primaryEmojiRating = React.useMemo(() => {
    if (
      ratingDisplayMode === 'top-rated' &&
      topEmojiRatings &&
      topEmojiRatings.length > 0
    ) {
      const topRated = topEmojiRatings.reduce((max, current) =>
        current.averageValue > max.averageValue ? current : max
      );
      return {
        emoji: topRated.emoji,
        value: topRated.averageValue,
        count: topRated.count,
      };
    } else if (mostInteractedEmojiData) {
      return {
        emoji: mostInteractedEmojiData.emoji,
        value: mostInteractedEmojiData.value,
        count: mostInteractedEmojiData.count,
      };
    }
    return null;
  }, [ratingDisplayMode, topEmojiRatings, mostInteractedEmojiData]);

  // Transform emoji ratings to reaction format
  const emojiReactions = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    // Determine max reactions based on variant
    const maxReactions = (() => {
      switch (finalVariant) {
        case 'compact':
          return 6;
        case 'feed-masonry':
        case 'feed-single':
          return 12;
        case 'feed-grid':
          return 8;
        case 'mobile-story':
        case 'mobile-square':
        case 'mobile-optimized':
          return 8;
        default:
          return 10;
      }
    })();

    return topEmojiRatings
      .slice(0, maxReactions)
      .map((rating: { emoji: string; count: number }) => ({
        emoji: rating.emoji,
        count: rating.count,
        users: [], // We don't track individual users in the new system
      }));
  }, [topEmojiRatings, finalVariant]);

  // Use emoji metadata passed from parent (no query needed)
  const emojiMetadataRecord: Record<string, EmojiRatingMetadata> =
    emojiMetadata;

  // Removed saveExpansionState

  // Handle card click - no navigation
  const handleCardClick = React.useCallback(
    (e: React.MouseEvent) => {
      console.log('handleCardClick called:', {
        vibeId: vibe?.id,
        target: (e.target as HTMLElement).tagName,
        currentTarget: (e.currentTarget as HTMLElement).tagName,
      });

      if (!vibe?.id) {
        console.log('No vibe ID, returning');
        return;
      }

      // Check if this click is from a drawer/dialog overlay closing event
      const target = e.target as HTMLElement;

      // Check if we're inside a dragging tabs container or in drag cooldown
      // Only check for tabs containers that are actually related to this vibe card
      // Skip this check on mobile to ensure navigation works
      const tabsDraggableContainer = target.closest(
        '[data-tabs-draggable-container]'
      );
      if (tabsDraggableContainer && !isMobile) {
        // Only prevent navigation if the tabs container is actually dragging AND
        // it contains the vibe card (not just header tabs)
        const isDragging =
          tabsDraggableContainer.getAttribute('data-is-dragging') === 'true';
        const isInCooldown =
          tabsDraggableContainer.getAttribute('data-drag-cooldown') === 'true';
        const vibeCardElement = target.closest('[data-vibe-card]');

        // Only block if tabs are dragging/cooldown AND the vibe card is inside the tabs container
        if (
          (isDragging || isInCooldown) &&
          vibeCardElement &&
          tabsDraggableContainer.contains(vibeCardElement)
        ) {
          console.log('Navigation blocked by dragging tabs');
          return;
        }
      }

      const isFromDrawerOverlay = target.closest(
        '[data-slot="drawer-overlay"]'
      );
      const isFromDrawerContent = target.closest(
        '[data-slot="drawer-content"], [data-vaul-drawer]'
      );

      // Don't navigate if the click came from closing a drawer/dialog overlay
      if (isFromDrawerOverlay && !isFromDrawerContent) {
        console.log('Navigation blocked by drawer overlay');
        return;
      }

      // If this is from drawer content (like emoji picker), it shouldn't be navigating at all
      if (isFromDrawerContent) {
        console.log('Navigation blocked by drawer content');
        return;
      }

      console.log('Navigating to vibe:', vibe.id);
      router.navigate({
        to: '/vibes/$vibeId',
        params: { vibeId: vibe.id },
      });
    },
    [router, vibe?.id]
  );

  // Handle emoji rating click
  const handleEmojiRatingClick = (emoji: string, value?: number) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }

    setSelectedEmojiForRating(emoji);

    if (value !== undefined) {
      setPreselectedRatingValue(value);
    }

    setShowRatingDialog(true);
  };

  // Handle quick react
  const handleQuickReact = async (emoji: string) => {
    // Always open the emoji rating popover instead of quick reacting
    handleEmojiRatingClick(emoji, undefined);
  };

  // Handle emoji rating submission
  const handleEmojiRating = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    if (!vibe || !onEmojiRating) return;

    await onEmojiRating(data);
  };

  // Prepare shared props for layout components
  const sharedProps: VibeCardSharedProps = {
    vibe: vibe!,
    variant: finalVariant,
    className,
    loading: loading || false,
    enableFadeIn,
    optimizeForTouch,
    delay,

    // Computed data
    imageUrl: imageUrl ?? undefined,
    isImageLoading,
    imageError,
    usePlaceholder,
    isMobile,
    isVisible,

    // Rating data
    primaryEmojiRating,
    emojiRatings,
    emojiReactions,
    emojiMetadataRecord,
    currentUserRatings: currentUserRatings || vibe?.currentUserRatings || [],
    isRatingsLoading: false, // Data is already loaded from query

    // State
    isExpanded: false,
    hasBeenClicked: false,
    showRatingDialog,
    showAuthDialog,
    selectedEmojiForRating,
    preselectedRatingValue,

    // Callbacks
    handleCardClick,
    handleEmojiRating,
    handleEmojiRatingClick,
    handleQuickReact,
    setImageError,
    setShowRatingDialog,
    setShowAuthDialog,
    setSelectedEmojiForRating,
    setPreselectedRatingValue,
  };

  // Return early for loading state without vibe
  if (loading) {
    return getLayoutComponent(finalVariant, {
      ...sharedProps,
      loading: true,
    } as VibeCardSharedProps);
  }

  // Return early if error (parent should handle error display)
  if (error) return null;

  // Return early if no vibe
  if (!vibe) return null;

  // Render appropriate layout component
  return getLayoutComponent(finalVariant, sharedProps);
}

// Layout component selector
function getLayoutComponent(
  variant: VibeCardVariant,
  props: VibeCardSharedProps
) {
  switch (variant) {
    case 'search-result':
      return <SearchResultLayout {...props} />;
    case 'search-default':
      return <DefaultLayout {...props} />;
    case 'list':
      return <ListLayout {...props} />;
    case 'mobile-story':
      return <MobileStoryLayout {...props} />;
    case 'mobile-square':
      return <MobileSquareLayout {...props} />;
    default:
      return <DefaultLayout {...props} />;
  }
}

// Legacy export for backward compatibility
export interface FeedVibeCardProps {
  vibe: Vibe;
  layout?: 'masonry' | 'grid' | 'single';
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
}

export function FeedVibeCardV2(props: FeedVibeCardProps) {
  return <VibeCardV2 {...props} />;
}
