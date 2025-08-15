'use client';

import React, { useState, useEffect } from 'react';
import { bundleOptimizer } from '@/lib/performance/bundleOptimizer';
import { cacheManager } from '@/lib/performance/cacheManager';
import { databaseOptimizer } from '@/lib/performance/databaseOptimizer';
import { assetOptimizer } from '@/lib/performance/assetOptimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap, Database, Image, Code, BarChart3, TrendingUp,
  Clock, HardDrive, Wifi, CheckCircle, AlertTriangle,
  Settings, RefreshCw, Download, Upload
} from 'lucide-react';

export default function PerformanceOptimizationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [assetMetrics, setAssetMetrics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setIsAnalyzing(true);
    
    try {
      // Load bundle analysis
      const bundleReport = bundleOptimizer.generateOptimizationReport();
      setBundleAnalysis(bundleReport);

      // Load cache statistics
      const allCacheStats = cacheManager.getAllStats();
      setCacheStats(allCacheStats);

      // Load database metrics
      const dbReport = databaseOptimizer.generateOptimizationReport();
      setDbMetrics(dbReport);

      // Load asset metrics
      const assetReport = assetOptimizer.generateOptimizationReport();
      setAssetMetrics(assetReport);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Optimization Center</h1>
              <p className="text-green-100">
                Comprehensive performance analysis and optimization recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={loadPerformanceData}
                disabled={isAnalyzing}
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Performance
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Bundle Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bundleAnalysis ? formatBytes(bundleAnalysis.totalSize) : '---'}
              </div>
              <p className="text-sm text-gray-600">
                Gzipped: {bundleAnalysis ? formatBytes(bundleAnalysis.gzippedSize) : '---'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <HardDrive className="h-4 w-4 mr-2" />
                Cache Hit Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cacheStats ? `${(Array.from(cacheStats.values())[0]?.hitRate * 100 || 0).toFixed(1)}%` : '---'}
              </div>
              <p className="text-sm text-gray-600">
                Across all caches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Avg Query Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dbMetrics ? formatTime(dbMetrics.metrics.averageQueryTime) : '---'}
              </div>
              <p className="text-sm text-gray-600">
                Database performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Image className="h-4 w-4 mr-2" />
                Asset Compression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assetMetrics ? `${assetMetrics.metrics.compressionRatio.toFixed(1)}x` : '---'}
              </div>
              <p className="text-sm text-gray-600">
                Compression ratio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
            <TabsTrigger value="caching">Caching</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </Tabs>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Score</CardTitle>
                  <CardDescription>
                    Overall application performance rating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Bundle Optimization</span>
                      <Badge variant="outline" className="text-green-600">
                        {bundleAnalysis?.recommendations.length < 5 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                    <Progress value={bundleAnalysis?.recommendations.length < 5 ? 85 : 60} />
                    
                    <div className="flex items-center justify-between">
                      <span>Cache Performance</span>
                      <Badge variant="outline" className="text-blue-600">
                        {cacheStats && Array.from(cacheStats.values())[0]?.hitRate > 0.8 ? 'Excellent' : 'Good'}
                      </Badge>
                    </div>
                    <Progress value={cacheStats ? Array.from(cacheStats.values())[0]?.hitRate * 100 || 0 : 0} />
                    
                    <div className="flex items-center justify-between">
                      <span>Database Efficiency</span>
                      <Badge variant="outline" className="text-purple-600">
                        {dbMetrics?.metrics.averageQueryTime < 100 ? 'Fast' : 'Moderate'}
                      </Badge>
                    </div>
                    <Progress value={dbMetrics?.metrics.averageQueryTime < 100 ? 90 : 70} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Immediate optimization opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Enable Code Splitting
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Optimize Cache Strategy
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Add Database Indexes
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Image className="h-4 w-4 mr-2" />
                    Compress Images
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bundle Analysis Tab */}
          <TabsContent value="bundle" className="space-y-6 mt-6">
            {bundleAnalysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Bundle Analysis</CardTitle>
                    <CardDescription>
                      Code splitting and optimization recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatBytes(bundleAnalysis.totalSize)}
                        </div>
                        <div className="text-sm text-gray-600">Total Size</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatBytes(bundleAnalysis.gzippedSize)}
                        </div>
                        <div className="text-sm text-gray-600">Gzipped</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {bundleAnalysis.chunks.length}
                        </div>
                        <div className="text-sm text-gray-600">Chunks</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Optimization Recommendations</h4>
                      {bundleAnalysis.recommendations.map((rec: any, index: number) => (
                        <Alert key={index}>
                          <TrendingUp className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <span>{rec.description}</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                                  {rec.impact} impact
                                </Badge>
                                <span className="text-sm text-green-600">
                                  Save {formatBytes(rec.estimatedSavings)}
                                </span>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Caching Tab */}
          <TabsContent value="caching" className="space-y-6 mt-6">
            {cacheStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from(cacheStats.entries()).map(([cacheName, stats]: [string, any]) => (
                  <Card key={cacheName}>
                    <CardHeader>
                      <CardTitle className="capitalize">{cacheName.replace('-', ' ')} Cache</CardTitle>
                      <CardDescription>
                        Performance metrics and statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {(stats.hitRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Hit Rate</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {stats.entryCount}
                            </div>
                            <div className="text-sm text-gray-600">Entries</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Cache Size:</span>
                            <span>{formatBytes(stats.cacheSize)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Requests:</span>
                            <span>{stats.totalRequests}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cache Hits:</span>
                            <span className="text-green-600">{stats.totalHits}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cache Misses:</span>
                            <span className="text-red-600">{stats.totalMisses}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6 mt-6">
            {dbMetrics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Database Performance</CardTitle>
                    <CardDescription>
                      Query optimization and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatTime(dbMetrics.metrics.averageQueryTime)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Query Time</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {dbMetrics.metrics.activeConnections}
                        </div>
                        <div className="text-sm text-gray-600">Active Connections</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {dbMetrics.slowQueries.length}
                        </div>
                        <div className="text-sm text-gray-600">Slow Queries</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {(dbMetrics.metrics.cacheHitRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Cache Hit Rate</div>
                      </div>
                    </div>

                    {dbMetrics.slowQueries.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Slow Queries</h4>
                        {dbMetrics.slowQueries.slice(0, 3).map((query: any, index: number) => (
                          <Alert key={index}>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {query.query.substring(0, 60)}...
                                  </code>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-red-600">
                                      {formatTime(query.executionTime)}
                                    </span>
                                    <Badge variant="outline">
                                      {query.frequency} times
                                    </Badge>
                                  </div>
                                </div>
                                {query.suggestedOptimizations.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    Suggestion: {query.suggestedOptimizations[0].description}
                                  </div>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}