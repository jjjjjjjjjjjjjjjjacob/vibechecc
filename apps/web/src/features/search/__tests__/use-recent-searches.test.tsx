/// <reference lib="dom" />

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useRecentSearches } from '../hooks/use-recent-searches';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useRecentSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initialization', () => {
    it('initializes with empty array when no stored searches', () => {
      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual([]);
    });

    it('loads recent searches from localStorage on mount', () => {
      const storedSearches = [
        {
          term: 'test search',
          type: 'recent',
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
        {
          term: 'another search',
          type: 'recent',
          metadata: { lastUsed: '2024-01-02T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSearches));

      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual(storedSearches);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'viberater:recent-searches'
      );
    });

    it('handles localStorage parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual([]);
    });

    it('handles localStorage access errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual([]);
    });
  });

  describe('Adding Recent Searches', () => {
    it('adds new search term to the beginning', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('new search');
      });

      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0]).toMatchObject({
        term: 'new search',
        type: 'recent',
        metadata: expect.objectContaining({
          lastUsed: expect.any(String),
        }),
      });
    });

    it('removes duplicates when adding existing search', () => {
      const initialSearches = [
        {
          term: 'existing search',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
        {
          term: 'another search',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-02T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('existing search');
      });

      expect(result.current.recentSearches).toHaveLength(2);
      expect(result.current.recentSearches[0].term).toBe('existing search');
      expect(result.current.recentSearches[1].term).toBe('another search');
    });

    it('limits to MAX_RECENT_SEARCHES (10)', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addRecentSearch(`search ${i}`);
        }
      });

      expect(result.current.recentSearches).toHaveLength(10);
      expect(result.current.recentSearches[0].term).toBe('search 14');
      expect(result.current.recentSearches[9].term).toBe('search 5');
    });

    it('ignores empty or whitespace-only terms', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('');
        result.current.addRecentSearch('   ');
        result.current.addRecentSearch('\t\n');
      });

      expect(result.current.recentSearches).toEqual([]);
    });

    it('saves to localStorage when adding', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('test search');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'viberater:recent-searches',
        expect.stringContaining('"term":"test search"')
      );
    });

    it('handles localStorage save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('test search');
      });

      // Should still update state even if localStorage fails
      expect(result.current.recentSearches).toHaveLength(1);
    });
  });

  describe('Clearing Recent Searches', () => {
    it('clears all recent searches', () => {
      const initialSearches = [
        {
          term: 'search 1',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
        {
          term: 'search 2',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-02T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.clearRecentSearches();
      });

      expect(result.current.recentSearches).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'viberater:recent-searches'
      );
    });

    it('handles localStorage clear errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addRecentSearch('test');
        result.current.clearRecentSearches();
      });

      // Should still clear state even if localStorage fails
      expect(result.current.recentSearches).toEqual([]);
    });
  });

  describe('Removing Individual Searches', () => {
    it('removes specific search term', () => {
      const initialSearches = [
        {
          term: 'search 1',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
        {
          term: 'search 2',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-02T00:00:00.000Z' },
        },
        {
          term: 'search 3',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-03T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.removeRecentSearch('search 2');
      });

      expect(result.current.recentSearches).toHaveLength(2);
      expect(result.current.recentSearches.map((s) => s.term)).toEqual([
        'search 1',
        'search 3',
      ]);
    });

    it('saves to localStorage when removing', () => {
      const initialSearches = [
        {
          term: 'search 1',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.removeRecentSearch('search 1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'viberater:recent-searches',
        '[]'
      );
    });

    it('handles non-existent search term gracefully', () => {
      const initialSearches = [
        {
          term: 'search 1',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.removeRecentSearch('non-existent');
      });

      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0].term).toBe('search 1');
    });

    it('handles localStorage update errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const initialSearches = [
        {
          term: 'search 1',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-01T00:00:00.000Z' },
        },
        {
          term: 'search 2',
          type: 'recent' as const,
          metadata: { lastUsed: '2024-01-02T00:00:00.000Z' },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialSearches));
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.removeRecentSearch('search 1');
      });

      // Should still update state even if localStorage fails
      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0].term).toBe('search 2');
    });
  });

  describe('Date Metadata', () => {
    it('adds current ISO timestamp to new searches', () => {
      const { result } = renderHook(() => useRecentSearches());
      const beforeTime = new Date().toISOString();

      act(() => {
        result.current.addRecentSearch('test search');
      });

      const afterTime = new Date().toISOString();
      const lastUsed = result.current.recentSearches[0].metadata.lastUsed;

      expect(new Date(lastUsed).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
      expect(new Date(lastUsed).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime()
      );
    });
  });
});
