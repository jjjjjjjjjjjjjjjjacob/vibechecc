/**
 * Enhanced PostHog A/B Testing & Experiments System
 * Extends the existing enhanced-posthog.ts with comprehensive experiment capabilities
 */

import { enhancedAnalytics } from './enhanced-posthog';
import { performanceMonitor } from './performance-monitoring';

// Experiment configuration interfaces
export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: ExperimentVariant[];
  targeting?: ExperimentTargeting;
  metrics: ExperimentMetric[];
  significanceLevel: number; // Default 0.05 (95% confidence)
  minimumDetectableEffect: number; // Default 0.05 (5% improvement)
  trafficAllocation: number; // 0-1, percentage of users to include
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // 0-1, percentage of experiment traffic
  config: Record<string, unknown>; // Variant-specific configuration
  isControl: boolean;
}

export interface ExperimentTargeting {
  userProperties?: Record<string, unknown>;
  customProperties?: Record<string, unknown>;
  countries?: string[];
  languages?: string[];
  platforms?: ('web' | 'mobile' | 'desktop')[];
  newUsers?: boolean;
  returningUsers?: boolean;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'performance';
  eventName?: string; // PostHog event to track
  goal: 'increase' | 'decrease';
  primaryMetric: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: string;
  context: Record<string, unknown>;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metricId: string;
  value: number;
  sampleSize: number;
  conversionRate?: number;
  statisticalSignificance?: number;
  confidenceInterval?: [number, number];
  pValue?: number;
  timestamp: string;
}

// Enhanced experiment service class
export class EnhancedExperimentService {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private readonly STORAGE_KEY = 'posthog_experiment_assignments';

  constructor() {
    this.loadStoredAssignments();
  }

  // Experiment configuration management
  configureExperiment(config: ExperimentConfig): void {
    this.validateExperimentConfig(config);
    this.experiments.set(config.id, config);

    enhancedAnalytics.captureWithContext('experiment_configured', {
      experiment_id: config.id,
      experiment_name: config.name,
      variant_count: config.variants.length,
      traffic_allocation: config.trafficAllocation,
      significance_level: config.significanceLevel,
      status: config.status,
    });
  }

  // Get user's variant for an experiment
  getVariant(
    experimentId: string,
    userId: string,
    context?: Record<string, unknown>
  ): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    const assignmentKey = `${experimentId}_${userId}`;
    let assignment = this.assignments.get(assignmentKey);

    if (!assignment) {
      // Check if user matches targeting criteria
      if (!this.isUserEligible(experiment, userId, context)) {
        return null;
      }

      // Assign user to variant
      const newAssignment = this.assignUserToVariant(
        experiment,
        userId,
        context
      );
      if (!newAssignment) return null;
      assignment = newAssignment;

      this.assignments.set(assignmentKey, assignment);
      this.saveAssignments();
    }

    // Track assignment if first time seeing this experiment
    this.trackExperimentView(assignment, context);

    const variant = experiment.variants.find(
      (v) => v.id === assignment.variantId
    );
    return variant || null;
  }

  // Check if user should be included in experiment
  private isUserEligible(
    experiment: ExperimentConfig,
    userId: string,
    context?: Record<string, unknown>
  ): boolean {
    // Traffic allocation check
    const hash = this.hashUserId(userId + experiment.id);
    if (hash > experiment.trafficAllocation) {
      return false;
    }

    // Targeting criteria check
    if (experiment.targeting) {
      return this.checkTargetingCriteria(experiment.targeting, userId, context);
    }

    return true;
  }

  // Assign user to a variant using consistent hashing
  private assignUserToVariant(
    experiment: ExperimentConfig,
    userId: string,
    context?: Record<string, unknown>
  ): ExperimentAssignment | null {
    const hash = this.hashUserId(userId + experiment.id + '_variant');
    let cumulativeAllocation = 0;

    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (hash <= cumulativeAllocation) {
        const assignment: ExperimentAssignment = {
          experimentId: experiment.id,
          variantId: variant.id,
          userId,
          assignedAt: new Date().toISOString(),
          context: context || {},
        };

        enhancedAnalytics.captureWithContext('experiment_user_assigned', {
          experiment_id: experiment.id,
          experiment_name: experiment.name,
          variant_id: variant.id,
          variant_name: variant.name,
          is_control: variant.isControl,
          user_id: userId,
          assignment_hash: hash,
          ...context,
        });

        return assignment;
      }
    }

    return null; // Should not happen if allocations sum to 1
  }

  // Track when user views experiment
  private trackExperimentView(
    assignment: ExperimentAssignment,
    context?: Record<string, unknown>
  ): void {
    const experiment = this.experiments.get(assignment.experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find(
      (v) => v.id === assignment.variantId
    );
    if (!variant) return;

    enhancedAnalytics.captureWithContext('experiment_viewed', {
      experiment_id: assignment.experimentId,
      experiment_name: experiment.name,
      variant_id: assignment.variantId,
      variant_name: variant.name,
      is_control: variant.isControl,
      user_id: assignment.userId,
      assigned_at: assignment.assignedAt,
      ...context,
    });
  }

  // Track experiment conversion events
  trackConversion(
    experimentId: string,
    userId: string,
    metricId: string,
    value?: number,
    context?: Record<string, unknown>
  ): void {
    const assignment = this.assignments.get(`${experimentId}_${userId}`);
    if (!assignment) return;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find(
      (v) => v.id === assignment.variantId
    );
    const metric = experiment.metrics.find((m) => m.id === metricId);

    if (!variant || !metric) return;

    enhancedAnalytics.captureWithContext('experiment_conversion', {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: assignment.variantId,
      variant_name: variant.name,
      is_control: variant.isControl,
      metric_id: metricId,
      metric_name: metric.name,
      metric_type: metric.type,
      conversion_value: value,
      user_id: userId,
      ...context,
    });

    // Track performance impact if it's a performance metric
    if (metric.type === 'performance' && value !== undefined) {
      this.trackPerformanceImpact(
        experimentId,
        assignment.variantId,
        metricId,
        value
      );
    }
  }

  // Track performance impact of experiments
  private trackPerformanceImpact(
    experimentId: string,
    variantId: string,
    metricId: string,
    value: number
  ): void {
    performanceMonitor.trackMetric('apiResponse', value, {
      experiment_id: experimentId,
      variant_id: variantId,
      metric_id: metricId,
      metric_type: 'experiment_performance',
    });
  }

  // Get all active experiments for a user
  getActiveExperiments(userId: string): Array<{
    experiment: ExperimentConfig;
    variant: ExperimentVariant;
    assignment: ExperimentAssignment;
  }> {
    const activeExperiments: Array<{
      experiment: ExperimentConfig;
      variant: ExperimentVariant;
      assignment: ExperimentAssignment;
    }> = [];

    for (const [_assignmentKey, assignment] of this.assignments) {
      if (assignment.userId === userId) {
        const experiment = this.experiments.get(assignment.experimentId);
        if (experiment && experiment.status === 'running') {
          const variant = experiment.variants.find(
            (v) => v.id === assignment.variantId
          );
          if (variant) {
            activeExperiments.push({ experiment, variant, assignment });
          }
        }
      }
    }

    return activeExperiments;
  }

  // Statistical analysis helpers
  calculateStatisticalSignificance(
    controlResults: ExperimentResult[],
    variantResults: ExperimentResult[]
  ): number {
    // Simplified z-test for conversion rate comparison
    // In production, you'd want more sophisticated statistical analysis

    if (controlResults.length === 0 || variantResults.length === 0) {
      return 0;
    }

    const controlConversion =
      controlResults.reduce((sum, r) => sum + (r.conversionRate || 0), 0) /
      controlResults.length;
    const variantConversion =
      variantResults.reduce((sum, r) => sum + (r.conversionRate || 0), 0) /
      variantResults.length;

    const controlSampleSize = controlResults.reduce(
      (sum, r) => sum + r.sampleSize,
      0
    );
    const variantSampleSize = variantResults.reduce(
      (sum, r) => sum + r.sampleSize,
      0
    );

    if (controlSampleSize === 0 || variantSampleSize === 0) {
      return 0;
    }

    // Standard error calculation
    const pooledConversion =
      (controlConversion * controlSampleSize +
        variantConversion * variantSampleSize) /
      (controlSampleSize + variantSampleSize);
    const standardError = Math.sqrt(
      pooledConversion *
        (1 - pooledConversion) *
        (1 / controlSampleSize + 1 / variantSampleSize)
    );

    if (standardError === 0) return 0;

    // Z-score calculation
    const zScore =
      Math.abs(variantConversion - controlConversion) / standardError;

    // Convert to p-value (simplified)
    return 1 - this.normalCDF(Math.abs(zScore));
  }

  // Utility functions
  private hashUserId(input: string): number {
    // Simple hash function for consistent user assignment
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Properly normalize to 0-1 range using modulo
    return (Math.abs(hash) % 2147483647) / 2147483647;
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private checkTargetingCriteria(
    targeting: ExperimentTargeting,
    userId: string,
    context?: Record<string, unknown>
  ): boolean {
    // Implement targeting logic based on your user properties
    // This is a simplified implementation

    if (
      targeting.newUsers !== undefined &&
      context?.isNewUser !== targeting.newUsers
    ) {
      return false;
    }

    if (
      targeting.returningUsers !== undefined &&
      context?.isReturningUser !== targeting.returningUsers
    ) {
      return false;
    }

    if (
      targeting.platforms &&
      context?.platform &&
      !targeting.platforms.includes(
        context.platform as 'web' | 'mobile' | 'desktop'
      )
    ) {
      return false;
    }

    return true;
  }

  private validateExperimentConfig(config: ExperimentConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Experiment must have id and name');
    }

    if (config.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const totalAllocation = config.variants.reduce(
      (sum, v) => sum + v.allocation,
      0
    );
    if (Math.abs(totalAllocation - 1) > 0.001) {
      throw new Error('Variant allocations must sum to 1');
    }

    const controlVariants = config.variants.filter((v) => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Experiment must have exactly one control variant');
    }
  }

  private loadStoredAssignments(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const assignments = JSON.parse(stored);
        for (const [key, assignment] of Object.entries(assignments)) {
          this.assignments.set(key, assignment as ExperimentAssignment);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load stored experiment assignments:', error);
    }
  }

  private saveAssignments(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const assignmentsObj = Object.fromEntries(this.assignments);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assignmentsObj));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save experiment assignments:', error);
    }
  }

  // Development and debugging helpers
  getDebugInfo(): {
    experiments: ExperimentConfig[];
    assignments: ExperimentAssignment[];
    activeCount: number;
  } {
    return {
      experiments: Array.from(this.experiments.values()),
      assignments: Array.from(this.assignments.values()),
      activeCount: Array.from(this.experiments.values()).filter(
        (e) => e.status === 'running'
      ).length,
    };
  }

  // Clear all assignments (for testing)
  clearAssignments(): void {
    this.assignments.clear();
    localStorage.removeItem(this.STORAGE_KEY);

    enhancedAnalytics.captureWithContext('experiment_assignments_cleared', {
      cleared_at: new Date().toISOString(),
      reason: 'manual_clear',
    });
  }

  // Clear all experiments (for testing)
  clearExperiments(): void {
    this.experiments.clear();
  }
}

// Global experiment service instance
export const experimentService = new EnhancedExperimentService();

// Convenience functions for common experiment operations
export const experimentHelpers = {
  // Quick experiment setup for common patterns
  createSimpleABTest: (
    id: string,
    name: string,
    controlConfig: Record<string, unknown>,
    variantConfig: Record<string, unknown>,
    trafficAllocation: number = 1.0
  ): ExperimentConfig => ({
    id,
    name,
    description: `A/B test: ${name}`,
    status: 'draft',
    startDate: new Date().toISOString(),
    trafficAllocation,
    significanceLevel: 0.05,
    minimumDetectableEffect: 0.05,
    variants: [
      {
        id: `${id}_control`,
        name: 'Control',
        description: 'Original version',
        allocation: 0.5,
        config: controlConfig,
        isControl: true,
      },
      {
        id: `${id}_variant`,
        name: 'Variant',
        description: 'Test version',
        allocation: 0.5,
        config: variantConfig,
        isControl: false,
      },
    ],
    metrics: [
      {
        id: `${id}_conversion`,
        name: 'Primary Conversion',
        type: 'conversion',
        goal: 'increase',
        primaryMetric: true,
      },
    ],
  }),

  // Feature flag style experiment
  createFeatureFlag: (
    id: string,
    name: string,
    rolloutPercentage: number
  ): ExperimentConfig => ({
    id,
    name,
    description: `Feature flag: ${name}`,
    status: 'running',
    startDate: new Date().toISOString(),
    trafficAllocation: 1.0,
    significanceLevel: 0.05,
    minimumDetectableEffect: 0.05,
    variants: [
      {
        id: `${id}_off`,
        name: 'Feature Off',
        description: 'Feature disabled',
        allocation: 1 - rolloutPercentage,
        config: { enabled: false },
        isControl: true,
      },
      {
        id: `${id}_on`,
        name: 'Feature On',
        description: 'Feature enabled',
        allocation: rolloutPercentage,
        config: { enabled: true },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: `${id}_engagement`,
        name: 'Feature Engagement',
        type: 'engagement',
        goal: 'increase',
        primaryMetric: true,
      },
    ],
  }),
};
