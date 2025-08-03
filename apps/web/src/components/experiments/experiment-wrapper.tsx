/**
 * Experiment Wrapper Component
 * Declarative component for A/B testing UI variants
 */

import React, { useEffect } from 'react';
import {
  useExperiment,
  useExperimentAnalytics,
} from '@/hooks/use-experiment-system';

interface ExperimentWrapperProps {
  experimentId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onVariantExposed?: (
    variantId: string,
    config: Record<string, unknown>
  ) => void;
  context?: Record<string, unknown>;
  className?: string;
}

export function ExperimentWrapper({
  experimentId,
  children,
  fallback = null,
  onVariantExposed,
  context,
  className,
}: ExperimentWrapperProps) {
  const { variant, isLoading, config, isInExperiment } = useExperiment(
    experimentId,
    context
  );
  const { trackVariantExposure } = useExperimentAnalytics(experimentId);

  useEffect(() => {
    if (variant && !isLoading) {
      trackVariantExposure(variant.id, context);
      onVariantExposed?.(variant.id, config);
    }
  }, [
    variant,
    isLoading,
    trackVariantExposure,
    onVariantExposed,
    config,
    context,
  ]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isInExperiment) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={className}
      data-experiment={experimentId}
      data-variant={variant?.id}
    >
      {children}
    </div>
  );
}

interface VariantProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function Variant({ id, children, className }: VariantProps) {
  return (
    <div className={className} data-variant={id}>
      {children}
    </div>
  );
}

interface ExperimentSwitchProps {
  experimentId: string;
  variants: Array<{
    id: string;
    component: React.ReactNode;
  }>;
  fallback?: React.ReactNode;
  context?: Record<string, unknown>;
  onVariantRender?: (variantId: string) => void;
}

export function ExperimentSwitch({
  experimentId,
  variants,
  fallback = null,
  context,
  onVariantRender,
}: ExperimentSwitchProps) {
  const { variant, isLoading, isInExperiment } = useExperiment(
    experimentId,
    context
  );
  const { trackVariantExposure } = useExperimentAnalytics(experimentId);

  useEffect(() => {
    if (variant && !isLoading) {
      trackVariantExposure(variant.id, context);
      onVariantRender?.(variant.id);
    }
  }, [variant, isLoading, trackVariantExposure, onVariantRender, context]);

  if (isLoading || !isInExperiment || !variant) {
    return <>{fallback}</>;
  }

  const matchingVariant = variants.find((v) => v.id === variant.id);
  return <>{matchingVariant?.component || fallback}</>;
}

// Conditional rendering based on experiment variant
interface IfVariantProps {
  experimentId: string;
  variantId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: Record<string, unknown>;
}

export function IfVariant({
  experimentId,
  variantId,
  children,
  fallback = null,
  context,
}: IfVariantProps) {
  const { variant, isLoading } = useExperiment(experimentId, context);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (variant?.id === variantId) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Conditional rendering for control vs treatment
interface IfControlProps {
  experimentId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: Record<string, unknown>;
}

export function IfControl({
  experimentId,
  children,
  fallback = null,
  context,
}: IfControlProps) {
  const { isControl, isLoading } = useExperiment(experimentId, context);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (isControl) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface IfTreatmentProps {
  experimentId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: Record<string, unknown>;
}

export function IfTreatment({
  experimentId,
  children,
  fallback = null,
  context,
}: IfTreatmentProps) {
  const { isVariant, isLoading } = useExperiment(experimentId, context);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (isVariant) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Feature flag component
interface FeatureFlagProps {
  flagId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  defaultValue?: boolean;
  onFlagChange?: (isEnabled: boolean) => void;
}

export function FeatureFlag({
  flagId,
  children,
  fallback = null,
  defaultValue = false,
  onFlagChange,
}: FeatureFlagProps) {
  const { isInExperiment, isLoading } = useExperiment(flagId);
  const enabled = isLoading ? defaultValue : (isInExperiment ?? defaultValue);

  useEffect(() => {
    if (!isLoading) {
      onFlagChange?.(enabled);
    }
  }, [enabled, isLoading, onFlagChange]);

  if (isLoading) {
    return <>{defaultValue ? children : fallback}</>;
  }

  return <>{enabled ? children : fallback}</>;
}

// Experiment debugging component (development only)
interface ExperimentDebugProps {
  experimentId: string;
  showInProduction?: boolean;
}

export function ExperimentDebug({
  experimentId,
  showInProduction = false,
}: ExperimentDebugProps) {
  const { variant, isLoading, config, isInExperiment } =
    useExperiment(experimentId);

  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Experiment Loading: {experimentId}
      </div>
    );
  }

  if (!isInExperiment) {
    return (
      <div className="border border-gray-300 bg-gray-50 p-2 text-xs text-gray-600">
        Not in experiment: {experimentId}
      </div>
    );
  }

  return (
    <div className="border border-blue-300 bg-blue-50 p-2 text-xs text-blue-800">
      <div>
        <strong>Experiment:</strong> {experimentId}
      </div>
      <div>
        <strong>Variant:</strong> {variant?.name} ({variant?.id})
      </div>
      <div>
        <strong>Control:</strong> {variant?.isControl ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Config:</strong> {JSON.stringify(config, null, 2)}
      </div>
    </div>
  );
}
