"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Car,
  Route,
  MapPin,
  Clock,
  Users,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { LocationPoint } from '@/types';
import EnhancedMultiStopInterface from './enhanced-multi-stop-interface';

interface EnhancedBookingPageProps {
  initialPickupLocation?: string;
  initialDropoffLocation?: string;
  initialPickupCoords?: LocationPoint;
  initialDropoffCoords?: LocationPoint;
}

export default function EnhancedBookingPage({
  initialPickupLocation = '',
  initialDropoffLocation = '',
  initialPickupCoords,
  initialDropoffCoords,
}: EnhancedBookingPageProps) {
  const { toast } = useToast();
  const { user, phoneVerificationRequired } = useAuth();
  const [bookingMode, setBookingMode] = useState<'simple' | 'multi-stop'>('simple');
  const [multiStopData, setMultiStopData] = useState<any>(null);

  // Handle booking mode change
  const handleBookingModeChange = (mode: 'simple' | 'multi-stop') => {
    setBookingMode(mode);
    
    if (mode === 'multi-stop') {
      toast({
        title: "Multi-Stop Mode Activated",
        description: "You can now add multiple stops to your journey with route optimization",
      });
    } else {
      toast({
        title: "Simple Booking Mode",
        description: "Standard point-to-point booking",
      });
    }
  };

  // Handle multi-stop data changes
  const handleMultiStopChange = (data: any) => {
    setMultiStopData(data);
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      if (bookingMode === 'multi-stop') {
        // Handle multi-stop booking
        console.log('Multi-stop booking data:', multiStopData);
        toast({
          title: "Multi-Stop Booking Submitted",
          description: "Your multi-stop journey has been submitted for processing",
        });
      } else {
        // Handle simple booking (existing logic)
        toast({
          title: "Booking Submitted",
          description: "Your ride has been booked successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (phoneVerificationRequired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Phone Verification Required:</strong> You must verify your phone number to book a ride.
            </div>
            <Button variant="outline" size="sm">
              Verify Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Car className="w-8 h-8 text-primary" />
                Book Your Ride
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Choose between simple booking or create a multi-stop journey with route optimization
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Enhanced Booking
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Booking mode selector */}
          <Tabs value={bookingMode} onValueChange={handleBookingModeChange as any}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Simple Booking
              </TabsTrigger>
              <TabsTrigger value="multi-stop" className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                Multi-Stop Journey
              </TabsTrigger>
            </TabsList>

            {/* Simple booking tab */}
            <TabsContent value="simple" className="mt-6">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Simple Booking:</strong> Direct point-to-point journey with standard features.
                    For the full simple booking experience, please use the main booking page.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Direct Route</div>
                      <div className="text-sm text-gray-600">Pickup to dropoff</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Quick Booking</div>
                      <div className="text-sm text-gray-600">Fast and simple</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Standard Features</div>
                      <div className="text-sm text-gray-600">All basic options</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/dashboard/book-ride'}
                  className="w-full"
                  size="lg"
                >
                  Go to Simple Booking
                </Button>
              </div>
            </TabsContent>

            {/* Multi-stop booking tab */}
            <TabsContent value="multi-stop" className="mt-6">
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Multi-Stop Journey:</strong> Add multiple destinations with intelligent route optimization,
                    priority settings, and advanced scheduling options.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Smart Routing</div>
                      <div className="text-sm text-gray-600">AI-optimized paths</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">Route Optimization</div>
                      <div className="text-sm text-gray-600">Save time & money</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Advanced Scheduling</div>
                      <div className="text-sm text-gray-600">Wait times & priorities</div>
                    </div>
                  </div>
                </div>

                {/* Multi-stop interface */}
                <EnhancedMultiStopInterface
                  onBookingChange={handleMultiStopChange}
                  pickupLocation={initialPickupLocation}
                  dropoffLocation={initialDropoffLocation}
                  pickupCoords={initialPickupCoords}
                  dropoffCoords={initialDropoffCoords}
                  initialData={{
                    pickupLocation: initialPickupLocation,
                    dropoffLocation: initialDropoffLocation,
                    pickupCoords: initialPickupCoords,
                    dropoffCoords: initialDropoffCoords,
                  }}
                />

                {/* Booking action */}
                {multiStopData && multiStopData.stops && multiStopData.stops.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-green-800">Ready to Book</h3>
                          <p className="text-sm text-green-600">
                            {multiStopData.stops.length} stops • Estimated £{multiStopData.fareBreakdown?.totalFare?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <Button 
                          onClick={handleBookingSubmit}
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          Book Multi-Stop Journey
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Booking Options Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simple booking features */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Simple Booking
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Direct pickup to dropoff
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Quick booking process
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Standard scheduling options
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Basic vehicle preferences
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Voice input support
                </li>
              </ul>
            </div>

            {/* Multi-stop features */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Route className="w-4 h-4 text-green-600" />
                Multi-Stop Journey
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Multiple destinations with drag-and-drop ordering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  AI-powered route optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Individual stop priorities and wait times
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Special instructions per stop
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Real-time fare calculations with savings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Advanced scheduling and contact management
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}