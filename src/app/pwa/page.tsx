'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { PWAStatus } from '@/components/pwa/PWAStatus';
import { usePWA } from '@/hooks/usePWA';
import { 
  Smartphone, Download, Settings, Bell, Wifi, Database,
  Zap, Shield, Clock, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';

export default function PWAPage() {
  const { 
    isInstallable, 
    isInstalled, 
    isOnline, 
    isStandalone,
    requestNotificationPermission,
    enableBackgroundSync,
    registerServiceWorker
  } = usePWA();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Register service worker
    registerServiceWorker();
  }, [registerServiceWorker]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
    }
  };

  const handleBackgroundSyncToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableBackgroundSync('general-sync');
      setBackgroundSyncEnabled(success);
    } else {
      setBackgroundSyncEnabled(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      title: 'Lightning Fast Performance',
      description: 'Instant loading with advanced caching strategies',
      status: 'active'
    },
    {
      icon: <Wifi className="h-6 w-6 text-green-600" />,
      title: 'Offline Functionality',
      description: 'Full app functionality even without internet',
      status: 'active'
    },
    {
      icon: <Bell className="h-6 w-6 text-purple-600" />,
      title: 'Push Notifications',
      description: 'Real-time updates about your rides and bookings',
      status: notificationPermission === 'granted' ? 'active' : 'available'
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      title: 'Background Sync',
      description: 'Automatic data synchronization when online',
      status: 'active'
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600" />,
      title: 'Secure & Private',
      description: 'All data encrypted and stored securely',
      status: 'active'
    },
    {
      icon: <Database className="h-6 w-6 text-indigo-600" />,
      title: 'Local Storage',
      description: 'Your data available instantly, even offline',
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Progressive Web App
              </h1>
              <p className="text-xl text-gray-600">
                Transform your GoCars experience with PWA features
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Task 9.1.1 Implementation
              </Badge>
              {isInstallable && (
                <Button 
                  onClick={() => setShowInstallPrompt(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Install Prompt */}
        {showInstallPrompt && (
          <div className="mb-8">
            <PWAInstallPrompt 
              variant="card"
              onClose={() => setShowInstallPrompt(false)}
              showOnlyIfInstallable={false}
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* PWA Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-6 w-6" />
                  <span>Why Use GoCars as a PWA?</span>
                </CardTitle>
                <CardDescription>
                  Progressive Web Apps provide the best of both web and mobile experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{feature.title}</h4>
                          <Badge 
                            variant={feature.status === 'active' ? 'default' : 'secondary'}
                            className={feature.status === 'active' ? 'bg-green-600' : ''}
                          >
                            {feature.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Installation Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Installation Guide</CardTitle>
                <CardDescription>
                  How to install GoCars on different devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Smartphone className="h-5 w-5" />
                      <span>Mobile Devices</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                        <p>Open GoCars in your mobile browser (Chrome, Safari, Firefox)</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                        <p>Look for the "Install" or "Add to Home Screen" prompt</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                        <p>Tap "Install" or "Add" to install the app</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                        <p>Find the GoCars icon on your home screen</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Desktop</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                        <p>Open GoCars in Chrome, Edge, or another supported browser</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                        <p>Click the install icon in the address bar</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                        <p>Click "Install" in the popup dialog</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                        <p>Launch GoCars from your desktop or start menu</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            {/* Feature Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <span>Offline Functionality</span>
                  </CardTitle>
                  <CardDescription>
                    Full app functionality without internet connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">View ride history and saved locations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Access profile and settings</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Queue bookings for when online</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Cached content and data</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Background Sync</span>
                  </CardTitle>
                  <CardDescription>
                    Automatic data synchronization when connection returns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Sync pending bookings automatically</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Upload location updates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Send queued messages</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Update user preferences</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-purple-600" />
                    <span>Push Notifications</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time updates even when app is closed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Ride status updates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Driver arrival notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Payment confirmations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Promotional offers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span>Performance</span>
                  </CardTitle>
                  <CardDescription>
                    Optimized for speed and efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Instant loading with caching</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Reduced data usage</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Battery optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Smooth animations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>PWA Settings</CardTitle>
                <CardDescription>
                  Configure your Progressive Web App experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive real-time updates about your rides
                    </p>
                  </div>
                  <Switch
                    checked={notificationPermission === 'granted'}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Background Sync</Label>
                    <p className="text-sm text-gray-600">
                      Automatically sync data when connection is restored
                    </p>
                  </div>
                  <Switch
                    checked={backgroundSyncEnabled}
                    onCheckedChange={handleBackgroundSyncToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Offline Mode</Label>
                    <p className="text-sm text-gray-600">
                      Enable offline functionality and data caching
                    </p>
                  </div>
                  <Switch
                    checked={offlineMode}
                    onCheckedChange={setOfflineMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Sync</Label>
                    <p className="text-sm text-gray-600">
                      Automatically sync when app becomes active
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <PWAStatus />
          </TabsContent>
        </Tabs>

        {/* Implementation Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Task 9.1.1 Implementation Status</span>
            </CardTitle>
            <CardDescription>
              Progressive Web App capabilities implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Completed Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Service worker for offline functionality</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>App installation prompts and onboarding</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Offline data synchronization with IndexedDB</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Background sync for critical operations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Push notification support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Comprehensive caching strategies</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">🔧 Technical Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Advanced service worker with multiple caching strategies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>IndexedDB-based offline storage system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>React hooks for PWA functionality</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Background sync with automatic retry logic</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Comprehensive PWA status monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Cross-platform installation support</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}