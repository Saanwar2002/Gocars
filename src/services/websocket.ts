/**
 * WebSocket Service for Real-time Dashboard Updates
 * Handles connection management, message queuing, and data synchronization
 */

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  id: string
}

export interface ConnectionConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export interface WebSocketEventHandlers {
  onConnect?: () => void
  onDisconnect?: () => void
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onReconnect?: (attempt: number) => void
}

class WebSocketService {
  private ws: WebSocket | null = null
  private config: ConnectionConfig
  private handlers: WebSocketEventHandlers = {}
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnected = false
  private subscriptions = new Map<string, Set<(data: any) => void>>()

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url)
        
        this.ws.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.handlers.onConnect?.()
          resolve()
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.stopHeartbeat()
          this.handlers.onDisconnect?.()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          this.handlers.onError?.(error)
          reject(error)
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isConnected = false
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Send message to server
   */
  send(type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateId()
    }

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(type: string, handler: (data: any) => void): () => void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set())
    }
    
    this.subscriptions.get(type)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(type)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.subscriptions.delete(type)
        }
      }
    }
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  private handleMessage(message: WebSocketMessage): void {
    // Notify global message handler
    this.handlers.onMessage?.(message)
    
    // Notify type-specific subscribers
    const handlers = this.subscriptions.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message.payload))
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    this.handlers.onReconnect?.(this.reconnectAttempts)

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again
      })
    }, this.config.reconnectInterval)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected && this.ws) {
      const message = this.messageQueue.shift()!
      this.ws.send(JSON.stringify(message))
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Default configuration
const defaultConfig: ConnectionConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000
}

// Singleton instance
export const websocketService = new WebSocketService(defaultConfig)

// Dashboard-specific message types
export const DASHBOARD_EVENTS = {
  RIDE_STATUS_UPDATE: 'ride_status_update',
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  EARNINGS_UPDATE: 'earnings_update',
  FLEET_STATUS_UPDATE: 'fleet_status_update',
  SYSTEM_ALERT: 'system_alert',
  USER_ACTIVITY: 'user_activity',
  PERFORMANCE_METRICS: 'performance_metrics'
} as const

export type DashboardEventType = typeof DASHBOARD_EVENTS[keyof typeof DASHBOARD_EVENTS]