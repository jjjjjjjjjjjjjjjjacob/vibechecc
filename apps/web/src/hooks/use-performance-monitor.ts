import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameCount: number;
  isLowPerformance: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  connectionType?: string;
  adaptiveQuality: 'high' | 'medium' | 'low';
}

interface UsePerformanceMonitorOptions {
  sampleDuration?: number; // Duration to sample FPS in milliseconds
  lowFpsThreshold?: number; // FPS threshold to consider performance low
  enableBatteryMonitoring?: boolean;
  onPerformanceChange?: (metrics: PerformanceMetrics) => void;
}

/**
 * Custom hook for monitoring performance metrics and adapting UI accordingly
 * Helps optimize animations and interactions based on device capabilities
 */
export function usePerformanceMonitor({
  sampleDuration = 1000, // 1 second sampling
  lowFpsThreshold = 45, // Below 45 FPS considered low performance
  enableBatteryMonitoring = true,
  onPerformanceChange,
}: UsePerformanceMonitorOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameCount: 0,
    isLowPerformance: false,
    adaptiveQuality: 'high',
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const rafIdRef = useRef<number | undefined>(undefined);
  const samplingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Frame rate monitoring
  const measureFrameRate = useCallback(() => {
    frameCountRef.current++;

    const updateFPS = () => {
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= sampleDuration) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        const isLowPerformance = fps < lowFpsThreshold;

        // Determine adaptive quality based on performance
        let adaptiveQuality: 'high' | 'medium' | 'low' = 'high';
        if (fps < 30) {
          adaptiveQuality = 'low';
        } else if (fps < lowFpsThreshold) {
          adaptiveQuality = 'medium';
        }

        setMetrics((prev) => {
          const newMetrics: PerformanceMetrics = {
            ...prev,
            fps,
            frameCount: frameCountRef.current,
            isLowPerformance,
            adaptiveQuality,
          };

          onPerformanceChange?.(newMetrics);
          return newMetrics;
        });

        // Reset counters
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(updateFPS);
    };

    rafIdRef.current = requestAnimationFrame(updateFPS);
  }, [sampleDuration, lowFpsThreshold, onPerformanceChange]);

  // Battery monitoring
  const updateBatteryInfo = useCallback(async () => {
    if (!enableBatteryMonitoring || !('getBattery' in navigator)) {
      return;
    }

    try {
      // @ts-expect-error - Battery API is experimental
      const battery = await navigator.getBattery();

      setMetrics((prev) => ({
        ...prev,
        batteryLevel: Math.round(battery.level * 100),
        isCharging: battery.charging,
        adaptiveQuality:
          !battery.charging && battery.level < 0.2
            ? 'low' // Force low quality on low battery
            : prev.adaptiveQuality,
      }));
    } catch (error) {
      // Battery API not supported or failed
      // eslint-disable-next-line no-console
      console.warn('Battery monitoring not available:', error);
    }
  }, [enableBatteryMonitoring]);

  // Network monitoring
  const updateConnectionInfo = useCallback(() => {
    const connection =
      // @ts-expect-error - Connection API is experimental
      navigator.connection ||
      // @ts-expect-error - Mozilla/Webkit connection APIs are experimental
      navigator.mozConnection ||
      // @ts-expect-error - Mozilla/Webkit connection APIs are experimental
      navigator.webkitConnection;

    if (connection) {
      const connectionType =
        connection.effectiveType || connection.type || 'unknown';

      setMetrics((prev) => ({
        ...prev,
        connectionType,
        adaptiveQuality:
          connectionType === '2g' || connectionType === 'slow-2g'
            ? 'low' // Force low quality on slow connections
            : prev.adaptiveQuality,
      }));
    }
  }, []);

  // Start monitoring
  useEffect(() => {
    measureFrameRate();
    updateBatteryInfo();
    updateConnectionInfo();

    // Update battery info periodically
    const batteryInterval = setInterval(updateBatteryInfo, 30000); // Every 30 seconds

    // Update connection info on change
    // @ts-expect-error - Connection API not widely supported yet
    const connection = navigator.connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentSamplingInterval = samplingIntervalRef.current;
      if (currentSamplingInterval) {
        clearInterval(currentSamplingInterval);
      }
      clearInterval(batteryInterval);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [measureFrameRate, updateBatteryInfo, updateConnectionInfo]);

  // Adaptive CSS class generator
  const getAdaptiveClasses = useCallback(
    (baseClasses: string) => {
      const qualityClasses = {
        high: 'transition-all duration-300 ease-out',
        medium: 'transition-opacity duration-200 ease-out',
        low: 'transition-none',
      };

      return `${baseClasses} ${qualityClasses[metrics.adaptiveQuality]}`;
    },
    [metrics.adaptiveQuality]
  );

  // Performance-aware animation settings
  const getAnimationSettings = useCallback(() => {
    return {
      duration:
        metrics.adaptiveQuality === 'high'
          ? 300
          : metrics.adaptiveQuality === 'medium'
            ? 200
            : 0,
      easing: metrics.adaptiveQuality === 'high' ? 'ease-out' : 'linear',
      willChange:
        metrics.adaptiveQuality === 'high' ? 'transform, opacity' : 'auto',
      reducedMotion: metrics.adaptiveQuality === 'low',
    };
  }, [metrics.adaptiveQuality]);

  return {
    metrics,
    getAdaptiveClasses,
    getAnimationSettings,
    isHighPerformance: metrics.adaptiveQuality === 'high',
    isMediumPerformance: metrics.adaptiveQuality === 'medium',
    isLowPerformance: metrics.adaptiveQuality === 'low',
  };
}
