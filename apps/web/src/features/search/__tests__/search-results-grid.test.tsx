/// <reference lib="dom" />

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchResultsGrid } from '@/features/search/components/search-results-grid';
import type { SearchResult } from '@viberatr/types';

// Mock the child components
vi.mock('@/features/search/components/search-result-card', () => ({
  SearchResultCard: ({ result }: { result: SearchResult }) => (
    <div data-testid={`result-card-${result.id}`}>
      {result.type === 'vibe' ? result.content : result.title}
    </div>
  ),
}));

vi.mock('@/features/search/components/search-empty-state', () => ({
  SearchEmptyState: () => <div data-testid="empty-state">No results found</div>,
}));

vi.mock('@/features/search/components/search-loading', () => ({
  SearchLoading: ({ itemCount }: { itemCount?: number }) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: itemCount || 6 }).map((_, i) => (
        <div key={i} data-testid="loading-card">
          <div data-testid="skeleton" className="aspect-[4/3]">
            Loading...
          </div>
          <div data-testid="skeleton">Loading...</div>
          <div data-testid="skeleton">Loading...</div>
          <div data-testid="skeleton">Loading...</div>
          <div data-testid="skeleton">Loading...</div>
        </div>
      ))}
    </div>
  ),
}));

describe('SearchResultsGrid', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    // Mock useNavigate hook directly
    const _mockNavigate = vi.fn();
    return render(
      <QueryClientProvider client={queryClient}>
        {React.cloneElement(ui)}
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('displays loading skeletons when loading', () => {
      renderWithProviders(<SearchResultsGrid loading={true} />);

      // Check that loading cards are rendered
      const loadingCards = screen.getAllByTestId('loading-card');
      expect(loadingCards).toHaveLength(9); // SearchLoading renders 9 cards by default

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(45); // 9 cards * 5 skeletons each
    });

    it('displays correct grid layout for loading state', () => {
      const { container } = renderWithProviders(
        <SearchResultsGrid loading={true} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid',
        'grid-cols-1',
        'gap-6',
        'md:grid-cols-2',
        'lg:grid-cols-3'
      );
    });
  });

  describe('Empty State', () => {
    it('displays empty state when results is undefined', () => {
      renderWithProviders(<SearchResultsGrid loading={false} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('displays empty state when results is empty array', () => {
      renderWithProviders(<SearchResultsGrid results={[]} loading={false} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'vibe',
        content: 'First vibe',
        username: 'user1',
        avgRating: 4.5,
        totalRatings: 10,
        tags: ['funny'],
      },
      {
        id: '2',
        type: 'vibe',
        content: 'Second vibe',
        username: 'user2',
        avgRating: 3.8,
        totalRatings: 5,
        tags: ['sad'],
      },
      {
        id: '3',
        type: 'user',
        title: 'TestUser',
        subtitle: '5 vibes • 4.2 avg rating',
        imageUrl: '/avatar.jpg',
      },
    ];

    it('displays all results in a grid', () => {
      renderWithProviders(
        <SearchResultsGrid results={mockResults} loading={false} />
      );

      expect(screen.getByTestId('result-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('result-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('result-card-3')).toBeInTheDocument();
    });

    it('displays correct content for each result type', () => {
      renderWithProviders(
        <SearchResultsGrid results={mockResults} loading={false} />
      );

      expect(screen.getByText('First vibe')).toBeInTheDocument();
      expect(screen.getByText('Second vibe')).toBeInTheDocument();
      expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('applies correct grid layout classes', () => {
      const { container } = renderWithProviders(
        <SearchResultsGrid results={mockResults} loading={false} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid',
        'auto-rows-fr',
        'grid-cols-1',
        'gap-6',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      );
    });
  });

  describe('Edge Cases', () => {
    it('does not show empty state while loading', () => {
      renderWithProviders(<SearchResultsGrid results={[]} loading={true} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      // Check that loading cards are shown instead
      const loadingCards = screen.getAllByTestId('loading-card');
      expect(loadingCards).toHaveLength(9);
    });

    it('handles single result correctly', () => {
      const singleResult: SearchResult[] = [
        {
          id: '1',
          type: 'vibe',
          content: 'Single vibe',
          username: 'user1',
          avgRating: 4.5,
          totalRatings: 10,
          tags: [],
        },
      ];

      renderWithProviders(
        <SearchResultsGrid results={singleResult} loading={false} />
      );

      expect(screen.getByTestId('result-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('result-card-2')).not.toBeInTheDocument();
    });

    it('maintains grid structure with varying result counts', () => {
      const manyResults: SearchResult[] = Array.from(
        { length: 15 },
        (_, i) => ({
          id: `${i + 1}`,
          type: 'vibe' as const,
          content: `Vibe ${i + 1}`,
          username: `user${i + 1}`,
          avgRating: 4.0,
          totalRatings: 5,
          tags: [],
        })
      );

      const { container } = renderWithProviders(
        <SearchResultsGrid results={manyResults} loading={false} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid',
        'auto-rows-fr',
        'grid-cols-1',
        'gap-6',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      );

      const cards = screen.getAllByTestId(/^result-card-/);
      expect(cards).toHaveLength(15);
    });
  });
});
