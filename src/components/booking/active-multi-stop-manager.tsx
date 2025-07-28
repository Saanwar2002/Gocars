"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Timer,
  Route,
  Car,
  User,
  MapIcon,
  Pause,
  Play,
  SkipForward,
  Edit,
  Plus,
  Minus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationPoint } from '@/types';

interface ActiveStop {
  id: string;
  location: LocationPoint;
  address: string;
  doorOrFlat?: string;
  waitTime: number;
  instructions?: string;
  priority: 'low' | 'medium' | 'high';
  contactInfo?: string;
  status: 'pending' | 'approaching' | 'arrived' | 'waiting' | 'completed' | 'skipped';
  estimatedArrival?: Date;
  actualArrival?: Date;
  departureTime?: Date;
  actualWaitTime?: number;
}

interface ActiveMultiStopRide {
  id: string;
  passengerId: string;
  driverId: string;
  status: 'en_route' | 'at_pickup' | 'in_progress' | 'completed';
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  stops: ActiveStop[];
  currentStopIndex: number;
  totalDistance: number;
  totalDuration: number;
  estimatedFare: number;
  actualFare?: number;
  startTime: Date;
  estimatedCompletionTime: Date;
  driver: {
    name: string;
    phone: string;
    vehicleInfo: string;
    rating: number;
    photo?: string;
  };
}

interface ActiveMultiStopManagerProps {
  ride: ActiveMultiStopRide;
  onStopUpdate?: (stopId: string, updates: Partial<ActiveStop>) => void;
  onRideUpdate?: (rideId: string, updates: Partial<ActiveMultiStopRide>) => void;
  onContactDriver?: () => void;
  onEmergency?: () => void;
  userRole: 'passenger' | 'driver' | 'operator';
}

export default function ActiveMultiStopManager({
  ride,
  onStopUpdate,
  onRideUpdate,
  onContactDriver,
  onEmergency,
  userRole,
}: ActiveMultiStopManagerProps) {
  const { toast } = useToast();
  const [showStopDetails, setShowStopDetails] = useState<string | null>(null);
  const [showWaitTimeDialog, setShowWaitTimeDialog] = useState<string | null>(null);
  const [newWaitTime, setNewWaitTime] = useState(5);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentStop = ride.stops[ride.currentStopIndex];
  const completedStops = ride.stops.filter(stop => stop.status === 'completed').length;
  const totalStops = ride.stops.length;
  const progressPercentage = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // Calculate ETA for current stop
  const calculateETA = useCallback((stop: ActiveStop) => {
    if (stop.estimatedArrival) {
      return stop.estimatedArrival;
    }
    // Fallback calculation based on current time and estimated duration
    const now = new Date();
    return new Date(now.getTime() + 15 * 60000); // 15 minutes from now
  }, []);

  // Handle stop status update
  const handleStopStatusUpdate = useCallback((stopId: string, newStatus: ActiveStop['status']) => {
    const stop = ride.stops.find(s => s.id === stopId);
    if (!stop) return;

    const updates: Partial<ActiveStop> = { status: newStatus };

    if (newStatus === 'arrived') {
      updates.actualArrival = new Date();
    } else if (newStatus === 'completed') {
      updates.departureTime = new Date();
      if (stop.actualArrival) {
        updates.actualWaitTime = Math.floor((new Date().getTime() - stop.actualArrival.getTime()) / 60000);
      }
    }

    onStopUpdate?.(stopId, updates);

    // Show appropriate toast
    const statusMessages = {
      approaching: 'Driver is approaching the stop',
      arrived: 'Driver has arrived at the stop',
      waiting: 'Driver is waiting at the stop',
      completed: 'Stop completed successfully',
      skipped: 'Stop has been skipped',
    };

    toast({
      title: "Stop Updated",
      description: statusMessages[newStatus] || `Stop status updated to ${newStatus}`,
    });
  }, [ride.stops, onStopUpdate, toast]);

  // Handle wait time adjustment
  const handleWaitTimeAdjustment = useCallback((stopId: string, adjustment: number) => {
    const stop = ride.stops.find(s => s.id === stopId);
    if (!stop) return;

    const newWaitTime = Math.max(0, Math.min(120, stop.waitTime + adjustment));
    onStopUpdate?.(stopId, { waitTime: newWaitTime });

    toast({
      title: "Wait Time Updated",
      description: `Wait time ${adjustment > 0 ? 'increased' : 'decreased'} to ${newWaitTime} minutes`,
    });
  }, [ride.stops, onStopUpdate, toast]);

  // Skip stop
  const handleSkipStop = useCallback((stopId: string) => {
    handleStopStatusUpdate(stopId, 'skipped');
    
    // Move to next stop if this was the current stop
    const stopIndex = ride.stops.findIndex(s => s.id === stopId);
    if (stopIndex === ride.currentStopIndex) {
      onRideUpdate?.(ride.id, { currentStopIndex: ride.currentStopIndex + 1 });
    }
  }, [handleStopStatusUpdate, ride.currentStopIndex, ride.id, ride.stops, onRideUpdate]);

  // Get status color
  const getStatusColor = (status: ActiveStop['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'arrived': case 'waiting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approaching': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'skipped': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Ride overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Multi-Stop Journey
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedStops} of {totalStops} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Journey Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Driver info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{ride.driver.name}</div>
                <div className="text-sm text-gray-600">{ride.driver.vehicleInfo}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onContactDriver}
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onContactDriver}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current stop highlight */}
          {currentStop && (
            <Alert className="border-blue-200 bg-blue-50">
              <Navigation className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Current Stop:</strong> {currentStop.address}
                    {currentStop.status === 'approaching' && (
                      <span className="ml-2 text-sm">
                        ETA: {calculateETA(currentStop).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <Badge className={getStatusColor(currentStop.status)}>
                    {currentStop.status}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stops list */}
      <Card>
        <CardHeader>
          <CardTitle>Stops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ride.stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`p-4 border rounded-lg transition-all ${
                  index === ride.currentStopIndex 
                    ? 'border-blue-300 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Stop number and status */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        stop.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : index === ride.currentStopIndex
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stop.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < ride.stops.length - 1 && (
                        <div className={`w-0.5 h-8 ${
                          stop.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>

                    {/* Stop details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{stop.address}</h4>
                        <Badge className={`text-xs ${getPriorityColor(stop.priority)}`}>
                          {stop.priority}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(stop.status)}`}>
                          {stop.status}
                        </Badge>
                      </div>

                      {stop.doorOrFlat && (
                        <div className="text-sm text-gray-600">
                          📍 {stop.doorOrFlat}
                        </div>
                      )}

                      {stop.instructions && (
                        <div className="text-sm text-gray-600">
                          💬 {stop.instructions}
                        </div>
                      )}

                      {stop.contactInfo && (
                        <div className="text-sm text-gray-600">
                          📞 {stop.contactInfo}
                        </div>
                      )}

                      {/* Timing info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          <span>Wait: {stop.waitTime}min</span>
                        </div>
                        {stop.estimatedArrival && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>ETA: {stop.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {stop.actualArrival && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>Arrived: {stop.actualArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stop actions */}
                  {userRole === 'driver' && index === ride.currentStopIndex && (
                    <div className="flex flex-col gap-2">
                      {stop.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStopStatusUpdate(stop.id, 'approaching')}
                        >
                          Approaching
                        </Button>
                      )}
                      {stop.status === 'approaching' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStopStatusUpdate(stop.id, 'arrived')}
                        >
                          Arrived
                        </Button>
                      )}
                      {(stop.status === 'arrived' || stop.status === 'waiting') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStopStatusUpdate(stop.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSkipStop(stop.id)}
                          >
                            Skip
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Wait time adjustment for passengers */}
                  {userRole === 'passenger' && (stop.status === 'pending' || stop.status === 'approaching') && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleWaitTimeAdjustment(stop.id, -5)}
                        disabled={stop.waitTime <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm px-2">{stop.waitTime}m</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleWaitTimeAdjustment(stop.id, 5)}
                        disabled={stop.waitTime >= 120}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="w-5 h-5" />
            Journey Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Distance:</span>
                <span>{ride.totalDistance.toFixed(1)} miles</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Duration:</span>
                <span>{ride.totalDuration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Started:</span>
                <span>{ride.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Estimated Completion:</span>
                <span>{ride.estimatedCompletionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Fare:</span>
                <span>£{ride.estimatedFare.toFixed(2)}</span>
              </div>
              {ride.actualFare && (
                <div className="flex justify-between font-medium">
                  <span>Final Fare:</span>
                  <span>£{ride.actualFare.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency button */}
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onEmergency}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Emergency
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}