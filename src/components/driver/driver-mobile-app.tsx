'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Navigation, 
  DollarSign, 
  Clock, 
  Star,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  User,
  Settings,
  Menu,
  Bell,
  Zap,
  TrendingUp,
  Target,
  Award,
  Calendar,
  BarChart3,
  Route,
  Fuel,
  Shield,
  Heart
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Types and Interfaces
interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerRating: number;
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedFare: number;
  estimatedDuration: number;
  distance: number;
  requestedAt: Date;
  specialRequirements?: string[];
  rideType: 'standard' | 'premium' | 'shared';
}

interface ActiveRide {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: 'accepted' | 'en_route_pickup' | 'arrived_pickup' | 'passenger_onboard' | 'en_route_dropoff';
  fare: number;
  startTime: Date;
  estimatedArrival?: Date;
  actualPickupTime?: Date;
}

interface DriverEarnings {
  today: {
    total: number;
    rides: number;
    hours: number;
    averagePerRide: number;
  };
  week: {
    total: number;
    rides: number;
    hours: number;
    target: number;
  };
  month: {
    total: number;
    rides: number;
    hours: number;
    target: number;
  };
  lastRide: {
    fare: number;
    tip: number;
    total: number;
    completedAt: Date;
  };
}

interface DriverStatus {
  isOnline: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  batteryLevel: number;
  connectionStrength: 'excellent' | 'good' | 'fair' | 'poor';
  workingHours: {
    startTime: Date;
    totalHours: number;
    breakTime: number;
  };
}

export default function DriverMobileApp() {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>({
    isOnline: false,
    currentLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY'
    },
    batteryLevel: 85,
    connectionStrength: 'excellent',
    workingHours: {
      startTime: new Date(),
      totalHours: 0,
      breakTime: 0
    }
  });

  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [earnings, setEarnings] = useState<DriverEarnings>({
    today: { total: 245.50, rides: 12, hours: 8.5, averagePerRide: 20.46 },
    week: { total: 1234.75, rides: 58, hours: 42, target: 1500 },
    month: { total: 4567.25, rides: 234, hours: 168, target: 6000 },
    lastRide: { fare: 28.50, tip: 5.50, total: 34.00, completedAt: new Date(Date.now() - 15 * 60 * 1000) }
  });

  const [showIncomingRequest, setShowIncomingRequest] = useState(false);
  const [requestTimer, setRequestTimer] = useState(15);
  const [activeTab, setActiveTab] = useState('home');

  // Mock incoming ride request
  useEffect(() => {
    if (driverStatus.isOnline && !activeRide && !incomingRequest) {
      const timer = setTimeout(() => {
        const mockRequest: RideRequest = {
          id: 'ride-' + Date.now(),
          passengerId: 'passenger-001',
          passengerName: 'Sarah Johnson',
          passengerRating: 4.8,
          pickupLocation: {
            address: '456 Broadway, New York, NY',
            latitude: 40.7589,
            longitude: -73.9851
          },
          dropoffLocation: {
            address: '789 5th Ave, New York, NY',
            latitude: 40.7614,
            longitude: -73.9776
          },
          estimatedFare: 24.50,
          estimatedDuration: 18,
          distance: 3.2,
          requestedAt: new Date(),
          rideType: 'standard'
        };
        setIncomingRequest(mockRequest);
        setShowIncomingRequest(true);
        setRequestTimer(15);
      }, Math.random() * 30000 + 10000); // Random between 10-40 seconds

      return () => clearTimeout(timer);
    }
  }, [driverStatus.isOnline, activeRide, incomingRequest]);

  // Request timer countdown
  useEffect(() => {
    if (showIncomingRequest && requestTimer > 0) {
      const timer = setTimeout(() => setRequestTimer(requestTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (requestTimer === 0) {
      handleDeclineRequest();
    }
  }, [showIncomingRequest, requestTimer]);

  const toggleOnlineStatus = () => {
    setDriverStatus(prev => ({
      ...prev,
      isOnline: !prev.isOnline,
      workingHours: {
        ...prev.workingHours,
        startTime: !prev.isOnline ? new Date() : prev.workingHours.startTime
      }
    }));
  };

  const handleAcceptRequest = () => {
    if (incomingRequest) {
      const newActiveRide: ActiveRide = {
        id: incomingRequest.id,
        passengerId: incomingRequest.passengerId,
        passengerName: incomingRequest.passengerName,
        passengerPhone: '+1 (555) 123-4567',
        pickupLocation: incomingRequest.pickupLocation,
        dropoffLocation: incomingRequest.dropoffLocation,
        status: 'accepted',
        fare: incomingRequest.estimatedFare,
        startTime: new Date()
      };
      
      setActiveRide(newActiveRide);
      setIncomingRequest(null);
      setShowIncomingRequest(false);
    }
  };

  const handleDeclineRequest = () => {
    setIncomingRequest(null);
    setShowIncomingRequest(false);
    setRequestTimer(15);
  };

  const updateRideStatus = (newStatus: ActiveRide['status']) => {
    if (activeRide) {
      setActiveRide(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const completeRide = () => {
    if (activeRide) {
      // Update earnings
      setEarnings(prev => ({
        ...prev,
        today: {
          ...prev.today,
          total: prev.today.total + activeRide.fare,
          rides: prev.today.rides + 1
        },
        lastRide: {
          fare: activeRide.fare,
          tip: Math.random() * 10, // Random tip
          total: activeRide.fare + Math.random() * 10,
          completedAt: new Date()
        }
      }));
      
      setActiveRide(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">John Driver</div>
              <div className="text-sm opacity-90">Driver ID: #12345</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                driverStatus.connectionStrength === 'excellent' ? 'bg-green-400' :
                driverStatus.connectionStrength === 'good' ? 'bg-yellow-400' :
                driverStatus.connectionStrength === 'fair' ? 'bg-orange-400' : 'bg-red-400'
              }`} />
              <span>{driverStatus.batteryLevel}%</span>
            </div>
            <Bell className="h-5 w-5" />
            <Menu className="h-5 w-5" />
          </div>
        </div>
        
        {/* Online/Offline Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${driverStatus.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {driverStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <Button
            onClick={toggleOnlineStatus}
            variant={driverStatus.isOnline ? 'secondary' : 'default'}
            size="sm"
            className={driverStatus.isOnline ? 'bg-white/20 hover:bg-white/30' : 'bg-green-500 hover:bg-green-600'}
          >
            {driverStatus.isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>

      {/* Active Ride Status */}
      {activeRide && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-green-100 text-green-800">
              {activeRide.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-sm font-medium">${activeRide.fare.toFixed(2)}</span>
          </div>
          
          <div className="text-sm">
            <div className="font-medium">{activeRide.passengerName}</div>
            <div className="text-gray-600">
              {activeRide.status === 'accepted' || activeRide.status === 'en_route_pickup' 
                ? `Pickup: ${activeRide.pickupLocation.address}`
                : `Dropoff: ${activeRide.dropoffLocation.address}`
              }
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="navigation">Navigate</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
        </div>

        {/* Home Tab */}
        <TabsContent value="home" className="p-4 space-y-4">
          {!driverStatus.isOnline ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">You're Offline</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Go online to start receiving ride requests
                </p>
                <Button onClick={toggleOnlineStatus} className="w-full">
                  Go Online
                </Button>
              </CardContent>
            </Card>
          ) : !activeRide ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-pulse">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Looking for Rides</h3>
                <p className="text-sm text-gray-600">
                  Stay in a busy area to receive more requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <RideManagementCard 
              ride={activeRide} 
              onUpdateStatus={updateRideStatus}
              onCompleteRide={completeRide}
            />
          )}

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${earnings.today.total}</div>
                  <div className="text-sm text-gray-600">Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{earnings.today.rides}</div>
                  <div className="text-sm text-gray-600">Rides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{earnings.today.hours}h</div>
                  <div className="text-sm text-gray-600">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">${earnings.today.averagePerRide}</div>
                  <div className="text-sm text-gray-600">Per Ride</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-sm">Settings</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <MessageSquare className="h-5 w-5 mb-1" />
              <span className="text-sm">Support</span>
            </Button>
          </div>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="p-4 space-y-4">
          <EarningsTracker earnings={earnings} />
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="p-4 space-y-4">
          <NavigationInterface 
            currentLocation={driverStatus.currentLocation}
            activeRide={activeRide}
          />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="p-4 space-y-4">
          <DriverProfileView />
        </TabsContent>
      </Tabs>

      {/* Incoming Request Dialog */}
      <Dialog open={showIncomingRequest} onOpenChange={setShowIncomingRequest}>
        <DialogContent className="max-w-sm mx-auto">
          {incomingRequest && (
            <IncomingRequestDialog
              request={incomingRequest}
              timeRemaining={requestTimer}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ride Management Card Component
function RideManagementCard({ 
  ride, 
  onUpdateStatus, 
  onCompleteRide 
}: { 
  ride: ActiveRide; 
  onUpdateStatus: (status: ActiveRide['status']) => void;
  onCompleteRide: () => void;
}) {
  const getNextAction = () => {
    switch (ride.status) {
      case 'accepted':
        return { label: 'Start Trip to Pickup', action: () => onUpdateStatus('en_route_pickup') };
      case 'en_route_pickup':
        return { label: 'Arrived at Pickup', action: () => onUpdateStatus('arrived_pickup') };
      case 'arrived_pickup':
        return { label: 'Passenger On Board', action: () => onUpdateStatus('passenger_onboard') };
      case 'passenger_onboard':
        return { label: 'Start Trip to Destination', action: () => onUpdateStatus('en_route_dropoff') };
      case 'en_route_dropoff':
        return { label: 'Complete Ride', action: onCompleteRide };
      default:
        return { label: 'Continue', action: () => {} };
    }
  };

  const nextAction = getNextAction();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Ride</span>
          <Badge variant="outline">${ride.fare.toFixed(2)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-medium">{ride.passengerName}</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            4.8 • {ride.passengerPhone}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Pickup</div>
              <div className="text-gray-600">{ride.pickupLocation.address}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Destination</div>
              <div className="text-gray-600">{ride.dropoffLocation.address}</div>
            </div>
          </div>
        </div>

        <Button onClick={nextAction.action} className="w-full">
          {nextAction.label}
        </Button>
      </CardContent>
    </Card>
  );
}

// Incoming Request Dialog Component
function IncomingRequestDialog({ 
  request, 
  timeRemaining, 
  onAccept, 
  onDecline 
}: {
  request: RideRequest;
  timeRemaining: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>New Ride Request</span>
          <div className="text-lg font-bold text-red-600">{timeRemaining}s</div>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{request.passengerName}</div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {request.passengerRating}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">${request.estimatedFare}</div>
            <div className="text-sm text-gray-600">{request.estimatedDuration}min</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Pickup</div>
              <div className="text-gray-600">{request.pickupLocation.address}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Destination</div>
              <div className="text-gray-600">{request.dropoffLocation.address}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{request.distance} miles</span>
          <span>{request.rideType}</span>
        </div>
      </div>

      <DialogFooter className="flex gap-2">
        <Button variant="outline" onClick={onDecline} className="flex-1">
          <XCircle className="h-4 w-4 mr-2" />
          Decline
        </Button>
        <Button onClick={onAccept} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Accept
        </Button>
      </DialogFooter>
    </>
  );
}

// Earnings Tracker Component
function EarningsTracker({ earnings }: { earnings: DriverEarnings }) {
  return (
    <div className="space-y-4">
      {/* Last Ride */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Last Ride</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${earnings.lastRide.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Fare: ${earnings.lastRide.fare} + Tip: ${earnings.lastRide.tip.toFixed(2)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {earnings.lastRide.completedAt.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Earnings</span>
              <span className="font-medium">${earnings.week.total} / ${earnings.week.target}</span>
            </div>
            <Progress value={(earnings.week.total / earnings.week.target) * 100} />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{earnings.week.rides}</div>
                <div className="text-gray-600">Rides</div>
              </div>
              <div>
                <div className="font-medium">{earnings.week.hours}h</div>
                <div className="text-gray-600">Hours</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Target Progress</span>
              <span className="font-medium">${earnings.month.total} / ${earnings.month.target}</span>
            </div>
            <Progress value={(earnings.month.total / earnings.month.target) * 100} />
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{earnings.month.rides}</div>
                <div className="text-gray-600">Rides</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{earnings.month.hours}h</div>
                <div className="text-gray-600">Hours</div>
              </div>
              <div className="text-center">
                <div className="font-medium">${(earnings.month.total / earnings.month.rides).toFixed(2)}</div>
                <div className="text-gray-600">Per Ride</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Peak Hours</div>
                <div className="text-xs text-gray-600">
                  Drive during 7-9 AM and 5-7 PM for higher earnings
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Hot Spots</div>
                <div className="text-xs text-gray-600">
                  Position near airports and business districts
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Navigation Interface Component
function NavigationInterface({ 
  currentLocation, 
  activeRide 
}: { 
  currentLocation: any; 
  activeRide: ActiveRide | null;
}) {
  return (
    <div className="space-y-4">
      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">{currentLocation.address}</div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      {activeRide ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Navigation className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {activeRide.status === 'accepted' || activeRide.status === 'en_route_pickup' 
                    ? 'Navigate to Pickup' 
                    : 'Navigate to Destination'
                  }
                </div>
                <div className="text-xs text-gray-600">
                  {activeRide.status === 'accepted' || activeRide.status === 'en_route_pickup'
                    ? activeRide.pickupLocation.address
                    : activeRide.dropoffLocation.address
                  }
                </div>
              </div>
              <Button size="sm">
                <Route className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold mb-2">No Active Navigation</h3>
            <p className="text-sm text-gray-600">
              Accept a ride to start navigation
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation Options */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-16 flex-col">
          <Fuel className="h-5 w-5 mb-1" />
          <span className="text-sm">Gas Stations</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col">
          <Car className="h-5 w-5 mb-1" />
          <span className="text-sm">Parking</span>
        </Button>
      </div>
    </div>
  );
}

// Driver Profile View Component
function DriverProfileView() {
  return (
    <div className="space-y-4">
      {/* Profile Summary */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg">John Driver</h3>
          <p className="text-gray-600">Driver since March 2023</p>
          
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">4.9</span>
            <span className="text-gray-600 text-sm">(1,234 rides)</span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Acceptance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2.1%</div>
              <div className="text-sm text-gray-600">Cancellation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">45s</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-sm">Top Performer</div>
                <div className="text-xs text-gray-600">Maintained 4.9+ rating for 3 months</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Safety Champion</div>
                <div className="text-xs text-gray-600">Zero safety incidents this year</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Heart className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Customer Favorite</div>
                <div className="text-xs text-gray-600">500+ five-star ratings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Settings */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-16 flex-col">
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-sm">Settings</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col">
          <MessageSquare className="h-5 w-5 mb-1" />
          <span className="text-sm">Support</span>
        </Button>
      </div>
    </div>
  );
}