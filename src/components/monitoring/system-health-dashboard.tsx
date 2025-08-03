'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
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
    AlertTriangle,
    CheckCircle,
    Clock,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    Network,
    Server,
    Shield,
    TrendingUp,
    TrendingDown,
    Users,
    Zap,
    RefreshCw,
    Settings,
    Bell,
    Eye,
    AlertCircle,
    XCircle,
    Wifi,
    Globe
} from 'lucide-react';
import {
    systemHealthService,
    SystemMetrics,
    ApplicationMetrics,
    UserExperienceMetrics,
    ServiceHealth,
    Alert as SystemAlert,
    SystemStatus,
    PerformanceTrend
} from '@/services/systemHealthService';
import { useToast } from '@/hooks/use-toast';

interface SystemHealthDashboardProps {
    userId: string;
    userRole: 'admin' | 'operator' | 'developer';
}

export function SystemHealthDashboard({ userId, userRole }: SystemHealthDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

    // Real-time data states
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
    const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics | null>(null);
    const [userExperienceMetrics, setUserExperienceMetrics] = useState<UserExperienceMetrics | null>(null);
    const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);

    const { toast } = useToast();

    useEffect(() => {
        loadInitialData();

        // Start real-time monitoring
        const unsubscribeMonitoring = systemHealthService.startRealTimeMonitoring((data) => {
            setSystemMetrics(data.system);
            setApplicationMetrics(data.application);
            setUserExperienceMetrics(data.userExperience);
        });

        // Subscribe to alerts
        const unsubscribeAlerts = systemHealthService.subscribeToAlerts((alertsData) => {
            setAlerts(alertsData);
        });

        return () => {
            unsubscribeMonitoring();
            unsubscribeAlerts();
        };
    }, []);

    useEffect(() => {
        loadPerformanceTrends();
    }, [timeframe]);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            const [
                systemData,
                applicationData,
                userExperienceData,
                serviceHealthData,
                systemStatusData,
                alertsData
            ] = await Promise.all([
                systemHealthService.collectSystemMetrics(),
                systemHealthService.collectApplicationMetrics(),
                systemHealthService.collectUserExperienceMetrics(),
                systemHealthService.getServiceHealth(),
                systemHealthService.getSystemStatus(),
                systemHealthService.getActiveAlerts()
            ]);

            setSystemMetrics(systemData);
            setApplicationMetrics(applicationData);
            setUserExperienceMetrics(userExperienceData);
            setServiceHealth(serviceHealthData);
            setSystemStatus(systemStatusData);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Error loading system health data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load system health data. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPerformanceTrends = async () => {
        try {
            const trends = await systemHealthService.getPerformanceTrends(
                ['cpu_usage', 'memory_usage', 'response_time', 'error_rate'],
                timeframe
            );
            setPerformanceTrends(trends);
        } catch (error) {
            console.error('Error loading performance trends:', error);
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await systemHealthService.acknowledgeAlert(alertId, userId);
            toast({
                title: 'Success',
                description: 'Alert acknowledged successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to acknowledge alert. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const handleResolveAlert = async (alertId: string, resolution: string) => {
        try {
            await systemHealthService.resolveAlert(alertId, userId, resolution);
            toast({
                title: 'Success',
                description: 'Alert resolved successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to resolve alert. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational':
                return 'bg-green-100 text-green-800';
            case 'degraded':
                return 'bg-yellow-100 text-yellow-800';
            case 'unhealthy':
            case 'major_outage':
                return 'bg-red-100 text-red-800';
            case 'down':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
                    <p className="text-gray-600">Real-time system performance and health monitoring</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">Last Hour</SelectItem>
                            <SelectItem value="24h">Last 24h</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={loadInitialData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>

                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* System Status Overview */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                {systemStatus?.overall === 'operational' ? (
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                ) : systemStatus?.overall === 'degraded' ? (
                                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-600" />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {systemStatus?.overall === 'operational' ? 'All Systems Operational' :
                                            systemStatus?.overall === 'degraded' ? 'Some Systems Degraded' :
                                                'Major Service Outage'}
                                    </h2>
                                    <p className="text-gray-600">
                                        Last updated: {systemStatus?.lastUpdated.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatPercentage(systemStatus?.uptime.last24h || 0)}
                                </p>
                                <p className="text-sm text-gray-600">24h Uptime</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {systemStatus?.activeIncidents || 0}
                                </p>
                                <p className="text-sm text-gray-600">Active Incidents</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {serviceHealth.filter(s => s.status === 'healthy').length}/{serviceHealth.length}
                                </p>
                                <p className="text-sm text-gray-600">Healthy Services</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts */}
            {alerts.filter(a => a.status === 'active').length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Bell className="h-5 w-5" />
                            <span>Active Alerts</span>
                            <Badge variant="destructive">
                                {alerts.filter(a => a.status === 'active').length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.filter(a => a.status === 'active').slice(0, 3).map((alert) => (
                                <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{alert.title}</p>
                                                <p className="text-sm">{alert.description}</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {alert.createdAt.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleResolveAlert(alert.id, 'Manual resolution')}
                                                >
                                                    Resolve
                                                </Button>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="application">Application</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* System Metrics Cards */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Cpu className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">CPU Usage</p>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={systemMetrics?.cpu.usage || 0} className="flex-1" />
                                            <span className="text-sm font-medium">
                                                {formatPercentage(systemMetrics?.cpu.usage || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <MemoryStick className="h-5 w-5 text-green-600" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">Memory Usage</p>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={systemMetrics?.memory.usage || 0} className="flex-1" />
                                            <span className="text-sm font-medium">
                                                {formatPercentage(systemMetrics?.memory.usage || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">Response Time</p>
                                        <p className="text-2xl font-bold">
                                            {formatDuration(applicationMetrics?.responseTime.average || 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-5 w-5 text-orange-600" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">Active Users</p>
                                        <p className="text-2xl font-bold">
                                            {formatNumber(applicationMetrics?.throughput.concurrentUsers || 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>CPU & Memory Usage</CardTitle>
                                <CardDescription>System resource utilization over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={performanceTrends.find(t => t.metric === 'cpu_usage')?.data.map((d, i) => ({
                                        time: d.timestamp.toLocaleTimeString(),
                                        cpu: d.value,
                                        memory: performanceTrends.find(t => t.metric === 'memory_usage')?.data[i]?.value || 0
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                                        <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Response Time & Error Rate</CardTitle>
                                <CardDescription>Application performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
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
                                        <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
                                        <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ff7300" name="Error Rate %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Additional tabs would continue here... */}
                <TabsContent value="system">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">System metrics details coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="application">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Application metrics details coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Service health details coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Alert management details coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}