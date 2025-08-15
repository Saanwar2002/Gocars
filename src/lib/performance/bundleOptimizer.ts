// Bundle optimization utilities for performance enhancement

interface BundleAnalysis {
    totalSize: number;
    gzippedSize: number;
    chunks: ChunkInfo[];
    duplicates: DuplicateModule[];
    unusedExports: UnusedExport[];
    recommendations: OptimizationRecommendation[];
}

interface ChunkInfo {
    name: string;
    size: number;
    gzippedSize: number;
    modules: ModuleInfo[];
    loadTime: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ModuleInfo {
    name: string;
    size: number;
    imports: string[];
    exports: string[];
    isUsed: boolean;
}

interface DuplicateModule {
    name: string;
    occurrences: number;
    totalSize: number;
    chunks: string[];
}

interface UnusedExport {
    module: string;
    export: string;
    size: number;
}

interface OptimizationRecommendation {
    type: 'split' | 'merge' | 'lazy' | 'preload' | 'remove';
    description: string;
    impact: 'high' | 'medium' | 'low';
    estimatedSavings: number;
}

export class BundleOptimizer {
    private analysis: BundleAnalysis | null = null;
    private performanceObserver: PerformanceObserver | null = null;

    constructor() {
        this.initializePerformanceMonitoring();
    }

    private initializePerformanceMonitoring() {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }

        this.performanceObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.entryType === 'resource') {
                    this.analyzeResourceLoad(entry as PerformanceResourceTiming);
                } else if (entry.entryType === 'navigation') {
                    this.analyzeNavigationTiming(entry as PerformanceNavigationTiming);
                }
            });
        });

        this.performanceObserver.observe({
            entryTypes: ['resource', 'navigation', 'measure']
        });
    }

    private analyzeResourceLoad(entry: PerformanceResourceTiming) {
        const resourceAnalysis = {
            name: entry.name,
            size: entry.transferSize || 0,
            loadTime: entry.responseEnd - entry.requestStart,
            cacheHit: entry.transferSize === 0 && entry.decodedBodySize > 0,
            compressionRatio: entry.transferSize > 0 ?
                entry.decodedBodySize / entry.transferSize : 1,
        };

        // Store analysis for optimization recommendations
        this.storeResourceAnalysis(resourceAnalysis);
    }

    private analyzeNavigationTiming(entry: PerformanceNavigationTiming) {
        const navigationAnalysis = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
            loadComplete: entry.loadEventEnd - entry.navigationStart,
            firstPaint: this.getFirstPaintTime(),
            firstContentfulPaint: this.getFirstContentfulPaintTime(),
            largestContentfulPaint: this.getLargestContentfulPaintTime(),
        };

        this.storeNavigationAnalysis(navigationAnalysis);
    }

    private getFirstPaintTime(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint?.startTime || 0;
    }

    private getFirstContentfulPaintTime(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp?.startTime || 0;
    }

    private getLargestContentfulPaintTime(): number {
        return new Promise<number>((resolve) => {
            if (!('PerformanceObserver' in window)) {
                resolve(0);
                return;
            }

            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry?.startTime || 0);
                observer.disconnect();
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }) as any;
    }

    private storeResourceAnalysis(analysis: any) {
        // Store in IndexedDB or localStorage for analysis
        const stored = JSON.parse(localStorage.getItem('resource_analysis') || '[]');
        stored.push(analysis);

        // Keep only last 100 entries
        if (stored.length > 100) {
            stored.splice(0, stored.length - 100);
        }

        localStorage.setItem('resource_analysis', JSON.stringify(stored));
    }

    private storeNavigationAnalysis(analysis: any) {
        localStorage.setItem('navigation_analysis', JSON.stringify(analysis));
    }

    // Code splitting optimization
    public optimizeCodeSplitting(): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];

        // Analyze route-based splitting opportunities
        const routes = this.analyzeRoutes();
        routes.forEach(route => {
            if (route.size > 500000) { // 500KB threshold
                recommendations.push({
                    type: 'split',
                    description: `Split large route component: ${route.name}`,
                    impact: 'high',
                    estimatedSavings: route.size * 0.3,
                });
            }
        });

        // Analyze vendor bundle splitting
        const vendorSize = this.getVendorBundleSize();
        if (vendorSize > 1000000) { // 1MB threshold
            recommendations.push({
                type: 'split',
                description: 'Split vendor bundle into smaller chunks',
                impact: 'high',
                estimatedSavings: vendorSize * 0.4,
            });
        }

        return recommendations;
    }

    // Lazy loading optimization
    public optimizeLazyLoading(): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];

        // Analyze components that should be lazy loaded
        const heavyComponents = this.findHeavyComponents();
        heavyComponents.forEach(component => {
            if (!component.isLazyLoaded && component.usageFrequency < 0.3) {
                recommendations.push({
                    type: 'lazy',
                    description: `Lazy load component: ${component.name}`,
                    impact: 'medium',
                    estimatedSavings: component.size,
                });
            }
        });

        return recommendations;
    }

    // Preloading optimization
    public optimizePreloading(): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];

        // Analyze critical resources that should be preloaded
        const criticalResources = this.findCriticalResources();
        criticalResources.forEach(resource => {
            if (!resource.isPreloaded && resource.criticalPath) {
                recommendations.push({
                    type: 'preload',
                    description: `Preload critical resource: ${resource.name}`,
                    impact: 'high',
                    estimatedSavings: resource.loadTime * 0.8,
                });
            }
        });

        return recommendations;
    }

    // Tree shaking optimization
    public optimizeTreeShaking(): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];

        // Find unused exports
        const unusedExports = this.findUnusedExports();
        unusedExports.forEach(unusedExport => {
            recommendations.push({
                type: 'remove',
                description: `Remove unused export: ${unusedExport.export} from ${unusedExport.module}`,
                impact: 'low',
                estimatedSavings: unusedExport.size,
            });
        });

        return recommendations;
    }

    // Bundle analysis methods
    private analyzeRoutes(): any[] {
        // This would integrate with your routing system
        // For now, return mock data
        return [
            { name: 'Dashboard', size: 750000, isLazyLoaded: false },
            { name: 'Profile', size: 300000, isLazyLoaded: true },
            { name: 'Settings', size: 200000, isLazyLoaded: true },
        ];
    }

    private getVendorBundleSize(): number {
        // Analyze vendor bundle size
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const vendorResources = resources.filter(r =>
            r.name.includes('vendor') || r.name.includes('node_modules')
        );

        return vendorResources.reduce((total, resource) =>
            total + (resource.transferSize || 0), 0
        );
    }

    private findHeavyComponents(): any[] {
        // Mock heavy components analysis
        return [
            {
                name: 'DataVisualization',
                size: 400000,
                isLazyLoaded: false,
                usageFrequency: 0.2
            },
            {
                name: 'AdvancedSettings',
                size: 250000,
                isLazyLoaded: false,
                usageFrequency: 0.1
            },
        ];
    }

    private findCriticalResources(): any[] {
        // Mock critical resources analysis
        return [
            {
                name: 'main.css',
                isPreloaded: false,
                criticalPath: true,
                loadTime: 200
            },
            {
                name: 'fonts.woff2',
                isPreloaded: false,
                criticalPath: true,
                loadTime: 150
            },
        ];
    }

    private findUnusedExports(): UnusedExport[] {
        // Mock unused exports analysis
        return [
            {
                module: 'utils/helpers.ts',
                export: 'unusedFunction',
                size: 5000
            },
            {
                module: 'components/legacy.tsx',
                export: 'OldComponent',
                size: 15000
            },
        ];
    }

    // Performance metrics
    public getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        return {
            // Core Web Vitals
            firstContentfulPaint: this.getFirstContentfulPaintTime(),
            largestContentfulPaint: this.getLargestContentfulPaintTime(),
            cumulativeLayoutShift: this.getCumulativeLayoutShift(),
            firstInputDelay: this.getFirstInputDelay(),

            // Loading Performance
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            timeToFirstByte: navigation.responseStart - navigation.navigationStart,

            // Resource Performance
            totalResources: resources.length,
            totalTransferSize: resources.reduce((total, r) => total + (r.transferSize || 0), 0),
            cachedResources: resources.filter(r => r.transferSize === 0).length,

            // Bundle Analysis
            bundleSize: this.getBundleSize(),
            chunkCount: this.getChunkCount(),
            compressionRatio: this.getCompressionRatio(),
        };
    }

    private getCumulativeLayoutShift(): Promise<number> {
        return new Promise((resolve) => {
            if (!('PerformanceObserver' in window)) {
                resolve(0);
                return;
            }

            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
            });

            observer.observe({ entryTypes: ['layout-shift'] });

            // Return current value after 5 seconds
            setTimeout(() => {
                observer.disconnect();
                resolve(clsValue);
            }, 5000);
        });
    }

    private getFirstInputDelay(): Promise<number> {
        return new Promise((resolve) => {
            if (!('PerformanceObserver' in window)) {
                resolve(0);
                return;
            }

            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    resolve(entry.processingStart - entry.startTime);
                    observer.disconnect();
                });
            });

            observer.observe({ entryTypes: ['first-input'] });

            // Timeout after 10 seconds
            setTimeout(() => {
                observer.disconnect();
                resolve(0);
            }, 10000);
        });
    }

    private getBundleSize(): number {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(r =>
            r.name.endsWith('.js') || r.name.includes('chunk')
        );

        return jsResources.reduce((total, resource) =>
            total + (resource.transferSize || 0), 0
        );
    }

    private getChunkCount(): number {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources.filter(r => r.name.includes('chunk')).length;
    }

    private getCompressionRatio(): number {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const compressibleResources = resources.filter(r =>
            r.transferSize > 0 && r.decodedBodySize > 0
        );

        if (compressibleResources.length === 0) return 1;

        const totalTransfer = compressibleResources.reduce((sum, r) => sum + r.transferSize, 0);
        const totalDecoded = compressibleResources.reduce((sum, r) => sum + r.decodedBodySize, 0);

        return totalDecoded / totalTransfer;
    }

    // Generate comprehensive optimization report
    public generateOptimizationReport(): BundleAnalysis {
        const recommendations = [
            ...this.optimizeCodeSplitting(),
            ...this.optimizeLazyLoading(),
            ...this.optimizePreloading(),
            ...this.optimizeTreeShaking(),
        ];

        this.analysis = {
            totalSize: this.getBundleSize(),
            gzippedSize: this.getBundleSize() / this.getCompressionRatio(),
            chunks: this.analyzeChunks(),
            duplicates: this.findDuplicateModules(),
            unusedExports: this.findUnusedExports(),
            recommendations: recommendations.sort((a, b) => {
                const impactOrder = { high: 3, medium: 2, low: 1 };
                return impactOrder[b.impact] - impactOrder[a.impact];
            }),
        };

        return this.analysis;
    }

    private analyzeChunks(): ChunkInfo[] {
        // Mock chunk analysis
        return [
            {
                name: 'main',
                size: 500000,
                gzippedSize: 150000,
                modules: [],
                loadTime: 200,
                priority: 'critical',
            },
            {
                name: 'vendor',
                size: 800000,
                gzippedSize: 200000,
                modules: [],
                loadTime: 300,
                priority: 'high',
            },
        ];
    }

    private findDuplicateModules(): DuplicateModule[] {
        // Mock duplicate module analysis
        return [
            {
                name: 'lodash',
                occurrences: 3,
                totalSize: 75000,
                chunks: ['main', 'vendor', 'admin'],
            },
        ];
    }

    public cleanup() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }
}

// Singleton instance
export const bundleOptimizer = new BundleOptimizer();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        bundleOptimizer.cleanup();
    });
}