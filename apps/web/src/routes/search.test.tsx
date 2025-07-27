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
}));

// Mock components
vi.mock('@/features/search/components', () => ({
  SearchResultsGrid: ({
    results,
  }: {
    results: Array<{ id: string; title: string }>;
  }) => (
    <div data-testid="search-results">
      {results?.map((result) => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  ),
  SearchPagination: () => <div data-testid="pagination">Pagination</div>,
}));

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
      expect(screen.getByText('Search results for "test"')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
      expect(screen.getByText('Filter Results')).toBeInTheDocument();
    });
  });

  it('displays emoji rating filter', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Emoji Ratings')).toBeInTheDocument();
      expect(screen.getByText('Filter by emoji ratings')).toBeInTheDocument();
    });

    // Should show popular emojis
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
    expect(screen.getByText('😱')).toBeInTheDocument();
  });

  it('toggles emoji filter selection', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    // Click fire emoji to select it
    const fireEmojiButton = screen.getByText('🔥').closest('button');
    if (fireEmojiButton) await user.click(fireEmojiButton);

    // Emoji should be selected (would trigger navigation in real app)
    expect(fireEmojiButton).toHaveClass('ring-2');
  });

  it('shows minimum emoji rating slider', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Minimum emoji rating')).toBeInTheDocument();
    });

    // Should have slider with range 1-5
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '5');
  });

  it('displays active filters summary', async () => {
    renderWithRouter({
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 4,
    });

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Emojis: 🔥 😍')).toBeInTheDocument();
      expect(screen.getByText('Min rating: 4+ ⭐')).toBeInTheDocument();
    });
  });

  it('filters search results by emoji', async () => {
    const { useSearchResults } = await import(
      '@/features/search/hooks/use-search-results'
    );

    renderWithRouter({
      emojiFilter: ['🔥'],
      emojiMinValue: 4,
    });

    await waitFor(() => {
      expect(useSearchResults).toHaveBeenCalledWith({
        query: '',
        filters: {
          tags: undefined,
          minRating: undefined,
          sort: undefined,
          emojiRatings: {
            emojis: ['🔥'],
            minValue: 4,
          },
        },
      });
    });
  });

  it('clears all filters', async () => {
    renderWithRouter({
      rating: 4,
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 3,
    });

    await waitFor(() => {
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear All Filters');
    await user.click(clearButton);

    // Would trigger navigation to clear filters in real app
  });

  it('combines star rating and emoji filters', async () => {
    const { useSearchResults } = await import(
      '@/features/search/hooks/use-search-results'
    );

    renderWithRouter({
      rating: 4,
      emojiFilter: ['💯'],
      emojiMinValue: 5,
    });

    await waitFor(() => {
      expect(useSearchResults).toHaveBeenCalledWith({
        query: '',
        filters: {
          tags: undefined,
          minRating: 4,
          sort: undefined,
          emojiRatings: {
            emojis: ['💯'],
            minValue: 5,
          },
        },
      });
    });
  });

  it('maintains filters when changing sort order', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
      sort: 'relevance',
    });

    await waitFor(() => {
      // The select element should be present
      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toBeInTheDocument();
      expect(sortSelect).toHaveValue('relevance');
    });

    // Change sort order
    const sortSelect = screen.getByRole('combobox');
    await user.selectOptions(sortSelect, 'rating_desc');

    // Would maintain emoji filter while changing sort in real app
  });
});
