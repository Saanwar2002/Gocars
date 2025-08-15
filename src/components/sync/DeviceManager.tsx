'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Smartphone, Monitor, Tablet, Wifi, WifiOff, Battery,
  Clock, MapPin, Settings, Sync, MoreHorizontal,
  CheckCircle, AlertCircle, Share, Eye, EyeOff
} from 'lucide-react';

interface DeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  isCurrentDevice: boolean;
  lastSeen: number;
  isActive: boolean;
  location?: {
    pathname: string;
    search: string;
  };
  batteryLevel?: number;
  networkType?: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
}

interface DeviceManagerProps {
  sessions: DeviceSession[];
  currentDeviceId: string;
  onSwitchToDevice: (deviceId: string) => void;
  onHandoffToDevice: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  onSyncDevice: (deviceId: string) => void;
  className?: string;
}

export function DeviceManager({
  sessions,
  currentDeviceId,
  onSwitchToDevice,
  onHandoffToDevice,
  onRemoveDevice,
  onSyncDevice,
  className
}: DeviceManagerProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const getDeviceIcon = (type: string, isActive: boolean) => {
    const iconClass = cn('h-5 w-5', isActive ? 'text-green-600' : 'text-gray-400');
    
    switch (type) {
      case 'mobile':
        return <Smartphone className={iconClass} />;
      case 'tablet':
        return <Tablet className={iconClass} />;
      default:
        return <Monitor className={iconClass} />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4" />;
      case 'syncing': return <Sync className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const activeSessions = sessions.filter(session => session.isActive);
  const inactiveSessions = sessions.filter(session => !session.isActive);
  const displaySessions = showInactive ? sessions : activeSessions;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Sync className="h-5 w-5 mr-2" />
              Connected Devices
            </CardTitle>
            <CardDescription>
              {activeSessions.length} active device{activeSessions.length !== 1 ? 's' : ''}
              {inactiveSessions.length > 0 && (
                <span className="text-gray-500">
                  , {inactiveSessions.length} inactive
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {inactiveSessions.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showInactive ? 'Hide' : 'Show'} Inactive
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {displaySessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No devices connected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displaySessions.map((session) => (
              <Card
                key={session.deviceId}
                className={cn(
                  'transition-all duration-200',
                  session.isCurrentDevice && 'ring-2 ring-blue-500 bg-blue-50',
                  selectedDevice === session.deviceId && 'shadow-md',
                  !session.isActive && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(session.deviceType, session.isActive)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{session.deviceName}</span>
                          {session.isCurrentDevice && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                          <Badge className={getSyncStatusColor(session.syncStatus)}>
                            <div className="flex items-center space-x-1">
                              {getSyncStatusIcon(session.syncStatus)}
                              <span className="capitalize">{session.syncStatus}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {session.browser} on {session.os}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Battery Level */}
                      {session.batteryLevel !== undefined && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Battery className="h-4 w-4" />
                          <span>{session.batteryLevel}%</span>
                        </div>
                      )}
                      
                      {/* Network Status */}
                      {session.networkType && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Wifi className="h-4 w-4" />
                          <span>{session.networkType}</span>
                        </div>
                      )}
                      
                      {/* Last Seen */}
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatLastSeen(session.lastSeen)}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        {!session.isCurrentDevice && session.isActive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSwitchToDevice(session.deviceId)}
                              title="Switch to this device"
                            >
                              <Share className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onHandoffToDevice(session.deviceId)}
                              title="Handoff current session"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSyncDevice(session.deviceId)}
                          disabled={session.syncStatus === 'syncing'}
                          title="Sync device"
                        >
                          <Sync className={cn(
                            'h-4 w-4',
                            session.syncStatus === 'syncing' && 'animate-spin'
                          )} />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDevice(
                            selectedDevice === session.deviceId ? null : session.deviceId
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Location */}
                  {session.location && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Currently at: {session.location.pathname}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Expanded Details */}
                  {selectedDevice === session.deviceId && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-1">Device Info</div>
                          <div className="space-y-1 text-gray-600">
                            <div>ID: {session.deviceId.slice(-8)}</div>
                            <div>Type: {session.deviceType}</div>
                            <div>Browser: {session.browser}</div>
                            <div>OS: {session.os}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Status</div>
                          <div className="space-y-1 text-gray-600">
                            <div>Active: {session.isActive ? 'Yes' : 'No'}</div>
                            <div>Last Seen: {new Date(session.lastSeen).toLocaleString()}</div>
                            {session.batteryLevel && (
                              <div>Battery: {session.batteryLevel}%</div>
                            )}
                            {session.networkType && (
                              <div>Network: {session.networkType}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Sync Status Details */}
                      {session.syncStatus === 'error' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This device has sync errors. Try manually syncing or check the connection.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {session.syncStatus === 'offline' && (
                        <Alert>
                          <WifiOff className="h-4 w-4" />
                          <AlertDescription>
                            This device is offline. Data will sync when connection is restored.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-2">
                        {!session.isCurrentDevice && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemoveDevice(session.deviceId)}
                          >
                            Remove Device
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDevice(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Device sync status component
export function DeviceSyncStatus({ 
  deviceId, 
  syncProgress, 
  lastSyncTime,
  syncErrors 
}: {
  deviceId: string;
  syncProgress: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sync Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Sync Progress */}
          {syncProgress > 0 && syncProgress < 100 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Syncing...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          )}
          
          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Last synced: {lastSyncTime.toLocaleString()}</span>
            </div>
          )}
          
          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <div className="space-y-1">
              {syncErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Device handoff component
export function DeviceHandoff({
  availableDevices,
  onHandoff,
  isHandingOff
}: {
  availableDevices: DeviceSession[];
  onHandoff: (deviceId: string, includeState: boolean) => void;
  isHandingOff: boolean;
}) {
  const [includeState, setIncludeState] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Handoff to Device</CardTitle>
        <CardDescription>
          Continue your session on another device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availableDevices.length === 0 ? (
            <p className="text-sm text-gray-600">No other devices available</p>
          ) : (
            <>
              <div className="space-y-2">
                {availableDevices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(device.deviceType, device.isActive)}
                      <span className="text-sm">{device.deviceName}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onHandoff(device.deviceId, includeState)}
                      disabled={isHandingOff}
                    >
                      {isHandingOff ? 'Handing off...' : 'Handoff'}
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="includeState"
                  checked={includeState}
                  onChange={(e) => setIncludeState(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeState" className="text-sm">
                  Include current app state and preferences
                </label>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}