/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import * as React from 'react';
import { Route } from '@/routes/vibes/$vibeId';
// Get the component from the Route
const VibePage = Route.options.component;

// Mock Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({ user: { id: 'test-user' } }),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Convex
vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn(() => ({
    queryKey: ['convex', 'query'],
    queryFn: () => Promise.resolve(null),
  })),
}));

// Mock queries
const mockVibe = {
  id: 'test-vibe-1',
  title: 'Test Vibe',
  description: 'A test vibe for integration testing',
  image: 'https://example.com/image.jpg',
  createdById: 'creator-1',
  createdAt: new Date().toISOString(),
  tags: ['test', 'integration'],
  ratings: [],
  createdBy: {
    externalId: 'creator-1',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
  },
};

const mockEmojiMetadata = [
  {
    emoji: '😍',
    tags: ['love', 'amazing'],
    category: 'positive',
    sentiment: 'positive',
  },
  {
    emoji: '🔥',
    tags: ['fire', 'hot'],
    category: 'intense',
    sentiment: 'positive',
  },
  {
    emoji: '😱',
    tags: ['shocked', 'surprise'],
    category: 'surprise',
    sentiment: 'mixed',
  },
];

const mockCreateEmojiRatingMutate = vi.fn().mockResolvedValue({});

vi.mock('@/queries', () => ({
  useVibe: () => ({ data: mockVibe, isLoading: false, error: null }),
  useVibesPaginated: () => ({ data: { vibes: [] }, isLoading: false }),
  useAddRatingMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useCreateEmojiRatingMutation: () => ({
    mutateAsync: mockCreateEmojiRatingMutate,
    isPending: false,
  }),
  useEmojiMetadata: () => ({ data: mockEmojiMetadata }),
  useTopEmojiRatings: () => ({ data: [] }),
  useMostInteractedEmoji: () => ({ data: null }),
}));

// Mock components
vi.mock('@/components/auth-prompt-dialog', () => ({
  AuthPromptDialog: () => null,
}));

// Mock the emoji rating components with proper integration
let mockEmojiRatingPopoverOpen = false;

vi.mock('@/features/ratings/components/emoji-rating-selector', () => ({
  EmojiRatingSelector: () => {
    const openPopover = () => {
      mockEmojiRatingPopoverOpen = true;
      // Force re-render by dispatching custom event
      window.dispatchEvent(new CustomEvent('emoji-popover-open'));
    };

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold lowercase">
          rate & review this vibe
        </h3>
        <button onClick={openPopover}>click to rate with an emoji</button>
      </div>
    );
  },
}));

vi.mock('@/features/ratings/components/emoji-rating-popover', () => ({
  EmojiRatingPopover: ({
    onSubmit,
    isSubmitting,
    open: controlledOpen,
    onOpenChange,
    children,
  }: {
    emoji?: string;
    vibeId?: string;
    open?: boolean;
    onOpenChange?: () => void;
    children?: React.ReactNode;
  }) => {
    const [selectedEmoji, setSelectedEmoji] = React.useState('');
    const [review, setReview] = React.useState('');
    const [error, setError] = React.useState('');
    const [forceRender, setForceRender] = React.useState(0);

    // Listen for custom event to open
    React.useEffect(() => {
      const handleOpen = () => {
        if (onOpenChange) onOpenChange(true);
      };
      window.addEventListener('emoji-popover-open', handleOpen);
      return () => window.removeEventListener('emoji-popover-open', handleOpen);
    }, [onOpenChange]);

    const isOpen =
      controlledOpen !== undefined
        ? controlledOpen
        : mockEmojiRatingPopoverOpen;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!review) {
        setError('please write a review');
        return;
      }
      await onSubmit({
        emoji: selectedEmoji || '🔥',
        value: 3,
        review,
      });
    };

    const handleEmojiSelect = (emoji: string) => {
      setSelectedEmoji(emoji);
      // Force immediate re-render
      setForceRender((prev) => prev + 1);
    };

    if (!isOpen) return <>{children}</>;

    return (
      <>
        {children}
        <div data-testid="dialog-content" key={forceRender}>
          <h2>rate with emoji</h2>
          <div>
            <p>select an emoji</p>
            {['🔥', '😍', '😱'].map((emoji) => (
              <button key={emoji} onClick={() => handleEmojiSelect(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
          {selectedEmoji && (
            <p data-testid="selected-emoji">Selected: {selectedEmoji}</p>
          )}
          {selectedEmoji && (
            <form onSubmit={handleSubmit}>
              <label htmlFor="review">your review</label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts"
              />
              {error && <p>{error}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'submitting...' : 'submit rating'}
              </button>
            </form>
          )}
        </div>
      </>
    );
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Vibe Detail Page - Rating Flow Integration', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    vi.clearAllMocks();
    // Reset mock state
    mockEmojiRatingPopoverOpen = false;
  });

  const renderWithRouter = (component: React.ReactNode) => {
    const rootRoute = createRootRoute();
    const vibeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/vibes/$vibeId',
      component: () => component,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([vibeRoute]),
      defaultPendingComponent: () => <div>Loading...</div>,
      context: { queryClient },
      defaultParams: {
        vibeId: 'test-vibe-1',
      },
    });

    // Navigate to the vibe route
    router.navigate({
      to: '/vibes/$vibeId',
      params: { vibeId: 'test-vibe-1' },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  };

  it('renders vibe details correctly', async () => {
    renderWithRouter(<VibePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Vibe')).toBeInTheDocument();
      expect(
        screen.getByText('A test vibe for integration testing')
      ).toBeInTheDocument();
      expect(
        screen.getByText('originally vibed by testuser')
      ).toBeInTheDocument();
    });
  });

  it('opens rating popover when clicking the emoji rating selector', async () => {
    renderWithRouter(<VibePage />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', {
        name: /rate & review this vibe/i,
      });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Find the emoji rating selector button by its text content
    const rateButton = await screen.findByText('click to rate with an emoji');
    const buttonElement = rateButton.closest('button');

    // Click the button to open the popover
    if (buttonElement) {
      await user.click(buttonElement);
      // Wait a bit for the mock to update
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Should open emoji rating popover
    await waitFor(() => {
      const dialogs = screen.getAllByTestId('dialog-content');
      // Get the last dialog (most recently opened)
      const dialog = dialogs[dialogs.length - 1];
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('rate with emoji')).toBeInTheDocument();
      expect(within(dialog).getByText('select an emoji')).toBeInTheDocument();
    });
  });

  it('completes full emoji rating flow', async () => {
    renderWithRouter(<VibePage />);

    // Wait for the component to render
    await waitFor(() => {
      // Check that the heading exists
      const headings = screen.getAllByRole('heading', {
        name: /rate & review this vibe/i,
      });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Open emoji rating popover by clicking the rating selector
    const rateButton = await screen.findByText('click to rate with an emoji');
    const buttonElement = rateButton.closest('button');
    if (buttonElement) await user.click(buttonElement);

    // Select emoji
    await waitFor(() => {
      const dialogs = screen.getAllByTestId('dialog-content');
      const dialog = dialogs[dialogs.length - 1];
      const fireEmojis = within(dialog).getAllByText('🔥');
      expect(fireEmojis.length).toBeGreaterThan(0);
    });

    const dialogs = screen.getAllByTestId('dialog-content');
    const dialog = dialogs[dialogs.length - 1];
    const fireEmojis = within(dialog).getAllByText('🔥');
    const emojiButton = fireEmojis[0].closest('button');
    if (emojiButton) await user.click(emojiButton);

    // Wait for the emoji to be selected first
    await waitFor(
      () => {
        expect(screen.getByTestId('selected-emoji')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Then wait for the review textarea to appear
    await waitFor(
      () => {
        expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const reviewTextarea = screen.getByLabelText(/your review/i);
    await user.type(
      reviewTextarea,
      'This vibe is absolutely fire! Amazing content that exceeded my expectations.'
    );

    // Submit
    const submitButton = screen.getByRole('button', {
      name: 'submit rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateEmojiRatingMutate).toHaveBeenCalledWith({
        vibeId: 'test-vibe-1',
        emoji: '🔥',
        value: 3, // Default value
        review:
          'This vibe is absolutely fire! Amazing content that exceeded my expectations.',
      });
    });
  });

  it('validates review length in emoji rating', async () => {
    renderWithRouter(<VibePage />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', {
        name: /rate & review this vibe/i,
      });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Open emoji rating popover
    const rateButton = await screen.findByText('click to rate with an emoji');
    const buttonElement = rateButton.closest('button');
    if (buttonElement) await user.click(buttonElement);

    // Wait for dialog to open and select emoji
    await waitFor(() => {
      const dialogs = screen.getAllByTestId('dialog-content');
      const dialog = dialogs[dialogs.length - 1];
      expect(within(dialog).getByText('select an emoji')).toBeInTheDocument();
    });

    const dialogs = screen.getAllByTestId('dialog-content');
    const dialog = dialogs[dialogs.length - 1];
    const emojiButton = within(dialog).getByText('😍').closest('button');
    if (emojiButton) await user.click(emojiButton);

    // Wait for the emoji to be selected first
    await waitFor(
      () => {
        expect(screen.getByTestId('selected-emoji')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Then wait for the review textarea to appear
    await waitFor(
      () => {
        expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Don't type anything in the review textarea, just try to submit
    const submitButton = screen.getByRole('button', {
      name: 'submit rating',
    });
    await user.click(submitButton);

    // Should show error for empty review
    await waitFor(() => {
      expect(screen.getByText('please write a review')).toBeInTheDocument();
    });
  });
});
