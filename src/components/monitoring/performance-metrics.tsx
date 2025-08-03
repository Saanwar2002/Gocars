'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive,
  MemoryStick,
  Network,
  Server,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Users,
  Globe,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import { 
  systemHealthService, 
  SystemMetrics, 
  ApplicationMetrics, 
  UserExperienceMetrics,
  PerformanceTrend
} from '@/services/systemHealthService';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetricsProps {
  timeframe: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

export function PerformanceMetrics({ timeframe, refreshInterval = 30000 }: PerformanceMetricsProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics | null>(null);
  const [userExperienceMetrics, setUserExperienceMetrics] = useState<UserExperienceMetrics | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
    
    // Set up real-time monitoring
    const unsubscribe = systemHealthService.startRealTimeMonitoring((data) => {
      setSystemMetrics(data.system);
      setApplicationMetrics(data.application);
      setUserExperienceMetrics(data.userExperience);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadPerformanceTrends();
  }, [timeframe]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [system, application, userExperience] = await Promise.all([
        systemHealthService.collectSystemMetrics(),
        systemHealthService.collectApplicationMetrics(),
        systemHealthService.collectUserExperienceMetrics()
      ]);

      setSystemMetrics(system);
      setApplicationMetrics(application);
      setUserExperienceMetrics(userExperience);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance metrics.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceTrends = async () => {
    try {
      const trends = await systemHealthService.getPerformanceTrends(
        ['cpu_usage', 'memory_usage', 'response_time', 'error_rate', 'throughput'],
        timeframe
      );
      setPerformanceTrends(trends);
    } catch (error) {
      console.error('Error loading performance trends:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) {
      return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (value >= thresholds.warning) {
      return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Cpu className="h-5 w-5" />
              <span>CPU Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatPercentage(systemMetrics?.cpu.usage || 0)}
                </span>
                {getTrendIcon(performanceTrends.find(t => t.metric === 'cpu_usage')?.trend || 'stable')}
              </div>
              <Progress value={systemMetrics?.cpu.usage || 0} className="h-2" />
              <div className="text-sm text-gray-600">
                <p>Cores: {systemMetrics?.cpu.cores}</p>
                <p>Load Avg: {systemMetrics?.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <MemoryStick className="h-5 w-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatPercentage(systemMetrics?.memory.usage || 0)}
                </span>
                {getTrendIcon(performanceTrends.find(t => t.metric === 'memory_usage')?.trend || 'stable')}
              </div>
              <Progress value={systemMetrics?.memory.usage || 0} className="h-2" />
              <div className="text-sm text-gray-600">
                <p>Used: {formatBytes((systemMetrics?.memory.used || 0) * 1024 * 1024 * 1024)}</p>
                <p>Total: {formatBytes((systemMetrics?.memory.total || 0) * 1024 * 1024 * 1024)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <HardDrive className="h-5 w-5" />
              <span>Disk Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatPercentage(systemMetrics?.disk.usage || 0)}
                </span>
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <Progress value={systemMetrics?.disk.usage || 0} className="h-2" />
              <div className="text-sm text-gray-600">
                <p>Used: {formatBytes((systemMetrics?.disk.used || 0) * 1024 * 1024 * 1024)}</p>
                <p>Available: {formatBytes((systemMetrics?.disk.available || 0) * 1024 * 1024 * 1024)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Network className="h-5 w-5" />
              <span>Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatDuration(systemMetrics?.network.latency || 0)}
                </span>
                <Wifi className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>In: {formatNumber(systemMetrics?.network.inbound || 0)} Mbps</p>
                <p>Out: {formatNumber(systemMetrics?.network.outbound || 0)} Mbps</p>
                <p>Errors: {systemMetrics?.network.errors || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="h-5 w-5" />
              <span>Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatDuration(applicationMetrics?.responseTime.average || 0)}
                </span>
                {getTrendIcon(performanceTrends.find(t => t.metric === 'response_time')?.trend || 'stable')}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>P50: {formatDuration(applicationMetrics?.responseTime.p50 || 0)}</p>
                <p>P95: {formatDuration(applicationMetrics?.responseTime.p95 || 0)}</p>
                <p>P99: {formatDuration(applicationMetrics?.responseTime.p99 || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Throughput */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Zap className="h-5 w-5" />
              <span>Throughput</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatNumber(applicationMetrics?.throughput.requestsPerSecond || 0)}
                </span>
                <span className="text-sm text-gray-600">RPS</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>RPM: {formatNumber(applicationMetrics?.throughput.requestsPerMinute || 0)}</p>
                <p>Concurrent: {formatNumber(applicationMetrics?.throughput.concurrentUsers || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>Error Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatPercentage(applicationMetrics?.errors.rate || 0)}
                </span>
                {getTrendIcon(performanceTrends.find(t => t.metric === 'error_rate')?.trend || 'stable')}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Total: {applicationMetrics?.errors.total || 0}</p>
                <p>4xx: {applicationMetrics?.errors.by4xx || 0}</p>
                <p>5xx: {applicationMetrics?.errors.by5xx || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Database className="h-5 w-5" />
              <span>Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatDuration(applicationMetrics?.database.queryTime || 0)}
                </span>
                <span className="text-sm text-gray-600">Avg Query</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Connections: {applicationMetrics?.database.connections || 0}</p>
                <p>Slow Queries: {applicationMetrics?.database.slowQueries || 0}</p>
                <p>Deadlocks: {applicationMetrics?.database.deadlocks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Experience Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Experience Metrics</span>
          </CardTitle>
          <CardDescription>Frontend performance and user satisfaction metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {formatDuration(userExperienceMetrics?.pageLoad.average || 0)}
              </p>
              <p className="text-sm text-gray-600">Avg Page Load</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatDuration(userExperienceMetrics?.interactivity.firstContentfulPaint || 0)}
              </p>
              <p className="text-sm text-gray-600">First Contentful Paint</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {userExperienceMetrics?.satisfaction.apdexScore.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-600">Apdex Score</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {formatPercentage(userExperienceMetrics?.satisfaction.bounceRate || 0)}
              </p>
              <p className="text-sm text-gray-600">Bounce Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resource Trends</CardTitle>
            <CardDescription>CPU and Memory usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceTrends.find(t => t.metric === 'cpu_usage')?.data.map((d, i) => ({
                time: d.timestamp.toLocaleTimeString(),
                cpu: d.value,
                memory: performanceTrends.find(t => t.metric === 'memory_usage')?.data[i]?.value || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="CPU %" />
                <Area type="monotone" dataKey="memory" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Performance</CardTitle>
            <CardDescription>Response time and error rate trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends.find(t => t.metric === 'response_time')?.data.map((d, i) => ({
                time: d.timestamp.toLocaleTimeString(),
                responseTime: d.value,
                errorRate: performanceTrends.find(t => t.metric === 'error_rate')?.data[i]?.value || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} name="Response Time (ms)" />
                <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ff7300" strokeWidth={2} name="Error Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}