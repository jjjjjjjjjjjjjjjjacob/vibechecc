# Performance Monitoring Implementation Guide

## Overview

This guide documents the comprehensive performance monitoring system implemented for the viberater application, including Core Web Vitals tracking, real-time performance monitoring, and automated alerting.

## System Architecture

### Core Components

1. **Enhanced PostHog Service** (`/lib/enhanced-posthog.ts`)
   - Extended with Core Web Vitals tracking methods
   - Automatic performance rating system (good/needs-improvement/poor)
   - Performance threshold management

2. **Performance Monitoring System** (`/lib/performance-monitoring.ts`)
   - Comprehensive monitoring with configurable thresholds
   - Real-time alerting and degradation detection
   - Critical path performance analysis

3. **Analytics Hooks** (`/hooks/use-enhanced-analytics.ts`)
   - `usePageTracking` - Enhanced with Core Web Vitals monitoring
   - `usePerformanceMonitoring` - Performance metric tracking
   - `useRealtimePerformanceMonitoring` - Live monitoring capabilities

## Core Web Vitals Implementation

### Tracked Metrics

All metrics follow Google's official Core Web Vitals thresholds:

| Metric | Good | Needs Improvement | Poor | Description |
|--------|------|-------------------|------|-------------|
| **LCP** | ≤ 2.5s | ≤ 4.0s | > 4.0s | Largest Contentful Paint |
| **FID** | ≤ 100ms | ≤ 300ms | > 300ms | First Input Delay |
| **INP** | ≤ 200ms | ≤ 500ms | > 500ms | Interaction to Next Paint |
| **CLS** | ≤ 0.1 | ≤ 0.25 | > 0.25 | Cumulative Layout Shift |
| **FCP** | ≤ 1.8s | ≤ 3.0s | > 3.0s | First Contentful Paint |
| **TTFB** | ≤ 800ms | ≤ 1.8s | > 1.8s | Time to First Byte |

### Performance Observer Integration

The system uses the browser's native Performance Observer API for real-time metric collection:

```typescript
// LCP Tracking
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  if (lastEntry) {
    enhancedAnalytics.trackPerformanceMetric('LCP', lastEntry.startTime, {
      page_name: pageName,
      user_id: userId,
    });
  }
});
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
```

## Page Tracking Implementation

### Route Coverage

Performance tracking has been implemented across all 17 application routes:

#### Main Application Routes
- **Home** (`/`) - Feed performance and user engagement
- **Search** (`/search`) - Search performance with filter context
- **Discover** (`/discover`) - Content discovery performance
- **Profile** (`/profile`) - User settings and profile management

#### Content Routes
- **Vibe Detail** (`/vibes/$vibeId`) - Content viewing performance
- **Vibe Creation** (`/vibes/create`) - Content creation performance
- **Vibe Editing** (`/vibes/$vibeId/edit`) - Content editing performance
- **My Vibes** (`/vibes/my-vibes`) - Personal content management

#### User Routes
- **User Profiles** (`/users/$username`) - Public profile viewing
- **Onboarding** (`/onboarding`) - User setup funnel

#### Authentication Routes
- **Sign In** (`/sign-in`) - Authentication funnel
- **Sign Up** (`/sign-up`) - Registration funnel

#### Legal Routes
- **Privacy Policy** (`/privacy`) - Legal document performance
- **Terms of Service** (`/terms`) - Legal document performance
- **Data Policy** (`/data`) - Legal document performance

### Contextual Metadata

Each route includes specific contextual data for performance analysis:

```typescript
// Example: Search page with context
usePageTracking('search', { 
  section: 'search_results', 
  tab: tab || 'all',
  has_query: !!q,
  has_filters: !!(tags?.length || rating || emojiFilter?.length),
});

// Example: Authentication funnel
usePageTracking('sign_up', { 
  section: 'authentication',
  auth_method: 'clerk',
  funnel_step: 'signup',
});
```

## Performance Alerting System

### Alert Configuration

The system includes automated performance degradation detection:

```typescript
class PerformanceMonitor {
  private readonly ALERT_THRESHOLD = 3; // Poor metrics before alerting
  private readonly ALERT_WINDOW = 300000; // 5 minutes

  // Triggers alert when performance consistently degrades
  private triggerPerformanceAlert(
    metricName: string,
    value: number,
    occurrenceCount: number,
    context?: Record<string, any>
  ) {
    enhancedAnalytics.captureWithContext('performance_alert_triggered', {
      metric_name: metricName,
      metric_value: value,
      occurrence_count: occurrenceCount,
      alert_severity: 'high',
      requires_investigation: true,
    });
  }
}
```

### Real-time Monitoring

The system includes continuous monitoring capabilities:

1. **Memory Usage Monitoring** - JavaScript heap size tracking every 10 seconds
2. **Long Task Detection** - Tasks over 50ms that block the main thread
3. **Performance Observer Integration** - Native browser performance APIs

## Usage Examples

### Basic Page Tracking

```typescript
import { usePageTracking } from '@/hooks/use-enhanced-analytics';

export function MyPage() {
  // Automatic Core Web Vitals tracking
  usePageTracking('my_page', { 
    section: 'content',
    page_type: 'listing',
  });

  return <div>Page content</div>;
}
```

### Performance Monitoring Hook

```typescript
import { usePerformanceMonitoring } from '@/hooks/use-enhanced-analytics';

export function MyComponent() {
  const { trackAPICall, trackImageLoad } = usePerformanceMonitoring('my_page');

  const handleAPICall = async () => {
    const startTime = Date.now();
    try {
      const result = await api.getData();
      trackAPICall('/api/data', startTime, true);
      return result;
    } catch (error) {
      trackAPICall('/api/data', startTime, false);
      throw error;
    }
  };

  return <div>Component content</div>;
}
```

### Real-time Monitoring

```typescript
import { useRealtimePerformanceMonitoring } from '@/hooks/use-enhanced-analytics';

export function CriticalPage() {
  // Enable real-time monitoring for critical pages
  const { checkCriticalPath } = useRealtimePerformanceMonitoring('critical_page', true);

  useEffect(() => {
    // Check critical path performance
    checkCriticalPath({
      pageLoad: 3000,
      apiResponse: 500,
      imageLoad: 2000,
    }).then((result) => {
      console.log('Critical path performance:', result.overall);
    });
  }, []);

  return <div>Critical page content</div>;
}
```

## Monitoring and Debugging

### Development Mode

In development, the system provides console warnings for performance issues:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn(`🚨 Performance Alert: ${metricName} is consistently poor`, {
    metric: metricName,
    value,
    occurrenceCount,
    context,
  });
}
```

### Performance Status Debugging

```typescript
import { performanceMonitor } from '@/lib/performance-monitoring';

// Get current performance status
const status = performanceMonitor.getPerformanceStatus();
console.log('Performance Status:', status);
```

## Analytics Events

### Core Web Vitals Events

All Core Web Vitals are tracked with these PostHog events:

- `web_vital_recorded` - General Web Vital metric
- `perf_lcp_recorded` - Largest Contentful Paint
- `perf_fid_recorded` - First Input Delay
- `perf_cls_recorded` - Cumulative Layout Shift
- `perf_fcp_recorded` - First Contentful Paint
- `perf_ttfb_recorded` - Time to First Byte
- `perf_inp_recorded` - Interaction to Next Paint

### Performance Alert Events

- `performance_alert_triggered` - When performance consistently degrades
- `long_task_detected` - When tasks block main thread > 50ms
- `critical_path_performance_check` - Critical user flow analysis

## Best Practices

### 1. Page Context
Always provide meaningful context when tracking pages:

```typescript
// Good - Specific context
usePageTracking('search_results', {
  section: 'search',
  tab: 'vibes',
  has_filters: true,
  result_count: 25,
});

// Avoid - Generic context
usePageTracking('page');
```

### 2. Performance Thresholds
Use appropriate thresholds for different page types:

```typescript
// Critical user flows - stricter thresholds
const criticalThresholds = {
  pageLoad: { good: 2000, needsImprovement: 3000 },
  apiResponse: { good: 300, needsImprovement: 600 },
};

// Content pages - more lenient thresholds
const contentThresholds = {
  pageLoad: { good: 3000, needsImprovement: 5000 },
  imageLoad: { good: 2000, needsImprovement: 4000 },
};
```

### 3. Error Handling
Always handle performance tracking errors gracefully:

```typescript
try {
  trackPerformance(metric, value, context);
} catch (error) {
  // Performance tracking should never break the application
  console.warn('Performance tracking error:', error);
}
```

## Future Enhancements

### Potential Improvements

1. **Web Vitals Library Integration** - Consider using Google's `web-vitals` library for enhanced accuracy
2. **Performance Budgets** - Set and monitor performance budgets per route
3. **A/B Testing Integration** - Performance impact analysis for feature experiments
4. **User Experience Correlation** - Link performance metrics to user behavior patterns
5. **Automated Performance Reports** - Daily/weekly performance summary reports

### Monitoring Recommendations

1. **Dashboard Setup** - Create PostHog dashboards for Core Web Vitals monitoring
2. **Alert Configuration** - Set up external alerting (Slack, PagerDuty) for critical performance issues
3. **Performance CI/CD** - Integrate performance testing into deployment pipeline
4. **User Segmentation** - Analyze performance by user segments (device, connection, location)

## Troubleshooting

### Common Issues

1. **Performance Observer Not Available** - System gracefully degrades for older browsers
2. **TypeScript Errors** - Performance API types are properly defined in the hooks file
3. **Memory Leaks** - All observers are properly disconnected on component unmount
4. **False Positives** - Alert thresholds can be adjusted per page type

### Debugging Steps

1. Check browser dev tools for Performance Observer support
2. Verify PostHog initialization and event firing
3. Monitor console for performance warnings in development
4. Use `performanceMonitor.getPerformanceStatus()` for debugging

This comprehensive performance monitoring system provides deep insights into application performance while maintaining user privacy and system reliability.