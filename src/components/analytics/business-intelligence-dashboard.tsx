'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Car, 
  Star,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import { 
  businessIntelligenceService, 
  KPIMetric, 
  RevenueMetrics, 
  OperationalMetrics, 
  CustomerMetrics, 
  DriverMetrics,
  TimeSeriesData,
  GeographicData,
  DateRange
} from '@/services/businessIntelligenceService';
import { useToast } from '@/hooks/use-toast';

interface BusinessIntelligenceDashboardProps {
  userId: string;
  userRole: 'admin' | 'operator' | 'analyst';
}

export function BusinessIntelligenceDashboard({ userId, userRole }: BusinessIntelligenceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last_30_days'
  });

  // Data states
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics | null>(null);
  const [driverMetrics, setDriverMetrics] = useState<DriverMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        kpis,
        revenue,
        operational,
        customer,
        driver,
        timeSeries,
        geographic
      ] = await Promise.all([
        businessIntelligenceService.getKPIMetrics(undefined, selectedPeriod),
        businessIntelligenceService.getRevenueMetrics(dateRange),
        businessIntelligenceService.getOperationalMetrics(dateRange),
        businessIntelligenceService.getCustomerMetrics(dateRange),
        businessIntelligenceService.getDriverMetrics(dateRange),
        businessIntelligenceService.getTimeSeriesData('revenue', dateRange),
        businessIntelligenceService.getGeographicData(dateRange)
      ]);

      setKpiMetrics(kpis);
      setRevenueMetrics(revenue);
      setOperationalMetrics(operational);
      setCustomerMetrics(customer);
      setDriverMetrics(driver);
      setTimeSeriesData(timeSeries);
      setGeographicData(geographic);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Dashboard data refreshed successfully.',
    });
  };

  const handleExportData = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const blob = await businessIntelligenceService.exportData(
        ['revenue', 'rides', 'users', 'drivers'],
        dateRange,
        format
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gocars-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Data exported successfully as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Comprehensive analytics and insights for data-driven decisions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(range) => setDateRange(range || dateRange)}
          />
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.slice(0, 4).map((kpi) => (
          <Card key={kpi.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-2xl font-bold">
                      {kpi.unit === 'USD' ? formatCurrency(kpi.value) : 
                       kpi.unit === 'percent' ? formatPercentage(kpi.value) :
                       kpi.unit === 'rating' ? kpi.value.toFixed(1) :
                       formatNumber(kpi.value)}
                    </p>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-sm ${getTrendColor(kpi.trend)}`}>
                      {kpi.changePercent > 0 ? '+' : ''}{formatPercentage(kpi.changePercent)}
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className="text-right">
                  {kpi.target && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Target</p>
                      <Progress 
                        value={(kpi.value / kpi.target) * 100} 
                        className="w-16 h-2"
                      />
                      <p className="text-xs text-gray-600">
                        {((kpi.value / kpi.target) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Revenue Trend</span>
                </CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="metrics.revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rides vs Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Rides vs Active Users</span>
                </CardTitle>
                <CardDescription>Correlation between rides and user activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="metrics.rides" 
                      stroke="#8884d8" 
                      name="Rides"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="metrics.users" 
                      stroke="#82ca9d" 
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium">{formatPercentage(operationalMetrics?.completionRate || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Wait Time</span>
                  <span className="font-medium">{operationalMetrics?.averageWaitTime || 0} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="font-medium">{customerMetrics?.customerSatisfactionScore || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Driver Utilization</span>
                  <span className="font-medium">{formatPercentage(driverMetrics?.driverUtilizationRate || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <span className="font-medium text-green-600">+{formatPercentage(revenueMetrics?.revenueGrowth || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Retention</span>
                  <span className="font-medium">{formatPercentage(customerMetrics?.userRetentionRate || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Driver Retention</span>
                  <span className="font-medium">{formatPercentage(driverMetrics?.driverRetentionRate || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Users</span>
                  <span className="font-medium">+{formatNumber(customerMetrics?.newUsers || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Financial Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue per Ride</span>
                  <span className="font-medium">{formatCurrency(revenueMetrics?.averageRevenuePerRide || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue per User</span>
                  <span className="font-medium">{formatCurrency(revenueMetrics?.averageRevenuePerUser || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer LTV</span>
                  <span className="font-medium">{formatCurrency(customerMetrics?.lifetimeValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Driver Earnings</span>
                  <span className="font-medium">{formatCurrency(driverMetrics?.averageDriverEarnings || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Revenue Breakdown</span>
                </CardTitle>
                <CardDescription>Revenue distribution by source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Rides', value: revenueMetrics?.rideRevenue || 0 },
                        { name: 'Subscriptions', value: revenueMetrics?.subscriptionRevenue || 0 },
                        { name: 'Advertising', value: revenueMetrics?.advertisingRevenue || 0 },
                        { name: 'Partnerships', value: revenueMetrics?.partnershipRevenue || 0 },
                        { name: 'Other', value: revenueMetrics?.otherRevenue || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Revenue Metrics</span>
                </CardTitle>
                <CardDescription>Key revenue performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(revenueMetrics?.totalRevenue || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      +{formatPercentage(revenueMetrics?.revenueGrowth || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Growth Rate</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ride Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueMetrics?.rideRevenue || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subscription Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueMetrics?.subscriptionRevenue || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Advertising Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueMetrics?.advertisingRevenue || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Partnership Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueMetrics?.partnershipRevenue || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operational Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Operational Efficiency</span>
                </CardTitle>
                <CardDescription>Key operational performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={operationalMetrics?.completionRate || 0} className="w-20" />
                      <span className="font-medium">{formatPercentage(operationalMetrics?.completionRate || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Driver Utilization</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={operationalMetrics?.driverUtilization || 0} className="w-20" />
                      <span className="font-medium">{formatPercentage(operationalMetrics?.driverUtilization || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vehicle Utilization</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={operationalMetrics?.vehicleUtilization || 0} className="w-20" />
                      <span className="font-medium">{formatPercentage(operationalMetrics?.vehicleUtilization || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Peak Hour Utilization</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={operationalMetrics?.peakHourUtilization || 0} className="w-20" />
                      <span className="font-medium">{formatPercentage(operationalMetrics?.peakHourUtilization || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ride Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Ride Statistics</span>
                </CardTitle>
                <CardDescription>Detailed ride performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">
                      {formatNumber(operationalMetrics?.totalRides || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Total Rides</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">
                      {formatNumber(operationalMetrics?.completedRides || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Wait Time</span>
                    <span className="font-medium">{operationalMetrics?.averageWaitTime || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Ride Time</span>
                    <span className="font-medium">{operationalMetrics?.averageRideTime || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Distance</span>
                    <span className="font-medium">{operationalMetrics?.averageRideDistance || 0} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancelled Rides</span>
                    <span className="font-medium text-red-600">{formatNumber(operationalMetrics?.cancelledRides || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tabs would be implemented similarly... */}
        <TabsContent value="customers">
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Customer analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Driver analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic">
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Geographic analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}