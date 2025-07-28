'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Navigation,
  RefreshCw,
  Zap,
  Construction,
  Car
} from 'lucide-react'
import { TrafficData, TrafficIncident, routeOptimizationService } from '@/services/routeOptimizationService'

interface TrafficMonitoringDashboardProps {
  routeId?: string
  onIncidentDetected?: (incident: TrafficIncident) => void
  onTrafficUpdate?: (data: TrafficData[]) => void
}

export function TrafficMonitoringDashboard({
  routeId,
  onIncidentDetected,
  onTrafficUpdate
}: TrafficMonitoringDashboardProps) {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [incidents, setIncidents] = useState<TrafficIncident[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock traffic data - in real implementation, this would come from traffic APIs
  const mockTrafficData: TrafficData[] = [
    {
      segmentId: 'segment_1',
      currentSpeed: 45,
      averageSpeed: 60,
      congestionLevel: 0.3,
      incidents: [
        {
          id: 'incident_1',
          type: 'construction',
          location: { latitude: 40.7128, longitude: -74.0060 } as any,
          severity: 'moderate',
          estimatedClearTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          description: 'Lane closure due to carriageway maintenance',
          affectedLanes: 1,
          detourRecommended: true
        }
      ],
      predictedConditions: {
        nextHour: 0.4,
        nextTwoHours: 0.2,
        nextFourHours: 0.1
      }
    },
    {
      segmentId: 'segment_2',
      currentSpeed: 25,
      averageSpeed: 50,
      congestionLevel: 0.7,
      incidents: [
        {
          id: 'incident_2',
          type: 'accident',
          location: { latitude: 40.7589, longitude: -73.9851 } as any,
          severity: 'major',
          description: 'Multi-vehicle collision blocking two lanes',
          affectedLanes: 2,
          detourRecommended: true
        }
      ],
      predictedConditions: {
        nextHour: 0.8,
        nextTwoHours: 0.6,
        nextFourHours: 0.3
      }
    },
    {
      segmentId: 'segment_3',
      currentSpeed: 55,
      averageSpeed: 60,
      congestionLevel: 0.1,
      incidents: [],
      predictedConditions: {
        nextHour: 0.1,
        nextTwoHours: 0.2,
        nextFourHours: 0.3
      }
    }
  ]

  useEffect(() => {
    loadTrafficData()
  }, [routeId])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadTrafficData()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, routeId])

  const loadTrafficData = async () => {
    setIsLoading(true)
    try {
      // In real implementation, fetch from traffic service
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setTrafficData(mockTrafficData)
      
      // Extract incidents
      const allIncidents = mockTrafficData.flatMap(data => data.incidents)
      setIncidents(allIncidents)
      
      // Notify parent components
      onTrafficUpdate?.(mockTrafficData)
      allIncidents.forEach(incident => onIncidentDetected?.(incident))
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load traffic data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrafficColor = (congestionLevel: number) => {
    if (congestionLevel >= 0.7) return 'text-red-600 bg-red-100'
    if (congestionLevel >= 0.4) return 'text-orange-600 bg-orange-100'
    if (congestionLevel >= 0.2) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'accident': return <Car className="h-4 w-4" />
      case 'construction': return <Construction className="h-4 w-4" />
      case 'road_closure': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'border-red-500 bg-red-50'
      case 'major': return 'border-orange-500 bg-orange-50'
      case 'moderate': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-blue-500 bg-blue-50'
    }
  }

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current * 1.1) return <TrendingUp className="h-4 w-4 text-red-600" />
    if (predicted < current * 0.9) return <TrendingDown className="h-4 w-4 text-green-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const averageCongestion = trafficData.length > 0 
    ? trafficData.reduce((sum, data) => sum + data.congestionLevel, 0) / trafficData.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Traffic Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Traffic Monitoring
              </CardTitle>
              <CardDescription>
                Real-time traffic conditions and incident monitoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <Zap className="h-4 w-4 mr-1" />
                Auto Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTrafficData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trafficData.length}
              </div>
              <p className="text-sm text-muted-foreground">Monitored Segments</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(averageCongestion * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Avg Congestion</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {incidents.length}
              </div>
              <p className="text-sm text-muted-foreground">Active Incidents</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s
              </div>
              <p className="text-sm text-muted-foreground">Last Update</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Traffic Flow</span>
              <Badge className={getTrafficColor(averageCongestion)}>
                {averageCongestion >= 0.7 ? 'Heavy' : 
                 averageCongestion >= 0.4 ? 'Moderate' : 
                 averageCongestion >= 0.2 ? 'Light' : 'Free Flow'}
              </Badge>
            </div>
            <Progress value={averageCongestion * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segments">Traffic Segments</TabsTrigger>
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Traffic Segments */}
        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Route Segments</CardTitle>
              <CardDescription>
                Current traffic conditions for each route segment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficData.map((segment, index) => (
                  <div key={segment.segmentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">Segment {segment.segmentId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current: {segment.currentSpeed} km/h • Average: {segment.averageSpeed} km/h
                          </p>
                        </div>
                      </div>
                      <Badge className={getTrafficColor(segment.congestionLevel)}>
                        {Math.round(segment.congestionLevel * 100)}% congested
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Traffic Flow</span>
                        <span>{Math.round((1 - segment.congestionLevel) * 100)}% efficiency</span>
                      </div>
                      <Progress value={(1 - segment.congestionLevel) * 100} className="h-2" />
                    </div>

                    {segment.incidents.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-red-600 mb-2">
                          {segment.incidents.length} incident(s) affecting this segment
                        </p>
                        {segment.incidents.map(incident => (
                          <div key={incident.id} className="text-xs text-muted-foreground">
                            • {incident.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Incidents */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Active Incidents</CardTitle>
              <CardDescription>
                Current traffic incidents affecting your route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <Activity className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-lg font-medium text-green-600">All Clear!</p>
                  <p className="text-muted-foreground">No active incidents detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div 
                      key={incident.id} 
                      className={`border-l-4 rounded-lg p-4 ${getIncidentColor(incident.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getIncidentIcon(incident.type)}
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">
                              {incident.type.replace('_', ' ')} - {incident.severity}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {incident.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Affected lanes: {incident.affectedLanes}</span>
                              {incident.estimatedClearTime && (
                                <span>
                                  Est. clear: {incident.estimatedClearTime.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="capitalize">
                            {incident.severity}
                          </Badge>
                          {incident.detourRecommended && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Detour Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Predictions */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Predictions</CardTitle>
              <CardDescription>
                Predicted traffic conditions for the next few hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficData.map((segment, index) => (
                  <div key={segment.segmentId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <h4 className="font-medium">Segment {segment.segmentId}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {getTrendIcon(segment.congestionLevel, segment.predictedConditions.nextHour)}
                          <span className="text-sm font-medium">Next Hour</span>
                        </div>
                        <div className="text-lg font-bold">
                          {Math.round(segment.predictedConditions.nextHour * 100)}%
                        </div>
                        <Progress value={segment.predictedConditions.nextHour * 100} className="h-2 mt-2" />
                      </div>

                      <div className="text-center p-3 border rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {getTrendIcon(segment.congestionLevel, segment.predictedConditions.nextTwoHours)}
                          <span className="text-sm font-medium">2 Hours</span>
                        </div>
                        <div className="text-lg font-bold">
                          {Math.round(segment.predictedConditions.nextTwoHours * 100)}%
                        </div>
                        <Progress value={segment.predictedConditions.nextTwoHours * 100} className="h-2 mt-2" />
                      </div>

                      <div className="text-center p-3 border rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {getTrendIcon(segment.congestionLevel, segment.predictedConditions.nextFourHours)}
                          <span className="text-sm font-medium">4 Hours</span>
                        </div>
                        <div className="text-lg font-bold">
                          {Math.round(segment.predictedConditions.nextFourHours * 100)}%
                        </div>
                        <Progress value={segment.predictedConditions.nextFourHours * 100} className="h-2 mt-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}