'use client';

import React, { useState, useEffect } from 'react';
import { useDataSync } from '@/hooks/useDataSync';
import { useSessionSync } from '@/hooks/useSessionSync';
import { useDevicePreferences } from '@/hooks/useDevicePreferences';
import { ConflictResolver, ConflictResolutionStrategies } from '@/components/sync/ConflictResolver';
import { DeviceManager, DeviceSyncStatus, DeviceHandoff } from '@/components/sync/DeviceManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Sync, Smartphone, Monitor, Settings, Database,
  Users, Clock, Wifi, AlertTriangle, CheckCircle,
  Share, GitMerge, Activity, Zap
} from 'lucide-react';

// Mock user ID for demo
const DEMO_USER_ID = 'demo_user_123';

export default function SyncDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [testData, setTestData] = useState('');
  const [conflictResolution, setConflictResolution] = useState<'local' | 'remote' | 'manual' | 'merge'>('manual');

  // Hooks
  const {
    syncState,
    deviceId,
    updateData,
    deleteData,
    getData,
    resolveConflict,
    triggerSync,
    clearSyncErrors,
    localData
  } = useDataSync(DEMO_USER_ID, {
    conflictResolution,
    enableRealtime: true,
  });

  const {
    currentSession,
    activeSessions,
    updateSessionState,
    getSessionState,
    updatePreferences,
    getPreferences,
    switchToDevice,
    handoffToDevice
  } = useSessionSync(DEMO_USER_ID);

  const {
    preferences,
    capabilities,
    updatePreference,
    addFavoriteLocation,
    removeFavoriteLocation
  } = useDevicePreferences(DEMO_USER_ID);

  // Demo data management
  const handleAddTestData = () => {
    if (testData.trim()) {
      const id = `test_${Date.now()}`;
      updateData(id, 'test_data', {
        message: testData,
        createdAt: new Date().toISOString(),
        deviceName: capabilities.hasTouch ? 'Mobile Device' : 'Desktop Device'
      });
      setTestData('');
    }
  };

  const handleDeleteTestData = (id: string) => {
    deleteData(id);
  };

  const handleCreateConflict = () => {
    // Simulate a conflict by creating data with different versions
    const id = 'conflict_test';
    const baseData = {
      message: 'Original message',
      value: 100,
      timestamp: Date.now()
    };
    
    // Create local version
    updateData(id, 'conflict_test', {
      ...baseData,
      message: 'Local modification',
      value: 150,
      modifiedBy: 'local'
    });
    
    // Simulate remote conflict (in real app, this would come from server)
    setTimeout(() => {
      // This would normally be handled by the sync system
      console.log('Simulated conflict created');
    }, 1000);
  };

  const handleHandoffDevice = (deviceId: string, includeState: boolean) => {
    const success = handoffToDevice(deviceId, includeState);
    if (success) {
      alert(`Handoff initiated to device ${deviceId}`);
    } else {
      alert('Handoff failed - no active session found');
    }
  };

  const testDataItems = localData.filter(item => item.type === 'test_data');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Cross-Platform Sync Demo</h1>
              <p className="text-purple-100">
                Real-time data synchronization, conflict resolution, and device management
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${syncState.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">
                  {syncState.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-purple-100">
                Device: {deviceId.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncState.syncErrors.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sync errors detected. {syncState.syncErrors.length} error(s) need attention.
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={clearSyncErrors}
              >
                Clear Errors
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data-sync">Data Sync</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Sync className="h-4 w-4 mr-2" />
                    Sync Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Connected:</span>
                      <Badge variant={syncState.isConnected ? 'default' : 'destructive'}>
                        {syncState.isConnected ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Syncing:</span>
                      <Badge variant={syncState.isSyncing ? 'default' : 'outline'}>
                        {syncState.isSyncing ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending:</span>
                      <span>{syncState.pendingChanges}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Sync:</span>
                      <span className="text-xs">
                        {syncState.lastSyncTime ? syncState.lastSyncTime.toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Active Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span>{activeSessions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current:</span>
                      <span>{currentSession?.deviceId.slice(-8) || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Session ID:</span>
                      <span className="text-xs">{currentSession?.sessionId.slice(-8) || 'None'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Local Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Items:</span>
                      <span>{localData.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Test Data:</span>
                      <span>{testDataItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conflicts:</span>
                      <Badge variant={syncState.conflicts.length > 0 ? 'destructive' : 'outline'}>
                        {syncState.conflicts.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Device Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span>{capabilities.hasTouch ? 'Mobile' : 'Desktop'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Haptics:</span>
                      <span>{capabilities.hasHaptics ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Camera:</span>
                      <span>{capabilities.hasCamera ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>PWA:</span>
                      <span>{capabilities.supportsPWA ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Test synchronization features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={triggerSync}
                    disabled={syncState.isSyncing}
                    className="h-16 flex-col space-y-1"
                  >
                    <Sync className={`h-5 w-5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
                    <span>Manual Sync</span>
                  </Button>
                  
                  <Button
                    onClick={handleCreateConflict}
                    variant="outline"
                    className="h-16 flex-col space-y-1"
                  >
                    <GitMerge className="h-5 w-5" />
                    <span>Create Conflict</span>
                  </Button>
                  
                  <Button
                    onClick={() => updateSessionState('demo_action', Date.now())}
                    variant="outline"
                    className="h-16 flex-col space-y-1"
                  >
                    <Activity className="h-5 w-5" />
                    <span>Update Session</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Sync Tab */}
          <TabsContent value="data-sync" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Data Synchronization</CardTitle>
                <CardDescription>
                  Add, modify, and delete data to test sync functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter test data..."
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTestData()}
                  />
                  <Button onClick={handleAddTestData} disabled={!testData.trim()}>
                    Add Data
                  </Button>
                </div>

                <div className="space-y-2">
                  {testDataItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No test data. Add some data to see synchronization in action.
                    </p>
                  ) : (
                    testDataItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.data.message}</p>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(item.data.createdAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Device: {item.data.deviceName} | ID: {item.id.slice(-8)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTestData(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <DeviceSyncStatus
              deviceId={deviceId}
              syncProgress={syncState.isSyncing ? 75 : 0}
              lastSyncTime={syncState.lastSyncTime}
              syncErrors={syncState.syncErrors}
            />
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6 mt-6">
            <DeviceManager
              sessions={activeSessions}
              currentDeviceId={deviceId}
              onSwitchToDevice={switchToDevice}
              onHandoffToDevice={handleHandoffDevice}
              onRemoveDevice={(deviceId) => console.log('Remove device:', deviceId)}
              onSyncDevice={(deviceId) => console.log('Sync device:', deviceId)}
            />

            <DeviceHandoff
              availableDevices={activeSessions.filter(s => !s.isCurrentDevice)}
              onHandoff={handleHandoffDevice}
              isHandingOff={false}
            />
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-6 mt-6">
            <ConflictResolutionStrategies
              onStrategySelect={setConflictResolution}
            />

            <ConflictResolver
              conflicts={syncState.conflicts}
              onResolveConflict={resolveConflict}
              onResolveAll={(resolution) => {
                syncState.conflicts.forEach(conflict => {
                  resolveConflict(conflict.id, resolution);
                });
              }}
            />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Preferences</CardTitle>
                <CardDescription>
                  Preferences sync across all your devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme">Theme</Label>
                      <select
                        id="theme"
                        value={preferences.theme}
                        onChange={(e) => updatePreference('theme', e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <select
                        id="fontSize"
                        value={preferences.fontSize}
                        onChange={(e) => updatePreference('fontSize', e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="hapticFeedback">Haptic Feedback</Label>
                      <Switch
                        id="hapticFeedback"
                        checked={preferences.hapticFeedback}
                        onCheckedChange={(checked) => updatePreference('hapticFeedback', checked)}
                        disabled={!capabilities.hasHaptics}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <Switch
                        id="pushNotifications"
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dataUsage">Data Usage</Label>
                      <select
                        id="dataUsage"
                        value={preferences.dataUsage}
                        onChange={(e) => updatePreference('dataUsage', e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="unlimited">Unlimited</option>
                        <option value="moderate">Moderate</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="imageQuality">Image Quality</Label>
                      <select
                        id="imageQuality"
                        value={preferences.imageQuality}
                        onChange={(e) => updatePreference('imageQuality', e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="locationSharing">Location Sharing</Label>
                      <select
                        id="locationSharing"
                        value={preferences.locationSharing}
                        onChange={(e) => updatePreference('locationSharing', e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="always">Always</option>
                        <option value="while-using">While Using</option>
                        <option value="never">Never</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="dataSyncEnabled">Data Sync</Label>
                      <Switch
                        id="dataSyncEnabled"
                        checked={preferences.dataSyncEnabled}
                        onCheckedChange={(checked) => updatePreference('dataSyncEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Favorite Locations</h4>
                  <div className="space-y-2">
                    {preferences.favoriteLocations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-gray-600">{location.address}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFavoriteLocation(location.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      onClick={() => addFavoriteLocation({
                        name: 'Demo Location',
                        address: '123 Demo Street',
                        coordinates: { lat: 40.7128, lng: -74.0060 }
                      })}
                    >
                      Add Demo Location
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}