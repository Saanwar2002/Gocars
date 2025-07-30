'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertTriangle, 
  Activity,
  Gauge,
  Navigation,
  Clock,
  Award,
  XCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rideMonitoringService, DriverBehaviorMetrics, RideMonitoring } from '@/services/rideMonitoringService';

interface DriverBehaviorMonitorProps {
  rideId: string;
  driverId: string;
  userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
  onBehaviorAlert?: (alert: BehaviorAlert) => void;
}

interface BehaviorAlert {
  type: 'speed_violation' | 'harsh_acceleration' | 'harsh_braking' | 'sharp_turn' | 'phone_usage';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  data: any;
}

interface BehaviorTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export function DriverBehaviorMonitor({ 
  rideId, 
  driverId, 
  userRole = 'passenger',
  onBehaviorAlert 
}: DriverBehaviorMonitorProps) {
  const [monitoring, setMonitoring] = useState<RideMonitoring | null>(null);
  const [behaviorTrends, setBehaviorTrends] = useState<BehaviorTrend[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<BehaviorAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBehaviorData();
    
    // Set up periodic refresh
    const interval = setInterval(loadBehaviorData, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [rideId]);

  const loadBehaviorData = async () => {
    try {
      const monitoringData = await rideMonitoringService.getActiveMonitoring(rideId);
      setMonitoring(monitoringData);
      
      if (monitoringData) {
        // Generate behavior trends (in real implementation, this would compare with historical data)
        const trends = generateBehaviorTrends(monitoringData.driverBehavior);
        setBehaviorTrends(trends);
        
        // Extract recent behavior alerts
        const behaviorAlerts = monitoringData.safetyAlerts
          .filter(alert => ['speed_violation', 'harsh_driving'].includes(alert.type))
          .map(alert => ({
            type: alert.type as BehaviorAlert['type'],
            severity: alert.severity as BehaviorAlert['severity'],
            description: alert.description,
            timestamp: alert.triggeredAt,
            data: alert.data
          }))
          .slice(0, 5);
        
        setRecentAlerts(behaviorAlerts);
      }
    } catch (error) {
      console.error('Error loading behavior data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBehaviorTrends = (behavior: DriverBehaviorMetrics): BehaviorTrend[] => {
    // In a real implementation, this would compare with historical data
    // For demo purposes, we'll generate mock trends
    return [
      {
        metric: 'Overall Score',
        current: behavior.overallScore,
        previous: behavior.overallScore + Math.random() * 10 - 5,
        change: Math.random() * 10 - 5,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      {
        metric: 'Average Speed',
        current: behavior.averageSpeed,
        previous: behavior.averageSpeed + Math.random() * 5 - 2.5,
        change: Math.random() * 5 - 2.5,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      {
        metric: 'Speed Violations',
        current: behavior.speedViolations,
        previous: Math.max(0, behavior.speedViolations + Math.floor(Math.random() * 3 - 1)),
        change: Math.floor(Math.random() * 3 - 1),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }
    ];
  };

  const getRiskLevelColor = (riskLevel: DriverBehaviorMetrics['riskLevel']) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: BehaviorTrend['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertSeverityColor = (severity: BehaviorAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading driver behavior data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monitoring) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No behavior data</h3>
          <p className="text-muted-foreground">
            Driver behavior monitoring will start when the ride begins.
          </p>
        </CardContent>
      </Card>
    );
  }

  const behavior = monitoring.driverBehavior;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Gauge className="h-6 w-6 mr-2 text-blue-500" />
            Driver Behavior Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time analysis of driving patterns and safety metrics
          </p>
        </div>
        
        <Badge className={getRiskLevelColor(behavior.riskLevel)}>
          {behavior.riskLevel.toUpperCase()} RISK
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(behavior.overallScore)}`}>
              {behavior.overallScore.toFixed(0)}
            </div>
            <Progress value={behavior.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {behavior.averageSpeed.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              km/h (max: {behavior.maxSpeed.toFixed(1)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {behavior.speedViolations}
            </div>
            <p className="text-xs text-muted-foreground">
              Speed violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harsh Events</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {behavior.harshAccelerations + behavior.harshBraking}
            </div>
            <p className="text-xs text-muted-foreground">
              Acceleration + Braking
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Driving Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Speed Control</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={Math.max(0, 100 - behavior.speedViolations * 10)} className="w-20" />
                      <span className="text-sm font-medium">
                        {Math.max(0, 100 - behavior.speedViolations * 10)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Smooth Driving</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={Math.max(0, 100 - (behavior.harshAccelerations + behavior.harshBraking) * 5)} className="w-20" />
                      <span className="text-sm font-medium">
                        {Math.max(0, 100 - (behavior.harshAccelerations + behavior.harshBraking) * 5)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cornering</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={Math.max(0, 100 - behavior.sharpTurns * 3)} className="w-20" />
                      <span className="text-sm font-medium">
                        {Math.max(0, 100 - behavior.sharpTurns * 3)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Focus</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={Math.max(0, 100 - behavior.phoneUsage * 20)} className="w-20" />
                      <span className="text-sm font-medium">
                        {Math.max(0, 100 - behavior.phoneUsage * 20)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(behavior.overallScore)}`}>
                    {behavior.riskLevel.toUpperCase()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current risk level based on driving behavior
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Safety Score</span>
                    <span className="font-medium">{behavior.overallScore.toFixed(0)}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Speed Compliance</span>
                    <span className={behavior.speedViolations === 0 ? 'text-green-600' : 'text-red-600'}>
                      {behavior.speedViolations === 0 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Smooth Driving</span>
                    <span className={(behavior.harshAccelerations + behavior.harshBraking) < 3 ? 'text-green-600' : 'text-red-600'}>
                      {(behavior.harshAccelerations + behavior.harshBraking) < 3 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Speed Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Average Speed</span>
                  <span className="font-medium">{behavior.averageSpeed.toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Maximum Speed</span>
                  <span className="font-medium">{behavior.maxSpeed.toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Speed Violations</span>
                  <span className="font-medium text-orange-600">{behavior.speedViolations}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acceleration Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Harsh Accelerations</span>
                  <span className="font-medium text-red-600">{behavior.harshAccelerations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Harsh Braking</span>
                  <span className="font-medium text-red-600">{behavior.harshBraking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sharp Turns</span>
                  <span className="font-medium text-yellow-600">{behavior.sharpTurns}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Focus & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Phone Usage</span>
                  <span className="font-medium text-red-600">{behavior.phoneUsage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Overall Score</span>
                  <span className={`font-medium ${getScoreColor(behavior.overallScore)}`}>
                    {behavior.overallScore.toFixed(0)}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Risk Level</span>
                  <Badge className={getRiskLevelColor(behavior.riskLevel)}>
                    {behavior.riskLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {behaviorTrends.map((trend, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{trend.metric}</h4>
                    {getTrendIcon(trend.trend)}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">{trend.current.toFixed(1)}</span>
                    <span className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs previous: {trend.previous.toFixed(1)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {recentAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No behavior alerts</h3>
                <p className="text-muted-foreground">
                  The driver is maintaining good driving behavior with no recent alerts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h4 className="font-medium capitalize">
                          {alert.type.replace('_', ' ')}
                        </h4>
                      </div>
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{alert.timestamp.toLocaleString()}</span>
                      {alert.data && (
                        <span>
                          {alert.data.speed && `Speed: ${Math.round(alert.data.speed)} km/h`}
                          {alert.data.acceleration && `Acceleration: ${alert.data.acceleration.toFixed(1)} m/s²`}
                        </span>
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