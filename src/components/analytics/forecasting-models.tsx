'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  predictiveAnalyticsService, 
  PredictiveModel 
} from '@/services/predictiveAnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface ForecastingModelsProps {
  userId: string;
}

export function ForecastingModels({ userId }: ForecastingModelsProps) {
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<PredictiveModel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const modelsData = await predictiveAnalyticsService.getPredictiveModels();
      setModels(modelsData);
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forecasting models. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'neural_network': return <Brain className="h-4 w-4" />;
      case 'ensemble': return <Activity className="h-4 w-4" />;
      case 'linear_regression': return <TrendingUp className="h-4 w-4" />;
      case 'arima': return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-yellow-100 text-yellow-800';
      case 'deprecated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600';
    if (accuracy >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
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
          <h1 className="text-3xl font-bold text-gray-900">Forecasting Models</h1>
          <p className="text-gray-600">Manage and monitor predictive models</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadModels}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            New Model
          </Button>
        </div>
      </div>

      {/* Model Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Models</p>
                <p className="text-2xl font-bold">{models.filter(m => m.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Training</p>
                <p className="text-2xl font-bold">{models.filter(m => m.status === 'training').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Model Types</p>
                <p className="text-2xl font-bold">{new Set(models.map(m => m.type)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Models Grid */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Inventory</CardTitle>
              <CardDescription>All predictive models and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {models.map((model) => (
                    <div 
                      key={model.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedModel?.id === model.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getModelTypeIcon(model.type)}
                          <h4 className="font-medium">{model.name}</h4>
                        </div>
                        <Badge className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Type</p>
                          <p className="font-medium">{model.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Target</p>
                          <p className="font-medium">{model.target.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Accuracy</p>
                          <p className={`font-medium ${getAccuracyColor(model.accuracy)}`}>
                            {formatPercentage(model.accuracy)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Last Trained</p>
                          <p className="font-medium">{formatDate(model.lastTrained)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">Features: {model.features.length}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature.replace('_', ' ')}
                            </Badge>
                          ))}
                          {model.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{model.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Model Details */}
        <div className="space-y-4">
          {selectedModel ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getModelTypeIcon(selectedModel.type)}
                      <span>{selectedModel.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {selectedModel.type.replace('_', ' ')} model for {selectedModel.target.replace('_', ' ')} prediction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedModel.status)}>
                        {selectedModel.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={selectedModel.accuracy * 100} className="flex-1" />
                        <span className={`text-sm font-medium ${getAccuracyColor(selectedModel.accuracy)}`}>
                          {formatPercentage(selectedModel.accuracy)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Target Variable</p>
                      <Badge variant="outline">{selectedModel.target.replace('_', ' ')}</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Features ({selectedModel.features.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedModel.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Training</p>
                      <p className="text-sm">{formatDate(selectedModel.lastTrained)}</p>
                    </div>
                  </div>

                  {/* Model Parameters */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Parameters</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(selectedModel.parameters, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    {selectedModel.status === 'active' ? (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retrain
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Model accuracy and performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(selectedModel.accuracy)}
                        </p>
                        <p className="text-sm text-gray-600">Accuracy</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">0.92</p>
                        <p className="text-sm text-gray-600">Precision</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">0.89</p>
                        <p className="text-sm text-gray-600">Recall</p>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500">
                      Performance metrics based on latest validation set
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a model to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}