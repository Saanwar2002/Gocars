'use client';

import React, { useState } from 'react';
import { MobileOptimizedLayout, MobileBottomNavigation } from '@/components/mobile/MobileOptimizedLayout';
import { HapticFeedbackProvider } from '@/components/mobile/HapticFeedback';
import { QuickBookingWorkflow, QuickActionsPanel, SwipeableRideCard, MobileKeyboard, TouchOptimizedRating } from '@/components/mobile/MobileWorkflows';
import { MobileShortcuts, QuickActionFAB, ContextualShortcuts } from '@/components/mobile/MobileShortcuts';
import { TouchOptimizedButton } from '@/components/mobile/TouchOptimizedButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, MapPin, Clock, CreditCard, User, Star, 
  Home, Search, Bell, Settings, Phone, MessageCircle,
  Zap, TrendingUp, Shield, Heart
} from 'lucide-react';

export default function MobileDemoPage() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [activeBottomNav, setActiveBottomNav] = useState('home');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { id: 'rides', label: 'Rides', icon: <Car className="h-5 w-5" />, badge: '2' },
    { id: 'search', label: 'Search', icon: <Search className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ];

  const sampleRides = [
    {
      id: '1',
      destination: 'Airport Terminal 1',
      estimatedTime: '5 min',
      fare: '$18.50',
      status: 'Pending'
    },
    {
      id: '2',
      destination: 'Downtown Mall',
      estimatedTime: '3 min',
      fare: '$12.00',
      status: 'Confirmed'
    },
    {
      id: '3',
      destination: 'Business District',
      estimatedTime: '8 min',
      fare: '$25.00',
      status: 'Arriving'
    }
  ];

  return (
    <HapticFeedbackProvider>
      <MobileOptimizedLayout
        title="Mobile Demo"
        showBackButton={false}
        showMenuButton={true}
        showSearchButton={true}
        showNotificationButton={true}
        showUserButton={true}
        shortcuts={true}
        onSearch={() => console.log('Search pressed')}
        onNotifications={() => console.log('Notifications pressed')}
        onUserProfile={() => console.log('Profile pressed')}
        bottomNavigation={
          <MobileBottomNavigation
            items={bottomNavItems}
            activeItem={activeBottomNav}
            onItemPress={setActiveBottomNav}
          />
        }
      >
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 mx-4 mt-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-2">GoCars Mobile Experience</h1>
            <p className="text-blue-100">
              Optimized for touch interactions, gestures, and mobile workflows
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="gestures">Gestures</TabsTrigger>
                <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
              </TabsList>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="h-5 w-5" />
                      <span>Quick Booking Workflow</span>
                    </CardTitle>
                    <CardDescription>
                      Streamlined mobile booking experience with touch optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QuickBookingWorkflow 
                      onBookingComplete={(booking) => {
                        console.log('Booking completed:', booking);
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mobile Keyboard & Quick Replies</CardTitle>
                    <CardDescription>
                      Touch-optimized input with voice recording and quick replies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MobileKeyboard
                      placeholder="Type a message to your driver..."
                      onInput={(text) => {
                        setMessage(text);
                        console.log('Message sent:', text);
                      }}
                    />
                    {message && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">Last message: "{message}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Touch-Optimized Rating</CardTitle>
                    <CardDescription>
                      Large touch targets with haptic feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <TouchOptimizedRating
                        value={rating}
                        onChange={setRating}
                        size="large"
                      />
                      <p className="text-sm text-gray-600">
                        Current rating: {rating} star{rating !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gestures Tab */}
              <TabsContent value="gestures" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Swipeable Ride Cards</CardTitle>
                    <CardDescription>
                      Swipe left to cancel, right to accept rides
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sampleRides.map((ride) => (
                      <SwipeableRideCard
                        key={ride.id}
                        ride={ride}
                        onSwipeLeft={() => console.log('Cancelled ride:', ride.id)}
                        onSwipeRight={() => console.log('Accepted ride:', ride.id)}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gesture Instructions</CardTitle>
                    <CardDescription>
                      Available gestures in this demo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Pull to Refresh</span>
                        <Badge variant="outline">↓ Pull down</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Swipe Navigation</span>
                        <Badge variant="outline">← → Swipe</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Card Actions</span>
                        <Badge variant="outline">← → on cards</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Long Press</span>
                        <Badge variant="outline">Hold buttons</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shortcuts Tab */}
              <TabsContent value="shortcuts" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Grid Layout Shortcuts</CardTitle>
                    <CardDescription>
                      Quick access to common actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MobileShortcuts
                      layout="grid"
                      showLabels={true}
                      maxVisible={6}
                      onShortcutPress={(shortcut) => {
                        console.log('Shortcut pressed:', shortcut.label);
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contextual Shortcuts</CardTitle>
                    <CardDescription>
                      Context-aware quick actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Booking Context</h4>
                      <ContextualShortcuts context="booking" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Ride Context</h4>
                      <ContextualShortcuts context="ride" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Payment Context</h4>
                      <ContextualShortcuts context="payment" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components Tab */}
              <TabsContent value="components" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Touch-Optimized Buttons</CardTitle>
                    <CardDescription>
                      Various button styles with haptic feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <TouchOptimizedButton
                        className="h-12"
                        hapticFeedback={true}
                        rippleEffect={true}
                      >
                        Primary Action
                      </TouchOptimizedButton>
                      
                      <TouchOptimizedButton
                        variant="outline"
                        className="h-12"
                        hapticFeedback={true}
                        rippleEffect={true}
                      >
                        Secondary
                      </TouchOptimizedButton>
                      
                      <TouchOptimizedButton
                        variant="destructive"
                        className="h-12"
                        hapticFeedback={true}
                        rippleEffect={true}
                        longPressAction={() => console.log('Long press action!')}
                      >
                        Hold for Action
                      </TouchOptimizedButton>
                      
                      <TouchOptimizedButton
                        className="h-12 bg-green-600 hover:bg-green-700"
                        hapticFeedback={true}
                        rippleEffect={true}
                      >
                        Success Action
                      </TouchOptimizedButton>
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-4">
                      <p>• All buttons have optimal touch target sizes (44px minimum)</p>
                      <p>• Haptic feedback on supported devices</p>
                      <p>• Ripple effects for visual feedback</p>
                      <p>• Long press support where applicable</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mobile Features</CardTitle>
                    <CardDescription>
                      Device-specific optimizations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Haptic Feedback</p>
                            <p className="text-sm text-gray-600">Tactile responses for interactions</p>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Gesture Navigation</p>
                            <p className="text-sm text-gray-600">Swipe and touch gestures</p>
                          </div>
                        </div>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Touch Optimization</p>
                            <p className="text-sm text-gray-600">Optimized for mobile devices</p>
                          </div>
                        </div>
                        <Badge variant="outline">Optimized</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Demo Instructions */}
          <Card className="mx-4 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Try These Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• <strong>Pull down</strong> from the top to refresh</p>
                <p>• <strong>Swipe left/right</strong> on ride cards to interact</p>
                <p>• <strong>Long press</strong> buttons for additional actions</p>
                <p>• <strong>Tap shortcuts</strong> for quick access to features</p>
                <p>• <strong>Use the FAB</strong> (floating action button) for quick actions</p>
                <p>• <strong>Feel the haptic feedback</strong> on supported devices</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Button */}
        <QuickActionFAB />
      </MobileOptimizedLayout>
    </HapticFeedbackProvider>
  );
}