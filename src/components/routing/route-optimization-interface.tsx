'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin, 
  Route, 
  Clock, 
  Fuel, 
  Leaf, 
  DollarSign, 
  AlertTriangle,
  Navigation,
  Settings,
  TrendingUp,
  Zap
} from 'lucide-react'
import { GeoPoint } from 'firebase/firestore'
import { 
  routeOptimizationService, 
  RouteOptimizationRequest, 
  OptimizedRoute, 
  RoutePoint,
  AlternativeRoute 
} from '@/services/routeOptimizationService'

interface RouteOptimizationInterfaceProps {
  startLocation?: GeoPoint
  endLocation?: GeoPoint
  waypoints?: RoutePoint[]
  onRouteOptimized?: (route: OptimizedRoute) => void
  onRouteSelected?: (route: OptimizedRoute | AlternativeRoute) => void
}

export function RouteOptimizationInterface({
  startLocation,
  endLocation,
  waypoints = [],
  onRouteOptimized,
  onRouteSelected
}: RouteOptimizationInterfaceProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    routeType: 'balanced' as const,
    avoidTolls: false,
    avoidHighways: false,
    avoidTraffic: true,
    maxDetourTime: 15,
    fuelEfficiency: false,
    carbonOptimized: false
  })
  const [constraints, setConstraints] = useState({
    maxTotalTime: 120,
    maxTotalDistance: 100,
    vehicleType: 'car' as const,
    driverBreakRequired: false,
    timeWindows: false
  })
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)

  // Auto-optimize when locations change
  useEffect(() => {
    if (startLocation && (endLocation || waypoints.length > 0)) {
      handleOptimizeRoute()
    }
  }, [startLocation, endLocation, waypoints])

  // Real-time route updates
  useEffect(() => {
    if (optimizedRoute && realTimeUpdates) {
      const interval = setInterval(async () => {
        try {
          const updatedRoute = await routeOptimizationService.getTrafficAwareRoute(optimizedRoute.id!)
          setOptimizedRoute(updatedRoute)
        } catch (error) {
          console.error('Failed to update route:', error)
        }
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [optimizedRoute, realTimeUpdates])

  const handleOptimizeRoute = async () => {
    if (!startLocation) return

    setIsOptimizing(true)
    try {
      const request: RouteOptimizationRequest = {
        requesterId: 'user-interface',
        startLocation,
        endLocation,
        waypoints,
        preferences,
        constraints,
        createdAt: new Date() as any
      }

      const route = await routeOptimizationService.optimizeRoute(request)
      setOptimizedRoute(route)
      onRouteOptimized?.(route)
    } catch (error) {
      console.error('Route optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleSelectRoute = (route: OptimizedRoute | AlternativeRoute) => {
    onRouteSelected?.(route)
    if ('alternativeRoutes' in route) {
      setOptimizedRoute(route)
    }
  }

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'fastest': return 'bg-red-500'
      case 'eco_friendly': return 'bg-green-500'
      case 'shortest': return 'bg-blue-500'
      case 'scenic': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrafficColor = (condition: string) => {
    switch (condition) {
      case 'light': return 'text-green-600'
      case 'moderate': return 'text-yellow-600'
      case 'heavy': return 'text-orange-600'
      case 'severe': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Route Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Route Optimization Settings
          </CardTitle>
          <CardDescription>
            Configure your route preferences and constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preferences" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routeType">Route Type</Label>
                  <Select
                    value={preferences.routeType}
                    onValueChange={(value: any) => setPreferences(prev => ({ ...prev, routeType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fastest">Fastest Route</SelectItem>
                      <SelectItem value="shortest">Shortest Distance</SelectItem>
                      <SelectItem value="eco_friendly">Eco-Friendly</SelectItem>
                      <SelectItem value="scenic">Scenic Route</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDetour">Max Detour Time (minutes)</Label>
                  <div className="px-3">
                    <Slider
                      value={[preferences.maxDetourTime]}
                      onValueChange={([value]) => setPreferences(prev => ({ ...prev, maxDetourTime: value }))}
                      max={60}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>0 min</span>
                      <span>{preferences.maxDetourTime} min</span>
                      <span>60 min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="avoidTolls"
                    checked={preferences.avoidTolls}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, avoidTolls: checked }))}
                  />
                  <Label htmlFor="avoidTolls">Avoid Tolls</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="avoidHighways"
                    checked={preferences.avoidHighways}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, avoidHighways: checked }))}
                  />
                  <Label htmlFor="avoidHighways">Avoid Motorways</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="avoidTraffic"
                    checked={preferences.avoidTraffic}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, avoidTraffic: checked }))}
                  />
                  <Label htmlFor="avoidTraffic">Avoid Traffic</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="fuelEfficiency"
                    checked={preferences.fuelEfficiency}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, fuelEfficiency: checked }))}
                  />
                  <Label htmlFor="fuelEfficiency" className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    Fuel Efficient
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="carbonOptimized"
                    checked={preferences.carbonOptimized}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, carbonOptimized: checked }))}
                  />
                  <Label htmlFor="carbonOptimized" className="flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Carbon Optimized
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select
                    value={constraints.vehicleType}
                    onValueChange={(value: any) => setConstraints(prev => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="truck">HGV/Lorry</SelectItem>
                      <SelectItem value="motorcycle">Motorbike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTime">Max Total Time (minutes)</Label>
                  <Input
                    id="maxTime"
                    type="number"
                    value={constraints.maxTotalTime}
                    onChange={(e) => setConstraints(prev => ({ ...prev, maxTotalTime: parseInt(e.target.value) || 120 }))}
                    min="30"
                    max="480"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDistance">Max Distance (km)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={constraints.maxTotalDistance}
                    onChange={(e) => setConstraints(prev => ({ ...prev, maxTotalDistance: parseInt(e.target.value) || 100 }))}
                    min="10"
                    max="500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="realTimeUpdates"
                    checked={realTimeUpdates}
                    onCheckedChange={setRealTimeUpdates}
                  />
                  <Label htmlFor="realTimeUpdates" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Real-time Updates
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="driverBreak"
                    checked={constraints.driverBreakRequired}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, driverBreakRequired: checked }))}
                  />
                  <Label htmlFor="driverBreak">Driver Break Required</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="timeWindows"
                    checked={constraints.timeWindows}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, timeWindows: checked }))}
                  />
                  <Label htmlFor="timeWindows">Respect Time Windows</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleOptimizeRoute} 
              disabled={isOptimizing || !startLocation}
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Route className="h-4 w-4" />
                  Optimize Route
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Route Results */}
      {optimizedRoute && (
        <div className="space-y-4">
          {/* Primary Route */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Optimized Route
                </div>
                <Badge className={getRouteTypeColor(preferences.routeType)}>
                  {preferences.routeType.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Best route based on your preferences and current conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
                    <Clock className="h-5 w-5" />
                    {Math.round(optimizedRoute.totalDuration)}
                  </div>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <MapPin className="h-5 w-5" />
                    {optimizedRoute.totalDistance.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">Kilometres</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-600">
                    <Fuel className="h-5 w-5" />
                    {optimizedRoute.totalFuelConsumption.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">Litres</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-purple-600">
                    £{optimizedRoute.estimatedCost.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Cost (GBP)</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Optimization Score</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(optimizedRoute.optimizationScore * 100)}%
                  </span>
                </div>
                <Progress value={optimizedRoute.optimizationScore * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    CO₂ Emissions: {optimizedRoute.carbonEmissions.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    Traffic Delay: {Math.round(optimizedRoute.trafficDelay)} min
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => handleSelectRoute(optimizedRoute)}
                className="w-full mt-4"
              >
                Select This Route
              </Button>
            </CardContent>
          </Card>

          {/* Alternative Routes */}
          {optimizedRoute.alternativeRoutes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Alternative Routes
                </CardTitle>
                <CardDescription>
                  Other route options with different trade-offs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizedRoute.alternativeRoutes.map((alternative) => (
                    <div
                      key={alternative.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAlternative === alternative.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAlternative(alternative.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alternative.description}</h4>
                        <Badge variant="outline">
                          {alternative.trafficAvoidance ? 'Traffic-Free' : 'Standard'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Time: </span>
                          <span className="font-medium">{Math.round(alternative.totalDuration)} min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Distance: </span>
                          <span className="font-medium">{alternative.totalDistance.toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          <span className={alternative.fuelSavings > 0 ? 'text-green-600' : 'text-red-600'}>
                            {alternative.fuelSavings > 0 ? '-' : '+'}{Math.abs(alternative.fuelSavings).toFixed(1)}L
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={alternative.costDifference < 0 ? 'text-green-600' : 'text-red-600'}>
                            {alternative.costDifference < 0 ? '-£' : '+£'}{Math.abs(alternative.costDifference).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {selectedAlternative === alternative.id && (
                        <Button 
                          onClick={() => handleSelectRoute(alternative)}
                          size="sm"
                          className="mt-3 w-full"
                        >
                          Select Alternative Route
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Segments */}
          <Card>
            <CardHeader>
              <CardTitle>Route Segments</CardTitle>
              <CardDescription>
                Detailed breakdown of your route with traffic conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizedRoute.segments.map((segment, index) => (
                  <div key={segment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {segment.fromPoint.address} → {segment.toPoint.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {segment.distance.toFixed(1)} km • {Math.round(segment.duration)} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={getTrafficColor(segment.trafficCondition)}
                      >
                        {segment.trafficCondition}
                      </Badge>
                      {segment.tollRequired && (
                        <Badge variant="outline" className="ml-1">
                          Toll
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}