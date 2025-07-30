'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  PoundSterling,
  Fuel,
  Wrench,
  Users,
  BarChart3,
  Target,
  Zap,
  Calendar,
  MapPin
} from 'lucide-react'
import { 
  predictiveMaintenanceService, 
  FleetOptimization, 
  FleetUtilizationMetrics,
  DriverPerformanceMetrics,
  MaintenancePrediction,
  OptimizationRecommendation
} from '@/services/predictiveMaintenanceService'

interface FleetOptimizationDashboardProps {
  fleetId: string
  onOptimizationApplied?: (optimization: FleetOptimization) => void
}

export function FleetOptimizationDashboard({
  fleetId,
  onOptimizationApplied
}: FleetOptimizationDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [fleetAnalytics, setFleetAnalytics] = useState<{
    utilization: FleetUtilizationMetrics
    predictions: MaintenancePrediction[]
    optimizations: FleetOptimization[]
    driverPerformance: DriverPerformanceMetrics[]
  } | null>(null)

  useEffect(() => {
    loadFleetAnalytics()
  }, [fleetId, selectedPeriod])

  const loadFleetAnalytics = async () => {
    setIsLoading(true)
    try {
      const analytics = await predictiveMaintenanceService.getFleetAnalytics(fleetId, selectedPeriod)
      setFleetAnalytics(analytics)
    } catch (error) {
      console.error('Failed to load fleet analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeFleet = async () => {
    setIsLoading(true)
    try {
      const optimization = await predictiveMaintenanceService.optimizeFleetUtilization(fleetId)
      onOptimizationApplied?.(optimization)
      await loadFleetAnalytics() // Refresh data
    } catch (error) {
      console.error('Failed to optimize fleet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  if (isLoading && !fleetAnalytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading Fleet Analytics...</p>
          <p className="text-sm text-muted-foreground">Analyzing fleet performance and optimization opportunities</p>
        </div>
      </div>
    )
  }

  if (!fleetAnalytics) {
    return (
      <div className="text-center py-12">
        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No Fleet Data Available</p>
        <p className="text-sm text-muted-foreground">Unable to load fleet analytics</p>
      </div>
    )
  }

  const { utilization, predictions, optimizations, driverPerformance } = fleetAnalytics

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fleet Optimization Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive fleet performance analysis and optimization recommendations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleOptimizeFleet} disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Optimize Fleet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {utilization.totalVehicles}
              </div>
              <p className="text-sm text-muted-foreground">Total Vehicles</p>
              <div className="text-xs text-green-600 mt-1">
                {utilization.activeVehicles} active
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {utilization.utilizationRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <div className="text-xs text-muted-foreground mt-1">
                Target: 85%
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                £{utilization.revenuePerVehicle.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Revenue/Vehicle</p>
              <div className="text-xs text-green-600 mt-1">
                +12% vs last period
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                £{utilization.profitPerVehicle.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Profit/Vehicle</p>
              <div className="text-xs text-green-600 mt-1">
                +8% vs last period
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fleet Utilization</span>
              <span className="text-sm text-muted-foreground">
                {utilization.utilizationRate.toFixed(1)}% of capacity
              </span>
            </div>
            <Progress value={utilization.utilizationRate} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                <span>Overutilized: {utilization.overutilizedVehicles.length} vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <span>Underutilized: {utilization.underutilizedVehicles.length} vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Downtime: {utilization.downtime}h this period</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="optimizations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Optimization Recommendations */}
        <TabsContent value="optimizations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to improve fleet efficiency and reduce costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600">Fleet Optimally Configured</p>
                  <p className="text-muted-foreground">No optimization opportunities identified at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {optimizations.map((optimization) => (
                    <div key={optimization.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">Fleet Optimization Plan</h3>
                          <p className="text-sm text-muted-foreground">
                            {optimization.recommendations.length} recommendations • 
                            Potential savings: £{optimization.potentialSavings.toLocaleString()}/month
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(optimization.priority)}>
                            {optimization.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {optimization.implementationEffort} effort
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {optimization.recommendations.map((rec) => (
                          <div key={rec.id} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{rec.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rec.description}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                  <strong>Impact:</strong> {rec.impact}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Action:</strong> {rec.actionRequired}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-lg font-bold text-green-600">
                                  £{rec.estimatedSavings.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {rec.timeToImplement} days
                                </div>
                                <Badge className={getRiskColor(rec.riskLevel)} variant="outline">
                                  {rec.riskLevel} risk
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Valid until: {new Date(optimization.validUntil).toLocaleDateString()}
                        </div>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Implement Recommendations
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Predictive Maintenance
              </CardTitle>
              <CardDescription>
                AI-powered maintenance predictions to prevent breakdowns and optimize costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600">All Vehicles in Good Condition</p>
                  <p className="text-muted-foreground">No immediate maintenance needs predicted</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div key={prediction.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {prediction.predictionType.replace('_', ' ').toUpperCase()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Vehicle: {prediction.vehicleId} • 
                            Predicted: {new Date(prediction.predictedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(prediction.severity)} variant="outline">
                            {prediction.severity.toUpperCase()}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>

                      <p className="text-sm mb-3">{prediction.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {prediction.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            £{prediction.estimatedCost.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Estimated cost
                          </div>
                          <Button size="sm" className="mt-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Maintenance
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Driver Performance Analysis
              </CardTitle>
              <CardDescription>
                Individual driver metrics and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driverPerformance.map((driver) => (
                  <div key={driver.driverId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Driver {driver.driverId}</h4>
                        <p className="text-sm text-muted-foreground">
                          {driver.totalTrips} trips • {driver.totalMiles.toLocaleString()} miles • 
                          £{driver.earnings.toLocaleString()} earnings
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {driver.averageRating.toFixed(1)}★
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Average rating
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {driver.fuelEfficiency.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">MPG</div>
                        <div className="text-xs text-muted-foreground">
                          Target: 35 mpg
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {driver.safetyScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Safety Score</div>
                        <div className="text-xs text-muted-foreground">
                          Target: 80+
                        </div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">
                          {driver.punctualityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Punctuality</div>
                        <div className="text-xs text-muted-foreground">
                          Target: 85+
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {driver.vehicleWearScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Wear Score</div>
                        <div className="text-xs text-muted-foreground">
                          Target: <70
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Harsh braking: {driver.harshBraking} events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-600" />
                        <span>Harsh acceleration: {driver.harshAcceleration} events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-yellow-600" />
                        <span>Speeding incidents: {driver.speedingIncidents}</span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button size="sm" variant="outline">
                        View Optimization Suggestions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fleet Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive fleet performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Cost Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fuel Costs</span>
                      <span className="font-medium">£{utilization.fuelCostPerVehicle.toLocaleString()}/vehicle</span>
                    </div>
                    <Progress value={60} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Maintenance Costs</span>
                      <span className="font-medium">£{utilization.maintenanceCostPerVehicle.toLocaleString()}/vehicle</span>
                    </div>
                    <Progress value={25} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Other Costs</span>
                      <span className="font-medium">£{(utilization.revenuePerVehicle - utilization.profitPerVehicle - utilization.fuelCostPerVehicle - utilization.maintenanceCostPerVehicle).toLocaleString()}/vehicle</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Peak Utilization Hours</h4>
                  <div className="space-y-2">
                    {utilization.peakUtilizationHours.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium">{hour}</span>
                        <Badge variant="outline">Peak</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4">Fleet Health Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {Math.round((utilization.activeVehicles / utilization.totalVehicles) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Vehicles Active</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {utilization.averageMilesPerVehicle.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Miles/Vehicle</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {Math.round(utilization.downtime / utilization.totalVehicles)}h
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Downtime/Vehicle</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}