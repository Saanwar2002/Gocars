'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  isSupported: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
  position: GeolocationPosition | null;
  accuracy: number | null;
  isWatching: boolean;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface LocationUpdate {
  position: GeolocationPosition;
  timestamp: number;
  accuracy: number;
}

export function useGeolocation(options: LocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    isLoading: false,
    hasPermission: false,
    error: null,
    position: null,
    accuracy: null,
    isWatching: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const onLocationUpdateRef = useRef<((update: LocationUpdate) => void) | null>(null);

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    ...options,
  };

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      const hasPermission = permission.state === 'granted';
      
      setState(prev => ({ 
        ...prev, 
        hasPermission,
        error: permission.state === 'denied' ? 'Location permission denied' : null
      }));
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking geolocation permissions:', error);
      setState(prev => ({ ...prev, error: 'Failed to check location permissions' }));
      return false;
    }
  }, [state.isSupported]);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            position,
            accuracy: position.coords.accuracy,
            hasPermission: true,
            error: null,
          }));
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          setState(prev => ({
            ...prev,
            isLoading: false,
            hasPermission: error.code !== error.PERMISSION_DENIED,
            error: errorMessage,
          }));
          resolve(null);
        },
        defaultOptions
      );
    });
  }, [state.isSupported, defaultOptions]);

  const startWatching = useCallback((
    onLocationUpdate?: (update: LocationUpdate) => void,
    watchOptions?: LocationOptions
  ): boolean => {
    if (!state.isSupported || state.isWatching) {
      return false;
    }

    onLocationUpdateRef.current = onLocationUpdate || null;
    const options = { ...defaultOptions, ...watchOptions };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const update: LocationUpdate = {
          position,
          timestamp: now,
          accuracy: position.coords.accuracy,
        };

        setState(prev => ({
          ...prev,
          position,
          accuracy: position.coords.accuracy,
          hasPermission: true,
          error: null,
        }));

        // Call update callback if provided
        if (onLocationUpdateRef.current) {
          onLocationUpdateRef.current(update);
        }

        lastUpdateRef.current = now;
      },
      (error) => {
        let errorMessage = 'Failed to watch location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState(prev => ({
          ...prev,
          hasPermission: error.code !== error.PERMISSION_DENIED,
          error: errorMessage,
        }));
      },
      options
    );

    watchIdRef.current = watchId;
    setState(prev => ({ ...prev, isWatching: true }));
    
    return true;
  }, [state.isSupported, state.isWatching, defaultOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    onLocationUpdateRef.current = null;
    setState(prev => ({ ...prev, isWatching: false }));
  }, []);

  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const calculateBearing = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }, []);

  const isNearLocation = useCallback((
    targetLat: number,
    targetLon: number,
    radiusKm: number = 0.1
  ): boolean => {
    if (!state.position) return false;
    
    const distance = calculateDistance(
      state.position.coords.latitude,
      state.position.coords.longitude,
      targetLat,
      targetLon
    );
    
    return distance <= radiusKm;
  }, [state.position, calculateDistance]);

  const getLocationString = useCallback(async (
    lat?: number,
    lon?: number
  ): Promise<string | null> => {
    const latitude = lat || state.position?.coords.latitude;
    const longitude = lon || state.position?.coords.longitude;
    
    if (!latitude || !longitude) return null;

    try {
      // This would typically use a reverse geocoding service
      // For now, return coordinates as string
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting location string:', error);
      return null;
    }
  }, [state.position]);

  const getAccuracyLevel = useCallback((): 'high' | 'medium' | 'low' | null => {
    if (!state.accuracy) return null;
    
    if (state.accuracy <= 10) return 'high';
    if (state.accuracy <= 50) return 'medium';
    return 'low';
  }, [state.accuracy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    checkPermissions,
    getCurrentPosition,
    startWatching,
    stopWatching,
    calculateDistance,
    calculateBearing,
    isNearLocation,
    getLocationString,
    getAccuracyLevel,
  };
}