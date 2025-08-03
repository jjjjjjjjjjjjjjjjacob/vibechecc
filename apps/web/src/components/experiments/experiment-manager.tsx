/**
 * Experiment Manager Component
 * Admin interface for creating and managing experiments
 */

import React, { useState } from 'react';
import { useExperimentManagement } from '@/hooks/use-experiment-system';
import type {
  ExperimentConfig,
  ExperimentVariant,
  ExperimentMetric,
} from '@/lib/enhanced-posthog-experiments';

interface ExperimentFormData {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number;
  significanceLevel: number;
  minimumDetectableEffect: number;
}

export function ExperimentManager() {
  const {
    experiments,
    createExperiment,
    createSimpleABTest,
    createFeatureFlag,
    refreshExperiments,
  } = useExperimentManagement();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ExperimentFormData>({
    id: '',
    name: '',
    description: '',
    trafficAllocation: 0.5,
    significanceLevel: 0.05,
    minimumDetectableEffect: 0.05,
  });
  const [variants, setVariants] = useState<ExperimentVariant[]>([]);
  const [metrics, setMetrics] = useState<ExperimentMetric[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: ExperimentConfig = {
      ...formData,
      status: 'draft',
      startDate: new Date().toISOString(),
      variants,
      metrics,
    };

    const result = createExperiment(config);
    if (result.success) {
      setShowCreateForm(false);
      resetForm();
      refreshExperiments();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      trafficAllocation: 0.5,
      significanceLevel: 0.05,
      minimumDetectableEffect: 0.05,
    });
    setVariants([]);
    setMetrics([]);
  };

  const addVariant = () => {
    const newVariant: ExperimentVariant = {
      id: `${formData.id}_variant_${variants.length + 1}`,
      name: `Variant ${variants.length + 1}`,
      description: '',
      allocation: 0.5,
      config: {},
      isControl: variants.length === 0,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const updateVariant = (
    index: number,
    field: keyof ExperimentVariant,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addMetric = () => {
    const newMetric: ExperimentMetric = {
      id: `${formData.id}_metric_${metrics.length + 1}`,
      name: `Metric ${metrics.length + 1}`,
      type: 'conversion',
      goal: 'increase',
      primaryMetric: metrics.length === 0,
    };
    setMetrics([...metrics, newMetric]);
  };

  const removeMetric = (index: number) => {
    const newMetrics = metrics.filter((_, i) => i !== index);
    setMetrics(newMetrics);
  };

  const updateMetric = (
    index: number,
    field: keyof ExperimentMetric,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setMetrics(newMetrics);
  };

  const createQuickABTest = () => {
    const id = `ab_test_${Date.now()}`;
    const result = createSimpleABTest(
      id,
      'new a/b test',
      { version: 'control' },
      { version: 'variant' }
    );

    if (result.success) {
      refreshExperiments();
    }
  };

  const createQuickFeatureFlag = () => {
    const id = `feature_flag_${Date.now()}`;
    const result = createFeatureFlag(id, 'new feature flag', 0.1);

    if (result.success) {
      refreshExperiments();
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production unless explicitly enabled
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">experiment manager</h2>
        <div className="flex gap-2">
          <button
            onClick={createQuickABTest}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            quick a/b test
          </button>
          <button
            onClick={createQuickFeatureFlag}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          >
            quick feature flag
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
          >
            {showCreateForm ? 'cancel' : 'create experiment'}
          </button>
        </div>
      </div>

      {/* Existing Experiments */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold">
          existing experiments ({experiments.length})
        </h3>
        <div className="grid gap-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="rounded border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">{exp.name}</h4>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    exp.status === 'running'
                      ? 'bg-green-100 text-green-800'
                      : exp.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : exp.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {exp.status}
                </span>
              </div>
              <div className="mb-2 text-sm text-gray-600">
                {exp.description}
              </div>
              <div className="text-xs text-gray-500">
                <div>id: {exp.id}</div>
                <div>variants: {exp.variants.length}</div>
                <div>traffic: {(exp.trafficAllocation * 100).toFixed(0)}%</div>
                <div>
                  significance: {(exp.significanceLevel * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Experiment Form */}
      {showCreateForm && (
        <div className="rounded border border-gray-200 p-6">
          <h3 className="mb-4 text-lg font-semibold">create new experiment</h3>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  id
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  traffic allocation (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.trafficAllocation * 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trafficAllocation: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  significance level (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.significanceLevel * 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      significanceLevel: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Variants */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium">variants</h4>
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  add variant
                </button>
              </div>

              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="mb-3 rounded border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      variant {index + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div>
                      <label className="block text-xs text-gray-600">
                        name
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(index, 'name', e.target.value)
                        }
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        allocation (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.allocation * 100}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'allocation',
                            parseFloat(e.target.value) / 100
                          )
                        }
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={variant.isControl}
                          onChange={(e) =>
                            updateVariant(index, 'isControl', e.target.checked)
                          }
                          className="mr-1"
                        />
                        is control
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium">metrics</h4>
                <button
                  type="button"
                  onClick={addMetric}
                  className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                >
                  add metric
                </button>
              </div>

              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="mb-3 rounded border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      metric {index + 1}
                    </span>
                    {metrics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMetric(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div>
                      <label className="block text-xs text-gray-600">
                        name
                      </label>
                      <input
                        type="text"
                        value={metric.name}
                        onChange={(e) =>
                          updateMetric(index, 'name', e.target.value)
                        }
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        type
                      </label>
                      <select
                        value={metric.type}
                        onChange={(e) =>
                          updateMetric(index, 'type', e.target.value)
                        }
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="conversion">conversion</option>
                        <option value="revenue">revenue</option>
                        <option value="engagement">engagement</option>
                        <option value="performance">performance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        goal
                      </label>
                      <select
                        value={metric.goal}
                        onChange={(e) =>
                          updateMetric(index, 'goal', e.target.value)
                        }
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="increase">increase</option>
                        <option value="decrease">decrease</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={metric.primaryMetric}
                          onChange={(e) =>
                            updateMetric(
                              index,
                              'primaryMetric',
                              e.target.checked
                            )
                          }
                          className="mr-1"
                        />
                        primary
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={variants.length < 2 || metrics.length < 1}
                className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-300"
              >
                create experiment
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
