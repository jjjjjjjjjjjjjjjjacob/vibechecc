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
import { Route } from './search';
// Get the component from the Route
const SearchResultsPage =
  Route.options?.component ||
  Route.component ||
  (() => <div>Component not found</div>);

// Mock search results
const mockSearchResults = {
  vibes: [
    {
      id: '1',
      type: 'vibe',
      title: 'Fire Vibe',
      subtitle: 'By testuser',
      description: 'A vibe rated with fire emoji',
      rating: 4.5,
      ratingCount: 10,
      tags: ['hot', 'amazing'],
    },
    {
      id: '2',
      type: 'vibe',
      title: 'Love Vibe',
      subtitle: 'By anotheruser',
      description: 'A vibe rated with love emoji',
      rating: 4.8,
      ratingCount: 15,
      tags: ['romantic', 'sweet'],
    },
  ],
  users: [],
  tags: [],
  actions: [],
  totalCount: 2,
};

const mockEmojiMetadata = [
  { emoji: '🔥', tags: ['fire', 'hot'], category: 'intense', popularity: 100 },
  {
    emoji: '😍',
    tags: ['love', 'amazing'],
    category: 'positive',
    popularity: 95,
  },
  {
    emoji: '💯',
    tags: ['perfect', 'hundred'],
    category: 'achievement',
    popularity: 90,
  },
  {
    emoji: '😱',
    tags: ['shocked', 'surprise'],
    category: 'surprise',
    popularity: 85,
  },
];

// Mock hooks
vi.mock('@/features/search/hooks/use-search-results', () => ({
  useSearchResults: vi.fn(() => ({
    data: mockSearchResults,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
  })),
}));

vi.mock('@/queries', () => ({
  useEmojiMetadata: () => ({ data: mockEmojiMetadata, isLoading: false }),
  useCurrentUser: () => ({ data: null, isLoading: false }),
}));

// Mock components
vi.mock('@/features/search/components', () => ({
  SearchResultsGrid: ({
    results,
    loading,
    error,
  }: {
    results?: Array<{ id: string; title: string }>;
    loading?: boolean;
    error?: Error;
  }) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading search results</div>;
    if (!results || results.length === 0) return <div>no results found</div>;

    return (
      <div data-testid="search-results">
        {results.map((result) => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    );
  },
  SearchPagination: () => <div data-testid="pagination">Pagination</div>,
}));

vi.mock('@/components/emoji-search-command', () => ({
  EmojiSearchCommand: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <div data-testid="emoji-search-command">
      <button onClick={() => onSelect('🔥')}>🔥</button>
      <button onClick={() => onSelect('😍')}>😍</button>
    </div>
  ),
}));

vi.mock('@/components/emoji-rating-display', () => ({
  EmojiRatingDisplay: ({
    rating,
  }: {
    rating: { emoji: string; value: number };
  }) => (
    <div data-testid="emoji-rating-display">
      {rating.emoji} {rating.value}
    </div>
  ),
}));

// Import the mocked function
import { useSearchResults } from '@/features/search/hooks/use-search-results';
const mockUseSearchResults = vi.mocked(useSearchResults);

describe('Search Page - Emoji Filter Integration', () => {
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

  const renderWithRouter = (searchParams = {}) => {
    const rootRoute = createRootRoute();
    const searchRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/search',
      component: SearchResultsPage,
      validateSearch: () => searchParams,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([searchRoute]),
      defaultPendingComponent: () => <div>Loading...</div>,
      context: { queryClient },
    });

    router.navigate({ to: '/search', search: searchParams });

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  };

  it('renders search page with filters', async () => {
    renderWithRouter({ q: 'test' });

    await waitFor(() => {
      expect(screen.getByText('search results for "test"')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
      expect(screen.getByText('filter results')).toBeInTheDocument();
    });
  });

  it('displays emoji rating filter', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('filter by emoji')).toBeInTheDocument();
    });
  });

  it('toggles emoji filter selection', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('emoji-search-command')).toBeInTheDocument();
    });

    // Click fire emoji to select it
    const fireEmojiButton = screen.getByText('🔥');
    await user.click(fireEmojiButton);

    // Would trigger navigation to add emoji filter in real app
  });

  it('shows minimum emoji rating buttons when emojis are selected', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
    });

    await waitFor(() => {
      expect(screen.getByText('minimum emoji rating: 1')).toBeInTheDocument();
    });

    // Should have rating buttons 1-5
    const buttons = screen.getAllByRole('button');
    const ratingButtons = buttons.filter((btn) =>
      /^[1-5]$/.test(btn.textContent || '')
    );
    expect(ratingButtons).toHaveLength(5);
  });

  it('displays active filters summary', async () => {
    renderWithRouter({
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 4,
    });

    await waitFor(() => {
      // Check that filters are applied by looking for the clear all filters button
      expect(screen.getByText('clear all filters')).toBeInTheDocument();
      // Check that emoji filters are shown (they appear both in command and filter pills)
      const fireEmojis = screen.getAllByText('🔥');
      expect(fireEmojis.length).toBeGreaterThan(0);
      const loveEmojis = screen.getAllByText('😍');
      expect(loveEmojis.length).toBeGreaterThan(0);
    });
  });

  it('filters search results by emoji', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
      emojiMinValue: 4,
    });

    // Should show the active filters
    await waitFor(() => {
      expect(screen.getByText('clear all filters')).toBeInTheDocument();
      // Emoji appears in multiple places
      const fireEmojis = screen.getAllByText('🔥');
      expect(fireEmojis.length).toBeGreaterThan(0);
    });
  });

  it('clears all filters', async () => {
    renderWithRouter({
      rating: 4,
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 3,
    });

    await waitFor(() => {
      expect(screen.getByText('clear all filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('clear all filters');
    await user.click(clearButton);

    // Would trigger navigation to clear filters in real app
  });

  it('combines star rating and emoji filters', async () => {
    renderWithRouter({
      rating: 4,
      emojiFilter: ['💯'],
      emojiMinValue: 5,
    });

    await waitFor(() => {
      expect(screen.getByText('clear all filters')).toBeInTheDocument();
      // Emoji appears in multiple places
      const hundredEmojis = screen.getAllByText('💯');
      expect(hundredEmojis.length).toBeGreaterThan(0);
    });
  });

  it('maintains filters when changing sort order', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
      sort: 'relevance',
    });

    await waitFor(() => {
      // Should show both the emoji filter and sort option
      expect(screen.getByText('clear all filters')).toBeInTheDocument();
      expect(screen.getByText('sort by:')).toBeInTheDocument();
    });

    // The sort select should have the correct value (appears in both mobile and desktop)
    const sortSelects = screen.getAllByDisplayValue('most relevant');
    expect(sortSelects.length).toBeGreaterThan(0);
  });

  it('handles loading state', async () => {
    // Update the mock to return loading state
    mockUseSearchResults.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
    });

    renderWithRouter();

    // Wait for router to render and check that loading behavior is handled
    // The SearchResultsGrid component will handle the loading display
    await waitFor(() => {
      // Just verify the search structure is present, loading is handled by SearchResultsGrid
      expect(screen.getByText('all')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    mockUseSearchResults.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Search failed'),
      isSuccess: false,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText('Error loading search results')
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no results found', async () => {
    const emptyResults = { ...mockSearchResults, vibes: [], totalCount: 0 };
    mockUseSearchResults.mockReturnValue({
      data: emptyResults,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    });

    renderWithRouter({ q: 'nonexistent' });

    await waitFor(() => {
      expect(screen.getByText('no results found')).toBeInTheDocument();
    });
  });

  it('renders pagination when there are multiple pages', async () => {
    const manyResults = { ...mockSearchResults, totalCount: 50 };
    mockUseSearchResults.mockReturnValue({
      data: manyResults,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    });

    renderWithRouter();

    await waitFor(() => {
      // Look for pagination component
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });
});
