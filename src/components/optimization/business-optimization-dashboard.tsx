'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
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
  Target, 
  Lightbulb,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Zap,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  RefreshCw,
  Download,
  Settings,
  ArrowRight,
  Star,
  Award,
  Activity
} from 'lucide-react';
import { 
  businessOptimizationService, 
  OptimizationRecommendation, 
  BusinessInsight, 
  OptimizationDashboard,
  ROIAnalysis,
  PerformanceImprovement
} from '@/services/businessOptimizationService';
import { useToast } from '@/hooks/use-toast';

interface BusinessOptimizationDashboardProps {
  userId: string;
  userRole: 'admin' | 'manager' | 'analyst';
}

export function BusinessOptimizationDashboard({ userId, userRole }: BusinessOptimizationDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<OptimizationDashboard | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis | null>(null);
  const [optimizationTrends, setOptimizationTrends] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, trends] = await Promise.all([
        businessOptimizationService.getOptimizationDashboard(),
        businessOptimizationService.getOptimizationTrends()
      ]);
      
      setDashboardData(dashboard);
      setOptimizationTrends(trends);
    } catch (error) {
      console.error('Error loading optimization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load optimization data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationSelect = async (recommendation: OptimizationRecommendation) => {
    setSelectedRecommendation(recommendation);
    try {
      const roi = await businessOptimizationService.calculateROIAnalysis(recommendation.id);
      setRoiAnalysis(roi);
    } catch (error) {
      console.error('Error loading ROI analysis:', error);
    }
  };

  const handleApproveRecommendation = async (recommendationId: string) => {
    try {
      await businessOptimizationService.approveRecommendation(recommendationId, userId);
      toast({
        title: 'Success',
        description: 'Recommendation approved successfully.',
      });
      await loadDashboardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve recommendation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectRecommendation = async (recommendationId: string, reason: string) => {
    try {
      await businessOptimizationService.rejectRecommendation(recommendationId, userId, reason);
      toast({
        title: 'Success',
        description: 'Recommendation rejected.',
      });
      await loadDashboardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject recommendation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'identified': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'anomaly': return <Activity className="h-4 w-4 text-orange-600" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
          <h1 className="text-3xl font-bold text-gray-900">Business Optimization</h1>
          <p className="text-gray-600">AI-powered insights and recommendations for business growth</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                <p className="text-2xl font-bold">{dashboardData?.summary.totalRecommendations || 0}</p>
                <p className="text-xs text-gray-500">
                  {dashboardData?.summary.activeRecommendations || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.summary.totalPotentialRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500">Monthly impact</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average ROI</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(dashboardData?.summary.averageROI || 0)}
                </p>
                <p className="text-xs text-gray-500">Expected return</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Quick Wins</p>
                <p className="text-2xl font-bold">{dashboardData?.quickWins.length || 0}</p>
                <p className="text-xs text-gray-500">Low effort, high impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Top Opportunities</span>
                </CardTitle>
                <CardDescription>Highest impact optimization recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {dashboardData?.topOpportunities.slice(0, 5).map((rec) => (
                      <div 
                        key={rec.id} 
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleRecommendationSelect(rec)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-medium">
                            {formatCurrency(rec.impact.revenue)}/mo
                          </span>
                          <span className="text-blue-600">
                            ROI: {formatPercentage(rec.roi.expected)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Recent Insights</span>
                </CardTitle>
                <CardDescription>Latest AI-generated business insights</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {dashboardData?.recentInsights.slice(0, 5).map((insight) => (
                      <div key={insight.id} className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          {getInsightTypeIcon(insight.type)}
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Confidence: {formatPercentage(insight.confidence * 100)}
                          </span>
                          <span className="text-blue-600">{insight.timeframe.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Trends</CardTitle>
              <CardDescription>Implementation progress and impact over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={optimizationTrends?.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name.includes('impact') || name.includes('savings') 
                        ? formatCurrency(value) 
                        : value,
                      name.replace('_', ' ')
                    ]}
                  />
                  <Legend />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue_impact" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                    name="Revenue Impact"
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cost_savings" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                    name="Cost Savings"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="implemented" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    name="Implemented"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recommendations List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>All Recommendations</CardTitle>
                <CardDescription>Complete list of optimization recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {dashboardData?.topOpportunities.map((rec) => (
                      <div 
                        key={rec.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRecommendation?.id === rec.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleRecommendationSelect(rec)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(rec.status)}>
                            {rec.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Revenue Impact</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(rec.impact.revenue)}/mo
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expected ROI</p>
                            <p className="font-medium text-blue-600">
                              {formatPercentage(rec.roi.expected)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Effort Level</p>
                            <p className="font-medium">{rec.effort.level}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Timeframe</p>
                            <p className="font-medium">{rec.effort.timeframe}</p>
                          </div>
                        </div>
                        
                        {userRole === 'admin' && rec.status === 'identified' && (
                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveRecommendation(rec.id);
                              }}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectRecommendation(rec.id, 'Not suitable at this time');
                              }}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recommendation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Details</CardTitle>
                <CardDescription>
                  {selectedRecommendation ? 'Detailed analysis and implementation plan' : 'Select a recommendation to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRecommendation ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Impact Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Revenue Impact:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(selectedRecommendation.impact.revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost Impact:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(selectedRecommendation.impact.cost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efficiency Gain:</span>
                          <span className="font-medium">
                            {formatPercentage(selectedRecommendation.impact.efficiency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Implementation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Effort Level:</span>
                          <span className="font-medium">{selectedRecommendation.effort.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Timeframe:</span>
                          <span className="font-medium">{selectedRecommendation.effort.timeframe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-medium">
                            {formatCurrency(selectedRecommendation.effort.cost)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">ROI Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Expected ROI:</span>
                          <span className="font-medium text-blue-600">
                            {formatPercentage(selectedRecommendation.roi.expected)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payback Period:</span>
                          <span className="font-medium">
                            {selectedRecommendation.roi.paybackPeriod.toFixed(1)} months
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {formatPercentage(selectedRecommendation.roi.confidence * 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Implementation Steps</h4>
                      <ScrollArea className="h-32">
                        <ol className="text-sm space-y-1">
                          {selectedRecommendation.implementation.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-gray-500">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a recommendation to view detailed analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tabs would continue here... */}
        <TabsContent value="insights">
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Business insights details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Performance tracking details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ROI analysis details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}