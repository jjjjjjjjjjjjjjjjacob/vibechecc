/**
 * Experiment Provider Component
 * Provides experiment context and utilities to the component tree
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  experimentService,
  type ExperimentConfig,
} from '@/lib/enhanced-posthog-experiments';
import { useUser } from '@clerk/tanstack-react-start';
import { useEnhancedAnalytics } from '@/hooks/use-enhanced-analytics';

interface ExperimentContextType {
  experiments: ExperimentConfig[];
  isLoading: boolean;
  refreshExperiments: () => void;
  getExperiment: (id: string) => ExperimentConfig | undefined;
  isExperimentActive: (id: string) => boolean;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(
  undefined
);

interface ExperimentProviderProps {
  children: React.ReactNode;
  fallbackMode?: 'optimistic' | 'conservative';
}

export function ExperimentProvider({
  children,
  fallbackMode: _fallbackMode = 'conservative',
}: ExperimentProviderProps) {
  const { user } = useUser();
  const { trackEvent } = useEnhancedAnalytics();
  const [experiments, setExperiments] = useState<ExperimentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshExperiments = React.useCallback(() => {
    try {
      const debugInfo = experimentService.getDebugInfo();
      setExperiments(debugInfo.experiments);
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh experiments:', error);
      trackEvent('experiment_provider_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'refresh_experiments',
        user_id: user?.id,
      });
      setIsLoading(false);
    }
  }, [trackEvent, user?.id]);

  useEffect(() => {
    refreshExperiments();
  }, [refreshExperiments]);

  const getExperiment = React.useCallback(
    (id: string): ExperimentConfig | undefined => {
      return experiments.find((exp) => exp.id === id);
    },
    [experiments]
  );

  const isExperimentActive = React.useCallback(
    (id: string): boolean => {
      const experiment = getExperiment(id);
      return experiment?.status === 'running';
    },
    [getExperiment]
  );

  const contextValue: ExperimentContextType = {
    experiments,
    isLoading,
    refreshExperiments,
    getExperiment,
    isExperimentActive,
  };

  return (
    <ExperimentContext.Provider value={contextValue}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperimentContext(): ExperimentContextType {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error(
      'useExperimentContext must be used within an ExperimentProvider'
    );
  }
  return context;
}
