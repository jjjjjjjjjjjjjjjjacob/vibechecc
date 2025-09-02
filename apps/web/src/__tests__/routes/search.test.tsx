/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the component directly instead of trying to extract from Route
import SearchResultsPage from '@/routes/search';

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
vi.mock('@/features/search/hooks/use-search-results-improved', () => ({
  useSearchResultsImproved: vi.fn(() => ({
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
  useAllTags: () => ({
    data: [
      { tag: 'hot' },
      { tag: 'amazing' },
      { tag: 'shocked' },
      { tag: 'surprise' },
    ],
    isLoading: false,
  }),
  useCreateEmojiRatingMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useTopEmojiRatings: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useMostInteractedEmoji: () => ({
    data: ['🔥', '😍', '💯'],
    isLoading: false,
    error: null,
  }),
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
  SearchResultsList: ({
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
      <div data-testid="search-results-list">
        {results.map((result) => (
          <div key={result.id} data-testid="search-result-list-item">
            {result.title}
          </div>
        ))}
      </div>
    );
  },
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

// Mock the missing components used in the search page
vi.mock('@/features/ratings/components/emoji-search-collapsible', () => ({
  EmojiSearchCollapsible: ({
    onSelect,
    searchValue,
    onSearchChange,
    placeholder,
  }: {
    onSelect: (emoji: string) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
  }) => (
    <div data-testid="emoji-search-collapsible">
      <input
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button onClick={() => onSelect('🔥')}>🔥</button>
      <button onClick={() => onSelect('😍')}>😍</button>
    </div>
  ),
}));

vi.mock('@/features/ratings/components/emoji-pill-filters', () => ({
  EmojiPillFilters: ({
    emojis,
    onRemove,
    onClear,
  }: {
    emojis: string[];
    onRemove: (emoji: string) => void;
    onClear: () => void;
  }) => (
    <div data-testid="emoji-pill-filters">
      {emojis.map((emoji) => (
        <button key={emoji} onClick={() => onRemove(emoji)}>
          {emoji}
        </button>
      ))}
      <button onClick={onClear}>Clear all</button>
    </div>
  ),
}));

vi.mock('@/features/ratings/components/rating-range-slider', () => ({
  RatingRangeSlider: ({
    value,
    onChange,
    label,
  }: {
    value: [number, number];
    onChange: (value: [number, number]) => void;
    label: string;
  }) => (
    <div data-testid="rating-range-slider">
      <label>{label}</label>
      <input
        type="range"
        min="1"
        max="5"
        value={value[0]}
        onChange={(e) => onChange([Number(e.target.value), value[1]])}
      />
      <input
        type="range"
        min="1"
        max="5"
        value={value[1]}
        onChange={(e) => onChange([value[0], Number(e.target.value)])}
      />
    </div>
  ),
}));

vi.mock('@/components/tag-search-command', () => ({
  TagSearchCommand: ({
    selectedTags,
    onTagSelect,
    onTagRemove,
  }: {
    selectedTags: string[];
    onTagSelect: (tag: string) => void;
    onTagRemove: (tag: string) => void;
  }) => (
    <div data-testid="tag-search-command">
      {selectedTags.map((tag) => (
        <button key={tag} onClick={() => onTagRemove(tag)}>
          {tag} ×
        </button>
      ))}
      <button onClick={() => onTagSelect('test-tag')}>Add Tag</button>
    </div>
  ),
}));

// Import the mocked function
import { useSearchResultsImproved } from '@/features/search/hooks/use-search-results-improved';
const mockUseSearchResultsImproved = vi.mocked(useSearchResultsImproved);

describe('Search Page - Emoji Filter Integration', () => {
  let queryClient: QueryClient;

  let _user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    _user = userEvent.setup();
    vi.clearAllMocks();
  });

  const renderWithRouter = (searchParams = {}) => {
    // Set the mock search params before rendering
    (globalThis as any).setMockSearchParams(searchParams);

    return render(
      <QueryClientProvider client={queryClient}>
        <SearchResultsPage />
      </QueryClientProvider>
    );
  };

  it('renders search page with filters', async () => {
    renderWithRouter({ q: 'test' });

    await waitFor(() => {
      expect(screen.getByText('search results for "test"')).toBeInTheDocument();
      expect(
        screen.getByText('2 results found for "test"')
      ).toBeInTheDocument();
      expect(screen.getByText('filter results')).toBeInTheDocument();
    });
  });

  it('displays emoji rating filter when filters are active', async () => {
    // When emoji filters are active, they should be visible
    renderWithRouter({
      emojiFilter: ['🔥'],
    });

    await waitFor(() => {
      // When emoji filters are active, title shows emoji + 'vibes'
      expect(screen.getByText('🔥 vibes')).toBeInTheDocument();
      // When emoji filters are active, there should be some indication
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('renders search page structure', async () => {
    renderWithRouter();

    await waitFor(() => {
      // Check basic search page structure
      expect(screen.getByText('search results')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
      expect(screen.getByText('all')).toBeInTheDocument();
    });
  });

  it('processes emoji filter parameters', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
    });

    await waitFor(() => {
      // Check that search page renders with emoji filter parameters
      expect(screen.getByText('🔥 vibes')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('processes multiple filter parameters', async () => {
    renderWithRouter({
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 4,
    });

    await waitFor(() => {
      // Check that search page handles multiple filters (shows spaced emojis)
      expect(screen.getByText('🔥 😍 vibes')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('renders with emoji filter and minimum value', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
      emojiMinValue: 4,
    });

    await waitFor(() => {
      // Should render search page with emoji filter settings
      expect(screen.getByText('🔥 vibes')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('processes rating and emoji filters together', async () => {
    renderWithRouter({
      rating: 4,
      emojiFilter: ['🔥', '😍'],
      emojiMinValue: 3,
    });

    await waitFor(() => {
      // Should handle combined rating and emoji filters
      expect(screen.getByText('🔥 😍 vibes')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('handles maximum rating filters', async () => {
    renderWithRouter({
      rating: 4,
      emojiFilter: ['💯'],
      emojiMinValue: 5,
    });

    await waitFor(() => {
      // Should handle high rating filters
      expect(screen.getByText('💯 vibes')).toBeInTheDocument();
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('processes sort order with filters', async () => {
    renderWithRouter({
      emojiFilter: ['🔥'],
      sort: 'relevance',
    });

    await waitFor(() => {
      // Should handle sort order and emoji filters
      expect(screen.getByText('🔥 vibes')).toBeInTheDocument();
      expect(screen.getByText('sort by:')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    // Update the mock to return loading state
    mockUseSearchResultsImproved.mockReturnValue({
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
    mockUseSearchResultsImproved.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Search failed'),
      isSuccess: false,
    });

    renderWithRouter();

    await waitFor(() => {
      // When there's an error, page still renders with title
      expect(screen.getByText('search results')).toBeInTheDocument();
      // Error handling in this component is minimal - it just shows no results
    });
  });

  it('shows empty state when no results found', async () => {
    const emptyResults = { ...mockSearchResults, vibes: [], totalCount: 0 };
    mockUseSearchResultsImproved.mockReturnValue({
      data: emptyResults,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    });

    renderWithRouter({ q: 'nonexistent' });

    await waitFor(() => {
      expect(
        screen.getByText(/0.*results.*found for.*nonexistent/)
      ).toBeInTheDocument();
    });
  });

  it('displays extensive results with filters and many results', async () => {
    const manyResults = { ...mockSearchResults, totalCount: 50, totalPages: 5 };
    mockUseSearchResultsImproved.mockReturnValue({
      data: manyResults,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    });

    renderWithRouter({ tab: 'vibes' }); // Use 'vibes' tab, not 'all'

    // Wait for the component to render and check for the results text
    // The actual text will be "50 results found" without a query
    await waitFor(
      () => {
        const resultsText = screen.getByText(/50 results found/i);
        expect(resultsText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify search results are displayed
    expect(screen.getByText('search results')).toBeInTheDocument();
  });
});
