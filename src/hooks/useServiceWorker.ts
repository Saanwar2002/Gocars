'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function useServiceWorker(swPath: string = '/mobile-sw.js') {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    registration: null,
    error: null,
  });

  const updateState = useCallback((updates: Partial<ServiceWorkerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const register = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      updateState({ 
        isSupported: false, 
        error: 'Service Workers not supported' 
      });
      return;
    }

    updateState({ isSupported: true });

    try {
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      console.log('Service Worker registered:', registration);

      updateState({
        isRegistered: true,
        registration,
        error: null,
      });

      // Handle different service worker states
      if (registration.installing) {
        updateState({ isInstalling: true });
        registration.installing.addEventListener('statechange', handleStateChange);
      }

      if (registration.waiting) {
        updateState({ isWaiting: true });
      }

      if (registration.active) {
        updateState({ isActive: true });
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          updateState({ isInstalling: true });
          newWorker.addEventListener('statechange', handleStateChange);
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  }, [swPath, updateState]);

  const handleStateChange = useCallback((event: Event) => {
    const worker = event.target as ServiceWorker;
    console.log('Service Worker state changed:', worker.state);

    switch (worker.state) {
      case 'installed':
        updateState({ isInstalling: false });
        if (navigator.serviceWorker.controller) {
          // New service worker installed, waiting to activate
          updateState({ isWaiting: true });
        } else {
          // First time install
          updateState({ isActive: true });
        }
        break;
      case 'activated':
        updateState({ 
          isWaiting: false, 
          isActive: true 
        });
        break;
      case 'redundant':
        updateState({ 
          isInstalling: false, 
          isWaiting: false, 
          isActive: false 
        });
        break;
    }
  }, [updateState]);

  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.registration]);

  const unregister = useCallback(async () => {
    if (state.registration) {
      const success = await state.registration.unregister();
      if (success) {
        updateState({
          isRegistered: false,
          isInstalling: false,
          isWaiting: false,
          isActive: false,
          registration: null,
        });
      }
      return success;
    }
    return false;
  }, [state.registration, updateState]);

  const sendMessage = useCallback((message: any) => {
    if (state.registration?.active) {
      state.registration.active.postMessage(message);
    }
  }, [state.registration]);

  const cacheUrls = useCallback((urls: string[]) => {
    sendMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }, [sendMessage]);

  const requestPersistentStorage = useCallback(async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log('Persistent storage granted:', granted);
        return granted;
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }, []);

  const getStorageEstimate = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          usagePercentage: estimate.quota ? (estimate.usage || 0) / estimate.quota * 100 : 0,
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Register service worker on mount
  useEffect(() => {
    register();
  }, [register]);

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      console.log('Message from Service Worker:', event.data);
      
      if (event.data.type === 'SYNC_OFFLINE_ACTIONS') {
        // Trigger offline actions sync in the app
        window.dispatchEvent(new CustomEvent('sw-sync-offline-actions'));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Listen for service worker controller changes
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    ...state,
    register,
    unregister,
    skipWaiting,
    sendMessage,
    cacheUrls,
    requestPersistentStorage,
    getStorageEstimate,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const { registration } = useServiceWorker();

  const requestSync = useCallback(async (tag: string) => {
    if (registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, [registration]);

  const requestPeriodicSync = useCallback(async (tag: string, minInterval: number = 24 * 60 * 60 * 1000) => {
    if (registration && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' as any });
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register(tag, {
            minInterval,
          });
          console.log('Periodic background sync registered:', tag);
          return true;
        } else {
          console.log('Periodic background sync permission not granted');
          return false;
        }
      } catch (error) {
        console.error('Periodic background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, [registration]);

  return {
    requestSync,
    requestPeriodicSync,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const { registration } = useServiceWorker();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  }, []);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!registration) {
      throw new Error('Service Worker not registered');
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(subscription);
      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }, [registration, permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      const success = await subscription.unsubscribe();
      if (success) {
        setSubscription(null);
      }
      return success;
    }
    return false;
  }, [subscription]);

  const getSubscription = useCallback(async () => {
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      return sub;
    }
    return null;
  }, [registration]);

  useEffect(() => {
    getSubscription();
  }, [getSubscription]);

  return {
    subscription,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    getSubscription,
  };
}