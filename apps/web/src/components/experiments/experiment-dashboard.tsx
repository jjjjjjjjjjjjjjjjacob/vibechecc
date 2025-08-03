/**
 * Experiment Dashboard Component
 * Development tool for viewing and managing experiments
 */

import React, { useState } from 'react';
import {
  useExperimentManagement,
  useExperimentTesting,
} from '@/hooks/use-experiment-system';

export function ExperimentDashboard() {
  const { experiments, getDebugInfo, getUserExperiments, clearAllAssignments } =
    useExperimentManagement();

  const {
    testingMode,
    forceUserIntoVariant,
    clearForcedVariant,
    getTestingInfo,
  } = useExperimentTesting();

  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const debugInfo = getDebugInfo();
  const userExperiments = getUserExperiments();
  const testingInfo = getTestingInfo();

  const handleForceVariant = () => {
    if (selectedExperiment && selectedVariant) {
      forceUserIntoVariant(selectedExperiment, selectedVariant);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-md rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">experiment dashboard</h3>
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDebugInfo ? 'hide' : 'show'} debug
        </button>
      </div>

      {/* Active Experiments */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium">
          active experiments (
          {experiments.filter((e) => e.status === 'running').length})
        </h4>
        {experiments
          .filter((e) => e.status === 'running')
          .map((exp) => (
            <div key={exp.id} className="mb-2 rounded bg-green-50 p-2 text-xs">
              <div className="font-medium">{exp.name}</div>
              <div className="text-gray-600">{exp.id}</div>
              <div className="text-gray-600">
                {exp.variants.length} variants
              </div>
            </div>
          ))}
      </div>

      {/* User's Current Experiments */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium">
          your experiments ({userExperiments.length})
        </h4>
        {userExperiments.map(({ experiment, variant, assignment }) => (
          <div
            key={assignment.experimentId}
            className="mb-2 rounded bg-blue-50 p-2 text-xs"
          >
            <div className="font-medium">{experiment.name}</div>
            <div className="text-blue-600">variant: {variant.name}</div>
            <div className="text-gray-600">
              {variant.isControl ? 'control' : 'treatment'}
            </div>
          </div>
        ))}
      </div>

      {/* Testing Controls */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium">testing controls</h4>
        <div className="mb-2">
          <select
            value={selectedExperiment}
            onChange={(e) => setSelectedExperiment(e.target.value)}
            className="w-full rounded border border-gray-300 p-1 text-xs"
          >
            <option value="">select experiment</option>
            {experiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.name}
              </option>
            ))}
          </select>
        </div>

        {selectedExperiment && (
          <div className="mb-2">
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full rounded border border-gray-300 p-1 text-xs"
            >
              <option value="">select variant</option>
              {experiments
                .find((e) => e.id === selectedExperiment)
                ?.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} {variant.isControl ? '(control)' : ''}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleForceVariant}
            disabled={!selectedExperiment || !selectedVariant}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            force variant
          </button>
          <button
            onClick={clearForcedVariant}
            className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
          >
            clear forced
          </button>
          <button
            onClick={clearAllAssignments}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            clear all
          </button>
        </div>

        {testingMode && (
          <div className="mt-2 rounded bg-orange-50 p-2 text-xs text-orange-800">
            testing mode active: {testingInfo.forcedVariant}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium">debug information</h4>
          <div className="max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
