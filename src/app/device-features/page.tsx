'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DocumentScanner } from '@/components/camera/DocumentScanner';
import { LocationServices } from '@/components/location/LocationServices';
import { useDeviceStorage } from '@/hooks/useDeviceStorage';
import { usePWA } from '@/hooks/usePWA';
import { 
  Camera, MapPin, Database, Bell, Smartphone, Settings,
  CheckCircle, AlertCircle, Zap, Shield, Download, Trash2,
  RefreshCw, Eye, Upload, FileText
} from 'lucide-react';

export default function DeviceFeaturesPage() {
  const [activeScanner, setActiveScanner] = useState<string | null>(null);
  const [capturedDocuments, setCapturedDocuments] = useState<Array<{
    type: string;
    dataUrl: string;
    timestamp: number;
  }>>([]);

  const {
    quota,
    caches,
    localStorageSize,
    sessionStorageSize,
    isLoading: storageLoading,
    refreshStorageInfo,
    clearCache,
    clearLocalStorage,
    optimizeStorage,
    formatBytes
  } = useDeviceStorage();

  const {
    requestNotificationPermission,
    showNotification
  } = usePWA();

  const handleDocumentCapture = (type: string) => (capture: any) => {
    setCapturedDocuments(prev => [...prev, {
      type,
      dataUrl: capture.dataUrl,
      timestamp: capture.timestamp
    }]);
  };

  const handleTestNotification = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await showNotification('GoCars Device Features', {
        body: 'Push notifications are working correctly!',
        icon: '/images/brand/android-chrome-192x192.png',
        badge: '/images/brand/android-chrome-192x192.png'
      });
    }
  };

  const handleOptimizeStorage = async () => {
    const result = await optimizeStorage();
    if (result.success) {
      await showNotification('Storage Optimized', {
        body: `Freed ${formatBytes(result.freedSpace)} of storage space`,
        icon: '/images/brand/android-chrome-192x192.png'
      });
    }
  };

  const deviceFeatures = [
    {
      id: 'camera',
      title: 'Camera Access',
      description: 'Document scanning and photo capture',
      icon: <Camera className="h-6 w-6 text-blue-600" />,
      status: 'available',
      capabilities: [
        'Document scanning with auto-detection',
        'Multiple camera support (front/back)',
        'Flash control and zoom functionality',
        'High-quality image capture',
        'Real-time preview and guides'
      ]
    },
    {
      id: 'location',
      title: 'GPS & Location',
      description: 'Precise location tracking and services',
      icon: <MapPin className="h-6 w-6 text-green-600" />,
      status: 'available',
      capabilities: [
        'High-accuracy GPS positioning',
        'Real-time location tracking',
        'Background location updates',
        'Geofencing and proximity alerts',
        'Location history and analytics'
      ]
    },
    {
      id: 'storage',
      title: 'Device Storage',
      description: 'Optimized caching and data management',
      icon: <Database className="h-6 w-6 text-purple-600" />,
      status: 'active',
      capabilities: [
        'Intelligent cache management',
        'Offline data synchronization',
        'Storage quota monitoring',
        'Automatic cleanup and optimization',
        'Persistent storage support'
      ]
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Real-time updates and alerts',
      icon: <Bell className="h-6 w-6 text-orange-600" />,
      status: 'available',
      capabilities: [
        'Rich push notifications',
        'Background message handling',
        'Action buttons and interactions',
        'Notification grouping and management',
        'Custom notification sounds'
      ]
    }
  ];

  const documentTypes = [
    { id: 'license', name: 'Driver\'s License', icon: <FileText className="h-5 w-5" /> },
    { id: 'insurance', name: 'Insurance Card', icon: <Shield className="h-5 w-5" /> },
    { id: 'registration', name: 'Vehicle Registration', icon: <FileText className="h-5 w-5" /> },
    { id: 'id', name: 'ID Document', icon: <FileText className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Native Device Features
              </h1>
              <p className="text-xl text-gray-600">
                Enhanced mobile experience with native device integration
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Task 9.1.2 Implementation
            </Badge>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {deviceFeatures.map((feature) => (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {feature.icon}
                  </div>
                  <Badge 
                    variant={feature.status === 'active' ? 'default' : 'secondary'}
                    className={feature.status === 'active' ? 'bg-green-600' : ''}
                  >
                    {feature.status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {feature.capabilities.slice(0, 3).map((capability, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{capability}</span>
                    </li>
                  ))}
                  {feature.capabilities.length > 3 && (
                    <li className="text-gray-500">
                      +{feature.capabilities.length - 3} more features
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="camera" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-6">
            {activeScanner ? (
              <DocumentScanner
                documentType={activeScanner as any}
                onCapture={handleDocumentCapture(activeScanner)}
                onClose={() => setActiveScanner(null)}
                maxCaptures={5}
              />
            ) : (
              <>
                {/* Document Scanner Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Camera className="h-5 w-5" />
                      <span>Document Scanner</span>
                    </CardTitle>
                    <CardDescription>
                      Scan important documents using your device camera
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {documentTypes.map((type) => (
                        <Button
                          key={type.id}
                          variant="outline"
                          className="h-20 flex-col space-y-2"
                          onClick={() => setActiveScanner(type.id)}
                        >
                          {type.icon}
                          <span className="text-sm">{type.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Captured Documents */}
                {capturedDocuments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Captured Documents</CardTitle>
                      <CardDescription>
                        Recently scanned documents ({capturedDocuments.length} items)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {capturedDocuments.map((doc, index) => (
                          <div key={index} className="relative group">
                            <div className="border rounded-lg overflow-hidden">
                              <img
                                src={doc.dataUrl}
                                alt={`${doc.type} scan`}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2">
                                <p className="text-sm font-medium capitalize">{doc.type}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(doc.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <LocationServices
              onLocationUpdate={(position) => {
                console.log('Location updated:', position);
              }}
              showMap={true}
              enableTracking={false}
            />
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            {/* Storage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Device Storage Management</span>
                </CardTitle>
                <CardDescription>
                  Monitor and optimize your device storage usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Storage Quota */}
                {quota && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Storage Usage</span>
                      <span className="text-sm text-gray-600">
                        {formatBytes(quota.usage)} / {formatBytes(quota.quota)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {quota.percentage.toFixed(1)}% used • {formatBytes(quota.available)} available
                    </p>
                  </div>
                )}

                {/* Storage Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Cache Storage</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {caches.reduce((total, cache) => total + cache.size, 0) > 0 
                        ? formatBytes(caches.reduce((total, cache) => total + cache.size, 0))
                        : '0 Bytes'
                      }
                    </p>
                    <p className="text-sm text-gray-600">{caches.length} cache(s)</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Settings className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Local Storage</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBytes(localStorageSize)}
                    </p>
                    <p className="text-sm text-gray-600">App settings & data</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Session Storage</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatBytes(sessionStorageSize)}
                    </p>
                    <p className="text-sm text-gray-600">Temporary data</p>
                  </div>
                </div>

                {/* Cache Details */}
                {caches.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Cache Details</h4>
                    <div className="space-y-2">
                      {caches.map((cache, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{cache.name}</p>
                            <p className="text-sm text-gray-600">
                              {cache.itemCount} items • {formatBytes(cache.size)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearCache(cache.name)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Actions */}
                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <Button
                    onClick={refreshStorageInfo}
                    disabled={storageLoading}
                    variant="outline"
                  >
                    {storageLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>

                  <Button
                    onClick={handleOptimizeStorage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Storage
                  </Button>

                  <Button
                    onClick={() => clearCache()}
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Caches
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Push Notifications</span>
                </CardTitle>
                <CardDescription>
                  Configure and test push notification functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {Notification.permission === 'granted' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Notification Permission</p>
                      <p className="text-sm text-gray-600">
                        Status: {Notification.permission}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={Notification.permission === 'granted' ? 'default' : 'secondary'}
                    className={Notification.permission === 'granted' ? 'bg-green-600' : ''}
                  >
                    {Notification.permission.toUpperCase()}
                  </Badge>
                </div>

                {/* Notification Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Notification Types</h4>
                    
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Ride status updates</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Driver arrival notifications</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Payment confirmations</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Promotional offers</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Advanced Features</h4>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Rich notifications with images</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Action buttons and quick replies</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Background notification handling</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Notification grouping and management</span>
                    </div>
                  </div>
                </div>

                {/* Test Notifications */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Test Notifications</h4>
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleTestNotification}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                    
                    <Button
                      onClick={async () => {
                        const permission = await requestNotificationPermission();
                        if (permission === 'granted') {
                          await showNotification('Ride Update', {
                            body: 'Your driver will arrive in 3 minutes',
                            icon: '/images/brand/android-chrome-192x192.png',
                            actions: [
                              { action: 'view', title: 'View Details' },
                              { action: 'cancel', title: 'Cancel Ride' }
                            ]
                          });
                        }
                      }}
                      variant="outline"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Test Ride Notification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Task 9.1.2 Implementation Status</span>
            </CardTitle>
            <CardDescription>
              Native device feature integration implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Completed Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Camera access for document scanning</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>GPS and location services optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Push notification support with rich features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Device storage and caching optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Multi-camera support with flash and zoom</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Real-time location tracking and monitoring</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">🔧 Technical Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Advanced camera API with device capabilities detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>High-accuracy geolocation with background tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Intelligent storage management and optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Rich push notifications with action buttons</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Document scanning with auto-detection guides</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Comprehensive device feature integration</span>
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