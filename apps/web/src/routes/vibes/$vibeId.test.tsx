/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import VibePage from './$vibeId';

// Mock Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({ user: { id: 'test-user' } }),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  reactions: [],
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

vi.mock('@/queries', () => ({
  useVibe: () => ({ data: mockVibe, isLoading: false, error: null }),
  useVibesPaginated: () => ({ data: { vibes: [] }, isLoading: false }),
  useAddRatingMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useReactToVibeMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
  useCreateEmojiRatingMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
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
        screen.getByText('originally vibed by Test User')
      ).toBeInTheDocument();
    });
  });

  it('allows quick rating without review', async () => {
    const { useAddRatingMutation } = await import('@/queries');
    const mockMutate = vi.fn().mockResolvedValue({});
    (useAddRatingMutation as any).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    renderWithRouter(<VibePage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('rate & review this vibe')).toBeInTheDocument();
    });

    // Find and click the 4-star quick rating button
    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('.lucide-star'));

    await user.click(starButtons[3]); // Click 4th star

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        vibeId: 'test-vibe-1',
        rating: 4,
      });
    });
  });

  it('opens rating popover when clicking Rate & Review', async () => {
    renderWithRouter(<VibePage />);

    await waitFor(() => {
      expect(screen.getByText('rate & review this vibe')).toBeInTheDocument();
    });

    // Click the emoji rate & review button
    const rateButton = screen.getByRole('button', {
      name: /😍 Rate & Review/i,
    });
    await user.click(rateButton);

    // Should open emoji rating popover
    await waitFor(() => {
      expect(
        screen.getByText(/Rate "Test Vibe" with emoji/i)
      ).toBeInTheDocument();
      expect(screen.getByText('1. Choose an emoji')).toBeInTheDocument();
      expect(screen.getByText('2. Select rating (1-5)')).toBeInTheDocument();
      expect(screen.getByText('3. Write your review')).toBeInTheDocument();
    });
  });

  it('completes full emoji rating flow', async () => {
    const { useCreateEmojiRatingMutation } = await import('@/queries');
    const mockMutate = vi.fn().mockResolvedValue({});
    (useCreateEmojiRatingMutation as any).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    renderWithRouter(<VibePage />);

    // Open emoji rating popover
    const rateButton = screen.getByRole('button', {
      name: /😍 Rate & Review/i,
    });
    await user.click(rateButton);

    // Select emoji
    await waitFor(() => {
      const fireEmoji = screen.getByText('🔥');
      expect(fireEmoji).toBeInTheDocument();
    });

    const emojiButton = screen.getByText('🔥').closest('button');
    if (emojiButton) await user.click(emojiButton);

    // Select rating value
    await waitFor(() => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter((btn) =>
          ['1', '2', '3', '4', '5'].includes(btn.textContent || '')
        );
      expect(ratingButtons).toHaveLength(5);
    });

    const rating5Button = screen.getByRole('button', { name: '5' });
    await user.click(rating5Button);

    // Write review
    const reviewTextarea = screen.getByPlaceholderText(/Share your thoughts/i);
    await user.type(
      reviewTextarea,
      'This vibe is absolutely fire! Amazing content that exceeded my expectations.'
    );

    // Submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        vibeId: 'test-vibe-1',
        emoji: '🔥',
        value: 5,
        review:
          'This vibe is absolutely fire! Amazing content that exceeded my expectations.',
      });
    });
  });

  it('validates review length in emoji rating', async () => {
    renderWithRouter(<VibePage />);

    // Open emoji rating popover
    const rateButton = screen.getByRole('button', {
      name: /😍 Rate & Review/i,
    });
    await user.click(rateButton);

    // Select emoji and rating
    const emojiButton = screen.getByText('😍').closest('button');
    if (emojiButton) await user.click(emojiButton);

    await waitFor(() => {
      const rating3Button = screen.getByRole('button', { name: '3' });
      expect(rating3Button).toBeInTheDocument();
    });

    const rating3Button = screen.getByRole('button', { name: '3' });
    await user.click(rating3Button);

    // Write short review
    const reviewTextarea = screen.getByPlaceholderText(/Share your thoughts/i);
    await user.type(reviewTextarea, 'Too short');

    // Try to submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    // Should show error
    await waitFor(() => {
      expect(
        screen.getByText('Review must be at least 50 characters')
      ).toBeInTheDocument();
    });
  });

  it('handles emoji reaction toggle', async () => {
    const { useReactToVibeMutation } = await import('@/queries');
    const mockMutate = vi.fn().mockResolvedValue({ added: true });
    (useReactToVibeMutation as any).mockReturnValue({
      mutateAsync: mockMutate,
    });

    renderWithRouter(<VibePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Vibe')).toBeInTheDocument();
    });

    // Find and click the emoji reactions add button
    const addReactionButton = screen.getByRole('button', {
      name: /add reaction/i,
    });
    await user.click(addReactionButton);

    // Select an emoji from the picker
    await waitFor(() => {
      const heartEmoji = screen.getByText('❤️');
      expect(heartEmoji).toBeInTheDocument();
    });

    const heartButton = screen.getByText('❤️').closest('button');
    if (heartButton) await user.click(heartButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        vibeId: 'test-vibe-1',
        emoji: '❤️',
      });
    });
  });
});
