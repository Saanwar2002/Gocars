'use client';

import React, { useState, Suspense } from 'react';
import { OfflineMode, NetworkStatusIndicator, useOfflineData } from '@/components/performance/OfflineMode';
import { LazyImage, LazyImageGallery, useImagePreloader } from '@/components/performance/LazyImage';
import { PerformanceMonitor, PerformanceOptimizer } from '@/components/performance/PerformanceMonitor';
import { ComponentLoader, withLazyLoading, ProgressiveLoader } from '@/components/performance/CodeSplitting';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDataCache } from '@/hooks/useDataCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap, Database, Image, Code, Wifi, WifiOff, Activity,
  Download, Upload, Clock, Smartphone, TrendingUp
} from 'lucide-react';

// Lazy loaded components for demonstration
const LazyChart = withLazyLoading(
  () => import('@/components/charts/InteractiveChart').catch(() => ({ 
    default: () => <div className="p-8 text-center">Chart component not found</div> 
  })),
  {
    fallback: <ComponentLoader message="Loading chart..." />,
    networkAware: true,
    preload: true,
  }
);

const LazySettings = withLazyLoading(
  () => import('@/components/settings/SettingsPanel').catch(() => ({ 
    default: () => <div className="p-8 text-center">Settings component not found</div> 
  })),
  {
    fallback: <ComponentLoader message="Loading settings..." />,
    networkAware: true,
  }
);

export default function PerformanceDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [cacheStats, setCacheStats] = useState<any>({});
  const { networkStatus, shouldReduceData, isSlowConnection } = useNetworkStatus();
  const { get, set, cacheStats: dataCacheStats } = useDataCache();
  const { preloadImages } = useImagePreloader();

  // Sample data for offline demo
  const { data: sampleData, isLoading, isStale, refetch } = useOfflineData(
    'sample_data',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        rides: [
          { id: 1, destination: 'Airport', fare: '$25.00', status: 'completed' },
          { id: 2, destination: 'Downtown', fare: '$18.50', status: 'active' },
          { id: 3, destination: 'Mall', fare: '$12.00', status: 'pending' },
        ],
        stats: {
          totalRides: 156,
          totalEarnings: '$2,340.50',
          rating: 4.8,
        }
      };
    },
    { staleTime: 2 * 60 * 1000 } // 2 minutes
  );

  // Sample images for lazy loading demo
  const sampleImages = [
    { src: 'https://picsum.photos/400/300?random=1', alt: 'Sample 1', aspectRatio: 4/3 },
    { src: 'https://picsum.photos/400/300?random=2', alt: 'Sample 2', aspectRatio: 4/3 },
    { src: 'https://picsum.photos/400/300?random=3', alt: 'Sample 3', aspectRatio: 4/3 },
    { src: 'https://picsum.photos/400/300?random=4', alt: 'Sample 4', aspectRatio: 4/3 },
    { src: 'https://picsum.photos/400/300?random=5', alt: 'Sample 5', aspectRatio: 4/3 },
    { src: 'https://picsum.photos/400/300?random=6', alt: 'Sample 6', aspectRatio: 4/3 },
  ];

  const handlePreloadImages = () => {
    const imageSources = sampleImages.map(img => img.src);
    preloadImages(imageSources, 'high');
  };

  const handleCacheTest = () => {
    const testData = { message: 'Hello from cache!', timestamp: Date.now() };
    set('test_data', testData, { persistToStorage: true, priority: 'medium' });
    
    setTimeout(() => {
      const cached = get('test_data');
      alert(cached ? `Cached data: ${cached.message}` : 'No cached data found');
    }, 100);
  };

  return (
    <OfflineMode>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mobile Performance Demo</h1>
                <p className="text-blue-100">
                  Comprehensive mobile performance optimizations and monitoring
                </p>
              </div>
              <div className="text-right">
                <NetworkStatusIndicator className="justify-end mb-2" />
                <div className="text-sm text-blue-100">
                  {shouldReduceData() ? 'Data Saver Mode' : 'Normal Mode'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Alerts */}
        {isSlowConnection() && (
          <div className="max-w-7xl mx-auto mb-6">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Slow connection detected. Performance optimizations are active to improve your experience.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="caching">Caching</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="code-splitting">Code Splitting</TabsTrigger>
              <TabsTrigger value="offline">Offline Mode</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Wifi className="h-4 w-4 mr-2" />
                      Network Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Type:</span>
                        <Badge variant="outline">
                          {networkStatus.effectiveType.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Speed:</span>
                        <span>{networkStatus.downlink.toFixed(1)} Mbps</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>RTT:</span>
                        <span>{networkStatus.rtt}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Data Saver:</span>
                        <span>{networkStatus.saveData ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Cache Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory:</span>
                        <span>{(dataCacheStats.memorySize / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Storage:</span>
                        <span>{(dataCacheStats.storageSize / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Hit Rate:</span>
                        <span>{(dataCacheStats.hitRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Requests:</span>
                        <span>{dataCacheStats.totalRequests}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Load Time:</span>
                        <span className="text-green-600">Fast</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Bundle Size:</span>
                        <span className="text-green-600">Optimized</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Images:</span>
                        <span className="text-green-600">Lazy Loaded</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Code:</span>
                        <span className="text-green-600">Split</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Touch Optimized:</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Offline Support:</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>PWA Ready:</span>
                        <span className="text-green-600">✓</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Network Aware:</span>
                        <span className="text-green-600">✓</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <PerformanceOptimizer />
            </TabsContent>

            {/* Caching Tab */}
            <TabsContent value="caching" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Data Caching Demo
                  </CardTitle>
                  <CardDescription>
                    Intelligent caching with network awareness and offline support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Sample Data</h4>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sampleData?.rides.map((ride: any) => (
                            <div key={ride.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                              <span>{ride.destination}</span>
                              <span className="font-medium">{ride.fare}</span>
                            </div>
                          ))}
                          {isStale && (
                            <Badge variant="outline" className="text-orange-600">
                              Data may be stale
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Cache Actions</h4>
                      <div className="space-y-2">
                        <Button onClick={handleCacheTest} size="sm" className="w-full">
                          Test Cache Storage
                        </Button>
                        <Button onClick={refetch} size="sm" variant="outline" className="w-full">
                          Refresh Data
                        </Button>
                        <Button 
                          onClick={() => window.location.reload()} 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                        >
                          Clear & Reload
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Lazy Image Loading Demo
                  </CardTitle>
                  <CardDescription>
                    Network-aware image optimization with progressive loading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2 mb-4">
                    <Button onClick={handlePreloadImages} size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Preload Images
                    </Button>
                    <Badge variant="outline">
                      Quality: {shouldReduceData() ? 'Low' : 'High'}
                    </Badge>
                  </div>
                  
                  <LazyImageGallery
                    images={sampleImages}
                    columns={shouldReduceData() ? 2 : 3}
                    onImageClick={(index) => console.log('Image clicked:', index)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Splitting Tab */}
            <TabsContent value="code-splitting" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Code Splitting Demo
                  </CardTitle>
                  <CardDescription>
                    Lazy loading components with network awareness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Progressive Loading</h4>
                    <ProgressiveLoader
                      stages={[
                        <div key="1" className="p-4 bg-blue-50 rounded">Loading stage 1...</div>,
                        <div key="2" className="p-4 bg-green-50 rounded">Loading stage 2...</div>,
                        <div key="3" className="p-4 bg-purple-50 rounded">Loading stage 3...</div>,
                      ]}
                      delay={1000}
                      networkAware={true}
                    >
                      <div className="p-4 bg-gray-50 rounded">
                        <h5 className="font-medium">Fully Loaded Content</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          This content loaded progressively based on network conditions.
                        </p>
                      </div>
                    </ProgressiveLoader>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Lazy Loaded Chart</h4>
                    <Suspense fallback={<ComponentLoader message="Loading chart component..." />}>
                      <LazyChart />
                    </Suspense>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Lazy Loaded Settings</h4>
                    <Suspense fallback={<ComponentLoader message="Loading settings component..." />}>
                      <LazySettings />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Offline Mode Tab */}
            <TabsContent value="offline" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {networkStatus.isOnline ? (
                      <Wifi className="h-5 w-5 mr-2 text-green-600" />
                    ) : (
                      <WifiOff className="h-5 w-5 mr-2 text-red-600" />
                    )}
                    Offline Mode Demo
                  </CardTitle>
                  <CardDescription>
                    Test offline functionality and data synchronization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Connection Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {networkStatus.isOnline ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                          <span className="text-sm">
                            {networkStatus.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Try disconnecting your internet to test offline functionality.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Offline Features</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Cached data access</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Offline action queuing</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Auto-sync on reconnect</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Offline notifications</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h5 className="font-medium mb-2">Test Instructions</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      <li>Disconnect your internet connection</li>
                      <li>Try interacting with the app (forms, navigation, etc.)</li>
                      <li>Notice the offline banner and cached data</li>
                      <li>Reconnect to see automatic synchronization</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Performance Monitor */}
        <PerformanceMonitor showInProduction={true} />
      </div>
    </OfflineMode>
  );
}