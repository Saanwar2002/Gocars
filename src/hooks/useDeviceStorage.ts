'use client';

import { useState, useEffect, useCallback } from 'react';

interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
  percentage: number;
}

interface CacheInfo {
  name: string;
  size: number;
  lastModified: Date;
  itemCount: number;
}

interface StorageState {
  isSupported: boolean;
  quota: StorageQuota | null;
  caches: CacheInfo[];
  indexedDBSize: number;
  localStorageSize: number;
  sessionStorageSize: number;
  isLoading: boolean;
  error: string | null;
}

export function useDeviceStorage() {
  const [state, setState] = useState<StorageState>({
    isSupported: typeof navigator !== 'undefined' && 'storage' in navigator,
    quota: null,
    caches: [],
    indexedDBSize: 0,
    localStorageSize: 0,
    sessionStorageSize: 0,
    isLoading: false,
    error: null,
  });

  const getStorageQuota = useCallback(async (): Promise<StorageQuota | null> => {
    if (!state.isSupported || !navigator.storage?.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        quota,
        usage,
        available,
        percentage,
      };
    } catch (error) {
      console.error('Error getting storage quota:', error);
      return null;
    }
  }, [state.isSupported]);

  const getCacheInfo = useCallback(async (): Promise<CacheInfo[]> => {
    if (!('caches' in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfoPromises = cacheNames.map(async (name): Promise<CacheInfo> => {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        
        let totalSize = 0;
        let lastModified = new Date(0);

        // Estimate cache size (this is approximate)
        for (const request of requests) {
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
              
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const date = new Date(dateHeader);
                if (date > lastModified) {
                  lastModified = date;
                }
              }
            }
          } catch (error) {
            // Skip if we can't read the response
            console.warn('Could not read cache entry:', error);
          }
        }

        return {
          name,
          size: totalSize,
          lastModified,
          itemCount: requests.length,
        };
      });

      return await Promise.all(cacheInfoPromises);
    } catch (error) {
      console.error('Error getting cache info:', error);
      return [];
    }
  }, []);

  const getLocalStorageSize = useCallback((): number => {
    if (typeof localStorage === 'undefined') return 0;

    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }, []);

  const getSessionStorageSize = useCallback((): number => {
    if (typeof sessionStorage === 'undefined') return 0;

    let total = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        total += sessionStorage[key].length + key.length;
      }
    }
    return total;
  }, []);

  const getIndexedDBSize = useCallback(async (): Promise<number> => {
    // This is a simplified estimation
    // In a real implementation, you'd need to iterate through all databases and object stores
    try {
      if (!('indexedDB' in window)) return 0;
      
      // For now, return 0 as getting actual IndexedDB size requires
      // opening each database and calculating object store sizes
      return 0;
    } catch (error) {
      console.error('Error getting IndexedDB size:', error);
      return 0;
    }
  }, []);

  const refreshStorageInfo = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [quota, caches, indexedDBSize, localStorageSize, sessionStorageSize] = await Promise.all([
        getStorageQuota(),
        getCacheInfo(),
        getIndexedDBSize(),
        Promise.resolve(getLocalStorageSize()),
        Promise.resolve(getSessionStorageSize()),
      ]);

      setState(prev => ({
        ...prev,
        quota,
        caches,
        indexedDBSize,
        localStorageSize,
        sessionStorageSize,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get storage info',
      }));
    }
  }, [getStorageQuota, getCacheInfo, getIndexedDBSize, getLocalStorageSize, getSessionStorageSize]);

  const clearCache = useCallback(async (cacheName?: string): Promise<boolean> => {
    if (!('caches' in window)) return false;

    try {
      if (cacheName) {
        const success = await caches.delete(cacheName);
        if (success) {
          await refreshStorageInfo();
        }
        return success;
      } else {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(name => caches.delete(name));
        await Promise.all(deletePromises);
        await refreshStorageInfo();
        return true;
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, [refreshStorageInfo]);

  const clearLocalStorage = useCallback((): boolean => {
    if (typeof localStorage === 'undefined') return false;

    try {
      localStorage.clear();
      refreshStorageInfo();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }, [refreshStorageInfo]);

  const clearSessionStorage = useCallback((): boolean => {
    if (typeof sessionStorage === 'undefined') return false;

    try {
      sessionStorage.clear();
      refreshStorageInfo();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }, [refreshStorageInfo]);

  const optimizeStorage = useCallback(async (): Promise<{
    success: boolean;
    freedSpace: number;
    actions: string[];
  }> => {
    const actions: string[] = [];
    let freedSpace = 0;
    let success = true;

    try {
      // Clear expired cache entries (this would need more sophisticated logic)
      const oldCaches = state.caches.filter(cache => {
        const daysSinceModified = (Date.now() - cache.lastModified.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceModified > 7; // Clear caches older than 7 days
      });

      for (const cache of oldCaches) {
        const cleared = await clearCache(cache.name);
        if (cleared) {
          freedSpace += cache.size;
          actions.push(`Cleared cache: ${cache.name}`);
        }
      }

      // Clear old localStorage entries (implement your own logic)
      const localStorageKeys = Object.keys(localStorage);
      const oldKeys = localStorageKeys.filter(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp) {
              const daysSinceCreated = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
              return daysSinceCreated > 30; // Clear items older than 30 days
            }
          }
        } catch {
          // If we can't parse it, it might be old format
          return true;
        }
        return false;
      });

      oldKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          freedSpace += item.length + key.length;
          localStorage.removeItem(key);
          actions.push(`Removed localStorage item: ${key}`);
        }
      });

      await refreshStorageInfo();

    } catch (error) {
      console.error('Error optimizing storage:', error);
      success = false;
    }

    return {
      success,
      freedSpace,
      actions,
    };
  }, [state.caches, clearCache, refreshStorageInfo]);

  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    if (!navigator.storage?.persist) {
      return false;
    }

    try {
      const granted = await navigator.storage.persist();
      return granted;
    } catch (error) {
      console.error('Error requesting persistent storage:', error);
      return false;
    }
  }, []);

  const isPersistent = useCallback(async (): Promise<boolean> => {
    if (!navigator.storage?.persisted) {
      return false;
    }

    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('Error checking persistent storage:', error);
      return false;
    }
  }, []);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Initialize storage info on mount
  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  return {
    ...state,
    refreshStorageInfo,
    clearCache,
    clearLocalStorage,
    clearSessionStorage,
    optimizeStorage,
    requestPersistentStorage,
    isPersistent,
    formatBytes,
  };
}