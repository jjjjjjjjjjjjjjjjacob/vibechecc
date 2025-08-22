/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAbTest, useBinaryAbTest, useMultivariateTest } from '@/hooks/use-ab-testing';
import { trackEvents } from '@/lib/track-events';

// Mock PostHog hooks
vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: vi.fn(),
  useFeatureFlagPayload: vi.fn(),
  usePostHog: vi.fn(() => ({})),
}));

// Mock track events
vi.mock('@/lib/track-events', () => ({
  trackEvents: {
    experimentExposed: vi.fn(),
    experimentConversion: vi.fn(),
    experimentAction: vi.fn(),
    featureRolloutExposed: vi.fn(),
    featureRolloutAction: vi.fn(),
  },
}));

const mockUseFeatureFlagEnabled = vi.mocked(await import('posthog-js/react')).useFeatureFlagEnabled;
const mockUseFeatureFlagPayload = vi.mocked(await import('posthog-js/react')).useFeatureFlagPayload;

describe('useAbTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default variant when flag is disabled', () => {
    mockUseFeatureFlagEnabled.mockReturnValue(false);
    mockUseFeatureFlagPayload.mockReturnValue(null);

    const config = {
      flagKey: 'test-experiment',
      variants: [
        { id: 'control', name: 'Control' },
        { id: 'test', name: 'Test' },
      ],
      defaultVariant: 'control',
    };

    const { result } = renderHook(() => useAbTest(config));

    expect(result.current.variant.id).toBe('control');
    expect(result.current.isEnabled).toBe(false);
  });

  it('should track experiment exposure', () => {
    mockUseFeatureFlagEnabled.mockReturnValue(true);
    mockUseFeatureFlagPayload.mockReturnValue({ variant: 'test' });

    const config = {
      flagKey: 'test-experiment',
      variants: [
        { id: 'control', name: 'Control' },
        { id: 'test', name: 'Test' },
      ],
      defaultVariant: 'control',
    };

    renderHook(() => useAbTest(config));

    expect(trackEvents.experimentExposed).toHaveBeenCalledWith(
      'test-experiment',
      'test',
      'Test'
    );
  });

  it('should track conversions correctly', () => {
    mockUseFeatureFlagEnabled.mockReturnValue(true);
    mockUseFeatureFlagPayload.mockReturnValue({ variant: 'test' });

    const config = {
      flagKey: 'test-experiment',
      variants: [
        { id: 'control', name: 'Control' },
        { id: 'test', name: 'Test' },
      ],
      defaultVariant: 'control',
    };

    const { result } = renderHook(() => useAbTest(config));

    act(() => {
      result.current.trackConversion('signup', 1, { source: 'hero' });
    });

    expect(trackEvents.experimentConversion).toHaveBeenCalledWith(
      'test-experiment',
      'test',
      'signup',
      1,
      { source: 'hero' }
    );
  });
});

describe('useBinaryAbTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide binary test helpers', () => {
    mockUseFeatureFlagEnabled.mockReturnValue(true);
    mockUseFeatureFlagPayload.mockReturnValue({ variant: 'test' });

    const { result } = renderHook(() => 
      useBinaryAbTest('binary-test', {
        variantAName: 'Original',
        variantBName: 'New Design',
      })
    );

    expect(result.current.isVariantA).toBe(false);
    expect(result.current.isVariantB).toBe(true);
    expect(result.current.isControl).toBe(false);
    expect(result.current.isTest).toBe(true);
  });
});

describe('useMultivariateTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle multiple variants', () => {
    mockUseFeatureFlagEnabled.mockReturnValue(true);
    mockUseFeatureFlagPayload.mockReturnValue({ variant: 'variant-b' });

    const variants = ['variant-a', 'variant-b', 'variant-c'];

    const { result } = renderHook(() => 
      useMultivariateTest('multivariate-test', variants)
    );

    expect(result.current.currentVariant).toBe('variant-b');
    expect(result.current.isVariant('variant-b')).toBe(true);
    expect(result.current.isVariant('variant-a')).toBe(false);
  });
});