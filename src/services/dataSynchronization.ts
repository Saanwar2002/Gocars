/**
 * Data Synchronization Service
 * Handles optimistic UI updates and efficient data synchronization
 */

import { websocketService, DASHBOARD_EVENTS } from './websocket'

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: number
  optimistic: boolean
  retries: number
}

export interface SyncConfig {
  maxRetries: number
  retryDelay: number
  batchSize: number
  syncInterval: number
}

class DataSynchronizationService {
  private pendingOperations = new Map<string, SyncOperation>()
  private syncQueue: SyncOperation[] = []
  private config: SyncConfig
  private syncTimer: NodeJS.Timeout | null = null
  private isOnline = true

  constructor(config: SyncConfig) {
    this.config = config
    this.setupNetworkListeners()
    this.startSyncTimer()
  }

  /**
   * Perform optimistic update
   */
  optimisticUpdate(
    entity: string,
    data: any,
    operation: 'create' | 'update' | 'delete' = 'update'
  ): string {
    const operationId = this.generateId()
    
    const syncOperation: SyncOperation = {
      id: operationId,
      type: operation,
      entity,
      data,
      timestamp: Date.now(),
      optimistic: true,
      retries: 0
    }

    // Add to pending operations
    this.pendingOperations.set(operationId, syncOperation)
    
    // Add to sync queue
    this.syncQueue.push(syncOperation)
    
    // Send immediately if online
    if (this.isOnline) {
      this.processSyncQueue()
    }

    return operationId
  }

  /**
   * Confirm optimistic update
   */
  confirmUpdate(operationId: string, serverData?: any): void {
    const operation = this.pendingOperations.get(operationId)
    if (operation) {
      // Update with server data if provided
      if (serverData) {
        operation.data = { ...operation.data, ...serverData }
      }
      
      // Remove from pending operations
      this.pendingOperations.delete(operationId)
      
      // Broadcast confirmation
      this.broadcastUpdate(operation.entity, operation.data, false)
    }
  }

  /**
   * Revert optimistic update
   */
  revertUpdate(operationId: string, reason?: string): void {
    const operation = this.pendingOperations.get(operationId)
    if (operation) {
      // Remove from pending operations
      this.pendingOperations.delete(operationId)
      
      // Remove from sync queue
      this.syncQueue = this.syncQueue.filter(op => op.id !== operationId)
      
      // Broadcast revert
      this.broadcastRevert(operation.entity, operation.data, reason)
    }
  }

  /**
   * Get pending operations for an entity
   */
  getPendingOperations(entity: string): SyncOperation[] {
    return Array.from(this.pendingOperations.values())
      .filter(op => op.entity === entity)
  }

  /**
   * Check if entity has pending operations
   */
  hasPendingOperations(entity: string): boolean {
    return this.getPendingOperations(entity).length > 0
  }

  /**
   * Process sync queue
   */
  private processSyncQueue(): void {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    // Process in batches
    const batch = this.syncQueue.splice(0, this.config.batchSize)
    
    batch.forEach(operation => {
      this.sendOperation(operation)
    })
  }

  /**
   * Send operation to server
   */
  private sendOperation(operation: SyncOperation): void {
    websocketService.send('sync_operation', {
      id: operation.id,
      type: operation.type,
      entity: operation.entity,
      data: operation.data,
      timestamp: operation.timestamp
    })

    // Set timeout for confirmation
    setTimeout(() => {
      if (this.pendingOperations.has(operation.id)) {
        this.handleOperationTimeout(operation)
      }
    }, 10000) // 10 second timeout
  }

  /**
   * Handle operation timeout
   */
  private handleOperationTimeout(operation: SyncOperation): void {
    if (operation.retries < this.config.maxRetries) {
      // Retry operation
      operation.retries++
      setTimeout(() => {
        this.sendOperation(operation)
      }, this.config.retryDelay * operation.retries)
    } else {
      // Max retries reached, revert
      this.revertUpdate(operation.id, 'Operation timeout')
    }
  }

  /**
   * Broadcast update to subscribers
   */
  private broadcastUpdate(entity: string, data: any, isOptimistic: boolean): void {
    const eventType = this.getEventTypeForEntity(entity)
    if (eventType) {
      // Simulate WebSocket message for local updates
      const message = {
        type: eventType,
        payload: {
          ...data,
          _optimistic: isOptimistic,
          _timestamp: Date.now()
        }
      }
      
      // Broadcast to local subscribers
      websocketService.subscribe(eventType, () => {})
    }
  }

  /**
   * Broadcast revert to subscribers
   */
  private broadcastRevert(entity: string, data: any, reason?: string): void {
    const eventType = this.getEventTypeForEntity(entity)
    if (eventType) {
      const message = {
        type: `${eventType}_revert`,
        payload: {
          ...data,
          _revert: true,
          _reason: reason,
          _timestamp: Date.now()
        }
      }
      
      // Broadcast revert to local subscribers
      websocketService.subscribe(`${eventType}_revert`, () => {})
    }
  }

  /**
   * Get event type for entity
   */
  private getEventTypeForEntity(entity: string): string | null {
    const entityEventMap: Record<string, string> = {
      'ride': DASHBOARD_EVENTS.RIDE_STATUS_UPDATE,
      'driver_location': DASHBOARD_EVENTS.DRIVER_LOCATION_UPDATE,
      'earnings': DASHBOARD_EVENTS.EARNINGS_UPDATE,
      'fleet_status': DASHBOARD_EVENTS.FLEET_STATUS_UPDATE,
      'system_alert': DASHBOARD_EVENTS.SYSTEM_ALERT,
      'performance_metrics': DASHBOARD_EVENTS.PERFORMANCE_METRICS
    }
    
    return entityEventMap[entity] || null
  }

  /**
   * Setup network listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processSyncQueue()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Initial online status
      this.isOnline = navigator.onLine
    }

    // Listen for WebSocket connection changes
    websocketService.setHandlers({
      onConnect: () => {
        this.isOnline = true
        this.processSyncQueue()
      },
      onDisconnect: () => {
        this.isOnline = false
      }
    })

    // Listen for sync confirmations
    websocketService.subscribe('sync_confirmation', (payload: any) => {
      this.confirmUpdate(payload.operationId, payload.data)
    })

    websocketService.subscribe('sync_error', (payload: any) => {
      this.revertUpdate(payload.operationId, payload.error)
    })
  }

  /**
   * Start sync timer
   */
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.processSyncQueue()
    }, this.config.syncInterval)
  }

  /**
   * Stop sync timer
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopSyncTimer()
    this.pendingOperations.clear()
    this.syncQueue = []
  }
}

// Default configuration
const defaultSyncConfig: SyncConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  syncInterval: 5000
}

// Singleton instance
export const dataSyncService = new DataSynchronizationService(defaultSyncConfig)

// Helper functions for common operations
export const syncHelpers = {
  updateRideStatus: (rideId: string, status: string) => {
    return dataSyncService.optimisticUpdate('ride', { id: rideId, status })
  },

  updateDriverLocation: (driverId: string, location: { lat: number; lng: number }) => {
    return dataSyncService.optimisticUpdate('driver_location', { driverId, location })
  },

  updateEarnings: (driverId: string, earnings: any) => {
    return dataSyncService.optimisticUpdate('earnings', { driverId, ...earnings })
  },

  createSystemAlert: (alert: any) => {
    return dataSyncService.optimisticUpdate('system_alert', alert, 'create')
  },

  updatePerformanceMetrics: (userId: string, metrics: any) => {
    return dataSyncService.optimisticUpdate('performance_metrics', { userId, ...metrics })
  }
}