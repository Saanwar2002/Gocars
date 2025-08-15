'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  WifiOff, RefreshCw, Smartphone, Cloud, CheckCircle, 
  AlertCircle, Clock, Zap, Download, Settings
} from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache' 
      });
      
      if (response.ok) {
        // Redirect to home page if connection is restored
        window.location.href = '/';
      }
    } catch (error) {
      console.log('Still offline, retry failed');
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <WifiOff className="h-12 w-12 text-gray-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-lg text-gray-600">
            Don't worry! GoCars works offline too.
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Connection Status</span>
            </CardTitle>
            <CardDescription>
              {isOnline 
                ? 'Connection restored! You can now access all features.'
                : 'No internet connection detected. Some features may be limited.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
                {lastSync && (
                  <span className="text-sm text-gray-500">
                    Last sync: {lastSync.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <Button 
                onClick={handleRetry}
                variant="outline"
                disabled={isOnline}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
            {retryCount > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                Retry attempts: {retryCount}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Available Offline Features</span>
            </CardTitle>
            <CardDescription>
              These features work even without an internet connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">View Ride History</p>
                  <p className="text-sm text-gray-600">Access your past bookings</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Saved Locations</p>
                  <p className="text-sm text-gray-600">View favorite addresses</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Profile Settings</p>
                  <p className="text-sm text-gray-600">Update your preferences</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Cached Content</p>
                  <p className="text-sm text-gray-600">Previously loaded data</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limited Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="h-5 w-5" />
              <span>Requires Internet Connection</span>
            </CardTitle>
            <CardDescription>
              These features will be available when you're back online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Book New Rides</p>
                  <p className="text-sm text-gray-600">Real-time booking system</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Live Tracking</p>
                  <p className="text-sm text-gray-600">Real-time location updates</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Chat Messages</p>
                  <p className="text-sm text-gray-600">Communication with drivers</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Payment Processing</p>
                  <p className="text-sm text-gray-600">Secure payment transactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Sync Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Background Sync Active</AlertTitle>
          <AlertDescription>
            Any actions you take while offline will be automatically synced when your connection is restored. 
            Your data is safe and will be processed as soon as you're back online.
          </AlertDescription>
        </Alert>

        {/* PWA Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Progressive Web App Features</span>
            </CardTitle>
            <CardDescription>
              GoCars is designed to work seamlessly offline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Install GoCars</p>
                    <p className="text-sm text-gray-600">Add to your home screen for quick access</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Install
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Offline Settings</p>
                    <p className="text-sm text-gray-600">Configure offline behavior</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleGoHome}
            className="flex-1"
            variant={isOnline ? "default" : "outline"}
          >
            {isOnline ? 'Go to GoCars' : 'Browse Offline'}
          </Button>
          
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Connection
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>GoCars PWA • Offline-First Design</p>
          <p className="mt-1">Your journey continues, even offline</p>
        </div>
      </div>
    </div>
  );
}