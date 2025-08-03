// Performance monitoring configuration and alerting thresholds
import { enhancedAnalytics } from './enhanced-posthog';

export interface PerformanceThresholds {
  // Core Web Vitals thresholds (in milliseconds except CLS)
  LCP: { good: number; needsImprovement: number };
  FID: { good: number; needsImprovement: number };
  INP: { good: number; needsImprovement: number };
  CLS: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };

  // Custom application metrics (in milliseconds)
  pageLoad: { good: number; needsImprovement: number };
  apiResponse: { good: number; needsImprovement: number };
  imageLoad: { good: number; needsImprovement: number };
  searchResponse: { good: number; needsImprovement: number };

  // Bundle size thresholds (in bytes)
  bundleSize: { good: number; needsImprovement: number };

  // Memory usage thresholds (in MB)
  memoryUsage: { good: number; needsImprovement: number };
}

// Core Web Vitals thresholds based on Google's recommendations
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  // Core Web Vitals (official Google thresholds)
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte

  // Application-specific thresholds
  pageLoad: { good: 3000, needsImprovement: 5000 }, // Full page load
  apiResponse: { good: 500, needsImprovement: 1000 }, // API response time
  imageLoad: { good: 2000, needsImprovement: 4000 }, // Image loading time
  searchResponse: { good: 300, needsImprovement: 800 }, // Search response time

  // Resource thresholds
  bundleSize: { good: 500000, needsImprovement: 1000000 }, // 500KB / 1MB
  memoryUsage: { good: 50, needsImprovement: 100 }, // 50MB / 100MB
};

// Performance rating calculator
export function getPerformanceRating(
  metric: keyof PerformanceThresholds,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[metric];

  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

// Performance alert system
export class PerformanceMonitor {
  private alertCounts: Map<string, number> = new Map();
  private readonly ALERT_THRESHOLD = 3; // Number of poor metrics before alerting
  private readonly ALERT_WINDOW = 300000; // 5 minutes in milliseconds

  // Track performance metric and check for alerts
  trackMetric(
    metricName: keyof PerformanceThresholds,
    value: number,
    context?: Record<string, unknown>
  ) {
    const rating = getPerformanceRating(metricName, value);

    // Track the metric
    enhancedAnalytics.trackPerformanceMetric(metricName, value, {
      rating,
      threshold_good: PERFORMANCE_THRESHOLDS[metricName].good,
      threshold_needs_improvement:
        PERFORMANCE_THRESHOLDS[metricName].needsImprovement,
      ...context,
    });

    // Check for performance degradation alerts
    if (rating === 'poor') {
      this.handlePoorPerformance(metricName, value, context);
    }

    return rating;
  }

  // Handle poor performance detection
  private handlePoorPerformance(
    metricName: string,
    value: number,
    context?: Record<string, unknown>
  ) {
    const alertKey = `${metricName}_${context?.page_name || 'global'}`;
    const currentCount = this.alertCounts.get(alertKey) || 0;
    const newCount = currentCount + 1;

    this.alertCounts.set(alertKey, newCount);

    // Trigger alert if threshold is reached
    if (newCount >= this.ALERT_THRESHOLD) {
      this.triggerPerformanceAlert(metricName, value, newCount, context);
      // Reset counter after alert
      this.alertCounts.set(alertKey, 0);
    }

    // Clean up old alert counts
    this.cleanupAlertCounts();
  }

  // Trigger performance alert
  private triggerPerformanceAlert(
    metricName: string,
    value: number,
    occurrenceCount: number,
    context?: Record<string, unknown>
  ) {
    enhancedAnalytics.captureWithContext('performance_alert_triggered', {
      metric_name: metricName,
      metric_value: value,
      occurrence_count: occurrenceCount,
      threshold_exceeded:
        PERFORMANCE_THRESHOLDS[metricName as keyof PerformanceThresholds]
          ?.needsImprovement,
      alert_severity: 'high',
      requires_investigation: true,
      ...context,
    });

    // In a real application, you might also:
    // - Send notification to monitoring service (e.g., Sentry, DataDog)
    // - Log to console in development
    // - Store alert in local storage for debugging

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`🚨 Performance Alert: ${metricName} is consistently poor`, {
        metric: metricName,
        value,
        occurrenceCount,
        context,
      });
    }
  }

  // Clean up old alert counts (called periodically)
  private cleanupAlertCounts() {
    // For simplicity, we'll clear all counts periodically
    // In a production system, you'd track timestamps and clean up expired entries
    if (this.alertCounts.size > 100) {
      this.alertCounts.clear();
    }
  }

  // Get current performance status for debugging
  getPerformanceStatus(): Record<string, unknown> {
    return {
      activeAlerts: Array.from(this.alertCounts.entries()),
      thresholds: PERFORMANCE_THRESHOLDS,
      alertThreshold: this.ALERT_THRESHOLD,
    };
  }

  // Manual performance check for critical user flows
  checkCriticalPathPerformance(
    pageName: string,
    metrics: Partial<Record<keyof PerformanceThresholds, number>>
  ): {
    overall: 'good' | 'needs-improvement' | 'poor';
    details: Array<{ metric: string; value: number; rating: string }>;
  } {
    const results = Object.entries(metrics).map(([metric, value]) => ({
      metric,
      value: value!,
      rating: getPerformanceRating(
        metric as keyof PerformanceThresholds,
        value!
      ),
    }));

    // Calculate overall rating (worst metric determines overall score)
    const hasAnyPoor = results.some((r) => r.rating === 'poor');
    const hasAnyNeedsImprovement = results.some(
      (r) => r.rating === 'needs-improvement'
    );

    const overall = hasAnyPoor
      ? 'poor'
      : hasAnyNeedsImprovement
        ? 'needs-improvement'
        : 'good';

    // Track critical path performance
    enhancedAnalytics.captureWithContext('critical_path_performance_check', {
      page_name: pageName,
      overall_rating: overall,
      metrics_checked: results.length,
      poor_metrics: results.filter((r) => r.rating === 'poor').length,
      needs_improvement_metrics: results.filter(
        (r) => r.rating === 'needs-improvement'
      ).length,
      metrics_details: results,
    });

    return { overall, details: results };
  }

  // Real-time performance monitoring for specific pages
  startRealtimeMonitoring(pageName: string): () => void {
    if (typeof window === 'undefined') {
      return () => {}; // No-op for SSR
    }

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memoryInfo = (performance as Record<string, unknown>)
          .memory as Record<string, number>;
        const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);

        this.trackMetric('memoryUsage', memoryUsageMB, {
          page_name: pageName,
          total_heap_size: memoryInfo.totalJSHeapSize / (1024 * 1024),
          heap_size_limit: memoryInfo.jsHeapSizeLimit / (1024 * 1024),
        });
      }
    }, 10000); // Check every 10 seconds

    // Monitor long tasks (tasks > 50ms)
    let longTaskObserver: PerformanceObserver | null = null;
    if ('PerformanceObserver' in window) {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            enhancedAnalytics.captureWithContext('long_task_detected', {
              page_name: pageName,
              task_duration: entry.duration,
              task_start_time: entry.startTime,
              task_name: entry.name,
            });
          }
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    }

    // Return cleanup function
    return () => {
      clearInterval(memoryInterval);
      if (longTaskObserver) {
        longTaskObserver.disconnect();
      }
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions for common metrics
export const trackPageLoadPerformance = (pageName: string, loadTime: number) =>
  performanceMonitor.trackMetric('pageLoad', loadTime, { page_name: pageName });

export const trackAPIPerformance = (
  endpoint: string,
  responseTime: number,
  success: boolean
) =>
  performanceMonitor.trackMetric('apiResponse', responseTime, {
    endpoint,
    success,
  });

export const trackImageLoadPerformance = (
  imageUrl: string,
  loadTime: number,
  size?: number
) =>
  performanceMonitor.trackMetric('imageLoad', loadTime, {
    image_url: imageUrl,
    image_size: size,
  });

export const trackSearchPerformance = (
  query: string,
  responseTime: number,
  resultCount: number
) =>
  performanceMonitor.trackMetric('searchResponse', responseTime, {
    query,
    result_count: resultCount,
  });
