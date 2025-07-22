/**
 * WebSocket Server Implementation for GoCars Real-time Features
 * Handles real-time communication for ride updates, chat, and notifications
 */

import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'location_update' | 'ride_status' | 'chat_message' | 'notification' | 'driver_status' | 'booking_update'
  payload: any
  timestamp: number
  userId: string
  roomId?: string
  metadata?: Record<string, unknown>
}

// Connection Management
export interface ConnectionInfo {
  userId: string
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  socketId: string
  connectedAt: Date
  lastActivity: Date
  rooms: string[]
  deviceInfo?: {
    type: 'mobile' | 'desktop' | 'tablet'
    os: string
    browser: string
  }
}

// Room Management
export interface RoomInfo {
  id: string
  type: 'ride' | 'chat' | 'fleet' | 'admin'
  participants: string[]
  createdAt: Date
  metadata?: Record<string, unknown>
}

class WebSocketServer {
  private io: SocketIOServer | null = null
  private connections: Map<string, ConnectionInfo> = new Map()
  private rooms: Map<string, RoomInfo> = new Map()
  private messageQueue: Map<string, WebSocketMessage[]> = new Map()

  constructor() {
    this.setupEventHandlers()
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: any): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupSocketHandlers()
    console.log('WebSocket server initialized')
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Handle user authentication and registration
      socket.on('authenticate', (data: { userId: string; userRole: string; deviceInfo?: any }) => {
        this.handleAuthentication(socket, data)
      })

      // Handle joining rooms
      socket.on('join_room', (data: { roomId: string; roomType: string }) => {
        this.handleJoinRoom(socket, data)
      })

      // Handle leaving rooms
      socket.on('leave_room', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data)
      })

      // Handle message sending
      socket.on('send_message', (message: WebSocketMessage) => {
        this.handleMessage(socket, message)
      })

      // Handle location updates
      socket.on('location_update', (data: { lat: number; lng: number; heading?: number }) => {
        this.handleLocationUpdate(socket, data)
      })

      // Handle ride status updates
      socket.on('ride_status_update', (data: { rideId: string; status: string; metadata?: any }) => {
        this.handleRideStatusUpdate(socket, data)
      })

      // Handle driver status updates
      socket.on('driver_status_update', (data: { status: 'online' | 'offline' | 'busy'; location?: any }) => {
        this.handleDriverStatusUpdate(socket, data)
      })

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason)
      })

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong')
        this.updateLastActivity(socket.id)
      })
    })
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(socket: any, data: { userId: string; userRole: string; deviceInfo?: any }): void {
    const connectionInfo: ConnectionInfo = {
      userId: data.userId,
      userRole: data.userRole as any,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: [],
      deviceInfo: data.deviceInfo
    }

    this.connections.set(socket.id, connectionInfo)
    
    // Join user to their personal room
    socket.join(`user_${data.userId}`)
    
    // Join role-based room
    socket.join(`role_${data.userRole}`)

    // Send queued messages if any
    this.sendQueuedMessages(data.userId, socket)

    socket.emit('authenticated', { success: true, connectionId: socket.id })
    console.log(`User authenticated: ${data.userId} (${data.userRole})`)
  }

  /**
   * Handle joining rooms
   */
  private handleJoinRoom(socket: any, data: { roomId: string; roomType: string }): void {
    const connection = this.connections.get(socket.id)
    if (!connection) return

    socket.join(data.roomId)
    connection.rooms.push(data.roomId)

    // Update or create room info
    if (!this.rooms.has(data.roomId)) {
      this.rooms.set(data.roomId, {
        id: data.roomId,
        type: data.roomType as any,
        participants: [connection.userId],
        createdAt: new Date()
      })
    } else {
      const room = this.rooms.get(data.roomId)!
      if (!room.participants.includes(connection.userId)) {
        room.participants.push(connection.userId)
      }
    }

    socket.emit('room_joined', { roomId: data.roomId, success: true })
    socket.to(data.roomId).emit('user_joined_room', { 
      userId: connection.userId, 
      userRole: connection.userRole 
    })
  }

  /**
   * Handle leaving rooms
   */
  private handleLeaveRoom(socket: any, data: { roomId: string }): void {
    const connection = this.connections.get(socket.id)
    if (!connection) return

    socket.leave(data.roomId)
    connection.rooms = connection.rooms.filter(room => room !== data.roomId)

    // Update room info
    const room = this.rooms.get(data.roomId)
    if (room) {
      room.participants = room.participants.filter(userId => userId !== connection.userId)
      if (room.participants.length === 0) {
        this.rooms.delete(data.roomId)
      }
    }

    socket.emit('room_left', { roomId: data.roomId, success: true })
    socket.to(data.roomId).emit('user_left_room', { 
      userId: connection.userId, 
      userRole: connection.userRole 
    })
  }

  /**
   * Handle message broadcasting
   */
  private handleMessage(socket: any, message: WebSocketMessage): void {
    const connection = this.connections.get(socket.id)
    if (!connection) return

    // Add sender info to message
    const enrichedMessage: WebSocketMessage = {
      ...message,
      userId: connection.userId,
      timestamp: Date.now(),
      metadata: {
        ...message.metadata,
        senderRole: connection.userRole,
        socketId: socket.id
      }
    }

    // Broadcast to room or specific user
    if (message.roomId) {
      socket.to(message.roomId).emit('message', enrichedMessage)
    } else {
      // Broadcast to all connected clients (admin feature)
      socket.broadcast.emit('message', enrichedMessage)
    }

    // Store message for offline users if needed
    this.storeMessageForOfflineUsers(enrichedMessage)
  }

  /**
   * Handle location updates
   */
  private handleLocationUpdate(socket: any, data: { lat: number; lng: number; heading?: number }): void {
    const connection = this.connections.get(socket.id)
    if (!connection) return

    const locationMessage: WebSocketMessage = {
      type: 'location_update',
      payload: {
        userId: connection.userId,
        location: data,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId: connection.userId
    }

    // Broadcast to relevant rooms (active rides, fleet management)
    connection.rooms.forEach(roomId => {
      socket.to(roomId).emit('location_update', locationMessage)
    })

    // Update last activity
    this.updateLastActivity(socket.id)
  }

  /**
   * Handle ride status updates
   */
  private handleRideStatusUpdate(socket: any, data: { rideId: string; status: string; metadata?: any }): void {
    const connection = this.connections.get(socket.id)
    if (!connection) return

    const statusMessage: WebSocketMessage = {
      type: 'ride_status',
      payload: {
        rideId: data.rideId,
        status: data.status,
        updatedBy: connection.userId,
        metadata: data.metadata
      },
      timestamp: Date.now(),
      userId: connection.userId,
      roomId: `ride_${data.rideId}`
    }

    // Broadcast to ride room
    this.io?.to(`ride_${data.rideId}`).emit('ride_status_update', statusMessage)

    // Notify operators and admins
    this.io?.to('role_operator').emit('ride_status_update', statusMessage)
    this.io?.to('role_admin').emit('ride_status_update', statusMessage)
  }

  /**
   * Handle driver status updates
   */
  private handleDriverStatusUpdate(socket: any, data: { status: 'online' | 'offline' | 'busy'; location?: any }): void {
    const connection = this.connections.get(socket.id)
    if (!connection || connection.userRole !== 'driver') return

    const statusMessage: WebSocketMessage = {
      type: 'driver_status',
      payload: {
        driverId: connection.userId,
        status: data.status,
        location: data.location,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId: connection.userId
    }

    // Broadcast to operators and admins
    this.io?.to('role_operator').emit('driver_status_update', statusMessage)
    this.io?.to('role_admin').emit('driver_status_update', statusMessage)
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: any, reason: string): void {
    const connection = this.connections.get(socket.id)
    if (connection) {
      console.log(`User disconnected: ${connection.userId} (${reason})`)
      
      // Notify rooms about user leaving
      connection.rooms.forEach(roomId => {
        socket.to(roomId).emit('user_disconnected', {
          userId: connection.userId,
          userRole: connection.userRole
        })
      })

      // Clean up connection
      this.connections.delete(socket.id)
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(socketId: string): void {
    const connection = this.connections.get(socketId)
    if (connection) {
      connection.lastActivity = new Date()
    }
  }

  /**
   * Send queued messages to newly connected user
   */
  private sendQueuedMessages(userId: string, socket: any): void {
    const queuedMessages = this.messageQueue.get(userId)
    if (queuedMessages && queuedMessages.length > 0) {
      queuedMessages.forEach(message => {
        socket.emit('message', message)
      })
      this.messageQueue.delete(userId)
    }
  }

  /**
   * Store message for offline users
   */
  private storeMessageForOfflineUsers(message: WebSocketMessage): void {
    // Implementation would depend on your database choice
    // For now, we'll use in-memory storage
    if (message.roomId) {
      const room = this.rooms.get(message.roomId)
      if (room) {
        room.participants.forEach(userId => {
          const isOnline = Array.from(this.connections.values())
            .some(conn => conn.userId === userId)
          
          if (!isOnline) {
            if (!this.messageQueue.has(userId)) {
              this.messageQueue.set(userId, [])
            }
            this.messageQueue.get(userId)!.push(message)
          }
        })
      }
    }
  }

  /**
   * Setup periodic cleanup and health checks
   */
  private setupEventHandlers(): void {
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections()
    }, 5 * 60 * 1000)

    // Health check every minute
    setInterval(() => {
      this.performHealthCheck()
    }, 60 * 1000)
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections(): void {
    const now = new Date()
    const inactiveThreshold = 10 * 60 * 1000 // 10 minutes

    this.connections.forEach((connection, socketId) => {
      if (now.getTime() - connection.lastActivity.getTime() > inactiveThreshold) {
        console.log(`Cleaning up inactive connection: ${connection.userId}`)
        this.connections.delete(socketId)
      }
    })
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const stats = {
      totalConnections: this.connections.size,
      totalRooms: this.rooms.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      timestamp: new Date()
    }

    console.log('WebSocket Health Check:', stats)

    // Emit health stats to admin users
    this.io?.to('role_admin').emit('server_health', stats)
  }

  /**
   * Get server statistics
   */
  public getStats(): any {
    return {
      connections: this.connections.size,
      rooms: this.rooms.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      connectionsByRole: this.getConnectionsByRole(),
      roomsByType: this.getRoomsByType()
    }
  }

  /**
   * Get connections grouped by role
   */
  private getConnectionsByRole(): Record<string, number> {
    const roleCount: Record<string, number> = {}
    this.connections.forEach(connection => {
      roleCount[connection.userRole] = (roleCount[connection.userRole] || 0) + 1
    })
    return roleCount
  }

  /**
   * Get rooms grouped by type
   */
  private getRoomsByType(): Record<string, number> {
    const typeCount: Record<string, number> = {}
    this.rooms.forEach(room => {
      typeCount[room.type] = (typeCount[room.type] || 0) + 1
    })
    return typeCount
  }

  /**
   * Broadcast message to specific user
   */
  public sendToUser(userId: string, message: WebSocketMessage): void {
    this.io?.to(`user_${userId}`).emit('message', message)
  }

  /**
   * Broadcast message to specific role
   */
  public sendToRole(role: string, message: WebSocketMessage): void {
    this.io?.to(`role_${role}`).emit('message', message)
  }

  /**
   * Broadcast message to specific room
   */
  public sendToRoom(roomId: string, message: WebSocketMessage): void {
    this.io?.to(roomId).emit('message', message)
  }
}

// Singleton instance
export const webSocketServer = new WebSocketServer()

// Next.js API route handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    console.log('Setting up WebSocket server...')
    const httpServer = res.socket.server
    webSocketServer.initialize(httpServer)
    res.socket.server.io = webSocketServer
  }
  res.end()
}