'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Activity, Zap, Clock, Database, Smartphone, Wifi,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Custom metrics
  loadTime: number;
  domContentLoaded: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  
  // Mobile specific
  batteryLevel?: number;
  deviceMemory?: number;
  connectionSpeed: string;
}

interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
  bundleSize: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  lcp: 2500, // 2.5s
  fid: 100,  // 100ms
  cls: 0.1,  // 0.1
  loadTime: 3000, // 3s
  bundleSize: 500000, // 500KB
};

export function PerformanceMonitor({ 
  budget = DEFAULT_BUDGET,
  showInProduction = false 
}: {
  budget?: Partial<PerformanceBudget>;
  showInProduction?: boolean;
}) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const { networkStatus } = useNetworkStatus();
  
  const fullBudget = { ...DEFAULT_BUDGET, ...budget };
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  // Show monitor in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const newMetrics: Partial<PerformanceMetrics> = {
      loadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      ttfb: navigation?.responseStart - navigation?.navigationStart || 0,
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      connectionSpeed: networkStatus.effectiveType,
    };

    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      newMetrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Get device memory if available
    if ('deviceMemory' in navigator) {
      newMetrics.deviceMemory = (navigator as any).deviceMemory;
    }

    // Get battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setMetrics(prev => ({ ...prev, batteryLevel: battery.level * 100 }));
      });
    }

    // Collect Core Web Vitals using PerformanceObserver
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          newMetrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            newMetrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          newMetrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    metricsRef.current = { ...metricsRef.current, ...newMetrics };
    setMetrics(metricsRef.current);
  }, [networkStatus.effectiveType]);

  // Check performance budget
  const checkBudget = useCallback(() => {
    const newAlerts: string[] = [];
    const current = metricsRef.current;

    if (current.lcp && current.lcp > fullBudget.lcp) {
      newAlerts.push(`LCP exceeds budget: ${Math.round(current.lcp)}ms > ${fullBudget.lcp}ms`);
    }
    
    if (current.fid && current.fid > fullBudget.fid) {
      newAlerts.push(`FID exceeds budget: ${Math.round(current.fid)}ms > ${fullBudget.fid}ms`);
    }
    
    if (current.cls && current.cls > fullBudget.cls) {
      newAlerts.push(`CLS exceeds budget: ${current.cls.toFixed(3)} > ${fullBudget.cls}`);
    }
    
    if (current.loadTime && current.loadTime > fullBudget.loadTime) {
      newAlerts.push(`Load time exceeds budget: ${Math.round(current.loadTime)}ms > ${fullBudget.loadTime}ms`);
    }

    setAlerts(newAlerts);
  }, [fullBudget]);

  // Initialize metrics collection
  useEffect(() => {
    if (!shouldShow) return;

    // Collect initial metrics
    collectMetrics();

    // Collect metrics after page load
    const timer = setTimeout(collectMetrics, 2000);

    // Check budget periodically
    const budgetTimer = setInterval(checkBudget, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(budgetTimer);
    };
  }, [shouldShow, collectMetrics, checkBudget]);

  // Format metrics for display
  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'N/A';
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 'MB') return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (unit === '%') return `${Math.round(value)}%`;
    return value.toString();
  };

  // Get metric status color
  const getMetricStatus = (value: number | undefined, threshold: number, reverse = false) => {
    if (value === undefined) return 'text-gray-500';
    const isGood = reverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  // Calculate performance score
  const calculateScore = () => {
    const scores = [];
    
    if (metrics.lcp) {
      scores.push(metrics.lcp <= 2500 ? 100 : metrics.lcp <= 4000 ? 50 : 0);
    }
    
    if (metrics.fid) {
      scores.push(metrics.fid <= 100 ? 100 : metrics.fid <= 300 ? 50 : 0);
    }
    
    if (metrics.cls) {
      scores.push(metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 50 : 0);
    }

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  };

  if (!shouldShow) return null;

  const score = calculateScore();

  return (
    <>
      {/* Performance Monitor Toggle */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(!isVisible)}
          className="bg-white shadow-lg"
        >
          <Activity className="h-4 w-4 mr-1" />
          Perf
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
              {alerts.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Performance Monitor Panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 w-96 max-h-[80vh] overflow-y-auto z-50">
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Monitor
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                Real-time performance metrics and Core Web Vitals
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Performance Score */}
              <div className="text-center">
                <div className={cn(
                  'text-3xl font-bold mb-2',
                  score >= 90 ? 'text-green-600' : score >= 50 ? 'text-orange-600' : 'text-red-600'
                )}>
                  {score}
                </div>
                <Progress value={score} className="mb-2" />
                <p className="text-sm text-gray-600">Overall Performance Score</p>
              </div>

              {/* Core Web Vitals */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-1" />
                  Core Web Vitals
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className={cn('font-bold', getMetricStatus(metrics.lcp, 2500))}>
                      {formatMetric(metrics.lcp)}
                    </div>
                    <div className="text-xs text-gray-600">LCP</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className={cn('font-bold', getMetricStatus(metrics.fid, 100))}>
                      {formatMetric(metrics.fid)}
                    </div>
                    <div className="text-xs text-gray-600">FID</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className={cn('font-bold', getMetricStatus(metrics.cls, 0.1))}>
                      {metrics.cls?.toFixed(3) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">CLS</div>
                  </div>
                </div>
              </div>

              {/* Loading Metrics */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Loading Performance
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>First Contentful Paint</span>
                    <span className={getMetricStatus(metrics.fcp, 1800)}>
                      {formatMetric(metrics.fcp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to First Byte</span>
                    <span className={getMetricStatus(metrics.ttfb, 600)}>
                      {formatMetric(metrics.ttfb)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>DOM Content Loaded</span>
                    <span className={getMetricStatus(metrics.domContentLoaded, 1500)}>
                      {formatMetric(metrics.domContentLoaded)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load Event</span>
                    <span className={getMetricStatus(metrics.loadTime, 3000)}>
                      {formatMetric(metrics.loadTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Resources */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  System Resources
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span>{formatMetric(metrics.memoryUsage, 'MB')}</span>
                  </div>
                  {metrics.deviceMemory && (
                    <div className="flex justify-between">
                      <span>Device Memory</span>
                      <span>{metrics.deviceMemory}GB</span>
                    </div>
                  )}
                  {metrics.batteryLevel && (
                    <div className="flex justify-between">
                      <span>Battery Level</span>
                      <span className={metrics.batteryLevel < 20 ? 'text-red-600' : 'text-green-600'}>
                        {formatMetric(metrics.batteryLevel, '%')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Information */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Wifi className="h-4 w-4 mr-1" />
                  Network
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connection Type</span>
                    <Badge variant="outline">
                      {networkStatus.effectiveType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Downlink</span>
                    <span>{networkStatus.downlink.toFixed(1)} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RTT</span>
                    <span>{networkStatus.rtt}ms</span>
                  </div>
                  {networkStatus.saveData && (
                    <div className="flex items-center text-orange-600">
                      <Database className="h-3 w-3 mr-1" />
                      <span>Data Saver Mode</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Performance Alerts
                  </h4>
                  <div className="space-y-1">
                    {alerts.map((alert, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={collectMetrics}
                  className="flex-1"
                >
                  Refresh Metrics
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Performance Metrics:', metrics)}
                  className="flex-1"
                >
                  Log to Console
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Performance budget checker hook
export function usePerformanceBudget(budget: PerformanceBudget) {
  const [violations, setViolations] = useState<string[]>([]);
  const [score, setScore] = useState(100);

  useEffect(() => {
    const checkBudget = () => {
      const newViolations: string[] = [];
      let totalScore = 100;

      // Check navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        if (loadTime > budget.loadTime) {
          newViolations.push(`Load time: ${Math.round(loadTime)}ms > ${budget.loadTime}ms`);
          totalScore -= 20;
        }
      }

      // Check bundle size (approximate)
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, resource: any) => {
        return sum + (resource.transferSize || 0);
      }, 0);

      if (totalSize > budget.bundleSize) {
        newViolations.push(`Bundle size: ${Math.round(totalSize / 1024)}KB > ${Math.round(budget.bundleSize / 1024)}KB`);
        totalScore -= 20;
      }

      setViolations(newViolations);
      setScore(Math.max(0, totalScore));
    };

    // Check budget after page load
    if (document.readyState === 'complete') {
      setTimeout(checkBudget, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(checkBudget, 1000));
    }
  }, [budget]);

  return { violations, score };
}

// Performance optimization suggestions
export function PerformanceOptimizer() {
  const { networkStatus } = useNetworkStatus();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const newSuggestions: string[] = [];

    // Network-based suggestions
    if (networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g') {
      newSuggestions.push('Enable aggressive image compression for slow connections');
      newSuggestions.push('Reduce JavaScript bundle size');
      newSuggestions.push('Implement critical CSS inlining');
    }

    if (networkStatus.saveData) {
      newSuggestions.push('Respect data saver preferences');
      newSuggestions.push('Disable auto-playing videos');
      newSuggestions.push('Use lower quality images');
    }

    // Memory-based suggestions
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.8) {
        newSuggestions.push('High memory usage detected - consider lazy loading');
        newSuggestions.push('Implement component cleanup in useEffect');
      }
    }

    setSuggestions(newSuggestions);
  }, [networkStatus]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          Optimization Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
              {suggestion}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}