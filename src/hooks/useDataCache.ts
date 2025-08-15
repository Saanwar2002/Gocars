'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  priority: 'low' | 'medium' | 'high';
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  priority?: 'low' | 'medium' | 'high';
  maxSize?: number; // Maximum cache size in bytes
  persistToStorage?: boolean;
}

interface DataCacheConfig {
  maxMemorySize: number; // Maximum memory cache size in bytes
  maxStorageSize: number; // Maximum storage cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

const DEFAULT_CONFIG: DataCacheConfig = {
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
};

export function useDataCache<T = any>(config: Partial<DataCacheConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { shouldReduceData, isSlowConnection } = useNetworkStatus();
  
  const memoryCache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [cacheStats, setCacheStats] = useState({
    memorySize: 0,
    storageSize: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
  });

  const cleanupTimerRef = useRef<NodeJS.Timeout>();

  // Calculate size of data (rough estimation)
  const calculateSize = useCallback((data: any): number => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }, []);

  // Get from localStorage with error handling
  const getFromStorage = useCallback((key: string): CacheEntry<T> | null => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  // Set to localStorage with error handling
  const setToStorage = useCallback((key: string, entry: CacheEntry<T>): void => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  // Remove from localStorage
  const removeFromStorage = useCallback((key: string): void => {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }, []);

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    let memorySize = 0;
    
    // Cleanup memory cache
    for (const [key, entry] of memoryCache.current.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.current.delete(key);
      } else {
        memorySize += entry.size;
      }
    }

    // Cleanup storage cache
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    let storageSize = 0;
    
    for (const storageKey of storageKeys) {
      const key = storageKey.replace('cache_', '');
      const entry = getFromStorage(key);
      
      if (!entry || entry.expiresAt < now) {
        removeFromStorage(key);
      } else {
        storageSize += entry.size;
      }
    }

    setCacheStats(prev => ({
      ...prev,
      memorySize,
      storageSize,
    }));
  }, [getFromStorage, removeFromStorage]);

  // Evict entries based on priority and age
  const evictEntries = useCallback((targetSize: number, isMemory: boolean) => {
    const entries = isMemory 
      ? Array.from(memoryCache.current.entries())
      : Object.keys(localStorage)
          .filter(key => key.startsWith('cache_'))
          .map(storageKey => {
            const key = storageKey.replace('cache_', '');
            const entry = getFromStorage(key);
            return entry ? [key, entry] as [string, CacheEntry<T>] : null;
          })
          .filter(Boolean) as [string, CacheEntry<T>][];

    // Sort by priority (low first) and age (oldest first)
    entries.sort(([, a], [, b]) => {
      const priorityOrder = { low: 0, medium: 1, high: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    let currentSize = isMemory 
      ? cacheStats.memorySize 
      : cacheStats.storageSize;

    for (const [key] of entries) {
      if (currentSize <= targetSize) break;
      
      const entry = isMemory 
        ? memoryCache.current.get(key)
        : getFromStorage(key);
        
      if (entry) {
        currentSize -= entry.size;
        
        if (isMemory) {
          memoryCache.current.delete(key);
        } else {
          removeFromStorage(key);
        }
      }
    }
  }, [cacheStats.memorySize, cacheStats.storageSize, getFromStorage, removeFromStorage]);

  // Get data from cache
  const get = useCallback((key: string): T | null => {
    setCacheStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
    
    const now = Date.now();
    
    // Check memory cache first
    const memoryEntry = memoryCache.current.get(key);
    if (memoryEntry && memoryEntry.expiresAt > now) {
      setCacheStats(prev => ({ 
        ...prev, 
        cacheHits: prev.cacheHits + 1,
        hitRate: (prev.cacheHits + 1) / (prev.totalRequests)
      }));
      return memoryEntry.data;
    }

    // Check storage cache
    const storageEntry = getFromStorage(key);
    if (storageEntry && storageEntry.expiresAt > now) {
      // Promote to memory cache if there's space
      if (cacheStats.memorySize + storageEntry.size <= fullConfig.maxMemorySize) {
        memoryCache.current.set(key, storageEntry);
      }
      
      setCacheStats(prev => ({ 
        ...prev, 
        cacheHits: prev.cacheHits + 1,
        hitRate: (prev.cacheHits + 1) / (prev.totalRequests)
      }));
      return storageEntry.data;
    }

    return null;
  }, [cacheStats.memorySize, fullConfig.maxMemorySize, getFromStorage]);

  // Set data in cache
  const set = useCallback((key: string, data: T, options: CacheOptions = {}) => {
    const now = Date.now();
    const ttl = options.ttl || fullConfig.defaultTTL;
    const priority = options.priority || 'medium';
    const size = calculateSize(data);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      priority,
      size,
    };

    // Always try to store in memory first
    if (cacheStats.memorySize + size > fullConfig.maxMemorySize) {
      evictEntries(fullConfig.maxMemorySize - size, true);
    }
    
    memoryCache.current.set(key, entry);

    // Store in localStorage if requested and not in data saving mode
    if (options.persistToStorage && !shouldReduceData()) {
      if (cacheStats.storageSize + size > fullConfig.maxStorageSize) {
        evictEntries(fullConfig.maxStorageSize - size, false);
      }
      setToStorage(key, entry);
    }

    // Update stats
    setCacheStats(prev => ({
      ...prev,
      memorySize: prev.memorySize + size,
      storageSize: options.persistToStorage ? prev.storageSize + size : prev.storageSize,
    }));
  }, [
    fullConfig.defaultTTL,
    fullConfig.maxMemorySize,
    fullConfig.maxStorageSize,
    cacheStats.memorySize,
    cacheStats.storageSize,
    calculateSize,
    evictEntries,
    setToStorage,
    shouldReduceData
  ]);

  // Remove data from cache
  const remove = useCallback((key: string) => {
    const memoryEntry = memoryCache.current.get(key);
    const storageEntry = getFromStorage(key);
    
    if (memoryEntry) {
      memoryCache.current.delete(key);
      setCacheStats(prev => ({
        ...prev,
        memorySize: prev.memorySize - memoryEntry.size,
      }));
    }
    
    if (storageEntry) {
      removeFromStorage(key);
      setCacheStats(prev => ({
        ...prev,
        storageSize: prev.storageSize - storageEntry.size,
      }));
    }
  }, [getFromStorage, removeFromStorage]);

  // Clear all cache
  const clear = useCallback(() => {
    memoryCache.current.clear();
    
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    storageKeys.forEach(key => localStorage.removeItem(key));
    
    setCacheStats({
      memorySize: 0,
      storageSize: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
    });
  }, []);

  // Get cache keys
  const keys = useCallback(() => {
    const memoryKeys = Array.from(memoryCache.current.keys());
    const storageKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .map(key => key.replace('cache_', ''));
    
    return Array.from(new Set([...memoryKeys, ...storageKeys]));
  }, []);

  // Prefetch data with network awareness
  const prefetch = useCallback(async (
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ) => {
    // Skip prefetch on slow connections unless high priority
    if (isSlowConnection() && options.priority !== 'high') {
      return;
    }

    // Check if already cached
    if (get(key)) {
      return;
    }

    try {
      const data = await fetchFn();
      set(key, data, { ...options, persistToStorage: true });
    } catch (error) {
      console.warn('Prefetch failed for key:', key, error);
    }
  }, [isSlowConnection, get, set]);

  // Setup cleanup interval
  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanup, fullConfig.cleanupInterval);
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanup, fullConfig.cleanupInterval]);

  // Initial cleanup
  useEffect(() => {
    cleanup();
  }, [cleanup]);

  return {
    get,
    set,
    remove,
    clear,
    keys,
    prefetch,
    cacheStats,
    cleanup,
  };
}