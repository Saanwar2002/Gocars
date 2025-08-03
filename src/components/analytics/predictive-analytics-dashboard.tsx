'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Car,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Settings,
  Info,
  Lightbulb,
  Shield,
  Activity
} from 'lucide-react';
import { 
  predictiveAnalyticsService, 
  RevenueForecast, 
  DemandForecast, 
  CapacityPlanningData,
  MarketTrendAnalysis,
  CompetitiveIntelligence,
  AnomalyDetection,
  PredictiveModel
} from '@/services/predictiveAnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface PredictiveAnalyticsDashboardProps {
  userId: string;
  userRole: 'admin' | 'operator' | 'analyst';
}

export function PredictiveAnalyticsDashboard({ userId, userRole }: PredictiveAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecasting');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  
  // Data states
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast | null>(null);
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null);
  const [capacityPlan, setCapacityPlan] = useState<CapacityPlanningData | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendAnalysis | null>(null);
  const [competitiveIntel, setCompetitiveIntel] = useState<CompetitiveIntelligence | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection | null>(null);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [businessInsights, setBusinessInsights] = useState<any>(null);
  const [realTimePredictions, setRealTimePredictions] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadPredictiveData();
  }, [forecastHorizon]);

  useEffect(() => {
    // Subscribe to real-time predictions
    const unsubscribe = predictiveAnalyticsService.subscribeToRealTimePredictions(
      (predictions) => {
        setRealTimePredictions(predictions);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      
      const [
        revenue,
        demand,
        capacity,
        trends,
        competitive,
        anomalyData,
        modelData,
        insights
      ] = await Promise.all([
        predictiveAnalyticsService.generateRevenueForecast(forecastHorizon),
        predictiveAnalyticsService.generateDemandForecast(),
        predictiveAnalyticsService.generateCapacityPlan(),
        predictiveAnalyticsService.analyzeMarketTrends(),
        predictiveAnalyticsService.getCompetitiveIntelligence(),
        predictiveAnalyticsService.detectAnomalies(),
        predictiveAnalyticsService.getPredictiveModels(),
        predictiveAnalyticsService.getBusinessInsights()
      ]);

      setRevenueForecast(revenue);
      setDemandForecast(demand);
      setCapacityPlan(capacity);
      setMarketTrends(trends);
      setCompetitiveIntel(competitive);
      setAnomalies(anomalyData);
      setModels(modelData);
      setBusinessInsights(insights);
    } catch (error) {
      console.error('Error loading predictive data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load predictive analytics data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
          <p className="text-gray-600">AI-powered forecasting and business intelligence</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={forecastHorizon.toString()} onValueChange={(value) => setForecastHorizon(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadPredictiveData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {realTimePredictions.map((prediction, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {prediction.metric.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  <p className="text-2xl font-bold">
                    {prediction.metric.includes('revenue') 
                      ? formatCurrency(prediction.value)
                      : formatNumber(prediction.value)
                    }
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                      {formatPercentage(prediction.confidence)} confidence
                    </span>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </Tabs>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Revenue Forecast</span>
                </CardTitle>
                <CardDescription>
                  {forecastHorizon}-day revenue prediction with {formatPercentage(revenueForecast?.accuracy || 0)} accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Trend</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={revenueForecast?.trend === 'increasing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {revenueForecast?.trend}
                        </Badge>
                        {revenueForecast?.seasonality.detected && (
                          <Badge variant="outline">
                            {revenueForecast.seasonality.pattern} pattern
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <p className="text-lg font-bold">{formatPercentage(revenueForecast?.accuracy || 0)}</p>
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={revenueForecast?.forecasts.map(f => ({
                      date: f.timestamp.toLocaleDateString(),
                      predicted: f.predicted,
                      upperBound: f.upperBound,
                      lowerBound: f.lowerBound,
                      confidence: f.confidence
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value), 
                          name === 'predicted' ? 'Predicted' : name === 'upperBound' ? 'Upper Bound' : 'Lower Bound'
                        ]}
                      />
                      <Area type="monotone" dataKey="upperBound" stackId="1" stroke="none" fill="#e3f2fd" />
                      <Area type="monotone" dataKey="lowerBound" stackId="1" stroke="none" fill="#ffffff" />
                      <Line type="monotone" dataKey="predicted" stroke="#1976d2" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Demand Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Demand Forecast</span>
                </CardTitle>
                <CardDescription>
                  24-hour demand prediction by hour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {demandForecast?.peakHours.slice(0, 3).map((peak, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Peak {index + 1}</p>
                        <p className="font-bold">{peak.hour}:00</p>
                        <p className="text-sm">{formatNumber(peak.expectedDemand)} rides</p>
                      </div>
                    ))}
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={demandForecast?.forecasts.map(f => ({
                      hour: f.timestamp.getHours(),
                      predicted: f.predicted,
                      confidence: f.confidence
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatNumber(value), 'Predicted Rides']}
                      />
                      <Bar dataKey="predicted" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Influencing Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Influencing Factors</CardTitle>
              <CardDescription>Key factors affecting revenue predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {revenueForecast?.influencingFactors.map((factor, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{factor.name}</h4>
                      <Badge variant="outline">{factor.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Impact</span>
                        <span className={factor.impact > 0 ? 'text-green-600' : 'text-red-600'}>
                          {factor.impact > 0 ? '+' : ''}{formatPercentage(Math.abs(factor.impact))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence</span>
                        <span className={getConfidenceColor(factor.confidence)}>
                          {formatPercentage(factor.confidence)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would continue here... */}
        <TabsContent value="capacity">
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Capacity planning analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Market trend analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive">
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Competitive intelligence coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Anomaly detection coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Business insights coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}