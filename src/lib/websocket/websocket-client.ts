/**
 * WebSocket Client Service for GoCars Real-time Features
 * Handles client-side WebSocket connections with automatic reconnection
 */

import { io, Socket } from 'socket.io-client'
import { WebSocketMessage } from './websocket-server'

// Client Configuration
interface WebSocketClientConfig {
  url: string
  userId: string
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  deviceInfo?: {
    type: 'mobile' | 'desktop' | 'tablet'
    os: string
    browser: string
  }
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectDelay?: number
}

// Event Handlers
interface WebSocketEventHandlers {
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
  onReconnect?: (attemptNumber: number) => void
  onMessage?: (message: WebSocketMessage) => void
  onLocationUpdate?: (data: any) => void
  onRideStatusUpdate?: (data: any) => void
  onDriverStatusUpdate?: (data: any) => void
  onNotification?: (data: any) => void
  onError?: (error: Error) => void
}

// Connection Status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

class WebSocketClient {
  private socket: Socket | null = null
  private config: WebSocketClientConfig
  private eventHandlers: WebSocketEventHandlers = {}
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private connectionStatus: ConnectionStatus = 'disconnected'
  private messageQueue: WebSocketMessage[] = []
  private heartbeatInterval: NodeJS.Timeout | null = null
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map()

  constructor(config: WebSocketClientConfig) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config
    }
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5
    this.reconnectDelay = config.reconnectDelay || 1000
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.connectionStatus = 'connecting'
      
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: false // We handle reconnection manually
      })

      this.setupEventListeners()

      // Handle successful connection
      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.connectionStatus = 'connected'
        this.reconnectAttempts = 0
        
        // Authenticate user
        this.authenticate()
        
        // Start heartbeat
        this.startHeartbeat()
        
        // Send queued messages
        this.sendQueuedMessages()
        
        this.eventHandlers.onConnect?.()
        resolve()
      })

      // Handle connection error
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        this.connectionStatus = 'error'
        this.eventHandlers.onError?.(error)
        
        if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        } else {
          reject(error)
        }
      })

      // Handle disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        this.connectionStatus = 'disconnected'
        this.stopHeartbeat()
        this.eventHandlers.onDisconnect?.(reason)
        
        if (this.config.autoReconnect && reason !== 'io client disconnect') {
          this.scheduleReconnect()
        }
      })
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.connectionStatus = 'disconnected'
    this.stopHeartbeat()
    this.messageQueue = []
    this.subscriptions.clear()
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Authentication response
    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data)
    })

    // Generic message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      this.eventHandlers.onMessage?.(message)
      this.notifySubscribers('message', message)
    })

    // Location updates
    this.socket.on('location_update', (data) => {
      this.eventHandlers.onLocationUpdate?.(data)
      this.notifySubscribers('location_update', data)
    })

    // Ride status updates
    this.socket.on('ride_status_update', (data) => {
      this.eventHandlers.onRideStatusUpdate?.(data)
      this.notifySubscribers('ride_status_update', data)
    })

    // Driver status updates
    this.socket.on('driver_status_update', (data) => {
      this.eventHandlers.onDriverStatusUpdate?.(data)
      this.notifySubscribers('driver_status_update', data)
    })

    // Notifications
    this.socket.on('notification', (data) => {
      this.eventHandlers.onNotification?.(data)
      this.notifySubscribers('notification', data)
    })

    // Room events
    this.socket.on('room_joined', (data) => {
      console.log('Joined room:', data)
      this.notifySubscribers('room_joined', data)
    })

    this.socket.on('room_left', (data) => {
      console.log('Left room:', data)
      this.notifySubscribers('room_left', data)
    })

    this.socket.on('user_joined_room', (data) => {
      this.notifySubscribers('user_joined_room', data)
    })

    this.socket.on('user_left_room', (data) => {
      this.notifySubscribers('user_left_room', data)
    })

    // Server health updates
    this.socket.on('server_health', (data) => {
      this.notifySubscribers('server_health', data)
    })

    // Pong response for heartbeat
    this.socket.on('pong', () => {
      // Heartbeat received
    })
  }

  /**
   * Authenticate with server
   */
  private authenticate(): void {
    if (!this.socket) return

    this.socket.emit('authenticate', {
      userId: this.config.userId,
      userRole: this.config.userRole,
      deviceInfo: this.config.deviceInfo
    })
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.connectionStatus = 'reconnecting'
    this.reconnectAttempts++
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      this.connect().then(() => {
        this.eventHandlers.onReconnect?.(this.reconnectAttempts)
      }).catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping')
      }
    }, 30000) // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Send queued messages
   */
  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  /**
   * Send message to server
   */
  public sendMessage(message: WebSocketMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', message)
    } else {
      // Queue message for later sending
      this.messageQueue.push(message)
    }
  }

  /**
   * Join a room
   */
  public joinRoom(roomId: string, roomType: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', { roomId, roomType })
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', { roomId })
    }
  }

  /**
   * Send location update
   */
  public updateLocation(location: { lat: number; lng: number; heading?: number }): void {
    if (this.socket?.connected) {
      this.socket.emit('location_update', location)
    }
  }

  /**
   * Update ride status
   */
  public updateRideStatus(rideId: string, status: string, metadata?: any): void {
    if (this.socket?.connected) {
      this.socket.emit('ride_status_update', { rideId, status, metadata })
    }
  }

  /**
   * Update driver status
   */
  public updateDriverStatus(status: 'online' | 'offline' | 'busy', location?: any): void {
    if (this.socket?.connected) {
      this.socket.emit('driver_status_update', { status, location })
    }
  }

  /**
   * Subscribe to specific events
   */
  public subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set())
    }
    
    this.subscriptions.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(event)?.delete(callback)
    }
  }

  /**
   * Notify subscribers of events
   */
  private notifySubscribers(event: string, data: any): void {
    const subscribers = this.subscriptions.get(event)
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event subscriber for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket ID
   */
  public getSocketId(): string | undefined {
    return this.socket?.id
  }

  /**
   * Get connection info
   */
  public getConnectionInfo(): any {
    return {
      connected: this.isConnected(),
      status: this.connectionStatus,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscriptions: Array.from(this.subscriptions.keys())
    }
  }
}

// WebSocket Client Manager
class WebSocketClientManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private defaultConfig: Partial<WebSocketClientConfig> = {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000
  }

  /**
   * Create or get WebSocket client for user
   */
  public getClient(userId: string, userRole: string, deviceInfo?: any): WebSocketClient {
    if (!this.clients.has(userId)) {
      const config: WebSocketClientConfig = {
        ...this.defaultConfig,
        userId,
        userRole: userRole as any,
        deviceInfo,
        url: this.defaultConfig.url!
      }
      
      const client = new WebSocketClient(config)
      this.clients.set(userId, client)
    }
    
    return this.clients.get(userId)!
  }

  /**
   * Remove client
   */
  public removeClient(userId: string): void {
    const client = this.clients.get(userId)
    if (client) {
      client.disconnect()
      this.clients.delete(userId)
    }
  }

  /**
   * Get all clients
   */
  public getAllClients(): Map<string, WebSocketClient> {
    return this.clients
  }

  /**
   * Disconnect all clients
   */
  public disconnectAll(): void {
    this.clients.forEach(client => client.disconnect())
    this.clients.clear()
  }
}

// Singleton instance
export const webSocketClientManager = new WebSocketClientManager()

// Export types and classes
export { WebSocketClient, WebSocketClientManager }
export type { WebSocketClientConfig, WebSocketEventHandlers, ConnectionStatus }