'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  MapPin, 
  Fuel, 
  Battery, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Wrench,
  Users,
  BarChart3,
  Navigation,
  Zap
} from 'lucide-react';
import { 
  fleetMonitoringService, 
  Vehicle, 
  VehicleStatus,
  DriverPerformance,
  FleetUtilization,
  FleetAlert,
  MaintenanceSchedule
} from '@/services/fleetMonitoringService';

export default function FleetMonitoringDashboard() {
  const [fleetOverview, setFleetOverview] = useState<any>(null);
  const [vehicleTracking, setVehicleTracking] = useState<VehicleStatus[]>([]);
  const [fleetAlerts, setFleetAlerts] = useState<FleetAlert[]>([]);
  const [fleetUtilization, setFleetUtilization] = useState<FleetUtilization | null>(null);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    initializeFleetMonitoring();
    const interval = setInterval(loadFleetData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeFleetMonitoring = async () => {
    try {
      await fleetMonitoringService.initialize();
      await loadFleetData();
    } catch (error) {
      console.error('Error initializing fleet monitoring:', error);
      setError('Failed to initialize fleet monitoring');
    }
  };

  const loadFleetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load fleet overview
      const overview = await fleetMonitoringService.getFleetOverview();
      setFleetOverview(overview);

      // Load vehicle tracking
      const tracking = await fleetMonitoringService.getVehicleTracking();
      setVehicleTracking(tracking);

      // Load fleet alerts
      const alerts = await fleetMonitoringService.getFleetAlerts();
      setFleetAlerts(alerts);

      // Load fleet utilization
      const utilization = await fleetMonitoringService.analyzeFleetUtilization();
      setFleetUtilization(utilization);

      // Load maintenance schedules (mock data)
      // In production, this would load actual maintenance schedules
      setMaintenanceSchedules([]);

    } catch (error) {
      console.error('Error loading fleet data:', error);
      setError('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fleetMonitoringService.acknowledgeAlert(alertId, 'fleet_manager');
      await loadFleetData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fleetMonitoringService.resolveAlert(alertId, 'Issue resolved by fleet manager');
      await loadFleetData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'in_ride': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      case 'charging': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'in_ride': return 'default';
      case 'maintenance': return 'secondary';
      case 'offline': return 'outline';
      case 'charging': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} mi`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading && !fleetOverview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time fleet tracking, performance analytics, and maintenance management
          </p>
        </div>
        <Button onClick={loadFleetData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Fleet Overview */}
      {fleetOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetOverview.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {fleetOverview.activeVehicles} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fleetOverview.availableVehicles}</div>
              <p className="text-xs text-muted-foreground">
                Ready for dispatch
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Service</CardTitle>
              <Navigation className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{fleetOverview.inRideVehicles}</div>
              <p className="text-xs text-muted-foreground">
                Currently on rides
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(fleetOverview.averageUtilization * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Average fleet utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Vehicle Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        {/* Vehicle Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Real-time Vehicle Tracking</span>
              </CardTitle>
              <CardDescription>
                Live location and status of all fleet vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicleTracking.map((vehicle) => (
                  <div
                    key={vehicle.vehicleId}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      selectedVehicle === vehicle.vehicleId ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.vehicleId)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Vehicle {vehicle.vehicleId.slice(-4)}</span>
                          <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                            {vehicle.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}
                          </span>
                          <span className="flex items-center">
                            <Activity className="h-3 w-3 mr-1" />
                            {vehicle.location.speed.toFixed(0)} mph
                          </span>
                          {vehicle.driverId && (
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              Driver {vehicle.driverId.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {vehicle.batteryLevel !== undefined && (
                        <div className="flex items-center space-x-2">
                          <Battery className="h-4 w-4" />
                          <span className="text-sm">{vehicle.batteryLevel}%</span>
                        </div>
                      )}
                      {vehicle.fuelLevel !== undefined && (
                        <div className="flex items-center space-x-2">
                          <Fuel className="h-4 w-4" />
                          <span className="text-sm">{vehicle.fuelLevel}%</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {vehicle.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Fleet Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <span className="font-medium">4.7/5.0</span>
                  </div>
                  <Progress value={94} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">96%</span>
                  </div>
                  <Progress value={96} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On-Time Performance</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fuel Efficiency</span>
                    <span className="font-medium">28.5 MPG</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Daily Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">245</div>
                      <div className="text-sm text-muted-foreground">Total Rides</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">$3,675</div>
                      <div className="text-sm text-muted-foreground">Total Earnings</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">1,250</div>
                      <div className="text-sm text-muted-foreground">Miles Driven</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">18.5</div>
                      <div className="text-sm text-muted-foreground">Avg Hours</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span>Maintenance Schedule</span>
              </CardTitle>
              <CardDescription>
                Upcoming and overdue maintenance for fleet vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No maintenance scheduled</p>
                    <p className="text-sm text-muted-foreground">All vehicles are up to date</p>
                  </div>
                ) : (
                  maintenanceSchedules.map((schedule) => (
                    <div key={schedule.vehicleId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Vehicle {schedule.vehicleId.slice(-4)}</h4>
                        <p className="text-sm text-muted-foreground">{schedule.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Scheduled: {schedule.scheduledDate.toLocaleDateString()}</span>
                          <span>Duration: {schedule.estimatedDuration}h</span>
                          <span>Cost: {formatCurrency(schedule.estimatedCost)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={schedule.priority === 'critical' ? 'destructive' : 'default'}>
                          {schedule.priority}
                        </Badge>
                        <Badge variant="outline">{schedule.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Fleet Alerts</span>
              </CardTitle>
              <CardDescription>
                Active alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fleetAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No active alerts</p>
                    <p className="text-sm text-muted-foreground">Fleet is operating normally</p>
                  </div>
                ) : (
                  fleetAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          {alert.vehicleId && <span>Vehicle: {alert.vehicleId.slice(-4)}</span>}
                          {alert.driverId && <span>Driver: {alert.driverId.slice(-4)}</span>}
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-4">
          {fleetUtilization && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Fleet Utilization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Utilization</span>
                      <span className="font-medium">{Math.round(fleetUtilization.utilizationRate * 100)}%</span>
                    </div>
                    <Progress value={fleetUtilization.utilizationRate * 100} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{fleetUtilization.activeVehicles}</div>
                      <div className="text-sm text-muted-foreground">Active Vehicles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{fleetUtilization.averageIdleTime}</div>
                      <div className="text-sm text-muted-foreground">Avg Idle (min)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Peak Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fleetUtilization.peakHours.map((peak) => (
                      <div key={peak.hour} className="flex items-center justify-between">
                        <span className="text-sm">{peak.hour}:00</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${peak.utilization * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">
                            {Math.round(peak.utilization * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {fleetUtilization?.recommendations && fleetUtilization.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Optimization Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fleetUtilization.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium capitalize">{rec.type.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm text-green-600">
                            +{Math.round(rec.expectedImprovement * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}