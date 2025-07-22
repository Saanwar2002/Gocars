import * as React from "react"
import { 
  Car, 
  Clock, 
  Users, 
  Star,
  Navigation,
  Phone,
  MessageSquare,
  AlertTriangle,
  Activity,
  BarChart3,
  Shield
} from "lucide-react"
import { ConfigurableWidget, type WidgetConfig } from "./widget-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  WidgetSkeleton, 
  MetricWidgetSkeleton, 
  ListWidgetSkeleton, 
  AlertsSkeleton,
  PulseIndicator 
} from "@/components/ui/skeleton"
import { 
  useRideStatusData, 
  useEarningsData, 
  useFleetStatusData, 
  useSystemAlertsData,
  usePerformanceMetricsData 
} from "@/hooks/useRealTimeData"
import { cn } from "@/lib/utils"

// Passenger Dashboard Widgets
export const PassengerWidgets = {
  quickBooking: (config: WidgetConfig) => (
    <ConfigurableWidget config={config}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Quick Booking</p>
            <p className="text-sm text-muted-foreground">Book your next ride</p>
          </div>
        </div>
        <Button className="w-full" size="lg">
          <Car className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      </div>
    </ConfigurableWidget>
  ),

  activeRide: (config: WidgetConfig, rideId?: string) => {
    const { data: rideData, loading, isConnected } = useRideStatusData(rideId)
    
    if (loading) {
      return (
        <ConfigurableWidget config={config}>
          <WidgetSkeleton />
        </ConfigurableWidget>
      )
    }

    return (
      <ConfigurableWidget config={config}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="font-medium">Active Ride</span>
              {isConnected && <PulseIndicator className="ml-2" />}
            </div>
            <Badge variant="success" className={isConnected ? "animate-pulse" : ""}>
              {rideData?.status || "En Route"}
            </Badge>
          </div>
          
          {rideData?.driver && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{rideData.driver.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{rideData.driver}</p>
                <p className="text-xs text-muted-foreground">Your driver</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ETA:</span>
            <span className="font-medium">{rideData?.eta || "5 mins"}</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </ConfigurableWidget>
    )
  },

  rideHistory: (config: WidgetConfig, data?: { totalRides?: number; thisMonth?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: data?.totalRides || 0,
      trendValue: `+${data?.thisMonth || 0} this month`,
      trend: "up" as const
    }}>
      <div className="mt-4">
        <Button variant="ghost" className="w-full justify-start p-0 h-auto">
          <Clock className="h-4 w-4 mr-2" />
          View ride history
        </Button>
      </div>
    </ConfigurableWidget>
  ),

  favoriteDrivers: (config: WidgetConfig, data?: Array<{ name: string; rating: number }>) => (
    <ConfigurableWidget config={config}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">Favorite Drivers</span>
        </div>
        
        <div className="space-y-2">
          {(data || []).slice(0, 3).map((driver, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{driver.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{driver.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs">{driver.rating}</span>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" size="sm" className="w-full">
          View all favorites
        </Button>
      </div>
    </ConfigurableWidget>
  ),
}

// Driver Dashboard Widgets
export const DriverWidgets = {
  earnings: (config: WidgetConfig, driverId?: string) => {
    const { data: earningsData, loading, isConnected } = useEarningsData(driverId)
    
    if (loading) {
      return (
        <ConfigurableWidget config={config}>
          <MetricWidgetSkeleton />
        </ConfigurableWidget>
      )
    }

    return (
      <ConfigurableWidget config={config} data={{
        value: `$${earningsData?.today || 0}`,
        trendValue: `$${earningsData?.week || 0} this week`,
        trend: "up" as const
      }}>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">This week:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">${earningsData?.week || 0}</span>
              {isConnected && <PulseIndicator color="bg-green-500" />}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">This month:</span>
            <span className="font-medium">${earningsData?.month || 0}</span>
          </div>
        </div>
      </ConfigurableWidget>
    )
  },

  rideRequests: (config: WidgetConfig, data?: { pending?: number; accepted?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: data?.pending || 0,
      trendValue: `${data?.accepted || 0} accepted today`,
      trend: "neutral" as const
    }}>
      <div className="mt-4">
        <Button className="w-full" size="sm">
          <Car className="h-4 w-4 mr-2" />
          View Requests
        </Button>
      </div>
    </ConfigurableWidget>
  ),

  onlineStatus: (config: WidgetConfig, data?: { isOnline?: boolean; duration?: string }) => (
    <ConfigurableWidget config={config}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              data?.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="font-medium">
              {data?.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <Badge variant={data?.isOnline ? "success" : "secondary"}>
            {data?.isOnline ? "Available" : "Unavailable"}
          </Badge>
        </div>
        
        {data?.isOnline && data?.duration && (
          <div className="text-sm text-muted-foreground">
            Online for {data.duration}
          </div>
        )}
        
        <Button 
          variant={data?.isOnline ? "destructive" : "default"} 
          className="w-full"
          size="sm"
        >
          {data?.isOnline ? "Go Offline" : "Go Online"}
        </Button>
      </div>
    </ConfigurableWidget>
  ),

  performance: (config: WidgetConfig, driverId?: string) => {
    const { data: performanceData, loading, isConnected } = usePerformanceMetricsData(driverId)
    
    if (loading) {
      return (
        <ConfigurableWidget config={config}>
          <WidgetSkeleton />
        </ConfigurableWidget>
      )
    }

    return (
      <ConfigurableWidget config={config}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-medium">Performance</span>
            {isConnected && <PulseIndicator color="bg-blue-500" />}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rating</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{performanceData?.rating || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rides</span>
              <span className="font-medium">{performanceData?.completedRides || 0}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acceptance</span>
                <span className="font-medium">{performanceData?.acceptanceRate || 0}%</span>
              </div>
              <Progress value={performanceData?.acceptanceRate || 0} className="h-2" />
            </div>
          </div>
        </div>
      </ConfigurableWidget>
    )
  },
}

// Operator Dashboard Widgets
export const OperatorWidgets = {
  fleetOverview: (config: WidgetConfig) => {
    const { data: fleetData, loading, isConnected } = useFleetStatusData()
    
    if (loading) {
      return (
        <ConfigurableWidget config={config}>
          <MetricWidgetSkeleton />
        </ConfigurableWidget>
      )
    }

    return (
      <ConfigurableWidget config={config} data={{
        value: fleetData?.active || 0,
        trendValue: `${fleetData?.total || 0} total drivers`,
        trend: "neutral" as const
      }}>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Online:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">{fleetData?.active || 0}</span>
              {isConnected && <PulseIndicator color="bg-green-500" />}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Offline:</span>
            <span className="font-medium text-gray-500">{fleetData?.offline || 0}</span>
          </div>
          <Progress 
            value={fleetData?.total ? (fleetData.active || 0) / fleetData.total * 100 : 0} 
            className="h-2 mt-2" 
          />
        </div>
      </ConfigurableWidget>
    )
  },

  activeRides: (config: WidgetConfig, data?: { current?: number; completed?: number; cancelled?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: data?.current || 0,
      trendValue: `${data?.completed || 0} completed today`,
      trend: "up" as const
    }}>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Completed:</span>
          <span className="font-medium text-green-600">{data?.completed || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cancelled:</span>
          <span className="font-medium text-red-600">{data?.cancelled || 0}</span>
        </div>
      </div>
    </ConfigurableWidget>
  ),

  revenue: (config: WidgetConfig, data?: { today?: number; week?: number; month?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: `$${data?.today || 0}`,
      trendValue: `$${data?.week || 0} this week`,
      trend: "up" as const
    }}>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">This week:</span>
          <span className="font-medium">${data?.week || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">This month:</span>
          <span className="font-medium">${data?.month || 0}</span>
        </div>
      </div>
    </ConfigurableWidget>
  ),

  alerts: (config: WidgetConfig) => {
    const { data: alertsData, loading, isConnected } = useSystemAlertsData()
    
    if (loading) {
      return (
        <ConfigurableWidget config={config}>
          <AlertsSkeleton />
        </ConfigurableWidget>
      )
    }

    return (
      <ConfigurableWidget config={config}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="font-medium">System Alerts</span>
            {isConnected && <PulseIndicator color="bg-orange-500" />}
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {(alertsData || []).slice(0, 3).map((alert: { id: string; title: string; severity: string; time: string }, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  alert.type === 'error' && "bg-red-500",
                  alert.type === 'warning' && "bg-orange-500",
                  alert.type === 'info' && "bg-blue-500"
                )} />
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" className="w-full">
            View all alerts
          </Button>
        </div>
      </ConfigurableWidget>
    )
  },
}

// Admin Dashboard Widgets
export const AdminWidgets = {
  systemHealth: (config: WidgetConfig, data?: { status?: 'healthy' | 'warning' | 'critical'; uptime?: string }) => (
    <ConfigurableWidget config={config}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-medium">System Health</span>
          </div>
          <Badge variant={
            data?.status === 'healthy' ? 'success' : 
            data?.status === 'warning' ? 'warning' : 'destructive'
          }>
            {data?.status || 'healthy'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{data?.uptime || "99.9%"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={cn(
              "font-medium",
              data?.status === 'healthy' && "text-green-600",
              data?.status === 'warning' && "text-orange-600",
              data?.status === 'critical' && "text-red-600"
            )}>
              {data?.status === 'healthy' ? 'All systems operational' : 
               data?.status === 'warning' ? 'Minor issues detected' : 
               'Critical issues detected'}
            </span>
          </div>
        </div>
      </div>
    </ConfigurableWidget>
  ),

  platformMetrics: (config: WidgetConfig, data?: { users?: number; rides?: number; revenue?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: data?.users || 0,
      trendValue: `${data?.rides || 0} rides today`,
      trend: "up" as const
    }}>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total rides:</span>
          <span className="font-medium">{data?.rides || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Revenue:</span>
          <span className="font-medium">${data?.revenue || 0}</span>
        </div>
      </div>
    </ConfigurableWidget>
  ),

  userGrowth: (config: WidgetConfig, data?: { newUsers?: number; growthRate?: number }) => (
    <ConfigurableWidget config={config} data={{
      value: data?.newUsers || 0,
      trendValue: `${data?.growthRate || 0}% growth`,
      trend: (data?.growthRate || 0) > 0 ? "up" : "down"
    }}>
      <div className="mt-4">
        <Button variant="ghost" className="w-full justify-start p-0 h-auto">
          <Users className="h-4 w-4 mr-2" />
          View user analytics
        </Button>
      </div>
    </ConfigurableWidget>
  ),

  securityAlerts: (config: WidgetConfig, data?: { alerts?: number; lastIncident?: string }) => (
    <ConfigurableWidget config={config}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Security</span>
          </div>
          <Badge variant={data?.alerts ? "warning" : "success"}>
            {data?.alerts ? `${data.alerts} alerts` : "Secure"}
          </Badge>
        </div>
        
        {data?.lastIncident && (
          <div className="text-sm text-muted-foreground">
            Last incident: {data.lastIncident}
          </div>
        )}
        
        <Button variant="ghost" size="sm" className="w-full">
          <Shield className="h-4 w-4 mr-2" />
          Security Dashboard
        </Button>
      </div>
    </ConfigurableWidget>
  ),
}

// Widget Factory for creating role-specific widgets
export const createRoleWidgets = (role: 'passenger' | 'driver' | 'operator' | 'admin'): WidgetConfig[] => {
  const baseConfigs = {
    passenger: [
      { id: 'quick-booking', title: 'Quick Booking', type: 'action' as const, size: 'sm' as const },
      { id: 'active-ride', title: 'Active Ride', type: 'custom' as const, size: 'md' as const },
      { id: 'ride-history', title: 'Ride History', type: 'metric' as const, size: 'sm' as const },
      { id: 'favorite-drivers', title: 'Favorite Drivers', type: 'list' as const, size: 'md' as const },
    ],
    driver: [
      { id: 'earnings', title: 'Today\'s Earnings', type: 'metric' as const, size: 'sm' as const },
      { id: 'ride-requests', title: 'Ride Requests', type: 'metric' as const, size: 'sm' as const },
      { id: 'online-status', title: 'Status', type: 'action' as const, size: 'sm' as const },
      { id: 'performance', title: 'Performance', type: 'custom' as const, size: 'md' as const },
    ],
    operator: [
      { id: 'fleet-overview', title: 'Fleet Overview', type: 'metric' as const, size: 'sm' as const },
      { id: 'active-rides', title: 'Active Rides', type: 'metric' as const, size: 'sm' as const },
      { id: 'revenue', title: 'Revenue', type: 'metric' as const, size: 'sm' as const },
      { id: 'alerts', title: 'System Alerts', type: 'list' as const, size: 'md' as const },
    ],
    admin: [
      { id: 'system-health', title: 'System Health', type: 'custom' as const, size: 'sm' as const },
      { id: 'platform-metrics', title: 'Platform Metrics', type: 'metric' as const, size: 'sm' as const },
      { id: 'user-growth', title: 'User Growth', type: 'metric' as const, size: 'sm' as const },
      { id: 'security-alerts', title: 'Security', type: 'custom' as const, size: 'sm' as const },
    ],
  }

  return baseConfigs[role].map((config, index) => ({
    ...config,
    position: { x: index % 3, y: Math.floor(index / 3) },
    visible: true,
    permissions: [role],
    customizable: true,
    exportable: config.type === 'metric',
  }))
}