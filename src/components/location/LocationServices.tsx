'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  MapPin, Navigation, Target, AlertCircle, CheckCircle,
  Crosshair, Clock, Zap, Settings, RefreshCw, Eye
} from 'lucide-react';

interface LocationServicesProps {
  onLocationUpdate?: (position: GeolocationPosition) => void;
  showMap?: boolean;
  enableTracking?: boolean;
}

export function LocationServices({ 
  onLocationUpdate, 
  showMap = true, 
  enableTracking = false 
}: LocationServicesProps) {
  const {
    isSupported,
    isLoading,
    hasPermission,
    error,
    position,
    accuracy,
    isWatching,
    checkPermissions,
    getCurrentPosition,
    startWatching,
    stopWatching,
    calculateDistance,
    getLocationString,
    getAccuracyLevel
  } = useGeolocation();

  const [locationString, setLocationString] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(enableTracking);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{
    position: GeolocationPosition;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (position) {
      setLastUpdate(new Date());
      onLocationUpdate?.(position);
      
      // Update location string
      getLocationString().then(setLocationString);
      
      // Add to history
      setLocationHistory(prev => [
        ...prev.slice(-9), // Keep last 10 entries
        { position, timestamp: new Date() }
      ]);
    }
  }, [position, onLocationUpdate, getLocationString]);

  useEffect(() => {
    if (trackingEnabled && hasPermission) {
      startWatching((update) => {
        console.log('Location update:', update);
      });
    } else {
      stopWatching();
    }
  }, [trackingEnabled, hasPermission, startWatching, stopWatching]);

  const handleGetLocation = async () => {
    await getCurrentPosition();
  };

  const handleToggleTracking = (enabled: boolean) => {
    setTrackingEnabled(enabled);
  };

  const handleRequestPermission = async () => {
    await checkPermissions();
    if (hasPermission) {
      await getCurrentPosition();
    }
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lon'): string => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatAccuracy = (acc: number): string => {
    if (acc < 1000) return `${Math.round(acc)}m`;
    return `${(acc / 1000).toFixed(1)}km`;
  };

  const getAccuracyColor = (level: string | null): string => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Location Services Not Supported</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your device doesn't support location services. Please use a different device or enter your location manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Services</span>
          </CardTitle>
          <CardDescription>
            GPS and location tracking for enhanced ride experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {hasPermission ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">Location Permission</p>
                <p className="text-sm text-gray-600">
                  {hasPermission ? 'Granted' : 'Required for location services'}
                </p>
              </div>
            </div>
            {!hasPermission && (
              <Button onClick={handleRequestPermission} size="sm">
                Grant Permission
              </Button>
            )}
          </div>

          {/* Current Location */}
          {position && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Current Location</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getAccuracyColor(getAccuracyLevel())}>
                    {getAccuracyLevel()?.toUpperCase()} ACCURACY
                  </Badge>
                  {lastUpdate && (
                    <span className="text-sm text-gray-500">
                      {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Coordinates</span>
                  </div>
                  <p className="text-sm">
                    {formatCoordinate(position.coords.latitude, 'lat')}
                  </p>
                  <p className="text-sm">
                    {formatCoordinate(position.coords.longitude, 'lon')}
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Accuracy</span>
                  </div>
                  <p className="text-sm">
                    ±{formatAccuracy(position.coords.accuracy)}
                  </p>
                  {position.coords.altitude && (
                    <p className="text-sm">
                      Altitude: {Math.round(position.coords.altitude)}m
                    </p>
                  )}
                </div>
              </div>

              {locationString && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Location String</span>
                  </div>
                  <p className="text-sm font-mono">{locationString}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Location Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <Button
              onClick={handleGetLocation}
              disabled={isLoading || !hasPermission}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Getting Location...' : 'Get Current Location'}
            </Button>

            <div className="flex items-center space-x-2">
              <Switch
                id="tracking"
                checked={trackingEnabled}
                onCheckedChange={handleToggleTracking}
                disabled={!hasPermission}
              />
              <Label htmlFor="tracking" className="text-sm">
                Enable Tracking
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Status */}
      {trackingEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span>Location Tracking</span>
            </CardTitle>
            <CardDescription>
              Real-time location monitoring is active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isWatching ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-medium">Tracking Status</p>
                  <p className="text-sm text-gray-600">
                    {isWatching ? 'Active - Location updates in real-time' : 'Inactive'}
                  </p>
                </div>
              </div>
              <Badge variant={isWatching ? "default" : "secondary"}>
                {isWatching ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>

            {locationHistory.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Location Updates</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {locationHistory.slice().reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div>
                        <span className="font-mono">
                          {entry.position.coords.latitude.toFixed(6)}, {entry.position.coords.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">
                          ±{formatAccuracy(entry.position.coords.accuracy)}
                        </span>
                        <span className="text-gray-500">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Features */}
      <Card>
        <CardHeader>
          <CardTitle>Location Features</CardTitle>
          <CardDescription>
            Enhanced location services for better ride experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Precise Pickup</p>
                <p className="text-sm text-gray-600">
                  Accurate location sharing for faster driver pickup
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Real-time Tracking</p>
                <p className="text-sm text-gray-600">
                  Live location updates during your ride
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Smart Routing</p>
                <p className="text-sm text-gray-600">
                  Optimized routes based on current location
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Location History</p>
                <p className="text-sm text-gray-600">
                  Save frequent locations for quick booking
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Integration (Placeholder) */}
      {showMap && position && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Location Map</span>
            </CardTitle>
            <CardDescription>
              Visual representation of your current location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Map Integration</p>
                <p className="text-sm">
                  Interactive map would be displayed here
                </p>
                <p className="text-sm mt-2">
                  Current: {formatCoordinate(position.coords.latitude, 'lat')}, {formatCoordinate(position.coords.longitude, 'lon')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}