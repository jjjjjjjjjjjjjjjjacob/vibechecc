/// <reference lib="dom" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilters } from '@/features/search/components/search-filters';
import type { SearchFilters as SearchFiltersType } from '@viberater/types';

// Mock child components
vi.mock('@/features/search/components/filters/active-filters-bar', () => ({
  ActiveFiltersBar: () => null,
}));

vi.mock('@/features/search/components/filters/tag-filter-enhanced', () => ({
  TagFilterEnhanced: ({
    selected,
    onChange,
  }: {
    selected: string[];
    onChange: (tags: string[]) => void;
  }) => (
    <div data-testid="tag-filter">
      <button onClick={() => onChange(['funny', 'wholesome'])}>
        Add Tags ({selected.length} selected)
      </button>
    </div>
  ),
}));

vi.mock('@/features/search/components/filters/rating-slider', () => ({
  RatingSlider: ({
    min,
    onChange,
  }: {
    min: number | undefined;
    max?: number | undefined;
    onChange: (range: { min?: number; max?: number }) => void;
  }) => (
    <div data-testid="rating-filter">
      <button onClick={() => onChange({ min: 4 })}>
        Set Rating ({min || 0} stars)
      </button>
    </div>
  ),
}));

vi.mock('@/features/search/components/filters/date-range-picker', () => ({
  DateRangePicker: ({
    value,
    onChange,
  }: {
    value: { start: string; end: string } | undefined;
    onChange: (range: { start: string; end: string }) => void;
  }) => (
    <div data-testid="date-range-filter">
      <button
        onClick={() => onChange({ start: '2024-01-01', end: '2024-12-31' })}
      >
        Set Date Range ({value ? 'Set' : 'Not set'})
      </button>
    </div>
  ),
}));

describe('SearchFilters', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('renders all filter sections', () => {
      render(<SearchFilters filters={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
      expect(screen.getByTestId('rating-filter')).toBeInTheDocument();
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('displays default sort value', () => {
      render(<SearchFilters filters={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Most Relevant')).toBeInTheDocument();
    });

    it('shows "No filters applied" when no filters are active', () => {
      render(<SearchFilters filters={{}} onChange={vi.fn()} />);

      expect(screen.getByText('No filters applied')).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('passes correct values to child components', () => {
      const filters: Partial<SearchFiltersType> = {
        tags: ['funny', 'wholesome'],
        minRating: 4,
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        sort: 'rating_desc',
      };

      render(<SearchFilters filters={filters} onChange={vi.fn()} />);

      expect(screen.getByText('Add Tags (2 selected)')).toBeInTheDocument();
      expect(screen.getByText('Set Rating (4 stars)')).toBeInTheDocument();
      expect(screen.getByText('Set Date Range (Set)')).toBeInTheDocument();
      expect(screen.getByText('Highest Rated')).toBeInTheDocument();
    });

    it('calls onChange when tag filter changes', () => {
      const onChange = vi.fn();
      render(<SearchFilters filters={{}} onChange={onChange} />);

      fireEvent.click(screen.getByText('Add Tags (0 selected)'));

      expect(onChange).toHaveBeenCalledWith({
        tags: ['funny', 'wholesome'],
      });
    });

    it('calls onChange when rating filter changes', () => {
      const onChange = vi.fn();
      render(<SearchFilters filters={{}} onChange={onChange} />);

      fireEvent.click(screen.getByText('Set Rating (0 stars)'));

      expect(onChange).toHaveBeenCalledWith({
        minRating: 4,
      });
    });

    it('calls onChange when date range filter changes', () => {
      const onChange = vi.fn();
      render(<SearchFilters filters={{}} onChange={onChange} />);

      fireEvent.click(screen.getByText('Set Date Range (Not set)'));

      expect(onChange).toHaveBeenCalledWith({
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
      });
    });

    it('calls onChange when sort changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchFilters filters={{}} onChange={onChange} />);

      // Click the select trigger
      await user.click(screen.getByRole('combobox'));
      // Click the "Highest Rated" option
      await user.click(screen.getByText('Highest Rated'));

      expect(onChange).toHaveBeenCalledWith({
        sort: 'rating_desc',
      });
    });
  });

  describe('Clear All Functionality', () => {
    it('shows Clear all button when filters are active', () => {
      const filters: Partial<SearchFiltersType> = {
        tags: ['funny'],
      };

      render(<SearchFilters filters={filters} onChange={vi.fn()} />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('hides Clear all button when no filters are active', () => {
      render(<SearchFilters filters={{}} onChange={vi.fn()} />);

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('calls onChange with empty object when Clear all is clicked', () => {
      const onChange = vi.fn();
      const filters: Partial<SearchFiltersType> = {
        tags: ['funny'],
        minRating: 4,
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        sort: 'rating_desc',
      };

      render(<SearchFilters filters={filters} onChange={onChange} />);

      fireEvent.click(screen.getByText('Clear all'));

      expect(onChange).toHaveBeenCalledWith({});
    });

    it('shows Clear all for different filter combinations', () => {
      const testCases: Array<Partial<SearchFiltersType>> = [
        { tags: ['funny'] },
        { minRating: 4 },
        { dateRange: { start: '2024-01-01', end: '2024-12-31' } },
        { sort: 'rating_desc' },
      ];

      testCases.forEach((filters) => {
        const { unmount } = render(
          <SearchFilters filters={filters} onChange={vi.fn()} />
        );
        expect(screen.getByText('Clear all')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Active Filters Display', () => {
    it('shows "Filters applied" when filters are active', () => {
      const filters: Partial<SearchFiltersType> = {
        tags: ['funny'],
      };

      render(<SearchFilters filters={filters} onChange={vi.fn()} />);

      expect(screen.getByText('Filters applied')).toBeInTheDocument();
      expect(screen.queryByText('No filters applied')).not.toBeInTheDocument();
    });

    it('considers sort filter as active only when not default', () => {
      // Default sort should not show as active
      render(
        <SearchFilters filters={{ sort: 'relevance' }} onChange={vi.fn()} />
      );
      expect(screen.getByText('No filters applied')).toBeInTheDocument();

      cleanup();

      // Non-default sort should show as active
      render(
        <SearchFilters filters={{ sort: 'rating_desc' }} onChange={vi.fn()} />
      );
      expect(screen.getByText('Filters applied')).toBeInTheDocument();
    });
  });

  describe('Available Tags', () => {
    it('uses default tags when none provided', () => {
      render(<SearchFilters filters={{}} onChange={vi.fn()} />);

      // The component passes default tags to TagFilter
      // In real implementation, TagFilter would use these
      expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    });

    it('uses provided available tags', () => {
      const customTags = ['custom1', 'custom2', 'custom3'];
      render(
        <SearchFilters
          filters={{}}
          onChange={vi.fn()}
          availableTags={customTags}
        />
      );

      // The component passes custom tags to TagFilter
      expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('preserves existing filters when updating one', () => {
      const onChange = vi.fn();
      const existingFilters: Partial<SearchFiltersType> = {
        tags: ['funny'],
        minRating: 3,
      };

      render(<SearchFilters filters={existingFilters} onChange={onChange} />);

      fireEvent.click(screen.getByText('Set Rating (3 stars)'));

      expect(onChange).toHaveBeenCalledWith({
        tags: ['funny'],
        minRating: 4,
      });
    });

    it('handles undefined filter values gracefully', () => {
      const filters: Partial<SearchFiltersType> = {
        tags: undefined,
        minRating: undefined,
        dateRange: undefined,
        sort: undefined,
      };

      render(<SearchFilters filters={filters} onChange={vi.fn()} />);

      expect(screen.getByText('Add Tags (0 selected)')).toBeInTheDocument();
      expect(screen.getByText('Set Rating (0 stars)')).toBeInTheDocument();
      expect(screen.getByText('Set Date Range (Not set)')).toBeInTheDocument();
      expect(screen.getByText('Most Relevant')).toBeInTheDocument();
    });
  });
});
