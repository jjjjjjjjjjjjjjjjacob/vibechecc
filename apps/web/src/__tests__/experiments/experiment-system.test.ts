/**
 * Comprehensive test suite for the A/B testing and experiments system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  experimentService,
  experimentHelpers,
  type ExperimentConfig,
} from '@/lib/enhanced-posthog-experiments';
import {
  useExperiment,
  useFeatureFlag,
  useExperimentManagement,
} from '@/hooks/use-experiment-system';

// Mock dependencies
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({
    user: { id: 'test-user-123' },
  }),
}));

vi.mock('@/lib/enhanced-posthog', () => ({
  enhancedAnalytics: {
    captureWithContext: vi.fn(),
    trackPerformanceMetric: vi.fn(),
  },
}));

vi.mock('@/lib/performance-monitoring', () => ({
  performanceMonitor: {
    trackMetric: vi.fn(),
  },
}));

describe('ExperimentService', () => {
  beforeEach(() => {
    // Clear all experiments and assignments before each test
    experimentService.clearExperiments();
    experimentService.clearAssignments();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Experiment Configuration', () => {
    it('should configure a valid experiment', () => {
      const config = experimentHelpers.createSimpleABTest(
        'test-experiment',
        'Test A/B Test',
        { version: 'control' },
        { version: 'variant' }
      );

      expect(() => experimentService.configureExperiment(config)).not.toThrow();
    });

    it('should reject invalid experiment configurations', () => {
      const invalidConfig = {
        id: '',
        name: '',
        description: 'Invalid experiment',
        status: 'draft' as const,
        startDate: new Date().toISOString(),
        variants: [], // Invalid: no variants
        metrics: [],
        significanceLevel: 0.05,
        minimumDetectableEffect: 0.05,
        trafficAllocation: 1.0,
      };

      expect(() =>
        experimentService.configureExperiment(invalidConfig)
      ).toThrow();
    });

    it('should validate variant allocations sum to 1', () => {
      const config: ExperimentConfig = {
        id: 'test-invalid-allocation',
        name: 'Invalid Allocation Test',
        description: 'Test with invalid allocation',
        status: 'draft',
        startDate: new Date().toISOString(),
        trafficAllocation: 1.0,
        significanceLevel: 0.05,
        minimumDetectableEffect: 0.05,
        variants: [
          {
            id: 'control',
            name: 'Control',
            description: 'Control variant',
            allocation: 0.3,
            config: {},
            isControl: true,
          },
          {
            id: 'variant',
            name: 'Variant',
            description: 'Test variant',
            allocation: 0.8, // Invalid: 0.3 + 0.8 = 1.1
            config: {},
            isControl: false,
          },
        ],
        metrics: [
          {
            id: 'conversion',
            name: 'Conversion Rate',
            type: 'conversion',
            goal: 'increase',
            primaryMetric: true,
          },
        ],
      };

      expect(() => experimentService.configureExperiment(config)).toThrow(
        'Variant allocations must sum to 1'
      );
    });

    it('should require exactly one control variant', () => {
      const config: ExperimentConfig = {
        id: 'test-no-control',
        name: 'No Control Test',
        description: 'Test with no control',
        status: 'draft',
        startDate: new Date().toISOString(),
        trafficAllocation: 1.0,
        significanceLevel: 0.05,
        minimumDetectableEffect: 0.05,
        variants: [
          {
            id: 'variant1',
            name: 'Variant 1',
            description: 'First variant',
            allocation: 0.5,
            config: {},
            isControl: false, // No control
          },
          {
            id: 'variant2',
            name: 'Variant 2',
            description: 'Second variant',
            allocation: 0.5,
            config: {},
            isControl: false, // No control
          },
        ],
        metrics: [
          {
            id: 'conversion',
            name: 'Conversion Rate',
            type: 'conversion',
            goal: 'increase',
            primaryMetric: true,
          },
        ],
      };

      expect(() => experimentService.configureExperiment(config)).toThrow(
        'Experiment must have exactly one control variant'
      );
    });
  });

  describe('User Assignment', () => {
    beforeEach(() => {
      const config = experimentHelpers.createSimpleABTest(
        'test-assignment',
        'Assignment Test',
        { version: 'control' },
        { version: 'variant' }
      );
      config.status = 'running';
      experimentService.configureExperiment(config);
    });

    it('should assign users to variants consistently', () => {
      const userId = 'consistent-user';

      // Get variant multiple times
      const variant1 = experimentService.getVariant('test-assignment', userId);
      const variant2 = experimentService.getVariant('test-assignment', userId);
      const variant3 = experimentService.getVariant('test-assignment', userId);

      expect(variant1).toEqual(variant2);
      expect(variant2).toEqual(variant3);
      expect(variant1).not.toBeNull();
    });

    it('should return null for non-running experiments', () => {
      const config = experimentHelpers.createSimpleABTest(
        'test-draft',
        'Draft Test',
        { version: 'control' },
        { version: 'variant' }
      );
      config.status = 'draft'; // Not running
      experimentService.configureExperiment(config);

      const variant = experimentService.getVariant('test-draft', 'test-user');
      expect(variant).toBeNull();
    });

    it('should respect traffic allocation', () => {
      const config = experimentHelpers.createSimpleABTest(
        'test-traffic',
        'Traffic Test',
        { version: 'control' },
        { version: 'variant' }
      );
      config.status = 'running';
      config.trafficAllocation = 0.0; // No traffic
      experimentService.configureExperiment(config);

      const variant = experimentService.getVariant('test-traffic', 'test-user');
      expect(variant).toBeNull();
    });

    it('should distribute users across variants', () => {
      const assignments: Record<string, number> = {};
      const totalUsers = 1000;

      // Simulate many users
      for (let i = 0; i < totalUsers; i++) {
        const variant = experimentService.getVariant(
          'test-assignment',
          `user-${i}`
        );
        if (variant) {
          assignments[variant.id] = (assignments[variant.id] || 0) + 1;
        }
      }

      // Should have assignments to both variants
      expect(Object.keys(assignments).length).toBe(2);

      // Distribution should be roughly equal (within reasonable variance)
      const controlCount = assignments['test-assignment_control'] || 0;
      const variantCount = assignments['test-assignment_variant'] || 0;
      const ratio =
        Math.min(controlCount, variantCount) /
        Math.max(controlCount, variantCount);

      expect(ratio).toBeGreaterThan(0.7); // Allow for some variance
    });
  });

  describe('Conversion Tracking', () => {
    beforeEach(() => {
      const config = experimentHelpers.createSimpleABTest(
        'test-conversion',
        'Conversion Test',
        { version: 'control' },
        { version: 'variant' }
      );
      config.status = 'running';
      experimentService.configureExperiment(config);
    });

    it('should track conversions for assigned users', () => {
      const userId = 'conversion-user';

      // Get variant first (this assigns the user)
      const variant = experimentService.getVariant('test-conversion', userId);
      expect(variant).not.toBeNull();

      // Track conversion
      expect(() => {
        experimentService.trackConversion(
          'test-conversion',
          userId,
          'test-conversion_conversion'
        );
      }).not.toThrow();
    });

    it('should not track conversions for unassigned users', () => {
      const userId = 'unassigned-user';

      // Don't get variant first, so user is not assigned

      // Track conversion - should not throw but also should not track
      expect(() => {
        experimentService.trackConversion(
          'test-conversion',
          userId,
          'test-conversion_conversion'
        );
      }).not.toThrow();
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate statistical significance', () => {
      const controlResults = [
        {
          experimentId: 'test',
          variantId: 'control',
          metricId: 'conversion',
          value: 1,
          sampleSize: 100,
          conversionRate: 0.1,
          timestamp: '',
        },
        {
          experimentId: 'test',
          variantId: 'control',
          metricId: 'conversion',
          value: 1,
          sampleSize: 100,
          conversionRate: 0.12,
          timestamp: '',
        },
      ];

      const variantResults = [
        {
          experimentId: 'test',
          variantId: 'variant',
          metricId: 'conversion',
          value: 1,
          sampleSize: 100,
          conversionRate: 0.15,
          timestamp: '',
        },
        {
          experimentId: 'test',
          variantId: 'variant',
          metricId: 'conversion',
          value: 1,
          sampleSize: 100,
          conversionRate: 0.16,
          timestamp: '',
        },
      ];

      const significance = experimentService.calculateStatisticalSignificance(
        controlResults,
        variantResults
      );

      expect(typeof significance).toBe('number');
      expect(significance).toBeGreaterThanOrEqual(0);
      expect(significance).toBeLessThanOrEqual(1);
    });

    it('should return 0 significance for empty results', () => {
      const significance = experimentService.calculateStatisticalSignificance(
        [],
        []
      );
      expect(significance).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('should create simple A/B test configuration', () => {
      const config = experimentHelpers.createSimpleABTest(
        'simple-test',
        'Simple Test',
        { feature: false },
        { feature: true }
      );

      expect(config.id).toBe('simple-test');
      expect(config.name).toBe('Simple Test');
      expect(config.variants).toHaveLength(2);
      expect(config.variants[0].isControl).toBe(true);
      expect(config.variants[1].isControl).toBe(false);
    });

    it('should create feature flag configuration', () => {
      const config = experimentHelpers.createFeatureFlag(
        'feature-test',
        'Feature Test',
        0.25
      );

      expect(config.id).toBe('feature-test');
      expect(config.status).toBe('running');
      expect(config.variants).toHaveLength(2);
      expect(config.variants[0].allocation).toBe(0.75); // 75% off
      expect(config.variants[1].allocation).toBe(0.25); // 25% on
    });
  });

  describe('Debug and Management', () => {
    it('should provide debug information', () => {
      const config = experimentHelpers.createSimpleABTest(
        'debug-test',
        'Debug Test',
        { version: 'control' },
        { version: 'variant' }
      );
      experimentService.configureExperiment(config);

      const debugInfo = experimentService.getDebugInfo();

      expect(debugInfo.experiments).toHaveLength(1);
      expect(debugInfo.experiments[0].id).toBe('debug-test');
      expect(typeof debugInfo.activeCount).toBe('number');
    });

    it('should clear assignments', () => {
      const userId = 'clear-test-user';

      // Create and assign user to experiment
      const config = experimentHelpers.createSimpleABTest(
        'clear-test',
        'Clear Test',
        { version: 'control' },
        { version: 'variant' }
      );
      config.status = 'running';
      experimentService.configureExperiment(config);

      const variant1 = experimentService.getVariant('clear-test', userId);
      expect(variant1).not.toBeNull();

      // Clear assignments
      experimentService.clearAssignments();

      // Should get new assignment (might be different variant)
      const variant2 = experimentService.getVariant('clear-test', userId);
      expect(variant2).not.toBeNull();
      // Note: We can't guarantee the variant is different due to random assignment
    });
  });
});

describe('React Hooks', () => {
  beforeEach(() => {
    experimentService.clearExperiments();
    experimentService.clearAssignments();
    localStorage.clear();
  });

  describe('useExperiment', () => {
    it('should return experiment variant', () => {
      const config = experimentHelpers.createSimpleABTest(
        'hook-test',
        'Hook Test',
        { feature: false },
        { feature: true }
      );
      config.status = 'running';
      experimentService.configureExperiment(config);

      const { result } = renderHook(() => useExperiment('hook-test'));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.variant).not.toBeNull();
      expect(result.current.isInExperiment).toBe(true);
      expect(typeof result.current.trackConversion).toBe('function');
    });

    it('should handle non-existent experiments', () => {
      const { result } = renderHook(() => useExperiment('non-existent'));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.variant).toBeNull();
      expect(result.current.isInExperiment).toBe(false);
    });
  });

  describe('useFeatureFlag', () => {
    it('should return feature flag state', () => {
      const config = experimentHelpers.createFeatureFlag(
        'flag-test',
        'Flag Test',
        1.0 // 100% enabled
      );
      experimentService.configureExperiment(config);

      const { result } = renderHook(() => useFeatureFlag('flag-test'));

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.isEnabled).toBe('boolean');
      expect(typeof result.current.trackUsage).toBe('function');
    });

    it('should return default value for non-existent flags', () => {
      const { result } = renderHook(() =>
        useFeatureFlag('non-existent-flag', true)
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isEnabled).toBe(true); // Default value
    });
  });

  describe('useExperimentManagement', () => {
    it('should provide experiment management functions', () => {
      const { result } = renderHook(() => useExperimentManagement());

      expect(typeof result.current.createExperiment).toBe('function');
      expect(typeof result.current.createSimpleABTest).toBe('function');
      expect(typeof result.current.createFeatureFlag).toBe('function');
      expect(typeof result.current.clearAllAssignments).toBe('function');
      expect(Array.isArray(result.current.experiments)).toBe(true);
    });

    it('should create experiments successfully', () => {
      const { result } = renderHook(() => useExperimentManagement());

      act(() => {
        const createResult = result.current.createSimpleABTest(
          'mgmt-test',
          'Management Test',
          { version: 'old' },
          { version: 'new' }
        );
        expect(createResult.success).toBe(true);
      });

      expect(result.current.experiments.length).toBeGreaterThan(0);
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  beforeEach(() => {
    experimentService.clearExperiments();
    experimentService.clearAssignments();
    localStorage.clear();
  });

  it('should handle complete experiment lifecycle', () => {
    // 1. Create experiment
    const config = experimentHelpers.createSimpleABTest(
      'lifecycle-test',
      'Lifecycle Test',
      { feature: false },
      { feature: true }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);

    // 2. Assign user
    const userId = 'lifecycle-user';
    const variant = experimentService.getVariant('lifecycle-test', userId, {
      userAgent: 'test-agent',
      platform: 'web',
    });

    expect(variant).not.toBeNull();

    // 3. Track conversion
    experimentService.trackConversion(
      'lifecycle-test',
      userId,
      'lifecycle-test_conversion',
      1,
      { source: 'integration-test' }
    );

    // 4. Get user experiments
    const userExperiments = experimentService.getActiveExperiments(userId);
    expect(userExperiments.length).toBe(1);
    expect(userExperiments[0].experiment.id).toBe('lifecycle-test');

    // 5. Get debug info
    const debugInfo = experimentService.getDebugInfo();
    expect(debugInfo.experiments.length).toBe(1);
    expect(debugInfo.assignments.length).toBe(1);
  });

  it('should persist assignments across sessions', () => {
    // Create experiment
    const config = experimentHelpers.createSimpleABTest(
      'persistence-test',
      'Persistence Test',
      { version: 'old' },
      { version: 'new' }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);

    const userId = 'persistent-user';

    // Get initial assignment
    const variant1 = experimentService.getVariant('persistence-test', userId);
    expect(variant1).not.toBeNull();

    // Simulate page reload by creating new service instance
    const newService = new (experimentService.constructor as any)();

    // Configure the same experiment
    newService.configureExperiment(config);

    // Should get the same variant due to localStorage persistence
    const variant2 = newService.getVariant('persistence-test', userId);
    expect(variant2?.id).toBe(variant1?.id);
  });
});
