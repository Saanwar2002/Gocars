'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  PoundSterling,
  TrendingUp,
  Calendar,
  Car,
  Fuel,
  Gauge,
  Battery,
  Disc,
  Zap,
  FileText,
  Target,
  Activity
} from 'lucide-react'
import { 
  predictiveMaintenanceService, 
  MaintenancePrediction, 
  Vehicle,
  OptimizationRecommendation
} from '@/services/predictiveMaintenanceService'

interface PredictiveMaintenanceDashboardProps {
  fleetId?: string
  vehicleId?: string
  onMaintenanceScheduled?: (prediction: MaintenancePrediction) => void
}

export function PredictiveMaintenanceDashboard({
  fleetId,
  vehicleId,
  onMaintenanceScheduled
}: PredictiveMaintenanceDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId || '')
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
  const [driverSuggestions, setDriverSuggestions] = useState<OptimizationRecommendation[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    if (selectedVehicle) {
      loadMaintenancePredictions()
    }
  }, [selectedVehicle])

  const loadMaintenancePredictions = async () => {
    if (!selectedVehicle) return
    
    setIsLoading(true)
    try {
      const vehiclePredictions = await predictiveMaintenanceService.predictMaintenanceNeeds(selectedVehicle)
      setPredictions(vehiclePredictions)
      
      // Load driver optimization suggestions if we have a driver
      const suggestions = await predictiveMaintenanceService.generateDriverOptimizationSuggestions('DR001')
      setDriverSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load maintenance predictions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleMaintenance = (prediction: MaintenancePrediction) => {
    onMaintenanceScheduled?.(prediction)
    // In real implementation, this would integrate with scheduling system
  }

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'routine_service': return <Wrench className="h-5 w-5" />
      case 'brake_pads': return <Disc className="h-5 w-5" />
      case 'tyres': return <Car className="h-5 w-5" />
      case 'battery': return <Battery className="h-5 w-5" />
      case 'engine': return <Gauge className="h-5 w-5" />
      case 'mot_failure': return <FileText className="h-5 w-5" />
      default: return <Wrench className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDaysUntilMaintenance = (predictedDate: Date) => {
    const days = Math.ceil((predictedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    return Math.max(0, days)
  }

  const getUrgencyLevel = (days: number) => {
    if (days <= 7) return 'critical'
    if (days <= 30) return 'high'
    if (days <= 90) return 'medium'
    return 'low'
  }

  const totalMaintenanceCost = predictions.reduce((sum, p) => sum + p.estimatedCost, 0)
  const criticalPredictions = predictions.filter(p => p.severity === 'critical').length
  const highPriorityPredictions = predictions.filter(p => p.severity === 'high').length

  return (
    <div className="space-y-6">
      {/* Vehicle Selection and Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Predictive Maintenance Dashboard
              </CardTitle>
              <CardDescription>
                AI-powered maintenance predictions and optimization for UK fleet operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              {!vehicleId && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="vehicle-select">Vehicle:</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VH001">AB12 CDE (Car)</SelectItem>
                      <SelectItem value="VH002">EF34 GHI (Van)</SelectItem>
                      <SelectItem value="VH003">JK56 LMN (HGV)</SelectItem>
                      <SelectItem value="VH004">OP78 QRS (Car)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {criticalPredictions}
              </div>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
              <div className="text-xs text-red-600 mt-1">
                Immediate attention required
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {highPriorityPredictions}
              </div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <div className="text-xs text-orange-600 mt-1">
                Schedule within 30 days
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {predictions.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Predictions</p>
              <div className="text-xs text-blue-600 mt-1">
                Next {selectedTimeframe}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                £{totalMaintenanceCost.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Estimated Costs</p>
              <div className="text-xs text-purple-600 mt-1">
                Budget planning
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Analyzing Vehicle Data...</p>
            <p className="text-sm text-muted-foreground">Generating maintenance predictions using AI</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Maintenance Predictions</TabsTrigger>
            <TabsTrigger value="optimization">Driver Optimization</TabsTrigger>
            <TabsTrigger value="analytics">Vehicle Analytics</TabsTrigger>
          </TabsList>

          {/* Maintenance Predictions */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Maintenance Predictions
                </CardTitle>
                <CardDescription>
                  AI-powered predictions based on vehicle telemetry and historical data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-600">Vehicle in Excellent Condition</p>
                    <p className="text-muted-foreground">No maintenance issues predicted for the selected timeframe</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.map((prediction) => {
                      const daysUntil = getDaysUntilMaintenance(new Date(prediction.predictedDate))
                      const urgency = getUrgencyLevel(daysUntil)
                      
                      return (
                        <div key={prediction.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {getPredictionIcon(prediction.predictionType)}
                              </div>
                              <div>
                                <h4 className="font-medium text-lg capitalize">
                                  {prediction.predictionType.replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Predicted for: {new Date(prediction.predictedDate).toLocaleDateString('en-GB')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {daysUntil === 0 ? 'Due today' : 
                                   daysUntil === 1 ? 'Due tomorrow' : 
                                   `Due in ${daysUntil} days`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getSeverityColor(prediction.severity)}>
                                {prediction.severity.toUpperCase()}
                              </Badge>
                              <div className="text-sm mt-2">
                                <span className="text-muted-foreground">Confidence: </span>
                                <span className={getConfidenceColor(prediction.confidence)}>
                                  {Math.round(prediction.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm mb-4">{prediction.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {prediction.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Estimated Cost:</span>
                                  <span className="text-lg font-bold text-orange-600">
                                    £{prediction.estimatedCost.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Urgency Level:</span>
                                  <Badge className={getSeverityColor(urgency)}>
                                    {urgency.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Last updated: {new Date(prediction.lastUpdated.toDate()).toLocaleDateString('en-GB')}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleScheduleMaintenance(prediction)}
                                className={urgency === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Maintenance
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Driver Optimization */}
          <TabsContent value="optimization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Driver Performance Optimization
                </CardTitle>
                <CardDescription>
                  Personalized recommendations to improve driving efficiency and reduce vehicle wear
                </CardDescription>
              </CardHeader>
              <CardContent>
                {driverSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-600">Excellent Driving Performance</p>
                    <p className="text-muted-foreground">No optimization opportunities identified</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {driverSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {suggestion.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              £{suggestion.estimatedSavings.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Monthly savings
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Impact:</h5>
                            <p className="text-sm text-blue-600">{suggestion.impact}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Action Required:</h5>
                            <p className="text-sm text-gray-600">{suggestion.actionRequired}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Implementation: {suggestion.timeToImplement} days</span>
                            <Badge variant="outline" className={
                              suggestion.riskLevel === 'high' ? 'text-red-600 border-red-200' :
                              suggestion.riskLevel === 'medium' ? 'text-orange-600 border-orange-200' :
                              'text-green-600 border-green-200'
                            }>
                              {suggestion.riskLevel} risk
                            </Badge>
                          </div>
                          <Button size="sm">
                            <Zap className="h-4 w-4 mr-2" />
                            Implement Suggestion
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vehicle Health Analytics
                </CardTitle>
                <CardDescription>
                  Real-time vehicle condition monitoring and historical trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Current Vehicle Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Fuel Efficiency</span>
                        </div>
                        <span className="font-medium">34.2 mpg</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Disc className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">Brake Condition</span>
                        </div>
                        <span className="font-medium">65% wear</span>
                      </div>
                      <Progress value={35} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Tyre Depth</span>
                        </div>
                        <span className="font-medium">3.2mm</span>
                      </div>
                      <Progress value={70} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">Battery Health</span>
                        </div>
                        <span className="font-medium">12.6V</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Maintenance History</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">Last Service</div>
                          <div className="text-xs text-muted-foreground">15 Mar 2024</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">MOT Test</div>
                          <div className="text-xs text-muted-foreground">Valid until Dec 2024</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">Next Service</div>
                          <div className="text-xs text-muted-foreground">Due in 2,500 miles</div>
                        </div>
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Cost Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        £{(420).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Monthly Fuel Cost</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        £{(180).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Monthly Maintenance</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        £{(2200).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Monthly Profit</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}