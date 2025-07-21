/**
 * Real-time Data Hook for Dashboard Widgets
 * Provides live data updates with optimistic UI and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { websocketService, DASHBOARD_EVENTS, type DashboardEventType } from '@/services/websocket'

export interface RealTimeDataConfig {
  eventType: DashboardEventType
  initialData?: any
  cacheKey?: string
  optimisticUpdates?: boolean
  refreshInterval?: number
}

export interface RealTimeDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
  isConnected: boolean
}

export function useRealTimeData<T = any>(config: RealTimeDataConfig) {
  const [state, setState] = useState<RealTimeDataState<T>>({
    data: config.initialData || null,
    loading: true,
    error: null,
    lastUpdated: null,
    isConnected: false
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update data with optimistic UI support
  const updateData = useCallback((newData: T, isOptimistic = false) => {
    setState(prev => ({
      ...prev,
      data: newData,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    }))

    // Cache the data if cache key is provided
    if (config.cacheKey) {
      cacheRef.current.set(config.cacheKey, {
        data: newData,
        timestamp: Date.now()
      })
    }

    // If this is an optimistic update, set a timer to revert if no confirmation
    if (isOptimistic && config.optimisticUpdates) {
      setTimeout(() => {
        // Check if we received a real update in the meantime
        const cached = config.cacheKey ? cacheRef.current.get(config.cacheKey) : null
        if (!cached || Date.now() - cached.timestamp > 5000) {
          // Revert optimistic update
          setState(prev => ({
            ...prev,
            error: 'Update failed - reverting changes'
          }))
        }
      }, 5000)
    }
  }, [config.cacheKey, config.optimisticUpdates])

  // Handle WebSocket messages
  const handleMessage = useCallback((payload: any) => {
    updateData(payload)
  }, [updateData])

  // Handle connection status changes
  const handleConnectionChange = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: websocketService.getConnectionStatus()
    }))
  }, [])

  // Initialize WebSocket connection and subscription
  useEffect(() => {
    // Set up WebSocket handlers
    websocketService.setHandlers({
      onConnect: handleConnectionChange,
      onDisconnect: handleConnectionChange,
      onError: (error) => {
        setState(prev => ({
          ...prev,
          error: 'Connection error',
          loading: false
        }))
      }
    })

    // Connect if not already connected
    if (!websocketService.getConnectionStatus()) {
      websocketService.connect().catch((error) => {
        setState(prev => ({
          ...prev,
          error: 'Failed to connect to real-time service',
          loading: false
        }))
      })
    }

    // Subscribe to specific event type
    unsubscribeRef.current = websocketService.subscribe(config.eventType, handleMessage)

    // Set up periodic refresh if configured
    if (config.refreshInterval) {
      refreshTimerRef.current = setInterval(() => {
        // Request fresh data
        websocketService.send('request_data', {
          type: config.eventType,
          cacheKey: config.cacheKey
        })
      }, config.refreshInterval)
    }

    // Load cached data if available
    if (config.cacheKey) {
      const cached = cacheRef.current.get(config.cacheKey)
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        updateData(cached.data)
      }
    }

    // Initial connection status
    handleConnectionChange()

    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [config.eventType, config.cacheKey, config.refreshInterval, handleMessage, handleConnectionChange, updateData])

  // Manual refresh function
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }))
    websocketService.send('request_data', {
      type: config.eventType,
      cacheKey: config.cacheKey
    })
  }, [config.eventType, config.cacheKey])

  // Optimistic update function
  const optimisticUpdate = useCallback((newData: T) => {
    if (config.optimisticUpdates) {
      updateData(newData, true)
    }
  }, [config.optimisticUpdates, updateData])

  return {
    ...state,
    refresh,
    optimisticUpdate
  }
}

// Specialized hooks for different widget types
export function useRideStatusData(rideId?: string) {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.RIDE_STATUS_UPDATE,
    cacheKey: rideId ? `ride_${rideId}` : undefined,
    optimisticUpdates: true,
    refreshInterval: 10000 // 10 seconds
  })
}

export function useDriverLocationData(driverId?: string) {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.DRIVER_LOCATION_UPDATE,
    cacheKey: driverId ? `driver_location_${driverId}` : undefined,
    refreshInterval: 5000 // 5 seconds
  })
}

export function useEarningsData(driverId?: string) {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.EARNINGS_UPDATE,
    cacheKey: driverId ? `earnings_${driverId}` : undefined,
    optimisticUpdates: true,
    refreshInterval: 30000 // 30 seconds
  })
}

export function useFleetStatusData() {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.FLEET_STATUS_UPDATE,
    cacheKey: 'fleet_status',
    refreshInterval: 15000 // 15 seconds
  })
}

export function useSystemAlertsData() {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.SYSTEM_ALERT,
    cacheKey: 'system_alerts',
    refreshInterval: 60000 // 1 minute
  })
}

export function usePerformanceMetricsData(userId?: string) {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.PERFORMANCE_METRICS,
    cacheKey: userId ? `performance_${userId}` : undefined,
    refreshInterval: 60000 // 1 minute
  })
}