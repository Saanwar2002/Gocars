'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePWA } from '@/hooks/usePWA';
import { offlineStorage } from '@/lib/offlineStorage';
import { 
  Wifi, WifiOff, Download, Bell, Smartphone, Database,
  CheckCircle, AlertCircle, Clock, Trash2, RefreshCw
} from 'lucide-react';

export function PWAStatus() {
  const { 
    isOnline, 
    isInstalled, 
    isStandalone,
    getStorageUsage,
    clearCache 
  } = usePWA();
  
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number } | null>(null);
  const [offlineData, setOfflineData] = useState<{
    bookings: number;
    locations: number;
    messages: number;
    cache: number;
  } | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    loadOfflineData();
  }, []);

  const loadStorageInfo = async () => {
    const usage = await getStorageUsage();
    setStorageInfo(usage);
  };

  const loadOfflineData = async () => {
    try {
      await offlineStorage.init();
      const usage = await offlineStorage.getStorageUsage();
      setOfflineData(usage);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      await offlineStorage.clearExpiredCache();
      await loadStorageInfo();
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    if (!storageInfo || storageInfo.quota === 0) return 0;
    return (storageInfo.used / storageInfo.quota) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>
            Current network and app status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {isOnline ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">Network</p>
                <p className="text-sm text-gray-600">
                  {isOnline ? 'Connected' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {isInstalled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Download className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="font-medium">PWA Status</p>
                <p className="text-sm text-gray-600">
                  {isInstalled ? 'Installed' : 'Not Installed'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {isStandalone ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Smartphone className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <p className="font-medium">App Mode</p>
                <p className="text-sm text-gray-600">
                  {isStandalone ? 'Standalone' : 'Browser'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Storage Usage</span>
          </CardTitle>
          <CardDescription>
            Local storage and cache information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageInfo && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Storage Used</span>
                <span>
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <Progress value={getStoragePercentage()} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {getStoragePercentage().toFixed(1)}% of available storage used
              </p>
            </div>
          )}

          {offlineData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{offlineData.bookings}</p>
                <p className="text-sm text-gray-600">Bookings</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{offlineData.locations}</p>
                <p className="text-sm text-gray-600">Locations</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{offlineData.messages}</p>
                <p className="text-sm text-gray-600">Messages</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{offlineData.cache}</p>
                <p className="text-sm text-gray-600">Cache Items</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Cache Management</p>
              <p className="text-sm text-gray-600">Clear cached data to free up space</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={isClearing}
            >
              {isClearing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle>PWA Features</CardTitle>
          <CardDescription>
            Progressive Web App capabilities and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Enabled Features</h4>
              
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Offline Support</span>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Background Sync</span>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Service Worker</span>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">App Manifest</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Available Actions</h4>
              
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Push Notifications</span>
                <Badge variant="outline" className="ml-auto">
                  {Notification.permission === 'granted' ? 'Enabled' : 'Available'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-sm">App Installation</span>
                <Badge variant="outline" className="ml-auto">
                  {isInstalled ? 'Installed' : 'Available'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Background Tasks</span>
                <Badge variant="outline" className="ml-auto">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {!isOnline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              <span>Offline Mode Active</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Your data will sync automatically when connection is restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Bookings</span>
                <Badge variant="secondary">{offlineData?.bookings || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Messages</span>
                <Badge variant="secondary">{offlineData?.messages || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Location Updates</span>
                <Badge variant="secondary">{offlineData?.locations || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}