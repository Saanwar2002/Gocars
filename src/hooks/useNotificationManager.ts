'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlatformDetection } from './usePlatformDetection';
import { useDevicePreferences } from './useDevicePreferences';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'ride' | 'payment' | 'system' | 'promotion' | 'emergency';
  persistent?: boolean;
  silent?: boolean;
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isEnabled: boolean;
  pendingNotifications: NotificationData[];
  activeNotifications: NotificationData[];
  notificationHistory: NotificationData[];
}

interface NotificationOptions {
  enableBatching?: boolean;
  batchDelay?: number;
  maxActiveNotifications?: number;
  enableQuietHours?: boolean;
  enablePriority?: boolean;
  enableCrossPlatform?: boolean;
}

const DEFAULT_OPTIONS: NotificationOptions = {
  enableBatching: true,
  batchDelay: 5000, // 5 seconds
  maxActiveNotifications: 5,
  enableQuietHours: true,
  enablePriority: true,
  enableCrossPlatform: true,
};

export function useNotificationManager(userId: string, options: NotificationOptions = {}) {
  const fullOptions = { ...DEFAULT_OPTIONS, ...options };
  const { platformInfo, capabilities, isMobile, isPWA } = usePlatformDetection();
  const { preferences, isInQuietHours } = useDevicePreferences(userId);
  
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    isEnabled: false,
    pendingNotifications: [],
    activeNotifications: [],
    notificationHistory: [],
  });

  const batchTimerRef = useRef<NodeJS.Timeout>();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Initialize notification support
  useEffect(() => {
    const isSupported = 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'denied';
    const isEnabled = permission === 'granted' && preferences.pushNotifications;

    setNotificationState(prev => ({
      ...prev,
      isSupported,
      permission,
      isEnabled,
    }));

    // Get service worker registration for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registrationRef.current = registration;
      });
    }
  }, [preferences.pushNotifications]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    
    setNotificationState(prev => ({
      ...prev,
      permission,
      isEnabled: permission === 'granted' && preferences.pushNotifications,
    }));

    return permission;
  }, [preferences.pushNotifications]);

  // Check if notification should be shown
  const shouldShowNotification = useCallback((notification: NotificationData): boolean => {
    // Check if notifications are enabled
    if (!notificationState.isEnabled) return false;

    // Check quiet hours
    if (fullOptions.enableQuietHours && isInQuietHours() && notification.priority !== 'urgent') {
      return false;
    }

    // Check if sound should be disabled
    if (!preferences.soundEnabled && !notification.silent) {
      return false;
    }

    // Check priority filtering
    if (fullOptions.enablePriority) {
      const priorityThreshold = isMobile() ? 'normal' : 'low';
      const priorityLevels = { low: 0, normal: 1, high: 2, urgent: 3 };
      
      if (priorityLevels[notification.priority] < priorityLevels[priorityThreshold]) {
        return false;
      }
    }

    return true;
  }, [
    notificationState.isEnabled,
    fullOptions.enableQuietHours,
    fullOptions.enablePriority,
    isInQuietHours,
    preferences.soundEnabled,
    isMobile
  ]);

  // Create platform-specific notification
  const createNotification = useCallback(async (data: NotificationData): Promise<Notification | null> => {
    if (!shouldShowNotification(data)) return null;

    const options: NotificationOptions & any = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      image: data.image,
      tag: data.tag || data.id,
      data: { ...data.data, notificationId: data.id },
      timestamp: data.timestamp,
      requireInteraction: data.requireInteraction || data.priority === 'urgent',
      silent: data.silent || !preferences.soundEnabled,
      actions: data.actions,
    };

    // Platform-specific optimizations
    if (isMobile()) {
      // Mobile-specific options
      if (preferences.vibrationEnabled && capabilities.hasVibration) {
        options.vibrate = getVibrationPattern(data.priority);
      }
    }

    // Use service worker for persistent notifications
    if (registrationRef.current && isPWA()) {
      try {
        await registrationRef.current.showNotification(data.title, options);
        return null; // Service worker notification doesn't return Notification object
      } catch (error) {
        console.warn('Service worker notification failed, falling back to regular notification:', error);
      }
    }

    // Fallback to regular notification
    try {
      return new Notification(data.title, options);
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }, [
    shouldShowNotification,
    preferences.soundEnabled,
    preferences.vibrationEnabled,
    capabilities.hasVibration,
    isMobile,
    isPWA
  ]);

  // Get vibration pattern based on priority
  const getVibrationPattern = useCallback((priority: NotificationData['priority']): number[] => {
    switch (priority) {
      case 'low': return [100];
      case 'normal': return [200, 100, 200];
      case 'high': return [300, 100, 300, 100, 300];
      case 'urgent': return [500, 200, 500, 200, 500];
      default: return [200];
    }
  }, []);

  // Batch notifications
  const processBatch = useCallback(() => {
    const { pendingNotifications } = notificationState;
    
    if (pendingNotifications.length === 0) return;

    // Group notifications by category
    const grouped = pendingNotifications.reduce((acc, notification) => {
      if (!acc[notification.category]) {
        acc[notification.category] = [];
      }
      acc[notification.category].push(notification);
      return acc;
    }, {} as Record<string, NotificationData[]>);

    // Create batched notifications
    Object.entries(grouped).forEach(([category, notifications]) => {
      if (notifications.length === 1) {
        // Single notification
        createNotification(notifications[0]);
      } else {
        // Batched notification
        const batchedNotification: NotificationData = {
          id: `batch_${category}_${Date.now()}`,
          title: `${notifications.length} ${category} notifications`,
          body: notifications.map(n => n.title).join(', '),
          category: category as NotificationData['category'],
          priority: Math.max(...notifications.map(n => 
            ({ low: 0, normal: 1, high: 2, urgent: 3 }[n.priority])
          )) as any,
          timestamp: Date.now(),
          data: { notifications },
          tag: `batch_${category}`,
        };

        createNotification(batchedNotification);
      }
    });

    // Clear pending notifications
    setNotificationState(prev => ({
      ...prev,
      pendingNotifications: [],
      activeNotifications: [...prev.activeNotifications, ...pendingNotifications],
    }));
  }, [notificationState.pendingNotifications, createNotification]);

  // Show notification
  const showNotification = useCallback((data: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const notification: NotificationData = {
      ...data,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to history
    setNotificationState(prev => ({
      ...prev,
      notificationHistory: [notification, ...prev.notificationHistory.slice(0, 99)], // Keep last 100
    }));

    if (fullOptions.enableBatching && data.priority !== 'urgent') {
      // Add to batch
      setNotificationState(prev => ({
        ...prev,
        pendingNotifications: [...prev.pendingNotifications, notification],
      }));

      // Set batch timer
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      
      batchTimerRef.current = setTimeout(processBatch, fullOptions.batchDelay);
    } else {
      // Show immediately
      createNotification(notification);
      
      setNotificationState(prev => ({
        ...prev,
        activeNotifications: [...prev.activeNotifications, notification],
      }));
    }
  }, [fullOptions.enableBatching, fullOptions.batchDelay, processBatch, createNotification]);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotificationState(prev => ({
      ...prev,
      activeNotifications: prev.activeNotifications.filter(n => n.id !== notificationId),
      pendingNotifications: prev.pendingNotifications.filter(n => n.id !== notificationId),
    }));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotificationState(prev => ({
      ...prev,
      activeNotifications: [],
      pendingNotifications: [],
    }));

    // Clear browser notifications
    if (registrationRef.current) {
      registrationRef.current.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback((
    data: Omit<NotificationData, 'id' | 'timestamp'>,
    delay: number
  ) => {
    setTimeout(() => {
      showNotification(data);
    }, delay);
  }, [showNotification]);

  // Show ride-specific notifications
  const showRideNotification = useCallback((type: 'request' | 'accepted' | 'arrived' | 'completed', rideData: any) => {
    const notifications = {
      request: {
        title: 'New Ride Request',
        body: `Ride to ${rideData.destination}`,
        category: 'ride' as const,
        priority: 'high' as const,
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' },
        ],
      },
      accepted: {
        title: 'Ride Accepted',
        body: `Your driver is on the way`,
        category: 'ride' as const,
        priority: 'normal' as const,
      },
      arrived: {
        title: 'Driver Arrived',
        body: `Your driver has arrived`,
        category: 'ride' as const,
        priority: 'high' as const,
        requireInteraction: true,
      },
      completed: {
        title: 'Ride Completed',
        body: `Thank you for riding with GoCars`,
        category: 'ride' as const,
        priority: 'normal' as const,
        actions: [
          { action: 'rate', title: 'Rate Driver' },
        ],
      },
    };

    showNotification({
      ...notifications[type],
      data: rideData,
    });
  }, [showNotification]);

  // Cross-platform notification sync
  const syncNotifications = useCallback(async () => {
    if (!fullOptions.enableCrossPlatform) return;

    // This would sync with other devices
    // Implementation would depend on your sync system
    console.log('Syncing notifications across platforms...');
  }, [fullOptions.enableCrossPlatform]);

  // Handle notification click
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const notification = event.target as Notification;
      const data = notification.data;
      
      // Handle notification action
      if (data?.notificationId) {
        clearNotification(data.notificationId);
      }
      
      // Platform-specific handling
      if (isMobile() && isPWA()) {
        // Focus the app
        if ('clients' in navigator.serviceWorker) {
          // This would be handled in the service worker
        }
      }
      
      notification.close();
    };

    // Listen for service worker notification events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          handleNotificationClick(event);
        }
      });
    }
  }, [clearNotification, isMobile, isPWA]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  return {
    notificationState,
    requestPermission,
    showNotification,
    showRideNotification,
    scheduleNotification,
    clearNotification,
    clearAllNotifications,
    syncNotifications,
  };
}