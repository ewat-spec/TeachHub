import { logger } from './logger';

// Core Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as any;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
        clsEntries.push(entry);
      }
    }
  });

  clsObserver.observe({ type: 'layout-shift', buffered: true });

  // Track LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry;
    
    logger.info('LCP measured', undefined, {
      value: lastEntry.startTime,
      metric: 'LCP'
    });
  });

  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

  // Track FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceEventTiming[]) {
      const fid = entry.processingStart - entry.startTime;
      
      logger.info('FID measured', undefined, {
        value: fid,
        metric: 'FID'
      });
    }
  });

  fidObserver.observe({ type: 'first-input', buffered: true });

  // Report CLS when page is about to unload
  const reportCLS = () => {
    logger.info('CLS measured', undefined, {
      value: clsValue,
      metric: 'CLS',
      entries: clsEntries.length
    });
  };

  window.addEventListener('beforeunload', reportCLS);
  
  return () => {
    clsObserver.disconnect();
    lcpObserver.disconnect();
    fidObserver.disconnect();
    window.removeEventListener('beforeunload', reportCLS);
  };
};

// Performance timing utilities
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return async () => {
    const start = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }
      
      const duration = performance.now() - start;
      logger.info(`Performance: ${name}`, undefined, { duration });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Performance error: ${name}`, error, { duration });
      throw error;
    }
  };
};

// Resource loading tracking
export const trackResourceLoading = () => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;
        
        // Log slow resources (>1s)
        if (resource.duration > 1000) {
          logger.warn('Slow resource detected', undefined, {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
  
  return () => observer.disconnect();
};

// Memory usage tracking
export const trackMemoryUsage = () => {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  
  logger.info('Memory usage', undefined, {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  });
};

// Bundle size analysis
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const resources = [...scripts, ...styles].map(el => {
    const src = el.getAttribute('src') || el.getAttribute('href');
    return src ? new URL(src, window.location.origin).pathname : null;
  }).filter(Boolean);

  logger.info('Bundle analysis', undefined, {
    scriptCount: scripts.length,
    styleCount: styles.length,
    resources: resources
  });
};

// API response time tracking
export const trackAPICall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    
    logger.info('API call completed', undefined, {
      endpoint,
      duration,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    logger.error('API call failed', error, {
      endpoint,
      duration,
      status: 'error'
    });
    
    throw error;
  }
};

// Page load time tracking
export const trackPageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
    };

    logger.info('Page load metrics', undefined, metrics);
  });
};

// Initialize all performance tracking
export const initializePerformanceTracking = () => {
  if (typeof window === 'undefined') return;

  const cleanupFunctions: (() => void)[] = [];

  // Track Core Web Vitals
  const cleanupWebVitals = trackWebVitals();
  if (cleanupWebVitals) cleanupFunctions.push(cleanupWebVitals);

  // Track resource loading
  const cleanupResources = trackResourceLoading();
  if (cleanupResources) cleanupFunctions.push(cleanupResources);

  // Track page load
  trackPageLoad();

  // Track memory usage periodically (every 30 seconds)
  const memoryInterval = setInterval(trackMemoryUsage, 30000);
  cleanupFunctions.push(() => clearInterval(memoryInterval));

  // Analyze bundle size on load
  window.addEventListener('load', analyzeBundleSize);

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};