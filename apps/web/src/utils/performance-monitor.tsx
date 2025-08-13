/**
 * Performance monitoring utilities for tracking app performance
 */

import React from 'react';

interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private enabled: boolean =
    typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  /**
   * Start a performance measurement
   */
  startMark(name: string, metadata?: Record<string, unknown>) {
    if (!this.enabled) return;

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    // Use native performance API if available
    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End a performance measurement and log the duration
   */
  endMark(name: string): number | null {
    if (!this.enabled) return null;

    const mark = this.marks.get(name);
    if (!mark) {
      // eslint-disable-next-line no-console
      console.warn(`Performance mark "${name}" not found`);
      return null;
    }

    mark.endTime = performance.now();
    mark.duration = mark.endTime - mark.startTime;

    // Use native performance API if available
    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Log slow operations (> 100ms)
    if (mark.duration > 100) {
      // eslint-disable-next-line no-console
      console.warn(
        `Slow operation detected: ${name} took ${mark.duration.toFixed(2)}ms`,
        mark.metadata
      );
    }

    return mark.duration;
  }

  /**
   * Measure a function's execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMark(name);
    try {
      const result = await fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function's execution time
   */
  measure<T>(name: string, fn: () => T): T {
    this.startMark(name);
    try {
      const result = fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * Get all performance marks
   */
  getAllMarks(): PerformanceMark[] {
    return Array.from(this.marks.values());
  }

  /**
   * Clear all marks
   */
  clear() {
    this.marks.clear();
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Log Core Web Vitals
   */
  logWebVitals() {
    if (!this.enabled || typeof window === 'undefined') return;

    // Log navigation timing
    const navTiming = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navTiming) {
      // eslint-disable-next-line no-console
      console.log('Navigation Timing:', {
        domContentLoaded:
          navTiming.domContentLoadedEventEnd -
          navTiming.domContentLoadedEventStart,
        loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
        domInteractive: navTiming.domInteractive,
        timeToFirstByte: navTiming.responseStart - navTiming.requestStart,
      });
    }

    // Log paint timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      // eslint-disable-next-line no-console
      console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
    });

    // Log largest contentful paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          // eslint-disable-next-line no-console
          console.log(
            'Largest Contentful Paint:',
            lastEntry.startTime.toFixed(2) + 'ms'
          );
          observer.disconnect();
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // LCP observer not supported
      }
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.enabled) return;

    // Track slow renders (> 16ms = 1 frame at 60fps)
    if (renderTime > 16) {
      // eslint-disable-next-line no-console
      console.warn(
        `Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, duration: number, status: number) {
    if (!this.enabled) return;

    const mark: PerformanceMark = {
      name: `api-${endpoint}`,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      metadata: { endpoint, status },
    };

    this.marks.set(`api-${endpoint}-${Date.now()}`, mark);

    // Log slow API calls (> 1000ms)
    if (duration > 1000) {
      // eslint-disable-next-line no-console
      console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

// React hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = performance.now();

  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    perfMonitor.trackComponentRender(componentName, renderTime);
  });
}

// HOC for measuring component performance
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    useRenderPerformance(componentName);
    return <Component {...props} />;
  });
}
