/**
 * @jest-environment jsdom
 */
/// <reference lib="dom" />

import { renderHook, act } from '@testing-library/react';
import {
  usePlaceholderTracking,
  useLoadingStateTracking,
  useComponentPerformance,
  useTimeToInteractive,
} from '@/hooks/use-performance-tracking';
import { trackEvents } from '@/lib/track-events';

// Mock track events
jest.mock('@/lib/track-events', () => ({
  trackEvents: {
    placeholderPerformance: jest.fn(),
    loadingStateChanged: jest.fn(),
    componentPerformance: jest.fn(),
    timeToInteractive: jest.fn(),
    firstInteraction: jest.fn(),
  },
}));

// Mock performance.now()
const mockPerformance = {
  now: jest.fn(() => 1000),
};
Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('usePlaceholderTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should track render time on mount', () => {
    const { unmount } = renderHook(() => 
      usePlaceholderTracking('test-component')
    );

    mockPerformance.now.mockReturnValue(1500);
    unmount();

    expect(trackEvents.placeholderPerformance).toHaveBeenCalledWith(
      'test-component',
      'render',
      500
    );
  });

  it('should track interaction delays', () => {
    const { result } = renderHook(() => 
      usePlaceholderTracking('test-component')
    );

    mockPerformance.now.mockReturnValue(1300);

    act(() => {
      result.current.trackInteraction('click');
    });

    expect(trackEvents.placeholderPerformance).toHaveBeenCalledWith(
      'test-component',
      'interaction',
      300,
      { interaction_type: 'click' }
    );
  });

  it('should setup intersection observer for visibility tracking', () => {
    const { result } = renderHook(() => 
      usePlaceholderTracking('test-component', { trackVisibility: true })
    );

    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.visibilityRef(mockElement);
    });

    expect(window.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });
});

describe('useLoadingStateTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should track loading state transitions', () => {
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingStateTracking('test-state', isLoading),
      { initialProps: { isLoading: false } }
    );

    // Start loading
    rerender({ isLoading: true });
    expect(trackEvents.loadingStateChanged).toHaveBeenCalledWith('test-state', 'started');

    mockPerformance.now.mockReturnValue(1500);

    // Finish loading
    rerender({ isLoading: false });
    expect(trackEvents.loadingStateChanged).toHaveBeenCalledWith(
      'test-state',
      'completed',
      500
    );
  });
});

describe('useComponentPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should track component mount and unmount', () => {
    const { unmount } = renderHook(() => 
      useComponentPerformance('test-component')
    );

    expect(trackEvents.componentPerformance).toHaveBeenCalledWith(
      'test-component',
      'mount'
    );

    mockPerformance.now.mockReturnValue(2000);
    unmount();

    expect(trackEvents.componentPerformance).toHaveBeenCalledWith(
      'test-component',
      'unmount',
      1000,
      { render_count: 1 }
    );
  });

  it('should track rerenders', () => {
    const { rerender } = renderHook(() => 
      useComponentPerformance('test-component', { trackRerender: true })
    );

    // Initial render - no rerender event
    expect(trackEvents.componentPerformance).toHaveBeenCalledTimes(1);

    // Force rerender
    rerender();

    expect(trackEvents.componentPerformance).toHaveBeenCalledWith(
      'test-component',
      'rerender',
      undefined,
      { render_count: 2 }
    );
  });
});

describe('useTimeToInteractive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should track time to interactive', () => {
    const { rerender } = renderHook(
      ({ isInteractive }) => useTimeToInteractive('test-component', isInteractive),
      { initialProps: { isInteractive: false } }
    );

    mockPerformance.now.mockReturnValue(1500);

    rerender({ isInteractive: true });

    expect(trackEvents.timeToInteractive).toHaveBeenCalledWith(
      'test-component',
      500
    );
  });

  it('should track first interaction', () => {
    const { result } = renderHook(() => 
      useTimeToInteractive('test-component', true)
    );

    mockPerformance.now.mockReturnValue(1300);

    act(() => {
      result.current.trackFirstInteraction('click', 'button');
    });

    expect(trackEvents.firstInteraction).toHaveBeenCalledWith(
      'test-component',
      'click',
      300,
      { target: 'button' }
    );
  });
});