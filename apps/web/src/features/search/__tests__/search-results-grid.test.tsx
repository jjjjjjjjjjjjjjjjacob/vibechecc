/// <reference lib="dom" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SearchResultsGrid } from '../components/search-results-grid';
import type { SearchResult } from '@vibechecc/types';

// Mock the child components
vi.mock('../components/search-result-card', () => ({
  SearchResultCard: ({ result }: { result: SearchResult }) => (
    <div data-testid={`result-card-${result.id}`}>
      {result.type === 'vibe' ? result.content : result.title}
    </div>
  ),
}));

vi.mock('../components/search-empty-state', () => ({
  SearchEmptyState: () => <div data-testid="empty-state">No results found</div>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>Loading...</div>
  ),
}));

describe('SearchResultsGrid', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Loading State', () => {
    it('displays loading skeletons when loading', () => {
      render(<SearchResultsGrid loading={true} />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(27); // 9 cards * 3 skeletons each
      expect(skeletons[0]).toHaveClass('aspect-[4/3]');
    });

    it('displays correct grid layout for loading state', () => {
      const { container } = render(<SearchResultsGrid loading={true} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
    });
  });

  describe('Empty State', () => {
    it('displays empty state when results is undefined', () => {
      render(<SearchResultsGrid loading={false} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('displays empty state when results is empty array', () => {
      render(<SearchResultsGrid results={[]} loading={false} />);
      
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
      render(<SearchResultsGrid results={mockResults} loading={false} />);
      
      expect(screen.getByTestId('result-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('result-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('result-card-3')).toBeInTheDocument();
    });

    it('displays correct content for each result type', () => {
      render(<SearchResultsGrid results={mockResults} loading={false} />);
      
      expect(screen.getByText('First vibe')).toBeInTheDocument();
      expect(screen.getByText('Second vibe')).toBeInTheDocument();
      expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('applies correct grid layout classes', () => {
      const { container } = render(<SearchResultsGrid results={mockResults} loading={false} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
    });
  });

  describe('Edge Cases', () => {
    it('does not show empty state while loading', () => {
      render(<SearchResultsGrid results={[]} loading={true} />);
      
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(27);
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

      render(<SearchResultsGrid results={singleResult} loading={false} />);
      
      expect(screen.getByTestId('result-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('result-card-2')).not.toBeInTheDocument();
    });

    it('maintains grid structure with varying result counts', () => {
      const manyResults: SearchResult[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        type: 'vibe' as const,
        content: `Vibe ${i + 1}`,
        username: `user${i + 1}`,
        avgRating: 4.0,
        totalRatings: 5,
        tags: [],
      }));

      const { container } = render(<SearchResultsGrid results={manyResults} loading={false} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      
      const cards = screen.getAllByTestId(/^result-card-/);
      expect(cards).toHaveLength(15);
    });
  });
});