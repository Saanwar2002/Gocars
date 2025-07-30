'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Navigation,
  Zap,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rideMonitoringService, RideMonitoring, SafetyAlert } from '@/services/rideMonitoringService';

interface RideMonitoringDashboardProps {
  rideId: string;
  userId: string;
  userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
  onEmergencyTriggered?: () => void;
}

export function RideMonitoringDashboard({ 
  rideId, 
  userId, 
  userRole = 'passenger',
  onEmergencyTriggered 
}: RideMonitoringDashboardProps) {
  const [monitoring, setMonitoring] = useState<RideMonitoring | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMonitoringData();
    
    // Set up periodic refresh
    const interval = setInterval(loadMonitoringData, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [rideId]);

  const loadMonitoringData = async () => {
    try {
      const monitoringData = await rideMonitoringService.getActiveMonitoring(rideId);
      setMonitoring(monitoringData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheckIn = async (isOk: boolean, message?: string) => {
    try {
      const success = await rideMonitoringService.performManualCheckIn(rideId, isOk, message);
      if (success) {
        await loadMonitoringData();
      }
    } catch (error) {
      console.error('Error performing check-in:', error);
    }
  };

  const getStatusColor = (status: RideMonitoring['status']) => {
    switch (status) {
      case 'monitoring': return 'bg-green-100 text-green-800';
      case 'alert_triggered': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 25) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAlertSeverityColor = (severity: SafetyAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading ride monitoring...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monitoring) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No active monitoring</h3>
          <p className="text-muted-foreground">
            Ride monitoring will start automatically when your ride begins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2 text-green-500" />
            Ride Safety Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time safety monitoring for your ride
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(monitoring.status)}>
            {monitoring.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(monitoring.riskScore)}`}>
              {monitoring.riskScore.toFixed(0)}%
            </div>
            <Progress value={monitoring.riskScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitoring.driverBehavior.overallScore.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoring.driverBehavior.riskLevel} risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {monitoring.safetyAlerts.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoring.safetyAlerts.length} total alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Status</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitoring.deviations.filter(d => !d.isResolved).length === 0 ? (
                <span className="text-green-600">On Route</span>
              ) : (
                <span className="text-orange-600">Deviated</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoring.deviations.length} deviations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Safety Alerts</TabsTrigger>
          <TabsTrigger value="behavior">Driver Behavior</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monitoring.actualRoute.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Coordinates:</strong><br />
                      {monitoring.actualRoute[monitoring.actualRoute.length - 1].latitude.toFixed(6)}, {monitoring.actualRoute[monitoring.actualRoute.length - 1].longitude.toFixed(6)}
                    </div>
                    <div className="text-sm">
                      <strong>Last Update:</strong><br />
                      {monitoring.actualRoute[monitoring.actualRoute.length - 1].timestamp.toLocaleTimeString()}
                    </div>
                    {monitoring.actualRoute[monitoring.actualRoute.length - 1].speed && (
                      <div className="text-sm">
                        <strong>Speed:</strong><br />
                        {(monitoring.actualRoute[monitoring.actualRoute.length - 1].speed! * 3.6).toFixed(1)} km/h
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Ride Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Started</span>
                      <span>{monitoring.startTime.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration</span>
                      <span>
                        {Math.floor((new Date().getTime() - monitoring.startTime.getTime()) / (1000 * 60))} min
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Route Points</span>
                      <span>{monitoring.actualRoute.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Update</span>
                      <span>{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Safety Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleManualCheckIn(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I'm OK
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleManualCheckIn(false, 'Need assistance')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Need Help
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${monitoring.driverId}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Driver
                </Button>
                <Button
                  variant="destructive"
                  onClick={onEmergencyTriggered}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {monitoring.safetyAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No safety alerts</h3>
                <p className="text-muted-foreground">
                  Your ride is proceeding safely with no alerts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {monitoring.safetyAlerts
                .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
                .map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h4 className="font-medium capitalize">
                          {alert.type.replace('_', ' ')}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getAlertSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{alert.triggeredAt.toLocaleString()}</span>
                      <span>{alert.actions.length} actions taken</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Driving Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Speed</span>
                  <span className="font-medium">
                    {monitoring.driverBehavior.averageSpeed.toFixed(1)} km/h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Max Speed</span>
                  <span className="font-medium">
                    {monitoring.driverBehavior.maxSpeed.toFixed(1)} km/h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Speed Violations</span>
                  <span className="font-medium text-orange-600">
                    {monitoring.driverBehavior.speedViolations}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Harsh Events</span>
                  <span className="font-medium text-red-600">
                    {monitoring.driverBehavior.harshAccelerations + monitoring.driverBehavior.harshBraking}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {monitoring.driverBehavior.overallScore.toFixed(0)}
                  </div>
                  <Badge className={
                    monitoring.driverBehavior.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    monitoring.driverBehavior.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    monitoring.driverBehavior.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {monitoring.driverBehavior.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <Progress value={monitoring.driverBehavior.overallScore} className="mb-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Based on speed, acceleration, and driving patterns
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4">
          {monitoring.checkIns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No check-ins yet</h3>
                <p className="text-muted-foreground">
                  Safety check-ins will appear here during your ride.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {monitoring.checkIns
                .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
                .map((checkIn) => (
                <Card key={checkIn.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {checkIn.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : checkIn.status === 'missed' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <h4 className="font-medium capitalize">
                          {checkIn.type} Check-in
                        </h4>
                      </div>
                      <Badge variant={
                        checkIn.status === 'completed' ? 'default' :
                        checkIn.status === 'missed' ? 'destructive' :
                        'secondary'
                      }>
                        {checkIn.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Scheduled: {checkIn.scheduledAt.toLocaleString()}</div>
                      {checkIn.completedAt && (
                        <div>Completed: {checkIn.completedAt.toLocaleString()}</div>
                      )}
                      {checkIn.response?.message && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          Message: {checkIn.response.message}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}