'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDataCache } from '@/hooks/useDataCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Wifi, WifiOff, Download, Upload, Sync, AlertTriangle,
  CheckCircle, Clock, Database, Smartphone
} from 'lucide-react';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineModeProps {
  children: React.ReactNode;
  enableOfflineActions?: boolean;
  maxOfflineActions?: number;
  syncInterval?: number;
}

export function OfflineMode({
  children,
  enableOfflineActions = true,
  maxOfflineActions = 100,
  syncInterval = 30000, // 30 seconds
}: OfflineModeProps) {
  const { networkStatus } = useNetworkStatus();
  const { get, set } = useDataCache();
  
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Load offline actions from cache on mount
  useEffect(() => {
    const cachedActions = get('offline_actions');
    if (cachedActions) {
      setOfflineActions(cachedActions);
    }
  }, [get]);

  // Save offline actions to cache
  useEffect(() => {
    if (offlineActions.length > 0) {
      set('offline_actions', offlineActions, { 
        persistToStorage: true,
        priority: 'high',
        ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
  }, [offlineActions, set]);

  // Show/hide offline banner
  useEffect(() => {
    setShowOfflineBanner(!networkStatus.isOnline);
  }, [networkStatus.isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && offlineActions.length > 0) {
      syncOfflineActions();
    }
  }, [networkStatus.isOnline]);

  // Periodic sync when online
  useEffect(() => {
    if (!networkStatus.isOnline || !enableOfflineActions) return;

    const interval = setInterval(() => {
      if (offlineActions.length > 0) {
        syncOfflineActions();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [networkStatus.isOnline, offlineActions.length, syncInterval, enableOfflineActions]);

  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    if (!enableOfflineActions || offlineActions.length >= maxOfflineActions) {
      return false;
    }

    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setOfflineActions(prev => [...prev, newAction]);
    return true;
  }, [enableOfflineActions, offlineActions.length, maxOfflineActions]);

  const removeOfflineAction = useCallback((actionId: string) => {
    setOfflineActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  const syncOfflineActions = useCallback(async () => {
    if (!networkStatus.isOnline || isSyncing || offlineActions.length === 0) {
      return;
    }

    setIsSyncing(true);
    const actionsToSync = [...offlineActions];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToSync) {
      try {
        // Simulate API call - replace with actual API calls
        await simulateApiCall(action);
        
        // Remove successful action
        setOfflineActions(prev => prev.filter(a => a.id !== action.id));
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        
        // Increment retry count
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
        };

        if (updatedAction.retryCount < updatedAction.maxRetries) {
          failedActions.push(updatedAction);
        } else {
          // Remove action that exceeded max retries
          setOfflineActions(prev => prev.filter(a => a.id !== action.id));
        }
      }
    }

    // Update failed actions with new retry counts
    if (failedActions.length > 0) {
      setOfflineActions(prev => 
        prev.map(action => 
          failedActions.find(failed => failed.id === action.id) || action
        )
      );
    }

    setIsSyncing(false);
    setLastSyncTime(new Date());
  }, [networkStatus.isOnline, isSyncing, offlineActions]);

  const simulateApiCall = async (action: OfflineAction): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }
  };

  const clearOfflineActions = useCallback(() => {
    setOfflineActions([]);
    set('offline_actions', [], { persistToStorage: true });
  }, [set]);

  return (
    <div className="relative">
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">You're offline</span>
              {offlineActions.length > 0 && (
                <Badge variant="secondary" className="bg-orange-600 text-white">
                  {offlineActions.length} pending actions
                </Badge>
              )}
            </div>
            {offlineActions.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={syncOfflineActions}
                disabled={isSyncing}
                className="text-white hover:bg-orange-600"
              >
                {isSyncing ? (
                  <>
                    <Sync className="h-4 w-4 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Retry Sync
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(showOfflineBanner && 'pt-12')}>
        {children}
      </div>

      {/* Offline Actions Panel (Development/Debug) */}
      {process.env.NODE_ENV === 'development' && offlineActions.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Offline Actions</span>
                <Badge variant="outline">{offlineActions.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Actions queued for sync when online
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {offlineActions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        action.type === 'create' && 'bg-green-500',
                        action.type === 'update' && 'bg-blue-500',
                        action.type === 'delete' && 'bg-red-500'
                      )} />
                      <span className="font-medium capitalize">{action.type}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      {action.retryCount > 0 && (
                        <span>{action.retryCount}/{action.maxRetries}</span>
                      )}
                      <Clock className="h-3 w-3" />
                    </div>
                  </div>
                ))}
                {offlineActions.length > 5 && (
                  <div className="text-center text-xs text-gray-500 py-1">
                    +{offlineActions.length - 5} more actions
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t">
                <div className="text-xs text-gray-500">
                  {lastSyncTime && (
                    <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={syncOfflineActions}
                    disabled={isSyncing || !networkStatus.isOnline}
                    className="text-xs h-6"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearOfflineActions}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Network status indicator component
export function NetworkStatusIndicator({ className }: { className?: string }) {
  const { networkStatus, isSlowConnection, shouldReduceData } = useNetworkStatus();

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return 'text-red-500';
    if (isSlowConnection()) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) return 'Offline';
    if (shouldReduceData()) return 'Data Saver';
    return networkStatus.effectiveType.toUpperCase();
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {networkStatus.isOnline ? (
        <Wifi className={cn('h-4 w-4', getStatusColor())} />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className={cn('text-sm font-medium', getStatusColor())}>
        {getStatusText()}
      </span>
      {shouldReduceData() && (
        <Database className="h-3 w-3 text-orange-500" />
      )}
    </div>
  );
}

// Offline-aware data fetcher hook
export function useOfflineData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime?: number;
    retryOnReconnect?: boolean;
    fallbackData?: T;
  } = {}
) {
  const { networkStatus } = useNetworkStatus();
  const { get, set } = useDataCache();
  const [data, setData] = useState<T | null>(options.fallbackData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    const cachedData = get(key);
    if (cachedData && !force) {
      setData(cachedData);
      
      // Check if data is stale
      const cacheAge = Date.now() - (cachedData.timestamp || 0);
      setIsStale(cacheAge > (options.staleTime || 5 * 60 * 1000));
      return;
    }

    if (!networkStatus.isOnline) {
      // Use cached data if available, even if stale
      if (cachedData) {
        setData(cachedData);
        setIsStale(true);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setIsStale(false);
      
      // Cache the result
      set(key, { ...result, timestamp: Date.now() }, {
        persistToStorage: true,
        priority: 'medium',
        ttl: options.staleTime || 5 * 60 * 1000,
      });
    } catch (err) {
      setError(err as Error);
      
      // Use cached data as fallback
      const cachedData = get(key);
      if (cachedData) {
        setData(cachedData);
        setIsStale(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, networkStatus.isOnline, get, set, options.staleTime]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retry when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && options.retryOnReconnect && (error || isStale)) {
      fetchData(true);
    }
  }, [networkStatus.isOnline, options.retryOnReconnect, error, isStale, fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    isOffline: !networkStatus.isOnline,
    refetch,
  };
}

// Offline-aware form component
export function OfflineForm({
  children,
  onSubmit,
  onOfflineSubmit,
  className,
}: {
  children: React.ReactNode;
  onSubmit: (data: any) => Promise<void>;
  onOfflineSubmit?: (data: any) => void;
  className?: string;
}) {
  const { networkStatus } = useNetworkStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    if (!networkStatus.isOnline) {
      onOfflineSubmit?.(data);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission failed:', error);
      onOfflineSubmit?.(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      
      {!networkStatus.isOnline && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're offline. Form data will be saved and submitted when connection is restored.
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? 'Submitting...' : networkStatus.isOnline ? 'Submit' : 'Save Offline'}
      </Button>
    </form>
  );
}