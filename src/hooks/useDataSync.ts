'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface SyncData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  deviceId: string;
  userId: string;
  version: number;
  checksum: string;
}

interface SyncConflict {
  id: string;
  localData: SyncData;
  remoteData: SyncData;
  conflictType: 'version' | 'timestamp' | 'concurrent';
  resolved: boolean;
}

interface SyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  conflicts: SyncConflict[];
  syncErrors: string[];
}

interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  conflictResolution?: 'local' | 'remote' | 'manual' | 'merge';
  enableRealtime?: boolean;
  maxRetries?: number;
}

const DEFAULT_OPTIONS: SyncOptions = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'manual',
  enableRealtime: true,
  maxRetries: 3,
};

export function useDataSync(userId: string, options: SyncOptions = {}) {
  const fullOptions = { ...DEFAULT_OPTIONS, ...options };
  const { networkStatus } = useNetworkStatus();
  
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    conflicts: [],
    syncErrors: [],
  });

  const [localData, setLocalData] = useState<Map<string, SyncData>>(new Map());
  const [deviceId] = useState(() => generateDeviceId());
  
  const wsRef = useRef<WebSocket | null>(null);
  const syncQueueRef = useRef<SyncData[]>([]);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Generate unique device ID
  function generateDeviceId(): string {
    const stored = localStorage.getItem('device_id');
    if (stored) return stored;
    
    const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', newId);
    return newId;
  }

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }, []);

  // Create sync data object
  const createSyncData = useCallback((id: string, type: string, data: any): SyncData => {
    return {
      id,
      type,
      data,
      timestamp: Date.now(),
      deviceId,
      userId,
      version: 1,
      checksum: generateChecksum(data),
    };
  }, [deviceId, userId, generateChecksum]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!networkStatus.isOnline || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // In a real implementation, this would be your WebSocket server URL
      const wsUrl = `wss://api.gocars.com/sync?userId=${userId}&deviceId=${deviceId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Sync WebSocket connected');
        setSyncState(prev => ({ ...prev, isConnected: true, syncErrors: [] }));
        
        // Send any queued changes
        if (syncQueueRef.current.length > 0) {
          syncQueueRef.current.forEach(data => {
            wsRef.current?.send(JSON.stringify({ type: 'sync', data }));
          });
          syncQueueRef.current = [];
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Sync WebSocket disconnected');
        setSyncState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect after delay
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Sync WebSocket error:', error);
        setSyncState(prev => ({ 
          ...prev, 
          syncErrors: [...prev.syncErrors, 'WebSocket connection error']
        }));
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setSyncState(prev => ({ 
        ...prev, 
        syncErrors: [...prev.syncErrors, 'Failed to establish connection']
      }));
    }
  }, [networkStatus.isOnline, userId, deviceId]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'sync_data':
        handleRemoteDataUpdate(message.data);
        break;
      case 'sync_conflict':
        handleSyncConflict(message.conflict);
        break;
      case 'sync_ack':
        handleSyncAcknowledgment(message.id);
        break;
      case 'ping':
        wsRef.current?.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Handle remote data updates
  const handleRemoteDataUpdate = useCallback((remoteData: SyncData) => {
    const localItem = localData.get(remoteData.id);
    
    if (!localItem) {
      // New data from remote
      setLocalData(prev => new Map(prev).set(remoteData.id, remoteData));
      return;
    }

    // Check for conflicts
    if (localItem.version !== remoteData.version || 
        localItem.timestamp > remoteData.timestamp) {
      
      const conflict: SyncConflict = {
        id: remoteData.id,
        localData: localItem,
        remoteData,
        conflictType: localItem.version !== remoteData.version ? 'version' : 'timestamp',
        resolved: false,
      };

      setSyncState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflict],
      }));

      // Auto-resolve based on strategy
      if (fullOptions.conflictResolution !== 'manual') {
        resolveConflict(conflict.id, fullOptions.conflictResolution);
      }
    } else {
      // No conflict, update local data
      setLocalData(prev => new Map(prev).set(remoteData.id, remoteData));
    }
  }, [localData, fullOptions.conflictResolution]);

  // Handle sync conflicts
  const handleSyncConflict = useCallback((conflict: SyncConflict) => {
    setSyncState(prev => ({
      ...prev,
      conflicts: [...prev.conflicts, conflict],
    }));
  }, []);

  // Handle sync acknowledgments
  const handleSyncAcknowledgment = useCallback((id: string) => {
    retryCountRef.current.delete(id);
    setSyncState(prev => ({
      ...prev,
      pendingChanges: Math.max(0, prev.pendingChanges - 1),
    }));
  }, []);

  // Sync data to remote
  const syncToRemote = useCallback(async (data: SyncData) => {
    if (!networkStatus.isOnline) {
      // Queue for later sync
      syncQueueRef.current.push(data);
      setSyncState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send via WebSocket for real-time sync
      wsRef.current.send(JSON.stringify({ type: 'sync', data }));
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.conflict) {
          handleSyncConflict(result.conflict);
        }
      } catch (error) {
        console.error('HTTP sync failed:', error);
        
        // Retry logic
        const retryCount = retryCountRef.current.get(data.id) || 0;
        if (retryCount < fullOptions.maxRetries!) {
          retryCountRef.current.set(data.id, retryCount + 1);
          setTimeout(() => syncToRemote(data), Math.pow(2, retryCount) * 1000);
        } else {
          setSyncState(prev => ({
            ...prev,
            syncErrors: [...prev.syncErrors, `Failed to sync ${data.id} after ${fullOptions.maxRetries} retries`],
          }));
        }
      }
    }
  }, [networkStatus.isOnline, fullOptions.maxRetries]);

  // Update local data and sync
  const updateData = useCallback(async (id: string, type: string, data: any) => {
    const syncData = createSyncData(id, type, data);
    
    // Update local data immediately
    setLocalData(prev => new Map(prev).set(id, syncData));
    
    // Sync to remote
    await syncToRemote(syncData);
  }, [createSyncData, syncToRemote]);

  // Delete data and sync
  const deleteData = useCallback(async (id: string) => {
    // Remove from local data
    setLocalData(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    // Create deletion sync data
    const syncData = createSyncData(id, 'delete', null);
    await syncToRemote(syncData);
  }, [createSyncData, syncToRemote]);

  // Resolve sync conflict
  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    setSyncState(prev => {
      const conflict = prev.conflicts.find(c => c.id === conflictId);
      if (!conflict) return prev;

      let resolvedData: SyncData;

      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          // Simple merge strategy - in practice, this would be more sophisticated
          resolvedData = {
            ...conflict.remoteData,
            data: { ...conflict.remoteData.data, ...conflict.localData.data },
            version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
            timestamp: Date.now(),
            checksum: generateChecksum({ ...conflict.remoteData.data, ...conflict.localData.data }),
          };
          break;
        default:
          return prev;
      }

      // Update local data
      setLocalData(prevData => new Map(prevData).set(conflictId, resolvedData));
      
      // Sync resolved data
      syncToRemote(resolvedData);

      // Remove conflict
      return {
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
      };
    });
  }, [generateChecksum, syncToRemote]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      // Sync all local data
      const syncPromises = Array.from(localData.values()).map(data => syncToRemote(data));
      await Promise.all(syncPromises);

      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        syncErrors: [],
      }));
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        syncErrors: [...prev.syncErrors, 'Manual sync failed'],
      }));
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [syncState.isSyncing, localData, syncToRemote]);

  // Get data by ID
  const getData = useCallback((id: string) => {
    return localData.get(id);
  }, [localData]);

  // Get all data of a specific type
  const getDataByType = useCallback((type: string) => {
    return Array.from(localData.values()).filter(item => item.type === type);
  }, [localData]);

  // Clear all sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncState(prev => ({ ...prev, syncErrors: [] }));
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (fullOptions.enableRealtime && networkStatus.isOnline) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fullOptions.enableRealtime, networkStatus.isOnline, connectWebSocket]);

  // Auto-sync interval
  useEffect(() => {
    if (!fullOptions.autoSync) return;

    const interval = setInterval(() => {
      if (networkStatus.isOnline && !syncState.isSyncing) {
        triggerSync();
      }
    }, fullOptions.syncInterval);

    return () => clearInterval(interval);
  }, [fullOptions.autoSync, fullOptions.syncInterval, networkStatus.isOnline, syncState.isSyncing, triggerSync]);

  // Sync when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && syncQueueRef.current.length > 0) {
      triggerSync();
    }
  }, [networkStatus.isOnline, triggerSync]);

  return {
    syncState,
    deviceId,
    updateData,
    deleteData,
    getData,
    getDataByType,
    resolveConflict,
    triggerSync,
    clearSyncErrors,
    localData: Array.from(localData.values()),
  };
}