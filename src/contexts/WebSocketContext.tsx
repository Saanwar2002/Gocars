/**
 * WebSocket Context Provider
 * Provides WebSocket functionality throughout the React app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { WebSocketClient, webSocketClientManager, ConnectionStatus } from '@/lib/websocket/websocket-client'
import { WebSocketMessage } from '@/lib/websocket/websocket-server'

// WebSocket Context Type
interface WebSocketContextType {
  client: WebSocketClient | null
  connectionStatus: ConnectionStatus
  isConnected: boolean
  error: Error | null
  sendMessage: (message: WebSocketMessage) => void
  joinRoom: (roomId: string, roomType: string) => void
  leaveRoom: (roomId: string) => void
  updateLocation: (location: { lat: number; lng: number; heading?: number }) => void
  updateRideStatus: (rideId: string, status: string, metadata?: any) => void
  updateDriverStatus: (status: 'online' | 'offline' | 'busy', location?: any) => void
  subscribe: (event: string, callback: (data: any) => void) => () => void
  getConnectionInfo: () => any
}

// Create Context
const WebSocketContext = createContext<WebSocketContextType | null>(null)

// WebSocket Provider Props
interface WebSocketProviderProps {
  children: ReactNode
}

// WebSocket Provider Component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [client, setClient] = useState<WebSocketClient | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialize WebSocket client when user is authenticated
  useEffect(() => {
    if (!user?.uid || !user?.role) {
      // Clean up if user is not authenticated
      if (client) {
        client.disconnect()
        setClient(null)
        setConnectionStatus('disconnected')
        setIsConnected(false)
        setError(null)
      }
      return
    }

    // Get device info
    const deviceInfo = {
      type: getDeviceType(),
      os: getOS(),
      browser: getBrowser()
    }

    // Get or create WebSocket client
    const wsClient = webSocketClientManager.getClient(user.uid, user.role, deviceInfo)
    
    // Set event handlers
    wsClient.setEventHandlers({
      onConnect: () => {
        console.log('WebSocket connected for user:', user.uid)
        setConnectionStatus('connected')
        setIsConnected(true)
        setError(null)
      },
      onDisconnect: (reason) => {
        console.log('WebSocket disconnected:', reason)
        setConnectionStatus('disconnected')
        setIsConnected(false)
      },
      onReconnect: (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`)
        setConnectionStatus('connected')
        setIsConnected(true)
        setError(null)
      },
      onError: (err) => {
        console.error('WebSocket error:', err)
        setError(err)
        setConnectionStatus('error')
        setIsConnected(false)
      },
      onMessage: (message) => {
        console.log('WebSocket message received:', message)
      },
      onNotification: (notification) => {
        console.log('WebSocket notification received:', notification)
        // You can add toast notifications here
      }
    })

    setClient(wsClient)

    // Connect to WebSocket server
    wsClient.connect().catch((err) => {
      console.error('Failed to connect WebSocket:', err)
      setError(err)
    })

    // Cleanup function
    return () => {
      // Don't disconnect immediately as other components might be using it
      // The client manager handles cleanup when needed
    }
  }, [user?.uid, user?.role])

  // Context value
  const contextValue: WebSocketContextType = {
    client,
    connectionStatus,
    isConnected,
    error,
    sendMessage: (message: WebSocketMessage) => {
      client?.sendMessage(message)
    },
    joinRoom: (roomId: string, roomType: string) => {
      client?.joinRoom(roomId, roomType)
    },
    leaveRoom: (roomId: string) => {
      client?.leaveRoom(roomId)
    },
    updateLocation: (location: { lat: number; lng: number; heading?: number }) => {
      client?.updateLocation(location)
    },
    updateRideStatus: (rideId: string, status: string, metadata?: any) => {
      client?.updateRideStatus(rideId, status, metadata)
    },
    updateDriverStatus: (status: 'online' | 'offline' | 'busy', location?: any) => {
      client?.updateDriverStatus(status, location)
    },
    subscribe: (event: string, callback: (data: any) => void) => {
      return client?.subscribe(event, callback) || (() => {})
    },
    getConnectionInfo: () => {
      return client?.getConnectionInfo() || null
    }
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Hook to use WebSocket context
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// Utility functions for device detection
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop'
  
  const userAgent = window.navigator.userAgent
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet'
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile'
  }
  
  return 'desktop'
}

function getOS(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = window.navigator.userAgent
  
  if (userAgent.indexOf('Win') !== -1) return 'Windows'
  if (userAgent.indexOf('Mac') !== -1) return 'macOS'
  if (userAgent.indexOf('Linux') !== -1) return 'Linux'
  if (userAgent.indexOf('Android') !== -1) return 'Android'
  if (userAgent.indexOf('like Mac') !== -1) return 'iOS'
  
  return 'unknown'
}

function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = window.navigator.userAgent
  
  if (userAgent.indexOf('Chrome') !== -1) return 'Chrome'
  if (userAgent.indexOf('Firefox') !== -1) return 'Firefox'
  if (userAgent.indexOf('Safari') !== -1) return 'Safari'
  if (userAgent.indexOf('Edge') !== -1) return 'Edge'
  if (userAgent.indexOf('Opera') !== -1) return 'Opera'
  
  return 'unknown'
}

// Connection Status Component
interface ConnectionStatusProps {
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const { connectionStatus, isConnected, error } = useWebSocketContext()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500'
      case 'disconnected':
        return 'text-gray-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
      <span className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {error && (
        <span className="text-xs text-red-500" title={error.message}>
          ⚠️
        </span>
      )}
    </div>
  )
}

export default WebSocketProvider