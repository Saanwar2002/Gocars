'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDataSync } from './useDataSync';
import { useTouch } from './useTouch';
import { useNetworkStatus } from './useNetworkStatus';

interface DevicePreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'default' | 'high-contrast' | 'colorblind-friendly';
  reducedMotion: boolean;
  
  // Mobile-specific preferences
  hapticFeedback: boolean;
  autoRotation: boolean;
  gestureNavigation: boolean;
  touchTargetSize: 'small' | 'medium' | 'large';
  
  // Performance preferences
  dataUsage: 'unlimited' | 'moderate' | 'minimal';
  imageQuality: 'high' | 'medium' | 'low' | 'auto';
  animationsEnabled: boolean;
  preloadContent: boolean;
  
  // Notification preferences
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  
  // Location preferences
  locationSharing: 'always' | 'while-using' | 'never';
  preciseLocation: boolean;
  locationHistory: boolean;
  
  // Privacy preferences
  analytics: boolean;
  crashReporting: boolean;
  personalizedAds: boolean;
  dataSyncEnabled: boolean;
  
  // App-specific preferences
  defaultView: 'map' | 'list' | 'cards';
  autoBooking: boolean;
  favoriteLocations: Array<{
    id: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }>;
  paymentMethod: string;
  language: string;
  currency: string;
  
  // Accessibility preferences
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  buttonLabels: boolean;
  reduceTransparency: boolean;
}

interface DeviceCapabilities {
  hasTouch: boolean;
  hasHaptics: boolean;
  hasGeolocation: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasBattery: boolean;
  hasNetworkInfo: boolean;
  supportsWebGL: boolean;
  supportsWebRTC: boolean;
  supportsPWA: boolean;
}

const DEFAULT_PREFERENCES: DevicePreferences = {
  theme: 'auto',
  fontSize: 'medium',
  colorScheme: 'default',
  reducedMotion: false,
  hapticFeedback: true,
  autoRotation: true,
  gestureNavigation: true,
  touchTargetSize: 'medium',
  dataUsage: 'moderate',
  imageQuality: 'auto',
  animationsEnabled: true,
  preloadContent: true,
  pushNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  locationSharing: 'while-using',
  preciseLocation: true,
  locationHistory: false,
  analytics: true,
  crashReporting: true,
  personalizedAds: false,
  dataSyncEnabled: true,
  defaultView: 'map',
  autoBooking: false,
  favoriteLocations: [],
  paymentMethod: '',
  language: 'en',
  currency: 'USD',
  screenReader: false,
  highContrast: false,
  largeText: false,
  buttonLabels: false,
  reduceTransparency: false,
};

export function useDevicePreferences(userId: string) {
  const { updateData, getData, deviceId } = useDataSync(userId);
  const { touchState, isTouchDevice } = useTouch();
  const { networkStatus, shouldReduceData } = useNetworkStatus();
  
  const [preferences, setPreferences] = useState<DevicePreferences>(DEFAULT_PREFERENCES);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    hasTouch: false,
    hasHaptics: false,
    hasGeolocation: false,
    hasCamera: false,
    hasMicrophone: false,
    hasAccelerometer: false,
    hasGyroscope: false,
    hasBattery: false,
    hasNetworkInfo: false,
    supportsWebGL: false,
    supportsWebRTC: false,
    supportsPWA: false,
  });

  // Detect device capabilities
  const detectCapabilities = useCallback(async (): Promise<DeviceCapabilities> => {
    const caps: DeviceCapabilities = {
      hasTouch: isTouchDevice(),
      hasHaptics: 'vibrate' in navigator,
      hasGeolocation: 'geolocation' in navigator,
      hasCamera: false,
      hasMicrophone: false,
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasGyroscope: 'DeviceOrientationEvent' in window,
      hasBattery: 'getBattery' in navigator,
      hasNetworkInfo: 'connection' in navigator,
      supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
      supportsWebRTC: 'RTCPeerConnection' in window,
      supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window,
    };

    // Check media devices
    if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        caps.hasCamera = devices.some(device => device.kind === 'videoinput');
        caps.hasMicrophone = devices.some(device => device.kind === 'audioinput');
      } catch (error) {
        console.warn('Could not enumerate media devices:', error);
      }
    }

    return caps;
  }, [isTouchDevice]);

  // Load preferences from sync
  const loadPreferences = useCallback(() => {
    const syncedPrefs = getData(`preferences_${deviceId}`) as DevicePreferences;
    if (syncedPrefs) {
      setPreferences(prev => ({ ...prev, ...syncedPrefs.data }));
    } else {
      // Load from localStorage as fallback
      const localPrefs = localStorage.getItem(`device_preferences_${deviceId}`);
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.warn('Failed to parse local preferences:', error);
        }
      }
    }
  }, [getData, deviceId]);

  // Save preferences
  const savePreferences = useCallback((newPreferences: Partial<DevicePreferences>) => {
    const updatedPrefs = { ...preferences, ...newPreferences };
    setPreferences(updatedPrefs);
    
    // Save to sync
    updateData(`preferences_${deviceId}`, 'preferences', updatedPrefs);
    
    // Save to localStorage as backup
    localStorage.setItem(`device_preferences_${deviceId}`, JSON.stringify(updatedPrefs));
  }, [preferences, updateData, deviceId]);

  // Auto-adjust preferences based on device capabilities and network
  const autoAdjustPreferences = useCallback(() => {
    const adjustments: Partial<DevicePreferences> = {};

    // Adjust based on network conditions
    if (shouldReduceData()) {
      adjustments.dataUsage = 'minimal';
      adjustments.imageQuality = 'low';
      adjustments.preloadContent = false;
      adjustments.animationsEnabled = false;
    }

    // Adjust based on device capabilities
    if (!capabilities.hasHaptics) {
      adjustments.hapticFeedback = false;
    }

    if (!capabilities.hasTouch) {
      adjustments.gestureNavigation = false;
      adjustments.touchTargetSize = 'small';
    }

    // Adjust based on screen size
    if (touchState.screenSize === 'small') {
      adjustments.touchTargetSize = 'large';
      adjustments.fontSize = 'large';
    }

    // Check for accessibility preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      adjustments.reducedMotion = true;
      adjustments.animationsEnabled = false;
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      adjustments.theme = 'dark';
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      adjustments.highContrast = true;
      adjustments.colorScheme = 'high-contrast';
    }

    // Apply adjustments if they differ from current preferences
    const hasChanges = Object.entries(adjustments).some(
      ([key, value]) => preferences[key as keyof DevicePreferences] !== value
    );

    if (hasChanges) {
      savePreferences(adjustments);
    }
  }, [shouldReduceData, capabilities, touchState, preferences, savePreferences]);

  // Get preference value
  const getPreference = useCallback(<K extends keyof DevicePreferences>(
    key: K
  ): DevicePreferences[K] => {
    return preferences[key];
  }, [preferences]);

  // Update single preference
  const updatePreference = useCallback(<K extends keyof DevicePreferences>(
    key: K,
    value: DevicePreferences[K]
  ) => {
    savePreferences({ [key]: value });
  }, [savePreferences]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    updateData(`preferences_${deviceId}`, 'preferences', DEFAULT_PREFERENCES);
    localStorage.removeItem(`device_preferences_${deviceId}`);
  }, [updateData, deviceId]);

  // Export preferences
  const exportPreferences = useCallback(() => {
    const exportData = {
      preferences,
      capabilities,
      deviceId,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gocars-preferences-${deviceId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [preferences, capabilities, deviceId]);

  // Import preferences
  const importPreferences = useCallback((file: File) => {
    return new Promise<boolean>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.preferences) {
            savePreferences(data.preferences);
            resolve(true);
          } else {
            reject(new Error('Invalid preferences file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [savePreferences]);

  // Add favorite location
  const addFavoriteLocation = useCallback((location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => {
    const newLocation = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...location,
    };
    
    const updatedFavorites = [...preferences.favoriteLocations, newLocation];
    updatePreference('favoriteLocations', updatedFavorites);
    
    return newLocation.id;
  }, [preferences.favoriteLocations, updatePreference]);

  // Remove favorite location
  const removeFavoriteLocation = useCallback((locationId: string) => {
    const updatedFavorites = preferences.favoriteLocations.filter(
      loc => loc.id !== locationId
    );
    updatePreference('favoriteLocations', updatedFavorites);
  }, [preferences.favoriteLocations, updatePreference]);

  // Check if in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = preferences.quietHours;
    
    if (start <= end) {
      // Same day range (e.g., 09:00 to 17:00)
      return currentTime >= start && currentTime <= end;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end;
    }
  }, [preferences.quietHours]);

  // Apply theme to document
  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    let theme = preferences.theme;
    
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [preferences.theme]);

  // Apply accessibility preferences
  const applyAccessibilityPreferences = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Font size
    root.setAttribute('data-font-size', preferences.fontSize);
    
    // High contrast
    root.classList.toggle('high-contrast', preferences.highContrast);
    
    // Reduced motion
    root.classList.toggle('reduce-motion', preferences.reducedMotion);
    
    // Large text
    root.classList.toggle('large-text', preferences.largeText);
    
    // Reduce transparency
    root.classList.toggle('reduce-transparency', preferences.reduceTransparency);
  }, [preferences]);

  // Initialize capabilities and preferences
  useEffect(() => {
    detectCapabilities().then(setCapabilities);
    loadPreferences();
  }, [detectCapabilities, loadPreferences]);

  // Auto-adjust preferences when capabilities or network changes
  useEffect(() => {
    if (Object.keys(capabilities).length > 0) {
      autoAdjustPreferences();
    }
  }, [capabilities, networkStatus, autoAdjustPreferences]);

  // Apply theme and accessibility preferences
  useEffect(() => {
    applyTheme();
    applyAccessibilityPreferences();
  }, [applyTheme, applyAccessibilityPreferences]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
    ];
    
    const handleChange = () => {
      if (preferences.theme === 'auto') {
        applyTheme();
      }
      autoAdjustPreferences();
    };
    
    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));
    
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, [preferences.theme, applyTheme, autoAdjustPreferences]);

  return {
    preferences,
    capabilities,
    deviceId,
    getPreference,
    updatePreference,
    savePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    addFavoriteLocation,
    removeFavoriteLocation,
    isInQuietHours,
    autoAdjustPreferences,
  };
}