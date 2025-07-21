/**
 * Real-time Dashboard Demo
 * Demonstrates the real-time widget functionality
 */

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { websocketService, DASHBOARD_EVENTS } from "@/services/websocket"
import { dataSyncService, syncHelpers } from "@/services/dataSynchronization"
import { PassengerWidgets, DriverWidgets, OperatorWidgets, AdminWidgets } from "./role-widgets"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { Wifi, WifiOff, Activity, Zap } from "lucide-react"

export function RealTimeDashboardDemo() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [simulationActive, setSimulationActive] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null)

  // Sample widget configurations
  const sampleWidgetConfig = {
    id: 'demo-widget',
    title: 'Demo Widget',
    type: 'metric' as const,
    size: 'sm' as const,
    position: { x: 0, y: 0 },
    visible: true,
    permissions: ['demo'],
    customizable: true,
    exportable: true
  }

  useEffect(() => {
    // Set up WebSocket handlers
    websocketService.setHandlers({
      onConnect: () => {
        setIsConnected(true)
        setConnectionStatus('connected')
      },
      onDisconnect: () => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
      },
      onError: () => {
        setConnectionStatus('disconnected')
      }
    })

    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval)
      }
    }
  }, [simulationInterval])

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    try {
      await websocketService.connect()
    } catch (error) {
      setConnectionStatus('disconnected')
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = () => {
    websocketService.disconnect()
    setConnectionStatus('disconnected')
  }

  const startSimulation = () => {
    setSimulationActive(true)
    
    const interval = setInterval(() => {
      // Simulate random data updates
      const randomEvents = [
        () => simulateRideUpdate(),
        () => simulateEarningsUpdate(),
        () => simulateFleetUpdate(),
        () => simulateSystemAlert(),
        () => simulatePerformanceUpdate()
      ]
      
      const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)]
      randomEvent()
    }, 2000) // Update every 2 seconds
    
    setSimulationInterval(interval)
  }

  const stopSimulation = () => {
    setSimulationActive(false)
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
  }

  const simulateRideUpdate = () => {
    const statuses = ['Requested', 'Accepted', 'En Route', 'Arrived', 'In Progress', 'Completed']
    const drivers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']
    const etas = ['2 mins', '5 mins', '8 mins', '12 mins']
    
    websocketService.send(DASHBOARD_EVENTS.RIDE_STATUS_UPDATE, {
      id: 'ride_123',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      driver: drivers[Math.floor(Math.random() * drivers.length)],
      eta: etas[Math.floor(Math.random() * etas.length)]
    })
  }

  const simulateEarningsUpdate = () => {
    websocketService.send(DASHBOARD_EVENTS.EARNINGS_UPDATE, {
      today: Math.floor(Math.random() * 200) + 50,
      week: Math.floor(Math.random() * 1000) + 300,
      month: Math.floor(Math.random() * 4000) + 1200
    })
  }

  const simulateFleetUpdate = () => {
    const total = 50
    const active = Math.floor(Math.random() * total) + 10
    
    websocketService.send(DASHBOARD_EVENTS.FLEET_STATUS_UPDATE, {
      total,
      active,
      offline: total - active
    })
  }

  const simulateSystemAlert = () => {
    const alertTypes = ['info', 'warning', 'error']
    const messages = [
      'System maintenance scheduled for tonight',
      'High demand detected in downtown area',
      'Payment processing experiencing delays',
      'New driver onboarding completed',
      'Server response time increased'
    ]
    
    websocketService.send(DASHBOARD_EVENTS.SYSTEM_ALERT, [{
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      message: messages[Math.floor(Math.random() * messages.length)]
    }])
  }

  const simulatePerformanceUpdate = () => {
    websocketService.send(DASHBOARD_EVENTS.PERFORMANCE_METRICS, {
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      completedRides: Math.floor(Math.random() * 100) + 20,
      acceptanceRate: Math.floor(Math.random() * 40) + 60 // 60-100%
    })
  }

  const testOptimisticUpdate = () => {
    // Test optimistic update with earnings
    const operationId = syncHelpers.updateEarnings('driver_123', {
      today: 150,
      week: 750,
      month: 2800
    })
    
    // Simulate server confirmation after 2 seconds
    setTimeout(() => {
      dataSyncService.confirmUpdate(operationId, {
        today: 155, // Server returned slightly different value
        week: 755,
        month: 2805
      })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Dashboard Demo
          </CardTitle>
          <CardDescription>
            Demonstrates WebSocket integration, live data updates, and optimistic UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Status: <Badge variant={isConnected ? "success" : "destructive"}>
                  {connectionStatus}
                </Badge>
              </span>
            </div>
            
            <div className="flex gap-2">
              {!isConnected ? (
                <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                Data Simulation: <Badge variant={simulationActive ? "success" : "secondary"}>
                  {simulationActive ? 'Active' : 'Inactive'}
                </Badge>
              </span>
            </div>
            
            <div className="flex gap-2">
              {!simulationActive ? (
                <Button onClick={startSimulation} disabled={!isConnected}>
                  Start Simulation
                </Button>
              ) : (
                <Button variant="outline" onClick={stopSimulation}>
                  Stop Simulation
                </Button>
              )}
              <Button variant="outline" onClick={testOptimisticUpdate} disabled={!isConnected}>
                Test Optimistic Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="passenger" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="passenger">Passenger</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="operator">Operator</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="passenger" className="space-y-4">
          <h3 className="text-lg font-semibold">Passenger Dashboard Widgets</h3>
          <ResponsiveGrid className="gap-4">
            {PassengerWidgets.quickBooking(sampleWidgetConfig)}
            {PassengerWidgets.activeRide(sampleWidgetConfig, 'ride_123')}
            {PassengerWidgets.rideHistory(sampleWidgetConfig, { totalRides: 45, thisMonth: 12 })}
            {PassengerWidgets.favoriteDrivers(sampleWidgetConfig, [
              { name: 'John Doe', rating: 4.9 },
              { name: 'Jane Smith', rating: 4.8 },
              { name: 'Mike Johnson', rating: 4.7 }
            ])}
          </ResponsiveGrid>
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <h3 className="text-lg font-semibold">Driver Dashboard Widgets</h3>
          <ResponsiveGrid className="gap-4">
            {DriverWidgets.earnings(sampleWidgetConfig, 'driver_123')}
            {DriverWidgets.rideRequests(sampleWidgetConfig, { pending: 3, accepted: 8 })}
            {DriverWidgets.onlineStatus(sampleWidgetConfig, { isOnline: true, duration: '2h 15m' })}
            {DriverWidgets.performance(sampleWidgetConfig, 'driver_123')}
          </ResponsiveGrid>
        </TabsContent>

        <TabsContent value="operator" className="space-y-4">
          <h3 className="text-lg font-semibold">Operator Dashboard Widgets</h3>
          <ResponsiveGrid className="gap-4">
            {OperatorWidgets.fleetOverview(sampleWidgetConfig)}
            {OperatorWidgets.activeRides(sampleWidgetConfig, { current: 25, completed: 120, cancelled: 5 })}
            {OperatorWidgets.revenue(sampleWidgetConfig, { today: 2500, week: 15000, month: 65000 })}
            {OperatorWidgets.alerts(sampleWidgetConfig)}
          </ResponsiveGrid>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <h3 className="text-lg font-semibold">Admin Dashboard Widgets</h3>
          <ResponsiveGrid className="gap-4">
            {AdminWidgets.systemHealth(sampleWidgetConfig, { status: 'healthy', uptime: '99.9%' })}
            {AdminWidgets.platformMetrics(sampleWidgetConfig, { users: 1250, rides: 450, revenue: 12500 })}
            {AdminWidgets.userGrowth(sampleWidgetConfig, { newUsers: 45, growthRate: 12.5 })}
            {AdminWidgets.securityAlerts(sampleWidgetConfig, { alerts: 0, lastIncident: '2 days ago' })}
          </ResponsiveGrid>
        </TabsContent>
      </Tabs>
    </div>
  )
}