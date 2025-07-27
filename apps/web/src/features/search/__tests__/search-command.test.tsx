/// <reference lib="dom" />

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SearchResponse } from '@viberater/types';

// Mock the router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the hooks
vi.mock('../hooks/use-search', () => ({
  useSearchSuggestions: vi.fn(),
}));

vi.mock('../hooks/use-trending-searches', () => ({
  useTrendingSearches: vi.fn(),
}));

// Mock the result components
vi.mock('../components/result-items/vibe-result', () => ({
  VibeResult: ({
    result,
    onSelect,
  }: {
    result: { id: string; content: string };
    onSelect: () => void;
  }) => (
    <button onClick={onSelect} data-testid={`vibe-${result.id}`}>
      {result.content}
    </button>
  ),
}));

vi.mock('../components/result-items/user-result', () => ({
  UserResult: ({
    result,
    onSelect,
  }: {
    result: { id: string; username: string };
    onSelect: () => void;
  }) => (
    <button onClick={onSelect} data-testid={`user-${result.id}`}>
      {result.username}
    </button>
  ),
}));

vi.mock('../components/result-items/tag-result', () => ({
  TagResult: ({
    result,
    onSelect,
  }: {
    result: { id: string; name: string };
    onSelect: () => void;
  }) => (
    <button onClick={onSelect} data-testid={`tag-${result.id}`}>
      {result.name}
    </button>
  ),
}));

vi.mock('../components/result-items/action-result', () => ({
  ActionResult: ({
    result,
    onSelect,
  }: {
    result: { id: string; title: string };
    onSelect: () => void;
  }) => (
    <button onClick={onSelect} data-testid={`action-${result.id}`}>
      {result.title}
    </button>
  ),
}));

vi.mock('../components/search-suggestions', () => ({
  SearchSuggestions: ({ onSelect }: { onSelect: (value: string) => void }) => (
    <div data-testid="search-suggestions">
      <button onClick={() => onSelect('recent search')}>Recent Search</button>
      <button onClick={() => onSelect('/explore')}>Navigate to Explore</button>
    </div>
  ),
}));

// Import SearchCommand after mocks are set up
import { SearchCommand } from '../components/search-command';
import { useSearchSuggestions } from '../hooks/use-search';
import { useTrendingSearches } from '../hooks/use-trending-searches';

const mockUseSearchSuggestions = useSearchSuggestions as unknown as ReturnType<
  typeof vi.fn
>;
const mockUseTrendingSearches = useTrendingSearches as unknown as ReturnType<
  typeof vi.fn
>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderSearchCommand = (props = {}) => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <SearchCommand {...defaultProps} {...props} />
    </QueryClientProvider>
  );
};

describe('SearchCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mocks
    mockUseTrendingSearches.mockReturnValue({
      data: [
        { term: 'trending1', count: 100 },
        { term: 'trending2', count: 50 },
      ],
    });
    mockUseSearchSuggestions.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('renders when open', () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand();
      expect(
        screen.getByPlaceholderText('Search vibes, users, or tags...')
      ).toBeInTheDocument();
    });

    it('shows search suggestions when no query is entered', () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand();
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });
  });

  describe('Search Results', () => {
    it('displays vibes results', async () => {
      const mockData: SearchResponse = {
        vibes: [
          {
            id: '1',
            content: 'Test vibe content',
            userId: 'user1',
            username: 'testuser',
            avgRating: 4.5,
            userAvgRating: 4.2,
            totalRatings: 10,
            tags: ['test'],
            createdAt: '2024-01-01',
          },
        ],
        users: [],
        tags: [],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Vibes')).toBeInTheDocument();
        expect(screen.getByTestId('vibe-1')).toBeInTheDocument();
      });
    });

    it('displays users results', async () => {
      const mockData: SearchResponse = {
        vibes: [],
        users: [
          {
            id: 'user1',
            username: 'testuser',
            displayName: 'Test User',
            avgRating: 4.5,
            totalVibes: 5,
            avatarUrl: null,
          },
        ],
        tags: [],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'user' } });

      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByTestId('user-user1')).toBeInTheDocument();
      });
    });

    it('displays tags results', async () => {
      const mockData: SearchResponse = {
        vibes: [],
        users: [],
        tags: [
          {
            id: 'tag1',
            name: 'funny',
            count: 42,
          },
        ],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'fun' } });

      await waitFor(() => {
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByTestId('tag-tag1')).toBeInTheDocument();
      });
    });

    it('displays all result types together', async () => {
      const mockData: SearchResponse = {
        vibes: [
          {
            id: '1',
            content: 'Test vibe',
            userId: 'user1',
            username: 'user1',
            avgRating: 4,
            userAvgRating: 4,
            totalRatings: 1,
            tags: [],
            createdAt: '2024-01-01',
          },
        ],
        users: [
          {
            id: 'user1',
            username: 'testuser',
            displayName: 'Test',
            avgRating: 4,
            totalVibes: 1,
            avatarUrl: null,
          },
        ],
        tags: [{ id: 'tag1', name: 'test', count: 5 }],
        actions: [
          {
            id: 'action1',
            type: 'action',
            title: 'Create new vibe',
            subtitle: 'Share your experience',
            action: 'create',
            icon: 'plus',
          },
        ],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Vibes')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no results found', async () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: {
          vibes: [],
          users: [],
          tags: [],
          actions: [],
        },
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(
          screen.getByText('No results found for "nonexistent"')
        ).toBeInTheDocument();
      });
    });

    it('does not show empty state while loading', () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: true,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates query when user types', async () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(input).toHaveValue('test query');
    });

    it('closes dialog when result is selected', async () => {
      const onOpenChange = vi.fn();
      const mockData: SearchResponse = {
        vibes: [
          {
            id: '1',
            content: 'Test vibe',
            userId: 'user1',
            username: 'user1',
            avgRating: 4,
            userAvgRating: 4,
            totalRatings: 1,
            tags: [],
            createdAt: '2024-01-01',
          },
        ],
        users: [],
        tags: [],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand({ onOpenChange });

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        const vibeResult = screen.getByTestId('vibe-1');
        fireEvent.click(vibeResult);
      });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('navigates to search page for long queries', async () => {
      const mockData: SearchResponse = {
        vibes: [],
        users: [],
        tags: [],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'long search query' } });

      await waitFor(() => {
        const searchAllAction = screen.getByText(
          'Search for "long search query"'
        );
        expect(searchAllAction).toBeInTheDocument();
        fireEvent.click(searchAllAction);
      });

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/search',
        search: { q: 'long search query' },
      });
    });
  });

  describe('Suggestions', () => {
    it('handles suggestion selection', async () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand();

      const recentSearchButton = screen.getByText('Recent Search');
      fireEvent.click(recentSearchButton);

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      expect(input).toHaveValue('recent search');
    });

    it('navigates when suggestion is a route', async () => {
      const onOpenChange = vi.fn();
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand({ onOpenChange });

      const exploreButton = screen.getByText('Navigate to Explore');
      fireEvent.click(exploreButton);

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/explore' });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles null data gracefully', () => {
      mockUseSearchSuggestions.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.queryByText('Vibes')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('only shows "Search for" action for queries longer than 2 characters', async () => {
      const mockData: SearchResponse = {
        vibes: [],
        users: [],
        tags: [],
        actions: [],
      };

      mockUseSearchSuggestions.mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      renderSearchCommand();

      const input = screen.getByPlaceholderText(
        'Search vibes, users, or tags...'
      );

      // Test with short query
      fireEvent.change(input, { target: { value: 'ab' } });
      await waitFor(() => {
        expect(screen.queryByText('Search for "ab"')).not.toBeInTheDocument();
      });

      // Test with longer query
      fireEvent.change(input, { target: { value: 'abc' } });
      await waitFor(() => {
        expect(screen.getByText('Search for "abc"')).toBeInTheDocument();
      });
    });
  });
});
