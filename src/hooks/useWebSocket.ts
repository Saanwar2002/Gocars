/**
 * React Hooks for WebSocket Integration
 * Provides easy-to-use hooks for real-time features
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { webSocketClientManager, WebSocketClient, ConnectionStatus } from '@/lib/websocket/websocket-client'
import { WebSocketMessage } from '@/lib/websocket/websocket-server'

// Hook for basic WebSocket connection
export function useWebSocket(userId: string, userRole: string, deviceInfo?: any) {
  const [client, setClient] = useState<WebSocketClient | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !userRole) return

    const wsClient = webSocketClientManager.getClient(userId, userRole, deviceInfo)
    
    // Set event handlers
    wsClient.setEventHandlers({
      onConnect: () => {
        setConnectionStatus('connected')
        setIsConnected(true)
        setError(null)
      },
      onDisconnect: (reason) => {
        setConnectionStatus('disconnected')
        setIsConnected(false)
        console.log('WebSocket disconnected:', reason)
      },
      onReconnect: (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`)
        setConnectionStatus('connected')
        setIsConnected(true)
        setError(null)
      },
      onError: (err) => {
        setError(err)
        setConnectionStatus('error')
        setIsConnected(false)
      }
    })

    setClient(wsClient)

    // Connect
    wsClient.connect().catch((err) => {
      console.error('Failed to connect WebSocket:', err)
      setError(err)
    })

    return () => {
      // Don't disconnect on unmount as other components might be using it
      // webSocketClientManager.removeClient(userId)
    }
  }, [userId, userRole, deviceInfo])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    client?.sendMessage(message)
  }, [client])

  const joinRoom = useCallback((roomId: string, roomType: string) => {
    client?.joinRoom(roomId, roomType)
  }, [client])

  const leaveRoom = useCallback((roomId: string) => {
    client?.leaveRoom(roomId)
  }, [client])

  const updateLocation = useCallback((location: { lat: number; lng: number; heading?: number }) => {
    client?.updateLocation(location)
  }, [client])

  const updateRideStatus = useCallback((rideId: string, status: string, metadata?: any) => {
    client?.updateRideStatus(rideId, status, metadata)
  }, [client])

  const updateDriverStatus = useCallback((status: 'online' | 'offline' | 'busy', location?: any) => {
    client?.updateDriverStatus(status, location)
  }, [client])

  return {
    client,
    connectionStatus,
    isConnected,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    updateLocation,
    updateRideStatus,
    updateDriverStatus
  }
}

// Hook for subscribing to specific WebSocket events
export function useWebSocketSubscription<T = any>(
  userId: string,
  userRole: string,
  event: string,
  callback: (data: T) => void,
  dependencies: any[] = []
) {
  const callbackRef = useRef(callback)
  const [data, setData] = useState<T | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!userId || !userRole) return

    const client = webSocketClientManager.getClient(userId, userRole)
    
    const unsubscribe = client.subscribe(event, (eventData: T) => {
      setData(eventData)
      setLastUpdate(new Date())
      callbackRef.current(eventData)
    })

    return unsubscribe
  }, [userId, userRole, event, ...dependencies])

  return { data, lastUpdate }
}

// Hook for real-time location tracking
export function useLocationTracking(userId: string, userRole: string) {
  const [locations, setLocations] = useState<Map<string, any>>(new Map())
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number; heading?: number } | null>(null)

  const { updateLocation } = useWebSocket(userId, userRole)

  // Subscribe to location updates
  useWebSocketSubscription(userId, userRole, 'location_update', (data: any) => {
    if (data.payload?.userId && data.payload?.location) {
      setLocations(prev => new Map(prev.set(data.payload.userId, {
        ...data.payload.location,
        timestamp: data.timestamp,
        userId: data.payload.userId
      })))
    }
  })

  // Function to update own location
  const updateMyLocation = useCallback((location: { lat: number; lng: number; heading?: number }) => {
    setMyLocation(location)
    updateLocation(location)
  }, [updateLocation])

  // Get location for specific user
  const getLocationForUser = useCallback((targetUserId: string) => {
    return locations.get(targetUserId)
  }, [locations])

  return {
    locations: Array.from(locations.values()),
    myLocation,
    updateMyLocation,
    getLocationForUser
  }
}

// Hook for ride status tracking
export function useRideTracking(userId: string, userRole: string, rideId?: string) {
  const [rideStatus, setRideStatus] = useState<any>(null)
  const [rideHistory, setRideHistory] = useState<any[]>([])

  const { updateRideStatus, joinRoom, leaveRoom } = useWebSocket(userId, userRole)

  // Subscribe to ride status updates
  useWebSocketSubscription(userId, userRole, 'ride_status_update', (data: any) => {
    if (!rideId || data.payload?.rideId === rideId) {
      setRideStatus(data.payload)
      setRideHistory(prev => [...prev, data.payload].slice(-50)) // Keep last 50 updates
    }
  })

  // Join ride room when rideId changes
  useEffect(() => {
    if (rideId) {
      joinRoom(`ride_${rideId}`, 'ride')
      return () => {
        leaveRoom(`ride_${rideId}`)
      }
    }
  }, [rideId, joinRoom, leaveRoom])

  const updateStatus = useCallback((status: string, metadata?: any) => {
    if (rideId) {
      updateRideStatus(rideId, status, metadata)
    }
  }, [rideId, updateRideStatus])

  return {
    rideStatus,
    rideHistory,
    updateStatus
  }
}

// Hook for driver status management
export function useDriverStatus(userId: string, userRole: string) {
  const [driverStatuses, setDriverStatuses] = useState<Map<string, any>>(new Map())
  const [myStatus, setMyStatus] = useState<'online' | 'offline' | 'busy'>('offline')

  const { updateDriverStatus } = useWebSocket(userId, userRole)

  // Subscribe to driver status updates
  useWebSocketSubscription(userId, userRole, 'driver_status_update', (data: any) => {
    if (data.payload?.driverId) {
      setDriverStatuses(prev => new Map(prev.set(data.payload.driverId, {
        ...data.payload,
        timestamp: data.timestamp
      })))
    }
  })

  const updateMyStatus = useCallback((status: 'online' | 'offline' | 'busy', location?: any) => {
    setMyStatus(status)
    updateDriverStatus(status, location)
  }, [updateDriverStatus])

  const getDriverStatus = useCallback((driverId: string) => {
    return driverStatuses.get(driverId)
  }, [driverStatuses])

  return {
    driverStatuses: Array.from(driverStatuses.values()),
    myStatus,
    updateMyStatus,
    getDriverStatus
  }
}

// Hook for real-time notifications
export function useNotifications(userId: string, userRole: string) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useWebSocketSubscription(userId, userRole, 'notification', (data: any) => {
    setNotifications(prev => [data, ...prev].slice(0, 100)) // Keep last 100 notifications
    setUnreadCount(prev => prev + 1)
  })

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ))
    } else {
      // Mark all as read
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      setUnreadCount(0)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications
  }
}

// Hook for chat functionality
export function useChat(userId: string, userRole: string, roomId?: string) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [isTyping, setIsTyping] = useState<string[]>([])

  const { sendMessage, joinRoom, leaveRoom } = useWebSocket(userId, userRole)

  // Subscribe to messages
  useWebSocketSubscription(userId, userRole, 'message', (message: WebSocketMessage) => {
    if (!roomId || message.roomId === roomId) {
      setMessages(prev => [...prev, message].slice(-100)) // Keep last 100 messages
    }
  })

  // Join chat room
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId, 'chat')
      return () => {
        leaveRoom(roomId)
      }
    }
  }, [roomId, joinRoom, leaveRoom])

  const sendChatMessage = useCallback((content: string, type: 'text' | 'image' | 'location' = 'text') => {
    if (!roomId) return

    const message: WebSocketMessage = {
      type: 'chat_message',
      payload: {
        content,
        messageType: type,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId,
      roomId
    }

    sendMessage(message)
  }, [roomId, userId, sendMessage])

  return {
    messages,
    isTyping,
    sendChatMessage
  }
}

// Hook for system health monitoring (admin only)
export function useSystemHealth(userId: string, userRole: string) {
  const [healthData, setHealthData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useWebSocketSubscription(userId, userRole, 'server_health', (data: any) => {
    if (userRole === 'admin') {
      setHealthData(data)
      setLastUpdate(new Date())
    }
  })

  return {
    healthData,
    lastUpdate,
    isHealthy: healthData?.totalConnections !== undefined
  }
}