'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Car, 
  Clock, 
  Star,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Settings,
  Bell,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  operationalAnalyticsService, 
  OperationalMetrics, 
  KPIMetrics,
  CostAnalysis,
  ProfitabilityReport,
  CompetitiveAnalysis,
  PerformanceDashboard,
  PerformanceAlert
} from '@/services/operationalAnalyticsService';

export default function OperationalAnalyticsDashboard() {
  const [currentMetrics, setCurrentMetrics] = useState<OperationalMetrics | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [profitabilityReport, setProfitabilityReport] = useState<ProfitabilityReport | null>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [performanceDashboard, setPerformanceDashboard] = useState<PerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [
        metrics,
        kpis,
        dashboard,
        costs,
        profitability,
        competitive
      ] = await Promise.all([
        operationalAnalyticsService.getCurrentOperationalMetrics(),
        operationalAnalyticsService.getKPIMetrics(),
        operationalAnalyticsService.getPerformanceDashboard(),
        operationalAnalyticsService.generateCostAnalysis({
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }),
        operationalAnalyticsService.generateProfitabilityReport({
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }),
        operationalAnalyticsService.getCompetitiveAnalysis()
      ]);

      setCurrentMetrics(metrics);
      setKpiMetrics(kpis);
      setPerformanceDashboard(dashboard);
      setCostAnalysis(costs);
      setProfitabilityReport(profitability);
      setCompetitiveAnalysis(competitive);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      // Implementation would generate and download report
      console.log(`Exporting ${type} report`);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading && !currentMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operational Analytics</h1>
          <p className="text-gray-600">Comprehensive business intelligence and performance insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={() => handleExportReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {performanceDashboard?.alerts && performanceDashboard.alerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {performanceDashboard.alerts.length} performance alert(s) require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rides</p>
                  <p className="text-2xl font-bold">{currentMetrics.totalRides.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.5% from last period
                  </p>
                </div>
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${currentMetrics.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.3% from last period
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold">{currentMetrics.activeDrivers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2% from last period
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                  <p className="text-2xl font-bold">{currentMetrics.averageWaitTime.toFixed(1)}m</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -3.1% from last period
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentMetrics && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(currentMetrics.completedRides / currentMetrics.totalRides) * 100} 
                          className="w-20 h-2" 
                        />
                        <span className="text-sm font-medium">
                          {((currentMetrics.completedRides / currentMetrics.totalRides) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Driver Utilization</span>
                      <div className="flex items-center gap-2">
                        <Progress value={currentMetrics.driverUtilization} className="w-20 h-2" />
                        <span className="text-sm font-medium">{currentMetrics.driverUtilization.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Satisfaction</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{currentMetrics.passengerSatisfaction.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Performance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceDashboard?.alerts && performanceDashboard.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {performanceDashboard.alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-1 rounded-full ${
                          alert.type === 'critical' ? 'bg-red-100' :
                          alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`h-3 w-3 ${
                            alert.type === 'critical' ? 'text-red-600' :
                            alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{alert.title}</div>
                          <div className="text-xs text-gray-600">{alert.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No active alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiMetrics.map((kpi) => (
              <Card key={kpi.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
                      <p className="text-2xl font-bold">{kpi.value.toFixed(1)}{kpi.unit}</p>
                    </div>
                    <Badge variant={kpi.priority === 'high' ? 'destructive' : 'secondary'}>
                      {kpi.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Target: {kpi.target}{kpi.unit}</span>
                      <span className={`flex items-center gap-1 ${
                        kpi.trend === 'up' ? 'text-green-600' :
                        kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                         kpi.trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                         <Activity className="h-3 w-3" />}
                        {Math.abs(kpi.changePercent).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (kpi.value / kpi.target) * 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Analysis */}
            {costAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Driver Payments</span>
                      <span className="font-medium">${costAnalysis.costBreakdown.driverPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Platform Operations</span>
                      <span className="font-medium">${costAnalysis.costBreakdown.platformOperations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Technology</span>
                      <span className="font-medium">${costAnalysis.costBreakdown.technology.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Marketing</span>
                      <span className="font-medium">${costAnalysis.costBreakdown.marketing.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center font-semibold">
                      <span>Total Costs</span>
                      <span>${costAnalysis.totalCosts.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profitability */}
            {profitabilityReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Profitability Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-medium text-green-600">
                        ${profitabilityReport.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Costs</span>
                      <span className="font-medium text-red-600">
                        ${profitabilityReport.totalCosts.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gross Profit</span>
                      <span className="font-medium">
                        ${profitabilityReport.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center font-semibold">
                      <span>Net Profit</span>
                      <span className="text-green-600">
                        ${profitabilityReport.netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Profit Margin</span>
                      <span className="font-medium">
                        {profitabilityReport.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Competitive Tab */}
        <TabsContent value="competitive" className="space-y-6">
          {competitiveAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Market Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        #{competitiveAnalysis.marketPosition.ranking}
                      </div>
                      <div className="text-sm text-gray-600">Market Ranking</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Market Share</span>
                        <span className="font-medium">{competitiveAnalysis.marketPosition.marketShare}%</span>
                      </div>
                      <Progress value={competitiveAnalysis.marketPosition.marketShare} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Total Market Size: ${(competitiveAnalysis.marketPosition.totalMarketSize / 1000000000).toFixed(1)}B
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Top Competitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitiveAnalysis.competitors.slice(0, 3).map((competitor, index) => (
                      <div key={competitor.name} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{competitor.name}</span>
                          <Badge variant="outline">{competitor.marketShare}% share</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Avg Fare: ${competitor.averageFare}</div>
                          <div>Wait Time: {competitor.averageWaitTime}m</div>
                          <div>Drivers: {competitor.driverCount.toLocaleString()}</div>
                          <div>Rating: {competitor.customerRating}/5</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Operational Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive operational metrics and performance analysis
                </p>
                <Button size="sm" onClick={() => handleExportReport('operational')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Financial Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Revenue, costs, profitability, and financial projections
                </p>
                <Button size="sm" onClick={() => handleExportReport('financial')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Performance Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  KPI tracking, performance trends, and improvement insights
                </p>
                <Button size="sm" onClick={() => handleExportReport('performance')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Competitive Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Market analysis, competitor insights, and opportunities
                </p>
                <Button size="sm" onClick={() => handleExportReport('competitive')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <LineChart className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <h3 className="font-semibold mb-2">Trend Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Historical trends, forecasting, and predictive analytics
                </p>
                <Button size="sm" onClick={() => handleExportReport('trends')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-semibold mb-2">Executive Summary</h3>
                <p className="text-sm text-gray-600 mb-4">
                  High-level overview for executive decision making
                </p>
                <Button size="sm" onClick={() => handleExportReport('executive')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
       