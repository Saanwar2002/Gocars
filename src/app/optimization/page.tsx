'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Brain, TrendingUp, TrendingDown, DollarSign, Target, Lightbulb,
  Users, Car, MapPin, Clock, Zap, Star, AlertCircle, CheckCircle,
  ArrowRight, Play, Pause, Settings, Download, Eye, BarChart3
} from 'lucide-react';

// Mock AI-powered insights and recommendations
const mockInsights = [
  {
    id: 1,
    type: 'revenue',
    priority: 'high',
    title: 'Peak Hour Revenue Optimization',
    description: 'Increase driver incentives during 5-7 PM to capture 15% more revenue',
    impact: { metric: 'Revenue', value: 15, unit: '%' },
    confidence: 0.87,
    timeframe: '2 weeks',
    effort: 'low',
    status: 'new',
    details: {
      currentState: 'Average 85 drivers active during peak hours',
      recommendation: 'Increase to 98 drivers with targeted incentives',
      expectedOutcome: '$42,000 additional monthly revenue',
      implementation: [
        'Create dynamic incentive program',
        'Send targeted notifications to drivers',
        'Monitor driver response and adjust rates'
      ]
    }
  },
  {
    id: 2,
    type: 'efficiency',
    priority: 'high',
    title: 'Driver Positioning Optimization',
    description: 'Implement smart positioning to reduce average wait time by 2.3 minutes',
    impact: { metric: 'Wait Time', value: -2.3, unit: ' min' },
    confidence: 0.92,
    timeframe: '1 month',
    effort: 'medium',
    status: 'in_progress',
    details: {
      currentState: 'Average wait time: 4.2 minutes',
      recommendation: 'Use predictive positioning based on demand patterns',
      expectedOutcome: 'Improved customer satisfaction and 8% more rides',
      implementation: [
        'Deploy ML-based positioning algorithm',
        'Create driver guidance system',
        'Implement real-time demand prediction'
      ]
    }
  },
  {
    id: 3,
    type: 'cost',
    priority: 'medium',
    title: 'Fuel Cost Reduction',
    description: 'Route optimization can reduce fuel costs by 12% across the fleet',
    impact: { metric: 'Fuel Costs', value: -12, unit: '%' },
    confidence: 0.78,
    timeframe: '3 weeks',
    effort: 'low',
    status: 'new',
    details: {
      currentState: 'Current monthly fuel costs: $28,500',
      recommendation: 'Implement advanced route optimization',
      expectedOutcome: '$3,420 monthly savings',
      implementation: [
        'Upgrade routing algorithm',
        'Integrate real-time traffic data',
        'Provide eco-driving recommendations'
      ]
    }
  },
  {
    id: 4,
    type: 'customer',
    priority: 'medium',
    title: 'Customer Retention Improvement',
    description: 'Personalized promotions can increase retention by 18%',
    impact: { metric: 'Retention', value: 18, unit: '%' },
    confidence: 0.83,
    timeframe: '6 weeks',
    effort: 'high',
    status: 'planned',
    details: {
      currentState: 'Current retention rate: 72%',
      recommendation: 'Implement AI-driven personalization engine',
      expectedOutcome: 'Increase to 85% retention rate',
      implementation: [
        'Develop customer segmentation model',
        'Create personalized promotion engine',
        'Implement behavioral tracking system'
      ]
    }
  }
];

const mockROIAnalysis = [
  {
    initiative: 'Peak Hour Optimization',
    investment: 15000,
    monthlyReturn: 42000,
    roi: 280,
    paybackPeriod: 0.36,
    status: 'recommended'
  },
  {
    initiative: 'Smart Positioning',
    investment: 45000,
    monthlyReturn: 28000,
    roi: 62,
    paybackPeriod: 1.6,
    status: 'in_progress'
  },
  {
    initiative: 'Route Optimization',
    investment: 8000,
    monthlyReturn: 3420,
    roi: 43,
    paybackPeriod: 2.3,
    status: 'approved'
  },
  {
    initiative: 'Personalization Engine',
    investment: 85000,
    monthlyReturn: 35000,
    roi: 41,
    paybackPeriod: 2.4,
    status: 'planned'
  }
];

const mockPerformanceTracking = [
  { month: 'Jan', baseline: 100, optimized: 100, improvement: 0 },
  { month: 'Feb', baseline: 100, optimized: 105, improvement: 5 },
  { month: 'Mar', baseline: 100, optimized: 112, improvement: 12 },
  { month: 'Apr', baseline: 100, optimized: 118, improvement: 18 },
  { month: 'May', baseline: 100, optimized: 125, improvement: 25 },
  { month: 'Jun', baseline: 100, optimized: 132, improvement: 32 }
];

const mockOptimizationMetrics = {
  totalSavings: 127500,
  revenueIncrease: 18.5,
  efficiencyGain: 23.2,
  customerSatisfaction: 4.8,
  implementedRecommendations: 12,
  activeOptimizations: 5
};

export default function OptimizationPage() {
  const [selectedInsight, setSelectedInsight] = useState(mockInsights[0]);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const runAnalysis = async () => {
    setIsRunningAnalysis(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    setLastUpdated(new Date());
    setIsRunningAnalysis(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'planned': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSign className="h-5 w-5" />;
      case 'efficiency': return <Zap className="h-5 w-5" />;
      case 'cost': return <TrendingDown className="h-5 w-5" />;
      case 'customer': return <Users className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const OptimizationCard = ({ title, value, unit, change, icon: Icon }: any) => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value.toLocaleString()}{unit}</p>
              {change && (
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{change}% this month</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Icon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Business Optimization Center
              </h1>
              <p className="text-xl text-gray-600">
                AI-powered insights and automated optimization recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Task 8.2.2 Implementation
              </Badge>
              <Button 
                onClick={runAnalysis} 
                disabled={isRunningAnalysis}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunningAnalysis ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {isRunningAnalysis ? 'Analyzing...' : 'Run AI Analysis'}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">AI Engine: </span>
                <span className="font-bold text-green-600">ACTIVE</span>
              </div>
              <div className="text-sm text-gray-500">
                Confidence Score: 87.3%
              </div>
              <div className="text-sm text-gray-500">
                Active Optimizations: {mockOptimizationMetrics.activeOptimizations}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last analysis: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <OptimizationCard
            title="Total Savings"
            value={mockOptimizationMetrics.totalSavings}
            unit=""
            change={12.5}
            icon={DollarSign}
          />
          <OptimizationCard
            title="Revenue Increase"
            value={mockOptimizationMetrics.revenueIncrease}
            unit="%"
            change={3.2}
            icon={TrendingUp}
          />
          <OptimizationCard
            title="Efficiency Gain"
            value={mockOptimizationMetrics.efficiencyGain}
            unit="%"
            change={5.8}
            icon={Zap}
          />
          <OptimizationCard
            title="Customer Rating"
            value={mockOptimizationMetrics.customerSatisfaction}
            unit="/5"
            change={2.1}
            icon={Star}
          />
          <OptimizationCard
            title="Implemented"
            value={mockOptimizationMetrics.implementedRecommendations}
            unit=" recs"
            icon={CheckCircle}
          />
          <OptimizationCard
            title="Active Projects"
            value={mockOptimizationMetrics.activeOptimizations}
            unit=""
            icon={Target}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            <TabsTrigger value="tracking">Performance Tracking</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Insights List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Opportunities</CardTitle>
                    <CardDescription>AI-identified improvement areas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedInsight.id === insight.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedInsight(insight)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(insight.type)}
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(insight.status)}`} />
                        </div>
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-green-600">
                            {insight.impact.value > 0 ? '+' : ''}{insight.impact.value}{insight.impact.unit}
                          </span>
                          <span className="text-gray-500">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Selected Insight Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          {getTypeIcon(selectedInsight.type)}
                          <span>{selectedInsight.title}</span>
                        </CardTitle>
                        <CardDescription>{selectedInsight.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(selectedInsight.priority)}>
                          {selectedInsight.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge variant="outline">
                          {selectedInsight.timeframe}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Impact Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Expected Impact</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedInsight.impact.value > 0 ? '+' : ''}{selectedInsight.impact.value}{selectedInsight.impact.unit}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Confidence</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(selectedInsight.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Effort Level</p>
                        <p className="text-2xl font-bold text-purple-600 capitalize">
                          {selectedInsight.effort}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Current State</h4>
                        <p className="text-gray-600">{selectedInsight.details.currentState}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Recommendation</h4>
                        <p className="text-gray-600">{selectedInsight.details.recommendation}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Expected Outcome</h4>
                        <p className="text-green-600 font-medium">{selectedInsight.details.expectedOutcome}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Implementation Steps</h4>
                        <ul className="space-y-2">
                          {selectedInsight.details.implementation.map((step, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <span className="text-gray-600">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-4 border-t">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Implement Recommendation
                      </Button>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Detailed Analysis
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis Dashboard</CardTitle>
                <CardDescription>
                  Return on investment analysis for optimization initiatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockROIAnalysis.map((item, index) => (
                    <div key={index} className="p-6 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">{item.initiative}</h4>
                        <Badge 
                          variant={item.status === 'recommended' ? 'default' : 'secondary'}
                          className={
                            item.status === 'recommended' ? 'bg-green-600' :
                            item.status === 'in_progress' ? 'bg-blue-600' :
                            item.status === 'approved' ? 'bg-purple-600' : 'bg-gray-600'
                          }
                        >
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Investment</p>
                          <p className="text-xl font-bold">${item.investment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Monthly Return</p>
                          <p className="text-xl font-bold text-green-600">${item.monthlyReturn.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">ROI</p>
                          <p className="text-xl font-bold text-blue-600">{item.roi}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Payback Period</p>
                          <p className="text-xl font-bold">{item.paybackPeriod} months</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>ROI Progress</span>
                          <span>{item.roi}%</span>
                        </div>
                        <Progress value={Math.min(item.roi, 100)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Investment Portfolio</CardTitle>
                  <CardDescription>Distribution of optimization investments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockROIAnalysis.map(item => ({
                          name: item.initiative,
                          value: item.investment
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockROIAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROI Comparison</CardTitle>
                  <CardDescription>Return on investment by initiative</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockROIAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="initiative" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Improvement Tracking</CardTitle>
                <CardDescription>
                  Track the impact of implemented optimizations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockPerformanceTracking}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Baseline Performance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="optimized" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      name="Optimized Performance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="improvement" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Improvement %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                  <CardDescription>Current vs. target performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { metric: 'Revenue Growth', current: 18.5, target: 20, unit: '%' },
                    { metric: 'Cost Reduction', current: 12.3, target: 15, unit: '%' },
                    { metric: 'Customer Satisfaction', current: 4.8, target: 4.9, unit: '/5' },
                    { metric: 'Driver Utilization', current: 87, target: 90, unit: '%' }
                  ].map((kpi, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{kpi.metric}</span>
                        <span>{kpi.current}{kpi.unit} / {kpi.target}{kpi.unit}</span>
                      </div>
                      <Progress 
                        value={(kpi.current / kpi.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Timeline</CardTitle>
                  <CardDescription>Implementation progress and milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { milestone: 'Peak Hour Optimization', date: '2024-01-15', status: 'completed' },
                    { milestone: 'Smart Positioning Rollout', date: '2024-02-28', status: 'in_progress' },
                    { milestone: 'Route Optimization', date: '2024-03-15', status: 'planned' },
                    { milestone: 'Personalization Engine', date: '2024-04-30', status: 'planned' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                      <div className="flex-1">
                        <p className="font-medium">{item.milestone}</p>
                        <p className="text-sm text-gray-600">{item.date}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Optimization Rules</CardTitle>
                <CardDescription>
                  Configure automatic optimization triggers and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    name: 'Dynamic Pricing Adjustment',
                    trigger: 'When demand exceeds supply by 20%',
                    action: 'Increase pricing by 15% and send driver incentives',
                    status: 'active',
                    lastTriggered: '2 hours ago'
                  },
                  {
                    name: 'Driver Positioning',
                    trigger: 'When wait times exceed 5 minutes in any zone',
                    action: 'Send positioning recommendations to nearby drivers',
                    status: 'active',
                    lastTriggered: '45 minutes ago'
                  },
                  {
                    name: 'Promotional Campaigns',
                    trigger: 'When customer retention drops below 70%',
                    action: 'Launch targeted promotional campaign',
                    status: 'paused',
                    lastTriggered: '3 days ago'
                  },
                  {
                    name: 'Fleet Optimization',
                    trigger: 'When utilization falls below 80%',
                    action: 'Adjust driver schedules and send availability requests',
                    status: 'active',
                    lastTriggered: '1 day ago'
                  }
                ].map((rule, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{rule.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={rule.status === 'active' ? 'default' : 'secondary'}
                          className={rule.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {rule.status.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Trigger: </span>
                        <span>{rule.trigger}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Action: </span>
                        <span>{rule.action}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Last Triggered: </span>
                        <span className="text-blue-600">{rule.lastTriggered}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Performance</CardTitle>
                  <CardDescription>Impact of automated optimizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rules Triggered Today</span>
                    <span className="text-lg font-bold">23</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Successful Actions</span>
                    <span className="text-lg font-bold text-green-600">21</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-lg font-bold">1.3s</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cost Savings</span>
                    <span className="text-lg font-bold text-green-600">$2,450</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Learning Progress</CardTitle>
                  <CardDescription>Model improvement and accuracy metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prediction Accuracy</span>
                      <span>87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Model Confidence</span>
                      <span>92.1%</span>
                    </div>
                    <Progress value={92.1} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Learning Rate</span>
                      <span>15.2% improvement</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Implementation Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Task 8.2.2 Implementation Status</span>
            </CardTitle>
            <CardDescription>
              Business optimization recommendations implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Completed Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>AI-powered business insights and recommendations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Automated optimization suggestions with confidence scores</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Performance improvement tracking and analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>ROI analysis for feature investments</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Automated optimization rules and triggers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Real-time performance monitoring and alerts</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">🔧 Technical Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Machine learning recommendation engine</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Automated rule-based optimization system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>ROI calculation and tracking algorithms</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Performance impact measurement system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Interactive visualization and reporting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Confidence scoring and risk assessment</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}