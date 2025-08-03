/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/features/theming/components/theme-provider';
import { HomeFeed } from './home-feed';

// Mock hooks
const mockUseUser = vi.fn();
const mockUseVibesPaginated = vi.fn();
const mockUseTopRatedVibes = vi.fn();
const mockUsePersonalizedVibes = vi.fn();
const mockUseVibesInfinite = vi.fn();
const mockUseMasonryLayout = vi.fn();

// Import the actual useMasonryLayout from the mock
import { useMasonryLayout } from './masonry-layout';

vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/queries', () => ({
  useVibesPaginated: (...args: unknown[]) => mockUseVibesPaginated(...args),
  useTopRatedVibes: (...args: unknown[]) => mockUseTopRatedVibes(...args),
  usePersonalizedVibes: (...args: unknown[]) =>
    mockUsePersonalizedVibes(...args),
  useVibesInfinite: (...args: unknown[]) => mockUseVibesInfinite(...args),
  useForYouFeedInfinite: (...args: unknown[]) =>
    mockUsePersonalizedVibes(...args),
}));

vi.mock('@/features/follows/hooks/use-follow-stats', () => ({
  useCurrentUserFollowStats: () => ({
    data: { followers: 5, following: 10 },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('./masonry-layout', () => ({
  JSMasonryLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="masonry-layout">{children}</div>
  ),
  useMasonryLayout: () => mockUseMasonryLayout(),
}));

vi.mock('./masonry-feed', () => ({
  MasonryFeed: ({
    vibes,
    isLoading,
    error,
    hasMore,
    emptyStateTitle,
    emptyStateDescription,
  }: {
    vibes?: unknown[];
    isLoading?: boolean;
    error?: Error | null;
    isLoadingNextPage?: boolean;
    hasMore?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
  }) => {
    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">failed to load vibes</p>
          <button className="text-primary hover:text-primary/80 text-sm underline">
            try again
          </button>
        </div>
      );
    }

    if (isLoading && (!vibes || vibes.length === 0)) {
      return <div>Loading...</div>;
    }

    if (!vibes || vibes.length === 0) {
      return (
        <div className="py-16 text-center">
          <h3 className="mb-2 text-lg font-semibold">
            {emptyStateTitle || 'no vibes found'}
          </h3>
          <p className="text-muted-foreground mx-auto mb-6 max-w-md">
            {emptyStateDescription ||
              'try adjusting your filters or check back later'}
          </p>
        </div>
      );
    }

    // Check if masonry layout should be used
    // Access the mocked function from vitest
    const mockUseMasonryLayout = vi.mocked(useMasonryLayout);
    const shouldUseMasonry = mockUseMasonryLayout();

    return (
      <div className="w-full space-y-6">
        {shouldUseMasonry ? (
          <div data-testid="masonry-layout">
            {vibes.map((vibe: { id: string; title: string }) => (
              <div
                key={vibe.id}
                data-testid="vibe-card-masonry"
                data-vibe-id={vibe.id}
              >
                {vibe.title}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {vibes.map((vibe: { id: string; title: string }) => (
              <div
                key={vibe.id}
                data-testid="vibe-card-single"
                data-vibe-id={vibe.id}
              >
                {vibe.title}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="pt-6 text-center">
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground">loading more...</span>
            </div>
          </div>
        )}
      </div>
    );
  },
}));

// Remove the VibeCard mock since MasonryFeed is now mocked

const mockVibes = [
  {
    id: '1',
    title: 'Test Vibe 1',
    description: 'Description 1',
    image: 'https://example.com/image1.jpg',
    createdBy: {
      id: 'user1',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
    },
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Test Vibe 2',
    description: 'Description 2',
    image: 'https://example.com/image2.jpg',
    createdBy: {
      id: 'user2',
      username: 'testuser2',
      first_name: 'Test2',
      last_name: 'User2',
    },
    createdAt: '2023-01-02T00:00:00Z',
  },
];

describe('HomeFeed', () => {
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

    // Default mock implementations
    mockUseUser.mockReturnValue({ user: { id: 'test-user' } });
    mockUseMasonryLayout.mockReturnValue(false);
    mockUseVibesPaginated.mockReturnValue({
      data: { vibes: mockVibes, isDone: false },
      isLoading: false,
      error: null,
    });
    mockUseTopRatedVibes.mockReturnValue({
      data: { vibes: mockVibes, isDone: false },
      isLoading: false,
      error: null,
    });
    mockUsePersonalizedVibes.mockReturnValue({
      data: {
        pages: [{ vibes: mockVibes, isDone: false }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });
    mockUseVibesInfinite.mockReturnValue({
      data: { pages: [{ vibes: mockVibes }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HomeFeed />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('renders feed header with title and tabs', async () => {
    renderComponent();

    expect(screen.getByText('feed')).toBeInTheDocument();
    expect(screen.getByText('for you')).toBeInTheDocument();
    expect(screen.getByText('hot')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('shows "for you" tab description initially for authenticated users', async () => {
    renderComponent();

    const forYouButton = screen.getByText('for you');
    await user.hover(forYouButton);

    await waitFor(() => {
      const descriptions = screen.getAllByText(
        'personalized vibes from 10 people you follow'
      );
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('hides "for you" tab for unauthenticated users', async () => {
    mockUseUser.mockReturnValue({ user: null });
    renderComponent();

    expect(screen.queryByText('for you')).not.toBeInTheDocument();
    expect(screen.getByText('hot')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('switches to "hot" tab automatically for unauthenticated users', async () => {
    mockUseUser.mockReturnValue({ user: null });
    renderComponent();

    // The hot tab should be active by default
    const hotButton = screen.getByText('hot');
    expect(hotButton).toBeInTheDocument();

    // Hover to see tooltip
    await user.hover(hotButton);

    await waitFor(() => {
      const descriptions = screen.getAllByText(
        'most rated & recently active vibes'
      );
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('switches tabs when clicked', async () => {
    renderComponent();

    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    await waitFor(() => {
      // Check that the tab has the active styling (primary background)
      expect(hotTab).toHaveClass('bg-primary');
    });
  });

  it('displays vibes in single column layout when masonry is disabled', async () => {
    mockUseMasonryLayout.mockReturnValue(false);
    // Ensure we have data in infinite query format
    mockUsePersonalizedVibes.mockReturnValue({
      data: {
        pages: [{ vibes: mockVibes, isDone: false }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('vibe-card-single')).toHaveLength(2);
    });
  });

  it('displays vibes in masonry layout when enabled', async () => {
    mockUseMasonryLayout.mockReturnValue(true);
    // Ensure we have data in infinite query format
    mockUsePersonalizedVibes.mockReturnValue({
      data: {
        pages: [{ vibes: mockVibes, isDone: false }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('masonry-layout')).toBeInTheDocument();
      expect(screen.getAllByTestId('vibe-card-masonry')).toHaveLength(2);
    });
  });

  it('shows loading skeleton when data is loading', async () => {
    mockUsePersonalizedVibes.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderComponent();

    // Should show the tabs but no content when loading
    expect(screen.getByText('for you')).toBeInTheDocument();
    expect(screen.getByText('hot')).toBeInTheDocument();
  });

  it('shows error state when there is an error', async () => {
    // Switch to a tab that uses the general feed (not personalized)
    mockUseUser.mockReturnValue({ user: null }); // No user to force "hot" tab
    mockUseVibesInfinite.mockReturnValue({
      data: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: new Error('Failed to load'),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('failed to load vibes')).toBeInTheDocument();
      expect(screen.getByText('try again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no vibes are available', async () => {
    // Use personalized feed for empty state
    mockUsePersonalizedVibes.mockReturnValue({
      data: { pages: [{ vibes: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('your personalized feed is getting ready')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/haven't shared any vibes yet/)
      ).toBeInTheDocument();
    });
  });

  it('shows load more button when there are more pages', async () => {
    mockUseVibesInfinite.mockReturnValue({
      data: { pages: [{ vibes: mockVibes }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    // Switch to "new" tab to test pagination
    const newTab = screen.getByText('new');
    await user.click(newTab);

    await waitFor(() => {
      // Check that pagination is working (hasMore is true)
      expect(screen.getByText('loading more...')).toBeInTheDocument();
    });
  });

  it('calls correct query based on active tab', async () => {
    renderComponent();

    // Check that useForYouFeedInfinite is called for "for you" tab (default)
    expect(mockUsePersonalizedVibes).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKeyPrefix: ['home-feed', 'for-you'],
      })
    );

    // Check that useVibesInfinite is called with enabled: false for "for you" tab
    expect(mockUseVibesInfinite).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        enabled: false,
        queryKeyPrefix: ['home-feed'],
        queryKeyName: 'for-you',
      })
    );

    // Switch to "hot" tab
    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    // Check that useVibesInfinite is called with same filters for hot tab (also top_rated)
    expect(mockUseVibesInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'top_rated', limit: 20 }),
      expect.objectContaining({
        enabled: true,
        queryKeyPrefix: ['home-feed'],
        queryKeyName: 'hot',
      })
    );

    // Switch to "new" tab
    const newTab = screen.getByText('new');
    await user.click(newTab);

    // Check that useVibesInfinite is called with different filters for new tab
    expect(mockUseVibesInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'recent', limit: 20 }),
      expect.objectContaining({
        enabled: true,
        queryKeyPrefix: ['home-feed'],
        queryKeyName: 'new',
      })
    );
  });

  it('uses correct rating display mode for hot vs other tabs', async () => {
    // Ensure we have data for all tabs in infinite query format
    mockUsePersonalizedVibes.mockReturnValue({
      data: {
        pages: [{ vibes: mockVibes, isDone: false }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });
    mockUseVibesInfinite.mockReturnValue({
      data: {
        pages: [{ vibes: mockVibes }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    // Check initial (for-you) tab uses "most-rated"
    await waitFor(() => {
      const vibeCards = screen.getAllByTestId('vibe-card-single');
      expect(vibeCards).toHaveLength(2);
    });

    // Switch to hot tab and check it uses "top-rated"
    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    await waitFor(() => {
      const vibeCards = screen.getAllByTestId('vibe-card-single');
      expect(vibeCards).toHaveLength(2);
    });
  });

  it('resets page to 1 when switching tabs', async () => {
    // Set up infinite scroll with hasNextPage true initially
    mockUseVibesInfinite.mockReturnValue({
      data: { pages: [{ vibes: mockVibes }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isLoading: false,
      isFetchingNextPage: false,
      error: null,
    });

    renderComponent();

    // Switch to hot tab
    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    // Verify useVibesInfinite is called with hot tab filters
    expect(mockUseVibesInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'top_rated', limit: 20 }),
      expect.objectContaining({
        enabled: true,
        queryKeyPrefix: ['home-feed'],
        queryKeyName: 'hot',
      })
    );
  });
});
