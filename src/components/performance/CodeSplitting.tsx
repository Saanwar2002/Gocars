'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

// Loading component for code splitting
export function ComponentLoader({ 
  className,
  size = 'medium',
  message = 'Loading...'
}: {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  message?: string;
}) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center">
        <div className={cn(
          'animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4',
          sizeClasses[size]
        )}></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Error boundary for lazy loaded components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">Failed to load component</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-blue-600 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with network awareness
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    preload?: boolean;
    networkAware?: boolean;
  } = {}
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: T) {
    const { shouldReduceData, isSlowConnection } = useNetworkStatus();
    const [shouldLoad, setShouldLoad] = useState(!options.networkAware || !shouldReduceData());

    useEffect(() => {
      if (options.preload && !isSlowConnection()) {
        // Preload component when network conditions are good
        importFn().catch(console.error);
      }
    }, [isSlowConnection]);

    useEffect(() => {
      if (options.networkAware && shouldReduceData()) {
        // Delay loading on slow connections
        const timer = setTimeout(() => setShouldLoad(true), 1000);
        return () => clearTimeout(timer);
      }
    }, [shouldReduceData]);

    if (!shouldLoad) {
      return options.fallback || <ComponentLoader message="Waiting for better connection..." />;
    }

    return (
      <LazyErrorBoundary fallback={options.errorFallback}>
        <Suspense fallback={options.fallback || <ComponentLoader />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

// Progressive loading component
export function ProgressiveLoader({
  children,
  stages,
  delay = 100,
  networkAware = true
}: {
  children: React.ReactNode;
  stages?: React.ReactNode[];
  delay?: number;
  networkAware?: boolean;
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const { isSlowConnection } = useNetworkStatus();
  
  const effectiveDelay = networkAware && isSlowConnection() ? delay * 2 : delay;

  useEffect(() => {
    if (!stages || currentStage >= stages.length) return;

    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
    }, effectiveDelay);

    return () => clearTimeout(timer);
  }, [currentStage, stages, effectiveDelay]);

  if (stages && currentStage < stages.length) {
    return <>{stages[currentStage]}</>;
  }

  return <>{children}</>;
}

// Lazy route component
export function LazyRoute({
  component: Component,
  loading,
  error,
  ...props
}: {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <LazyErrorBoundary fallback={error}>
      <Suspense fallback={loading || <ComponentLoader size="large" />}>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
}

// Hook for managing lazy loading state
export function useLazyLoading() {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const { shouldReduceData } = useNetworkStatus();

  const markAsLoaded = (componentId: string) => {
    setLoadedComponents(prev => new Set(prev).add(componentId));
  };

  const isLoaded = (componentId: string) => {
    return loadedComponents.has(componentId);
  };

  const shouldDelayLoading = (priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (priority === 'high') return false;
    return shouldReduceData() && priority === 'low';
  };

  return {
    loadedComponents,
    markAsLoaded,
    isLoaded,
    shouldDelayLoading,
  };
}

// Preload components based on user interaction
export function useComponentPreloader() {
  const { isFastConnection } = useNetworkStatus();
  const preloadedComponents = React.useRef<Set<string>>(new Set());

  const preloadComponent = React.useCallback(async (
    importFn: () => Promise<any>,
    componentId: string
  ) => {
    if (!isFastConnection() || preloadedComponents.current.has(componentId)) {
      return;
    }

    try {
      await importFn();
      preloadedComponents.current.add(componentId);
    } catch (error) {
      console.warn(`Failed to preload component ${componentId}:`, error);
    }
  }, [isFastConnection]);

  const preloadOnHover = React.useCallback((
    importFn: () => Promise<any>,
    componentId: string
  ) => {
    return {
      onMouseEnter: () => preloadComponent(importFn, componentId),
      onFocus: () => preloadComponent(importFn, componentId),
    };
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadOnHover,
    preloadedComponents: preloadedComponents.current,
  };
}

// Mobile-specific lazy loading patterns
export const MobileLazyPatterns = {
  // Lazy load below the fold content
  BelowFold: withLazyLoading(
    () => import('@/components/mobile/MobileWorkflows'),
    {
      networkAware: true,
      fallback: <ComponentLoader message="Loading mobile features..." />,
    }
  ),

  // Lazy load heavy components
  HeavyComponent: withLazyLoading(
    () => import('@/components/charts/InteractiveChart'),
    {
      networkAware: true,
      preload: true,
      fallback: <ComponentLoader size="large" message="Loading charts..." />,
    }
  ),

  // Lazy load modal content
  ModalContent: withLazyLoading(
    () => import('@/components/modals/BookingModal'),
    {
      fallback: <ComponentLoader message="Loading booking form..." />,
    }
  ),

  // Lazy load settings panel
  SettingsPanel: withLazyLoading(
    () => import('@/components/settings/SettingsPanel'),
    {
      networkAware: true,
      fallback: <ComponentLoader message="Loading settings..." />,
    }
  ),
};

// Bundle analyzer helper (development only)
export function BundleAnalyzer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log bundle loading information
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            console.log(`Loaded: ${entry.name} (${entry.duration}ms)`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
      
      return () => observer.disconnect();
    }
  }, []);

  return <>{children}</>;
}