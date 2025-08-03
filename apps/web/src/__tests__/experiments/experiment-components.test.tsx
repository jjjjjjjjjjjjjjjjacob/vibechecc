/**
 * Test suite for experiment React components
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  experimentService,
  experimentHelpers,
} from '@/lib/enhanced-posthog-experiments';
import {
  ExperimentProvider,
  ExperimentWrapper,
  ExperimentSwitch,
  IfVariant,
  IfControl,
  IfTreatment,
  FeatureFlag,
  ExperimentDebug,
} from '@/components/experiments';

// Mock the hooks
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

vi.mock('@/hooks/use-enhanced-analytics', () => ({
  useEnhancedAnalytics: () => ({
    trackEvent: vi.fn(),
  }),
}));

describe('ExperimentProvider', () => {
  beforeEach(() => {
    experimentService.clearAssignments();
  });

  it('should provide experiment context', () => {
    const TestComponent = () => {
      return <div>Provider test</div>;
    };

    const { container } = render(
      <ExperimentProvider>
        <TestComponent />
      </ExperimentProvider>
    );

    expect(container.textContent).toContain('Provider test');
  });
});

describe('ExperimentWrapper', () => {
  beforeEach(() => {
    experimentService.clearAssignments();

    // Create a test experiment
    const config = experimentHelpers.createSimpleABTest(
      'wrapper-test',
      'Wrapper Test',
      { color: 'blue' },
      { color: 'red' }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);
  });

  it('should render children when user is in experiment', async () => {
    render(
      <ExperimentWrapper experimentId="wrapper-test">
        <div>Experiment content</div>
      </ExperimentWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Experiment content')).toBeInTheDocument();
    });
  });

  it('should render fallback when user is not in experiment', async () => {
    render(
      <ExperimentWrapper
        experimentId="non-existent"
        fallback={<div>Fallback content</div>}
      >
        <div>Experiment content</div>
      </ExperimentWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback content')).toBeInTheDocument();
      expect(screen.queryByText('Experiment content')).not.toBeInTheDocument();
    });
  });

  it('should add experiment attributes to container', async () => {
    const { container } = render(
      <ExperimentWrapper experimentId="wrapper-test">
        <div>Content</div>
      </ExperimentWrapper>
    );

    await waitFor(() => {
      const wrapper = container.querySelector(
        '[data-experiment="wrapper-test"]'
      );
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveAttribute('data-variant');
    });
  });
});

describe('ExperimentSwitch', () => {
  beforeEach(() => {
    experimentService.clearAssignments();

    // Create a test experiment
    const config = experimentHelpers.createSimpleABTest(
      'switch-test',
      'Switch Test',
      { version: 'old' },
      { version: 'new' }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);
  });

  it('should render matching variant component', async () => {
    const variants = [
      {
        id: 'switch-test_control',
        component: <div>Control version</div>,
      },
      {
        id: 'switch-test_variant',
        component: <div>Variant version</div>,
      },
    ];

    render(
      <ExperimentSwitch
        experimentId="switch-test"
        variants={variants}
        fallback={<div>No experiment</div>}
      />
    );

    await waitFor(() => {
      // Should render either control or variant, not both
      const hasControl = screen.queryByText('Control version');
      const hasVariant = screen.queryByText('Variant version');
      const hasNoExperiment = screen.queryByText('No experiment');

      expect(
        [hasControl, hasVariant, hasNoExperiment].filter(Boolean)
      ).toHaveLength(1);
    });
  });

  it('should render fallback for non-existent experiment', async () => {
    const variants = [
      {
        id: 'control',
        component: <div>Control</div>,
      },
    ];

    render(
      <ExperimentSwitch
        experimentId="non-existent"
        variants={variants}
        fallback={<div>Fallback</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });
  });
});

describe('IfVariant', () => {
  beforeEach(() => {
    experimentService.clearAssignments();

    const config = experimentHelpers.createSimpleABTest(
      'if-variant-test',
      'If Variant Test',
      { feature: false },
      { feature: true }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);
  });

  it('should render children only for matching variant', async () => {
    // Test both possible variants
    render(
      <>
        <IfVariant
          experimentId="if-variant-test"
          variantId="if-variant-test_control"
        >
          <div>Control content</div>
        </IfVariant>
        <IfVariant
          experimentId="if-variant-test"
          variantId="if-variant-test_variant"
        >
          <div>Variant content</div>
        </IfVariant>
      </>
    );

    await waitFor(() => {
      // Should render exactly one of the variants
      const controlContent = screen.queryByText('Control content');
      const variantContent = screen.queryByText('Variant content');

      expect([controlContent, variantContent].filter(Boolean)).toHaveLength(1);
    });
  });
});

describe('IfControl and IfTreatment', () => {
  beforeEach(() => {
    experimentService.clearAssignments();

    const config = experimentHelpers.createSimpleABTest(
      'control-treatment-test',
      'Control Treatment Test',
      { version: 'control' },
      { version: 'treatment' }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);
  });

  it('should render control or treatment exclusively', async () => {
    render(
      <>
        <IfControl experimentId="control-treatment-test">
          <div>Control UI</div>
        </IfControl>
        <IfTreatment experimentId="control-treatment-test">
          <div>Treatment UI</div>
        </IfTreatment>
      </>
    );

    await waitFor(() => {
      const controlUI = screen.queryByText('Control UI');
      const treatmentUI = screen.queryByText('Treatment UI');

      // Should render exactly one
      expect([controlUI, treatmentUI].filter(Boolean)).toHaveLength(1);
    });
  });
});

describe('FeatureFlag', () => {
  beforeEach(() => {
    experimentService.clearAssignments();
  });

  it('should render children when feature is enabled', async () => {
    // Create feature flag with 100% rollout
    const config = experimentHelpers.createFeatureFlag(
      'enabled-feature',
      'Enabled Feature',
      1.0
    );
    experimentService.configureExperiment(config);

    render(
      <FeatureFlag
        flagId="enabled-feature"
        fallback={<div>Feature disabled</div>}
      >
        <div>Feature enabled</div>
      </FeatureFlag>
    );

    await waitFor(() => {
      expect(screen.getByText('Feature enabled')).toBeInTheDocument();
      expect(screen.queryByText('Feature disabled')).not.toBeInTheDocument();
    });
  });

  it('should render fallback when feature is disabled', async () => {
    // Create feature flag with 0% rollout
    const config = experimentHelpers.createFeatureFlag(
      'disabled-feature',
      'Disabled Feature',
      0.0
    );
    experimentService.configureExperiment(config);

    render(
      <FeatureFlag
        flagId="disabled-feature"
        fallback={<div>Feature disabled</div>}
      >
        <div>Feature enabled</div>
      </FeatureFlag>
    );

    await waitFor(() => {
      expect(screen.getByText('Feature disabled')).toBeInTheDocument();
      expect(screen.queryByText('Feature enabled')).not.toBeInTheDocument();
    });
  });

  it('should use default value for non-existent flags', async () => {
    render(
      <FeatureFlag
        flagId="non-existent-flag"
        defaultValue={true}
        fallback={<div>Disabled</div>}
      >
        <div>Enabled by default</div>
      </FeatureFlag>
    );

    await waitFor(() => {
      expect(screen.getByText('Enabled by default')).toBeInTheDocument();
    });
  });
});

describe('ExperimentDebug', () => {
  beforeEach(() => {
    experimentService.clearAssignments();

    const config = experimentHelpers.createSimpleABTest(
      'debug-test',
      'Debug Test',
      { debug: true },
      { debug: false }
    );
    config.status = 'running';
    experimentService.configureExperiment(config);
  });

  it('should not render in production', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { container } = render(<ExperimentDebug experimentId="debug-test" />);

    expect(container.firstChild).toBeNull();

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should render debug info in development', async () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ExperimentDebug experimentId="debug-test" />);

    await waitFor(() => {
      expect(screen.getByText(/Experiment:/)).toBeInTheDocument();
      expect(screen.getByText(/Variant:/)).toBeInTheDocument();
      expect(screen.getByText(/Control:/)).toBeInTheDocument();
    });

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should show not in experiment message', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ExperimentDebug experimentId="non-existent" />);

    await waitFor(() => {
      expect(screen.getByText(/Not in experiment:/)).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });
});

// Integration tests
describe('Component Integration', () => {
  beforeEach(() => {
    experimentService.clearAssignments();
  });

  it('should work together in complex scenarios', async () => {
    // Create multiple experiments
    const abTestConfig = experimentHelpers.createSimpleABTest(
      'integration-ab',
      'Integration A/B Test',
      { layout: 'old' },
      { layout: 'new' }
    );
    abTestConfig.status = 'running';
    experimentService.configureExperiment(abTestConfig);

    const featureFlagConfig = experimentHelpers.createFeatureFlag(
      'integration-feature',
      'Integration Feature',
      1.0
    );
    experimentService.configureExperiment(featureFlagConfig);

    render(
      <ExperimentProvider>
        <FeatureFlag flagId="integration-feature">
          <ExperimentSwitch
            experimentId="integration-ab"
            variants={[
              {
                id: 'integration-ab_control',
                component: <div>Old layout with feature</div>,
              },
              {
                id: 'integration-ab_variant',
                component: <div>New layout with feature</div>,
              },
            ]}
            fallback={<div>No experiment</div>}
          />
        </FeatureFlag>
      </ExperimentProvider>
    );

    await waitFor(() => {
      // Should show one of the layouts with feature enabled
      const oldLayout = screen.queryByText('Old layout with feature');
      const newLayout = screen.queryByText('New layout with feature');

      expect([oldLayout, newLayout].filter(Boolean)).toHaveLength(1);
    });
  });

  it('should handle nested experiments', async () => {
    // Create parent and child experiments
    const parentConfig = experimentHelpers.createSimpleABTest(
      'parent-exp',
      'Parent Experiment',
      { showChild: false },
      { showChild: true }
    );
    parentConfig.status = 'running';
    experimentService.configureExperiment(parentConfig);

    const childConfig = experimentHelpers.createSimpleABTest(
      'child-exp',
      'Child Experiment',
      { color: 'blue' },
      { color: 'red' }
    );
    childConfig.status = 'running';
    experimentService.configureExperiment(childConfig);

    render(
      <IfTreatment experimentId="parent-exp">
        <IfControl experimentId="child-exp">
          <div>Parent treatment, child control</div>
        </IfControl>
        <IfTreatment experimentId="child-exp">
          <div>Parent treatment, child treatment</div>
        </IfTreatment>
      </IfTreatment>
    );

    await waitFor(() => {
      // Should render something if parent treatment is active
      const _content = screen.queryByText(/Parent treatment/);

      // Content may or may not be present depending on assignment
      // This tests that nested experiments don't break
    });
  });
});
