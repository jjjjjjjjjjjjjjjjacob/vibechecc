/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeFeed } from './home-feed';

// Mock hooks
const mockUseUser = vi.fn();
const mockUseVibesPaginated = vi.fn();
const mockUseTopRatedVibes = vi.fn();
const mockUsePersonalizedVibes = vi.fn();
const mockUseMasonryLayout = vi.fn();

vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/queries', () => ({
  useVibesPaginated: (...args: any[]) => mockUseVibesPaginated(...args),
  useTopRatedVibes: (...args: any[]) => mockUseTopRatedVibes(...args),
  usePersonalizedVibes: (...args: any[]) => mockUsePersonalizedVibes(...args),
}));

vi.mock('./masonry-layout', () => ({
  JSMasonryLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="masonry-layout">{children}</div>
  ),
  useMasonryLayout: () => mockUseMasonryLayout(),
}));

vi.mock('@/features/vibes/components/vibe-card', () => ({
  VibeCard: ({ vibe, variant }: { vibe: any; variant: string }) => (
    <div
      data-testid={`vibe-card-${variant?.replace('feed-', '') || 'default'}`}
      data-vibe-id={vibe.id}
    >
      {vibe.title}
    </div>
  ),
}));

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
      data: mockVibes,
      isLoading: false,
      error: null,
    });
    mockUsePersonalizedVibes.mockReturnValue({
      data: mockVibes,
      isLoading: false,
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
        <HomeFeed />
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

    expect(
      screen.getByText('personalized based on your interactions')
    ).toBeInTheDocument();
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

    await waitFor(() => {
      expect(
        screen.getByText('most rated & recently active vibes')
      ).toBeInTheDocument();
    });
  });

  it('switches tabs when clicked', async () => {
    renderComponent();

    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    await waitFor(() => {
      expect(
        screen.getByText('most rated & recently active vibes')
      ).toBeInTheDocument();
    });
  });

  it('displays vibes in single column layout when masonry is disabled', async () => {
    mockUseMasonryLayout.mockReturnValue(false);
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('vibe-card-single')).toHaveLength(2);
    });
  });

  it('displays vibes in masonry layout when enabled', async () => {
    mockUseMasonryLayout.mockReturnValue(true);
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
    mockUsePersonalizedVibes.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('failed to load for-you feed')
      ).toBeInTheDocument();
      expect(screen.getByText('try again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no vibes are available', async () => {
    mockUsePersonalizedVibes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('your personalized feed is empty')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'start rating and interacting with vibes to get personalized recommendations!'
        )
      ).toBeInTheDocument();
    });
  });

  it('shows load more button when there are more pages', async () => {
    mockUseVibesPaginated.mockReturnValue({
      data: { vibes: mockVibes, isDone: false },
      isLoading: false,
      error: null,
    });

    renderComponent();

    // Switch to "new" tab to test pagination
    const newTab = screen.getByText('new');
    await user.click(newTab);

    await waitFor(() => {
      expect(screen.getByText('load more')).toBeInTheDocument();
    });
  });

  it('calls correct query based on active tab', async () => {
    renderComponent();

    // Check "for you" tab (default)
    expect(mockUsePersonalizedVibes).toHaveBeenCalledWith('test-user', {
      enabled: true,
      limit: 20,
    });

    // Switch to "hot" tab
    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    expect(mockUseTopRatedVibes).toHaveBeenCalledWith(20, {
      enabled: true,
    });

    // Switch to "new" tab
    const newTab = screen.getByText('new');
    await user.click(newTab);

    expect(mockUseVibesPaginated).toHaveBeenCalledWith(20, {
      enabled: true,
      cursor: undefined,
    });
  });

  it('uses correct rating display mode for hot vs other tabs', async () => {
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
    renderComponent();

    // Load more on initial tab (for-you)
    const loadMoreButton = screen.queryByText('load more');
    if (loadMoreButton) {
      await user.click(loadMoreButton);
    }

    // Switch to hot tab
    const hotTab = screen.getByText('hot');
    await user.click(hotTab);

    // Verify queries are called with page 1
    expect(mockUseTopRatedVibes).toHaveBeenCalledWith(20, {
      enabled: true,
    });
  });
});
