/**
 * Real-time Event System for GoCars
 * Handles event broadcasting, subscription management, and real-time updates
 */

import { webSocketServer } from './websocket-server'
import { WebSocketMessage } from './websocket-server'

// Event Types
export type EventType = 
  | 'ride_requested'
  | 'ride_accepted' 
  | 'ride_started'
  | 'ride_completed'
  | 'ride_cancelled'
  | 'driver_online'
  | 'driver_offline'
  | 'driver_busy'
  | 'location_updated'
  | 'emergency_alert'
  | 'payment_processed'
  | 'notification_sent'
  | 'system_alert'
  | 'user_joined'
  | 'user_left'

// Event Data Interfaces
export interface BaseEvent {
  id: string
  type: EventType
  timestamp: number
  userId: string
  metadata?: Record<string, unknown>
}

export interface RideEvent extends BaseEvent {
  type: 'ride_requested' | 'ride_accepted' | 'ride_started' | 'ride_completed' | 'ride_cancelled'
  rideId: string
  passengerId: string
  driverId?: string
  location?: {
    pickup: { lat: number; lng: number; address?: string }
    dropoff: { lat: number; lng: number; address?: string }
  }
  fare?: number
  estimatedDuration?: number
  actualDuration?: number
}

export interface DriverStatusEvent extends BaseEvent {
  type: 'driver_online' | 'driver_offline' | 'driver_busy'
  driverId: string
  location?: { lat: number; lng: number }
  vehicleInfo?: {
    make: string
    model: string
    licensePlate: string
    color: string
  }
}

export interface LocationEvent extends BaseEvent {
  type: 'location_updated'
  location: {
    lat: number
    lng: number
    heading?: number
    speed?: number
    accuracy?: number
  }
  rideId?: string
}

export interface EmergencyEvent extends BaseEvent {
  type: 'emergency_alert'
  alertType: 'sos' | 'panic' | 'accident' | 'route_deviation'
  location: { lat: number; lng: number }
  rideId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
}

export interface PaymentEvent extends BaseEvent {
  type: 'payment_processed'
  rideId: string
  amount: number
  currency: string
  paymentMethod: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
}

export interface NotificationEvent extends BaseEvent {
  type: 'notification_sent'
  recipientId: string
  title: string
  message: string
  category: 'ride' | 'payment' | 'system' | 'promotion'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
}

export interface SystemEvent extends BaseEvent {
  type: 'system_alert'
  alertLevel: 'info' | 'warning' | 'error' | 'critical'
  component: string
  message: string
  affectedUsers?: string[]
}

export interface UserEvent extends BaseEvent {
  type: 'user_joined' | 'user_left'
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  roomId?: string
}

export type GoCarsEvent = 
  | RideEvent 
  | DriverStatusEvent 
  | LocationEvent 
  | EmergencyEvent 
  | PaymentEvent 
  | NotificationEvent 
  | SystemEvent 
  | UserEvent

// Event Subscription Interface
export interface EventSubscription {
  id: string
  eventType: EventType | EventType[]
  userId?: string
  userRole?: string
  roomId?: string
  callback: (event: GoCarsEvent) => void
  filter?: (event: GoCarsEvent) => boolean
  createdAt: Date
  lastTriggered?: Date
}

// Event Broadcasting Rules
export interface BroadcastRule {
  eventType: EventType
  targetRoles: string[]
  targetRooms?: string[]
  targetUsers?: string[]
  condition?: (event: GoCarsEvent) => boolean
  transform?: (event: GoCarsEvent) => Partial<GoCarsEvent>
}

class RealTimeEventSystem {
  private subscriptions: Map<string, EventSubscription> = new Map()
  private eventHistory: GoCarsEvent[] = []
  private broadcastRules: BroadcastRule[] = []
  private eventQueue: GoCarsEvent[] = []
  private isProcessing: boolean = false

  constructor() {
    this.setupDefaultBroadcastRules()
    this.startEventProcessor()
  }

  /**
   * Setup default broadcasting rules
   */
  private setupDefaultBroadcastRules(): void {
    this.broadcastRules = [
      // Ride events - broadcast to passenger, driver, and operators
      {
        eventType: 'ride_requested',
        targetRoles: ['driver', 'operator', 'admin'],
        targetUsers: [(event) => (event as RideEvent).passengerId]
      },
      {
        eventType: 'ride_accepted',
        targetRoles: ['operator', 'admin'],
        targetUsers: [(event) => (event as RideEvent).passengerId, (event) => (event as RideEvent).driverId!]
      },
      {
        eventType: 'ride_started',
        targetRoles: ['operator', 'admin'],
        targetUsers: [(event) => (event as RideEvent).passengerId, (event) => (event as RideEvent).driverId!]
      },
      {
        eventType: 'ride_completed',
        targetRoles: ['operator', 'admin'],
        targetUsers: [(event) => (event as RideEvent).passengerId, (event) => (event as RideEvent).driverId!]
      },
      {
        eventType: 'ride_cancelled',
        targetRoles: ['operator', 'admin'],
        targetUsers: [(event) => (event as RideEvent).passengerId, (event) => (event as RideEvent).driverId!]
      },

      // Driver status events - broadcast to operators and admins
      {
        eventType: 'driver_online',
        targetRoles: ['operator', 'admin']
      },
      {
        eventType: 'driver_offline',
        targetRoles: ['operator', 'admin']
      },
      {
        eventType: 'driver_busy',
        targetRoles: ['operator', 'admin']
      },

      // Location updates - broadcast to ride participants and operators
      {
        eventType: 'location_updated',
        targetRoles: ['operator', 'admin'],
        condition: (event) => !!(event as LocationEvent).rideId,
        targetRooms: [(event) => `ride_${(event as LocationEvent).rideId}`]
      },

      // Emergency alerts - broadcast to everyone
      {
        eventType: 'emergency_alert',
        targetRoles: ['operator', 'admin'],
        condition: (event) => (event as EmergencyEvent).severity === 'critical'
      },

      // Payment events - broadcast to involved parties
      {
        eventType: 'payment_processed',
        targetRoles: ['admin'],
        targetUsers: [(event) => (event as PaymentEvent).userId]
      },

      // System alerts - broadcast based on severity
      {
        eventType: 'system_alert',
        targetRoles: ['admin'],
        condition: (event) => ['error', 'critical'].includes((event as SystemEvent).alertLevel)
      }
    ]
  }

  /**
   * Start the event processing queue
   */
  private startEventProcessor(): void {
    setInterval(() => {
      this.processEventQueue()
    }, 100) // Process events every 100ms
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return

    this.isProcessing = true

    try {
      const event = this.eventQueue.shift()
      if (event) {
        await this.processEvent(event)
      }
    } catch (error) {
      console.error('Error processing event:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Emit an event to the system
   */
  public emitEvent(event: GoCarsEvent): void {
    // Add to event history
    this.eventHistory.push(event)
    
    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000)
    }

    // Add to processing queue
    this.eventQueue.push(event)

    console.log(`Event emitted: ${event.type} by ${event.userId}`)
  }

  /**
   * Process a single event
   */
  private async processEvent(event: GoCarsEvent): Promise<void> {
    // Trigger subscriptions
    this.triggerSubscriptions(event)

    // Broadcast based on rules
    this.broadcastEvent(event)

    // Store event for analytics (if needed)
    this.storeEventForAnalytics(event)
  }

  /**
   * Trigger event subscriptions
   */
  private triggerSubscriptions(event: GoCarsEvent): void {
    this.subscriptions.forEach((subscription) => {
      if (this.shouldTriggerSubscription(subscription, event)) {
        try {
          subscription.callback(event)
          subscription.lastTriggered = new Date()
        } catch (error) {
          console.error(`Error in subscription callback for ${subscription.id}:`, error)
        }
      }
    })
  }

  /**
   * Check if subscription should be triggered
   */
  private shouldTriggerSubscription(subscription: EventSubscription, event: GoCarsEvent): boolean {
    // Check event type match
    const eventTypes = Array.isArray(subscription.eventType) ? subscription.eventType : [subscription.eventType]
    if (!eventTypes.includes(event.type)) return false

    // Check user filter
    if (subscription.userId && subscription.userId !== event.userId) return false

    // Check custom filter
    if (subscription.filter && !subscription.filter(event)) return false

    return true
  }

  /**
   * Broadcast event based on rules
   */
  private broadcastEvent(event: GoCarsEvent): void {
    const applicableRules = this.broadcastRules.filter(rule => 
      rule.eventType === event.type && 
      (!rule.condition || rule.condition(event))
    )

    applicableRules.forEach(rule => {
      const message: WebSocketMessage = {
        type: this.mapEventTypeToMessageType(event.type),
        payload: rule.transform ? { ...event, ...rule.transform(event) } : event,
        timestamp: event.timestamp,
        userId: event.userId,
        metadata: event.metadata
      }

      // Broadcast to target roles
      rule.targetRoles.forEach(role => {
        webSocketServer.sendToRole(role, message)
      })

      // Broadcast to target rooms
      rule.targetRooms?.forEach(roomIdOrFunction => {
        const roomId = typeof roomIdOrFunction === 'function' ? roomIdOrFunction(event) : roomIdOrFunction
        if (roomId) {
          webSocketServer.sendToRoom(roomId, message)
        }
      })

      // Broadcast to target users
      rule.targetUsers?.forEach(userIdOrFunction => {
        const userId = typeof userIdOrFunction === 'function' ? userIdOrFunction(event) : userIdOrFunction
        if (userId) {
          webSocketServer.sendToUser(userId, message)
        }
      })
    })
  }

  /**
   * Map event type to WebSocket message type
   */
  private mapEventTypeToMessageType(eventType: EventType): WebSocketMessage['type'] {
    const mapping: Record<EventType, WebSocketMessage['type']> = {
      'ride_requested': 'ride_status',
      'ride_accepted': 'ride_status',
      'ride_started': 'ride_status',
      'ride_completed': 'ride_status',
      'ride_cancelled': 'ride_status',
      'driver_online': 'driver_status',
      'driver_offline': 'driver_status',
      'driver_busy': 'driver_status',
      'location_updated': 'location_update',
      'emergency_alert': 'notification',
      'payment_processed': 'notification',
      'notification_sent': 'notification',
      'system_alert': 'notification',
      'user_joined': 'notification',
      'user_left': 'notification'
    }

    return mapping[eventType] || 'notification'
  }

  /**
   * Subscribe to events
   */
  public subscribe(subscription: Omit<EventSubscription, 'id' | 'createdAt'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullSubscription: EventSubscription = {
      ...subscription,
      id,
      createdAt: new Date()
    }

    this.subscriptions.set(id, fullSubscription)
    
    console.log(`Event subscription created: ${id} for ${subscription.eventType}`)
    
    return id
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriptionId: string): boolean {
    const success = this.subscriptions.delete(subscriptionId)
    if (success) {
      console.log(`Event subscription removed: ${subscriptionId}`)
    }
    return success
  }

  /**
   * Get event history
   */
  public getEventHistory(filter?: {
    eventType?: EventType
    userId?: string
    since?: Date
    limit?: number
  }): GoCarsEvent[] {
    let events = [...this.eventHistory]

    if (filter) {
      if (filter.eventType) {
        events = events.filter(e => e.type === filter.eventType)
      }
      if (filter.userId) {
        events = events.filter(e => e.userId === filter.userId)
      }
      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since!.getTime())
      }
      if (filter.limit) {
        events = events.slice(-filter.limit)
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get active subscriptions
   */
  public getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * Store event for analytics
   */
  private storeEventForAnalytics(event: GoCarsEvent): void {
    // This would typically store events in a database for analytics
    // For now, we'll just log important events
    if (['emergency_alert', 'system_alert'].includes(event.type)) {
      console.log(`IMPORTANT EVENT: ${event.type}`, event)
    }
  }

  /**
   * Add custom broadcast rule
   */
  public addBroadcastRule(rule: BroadcastRule): void {
    this.broadcastRules.push(rule)
    console.log(`Broadcast rule added for ${rule.eventType}`)
  }

  /**
   * Remove broadcast rule
   */
  public removeBroadcastRule(eventType: EventType, targetRoles: string[]): boolean {
    const initialLength = this.broadcastRules.length
    this.broadcastRules = this.broadcastRules.filter(rule => 
      !(rule.eventType === eventType && 
        JSON.stringify(rule.targetRoles) === JSON.stringify(targetRoles))
    )
    return this.broadcastRules.length < initialLength
  }

  /**
   * Get system statistics
   */
  public getStats(): any {
    return {
      totalEvents: this.eventHistory.length,
      activeSubscriptions: this.subscriptions.size,
      broadcastRules: this.broadcastRules.length,
      queuedEvents: this.eventQueue.length,
      eventsByType: this.getEventsByType(),
      recentEvents: this.eventHistory.slice(-10)
    }
  }

  /**
   * Get events grouped by type
   */
  private getEventsByType(): Record<string, number> {
    const counts: Record<string, number> = {}
    this.eventHistory.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })
    return counts
  }

  /**
   * Clear old events (cleanup)
   */
  public clearOldEvents(olderThan: Date): number {
    const initialLength = this.eventHistory.length
    this.eventHistory = this.eventHistory.filter(event => 
      event.timestamp >= olderThan.getTime()
    )
    const removedCount = initialLength - this.eventHistory.length
    
    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} old events`)
    }
    
    return removedCount
  }
}

// Singleton instance
export const eventSystem = new RealTimeEventSystem()

// Helper functions for creating events
export const createRideEvent = (
  type: RideEvent['type'],
  data: Omit<RideEvent, 'id' | 'type' | 'timestamp'>
): RideEvent => ({
  id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: Date.now(),
  ...data
})

export const createDriverStatusEvent = (
  type: DriverStatusEvent['type'],
  data: Omit<DriverStatusEvent, 'id' | 'type' | 'timestamp'>
): DriverStatusEvent => ({
  id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: Date.now(),
  ...data
})

export const createLocationEvent = (
  data: Omit<LocationEvent, 'id' | 'type' | 'timestamp'>
): LocationEvent => ({
  id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'location_updated',
  timestamp: Date.now(),
  ...data
})

export const createEmergencyEvent = (
  data: Omit<EmergencyEvent, 'id' | 'type' | 'timestamp'>
): EmergencyEvent => ({
  id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'emergency_alert',
  timestamp: Date.now(),
  ...data
})

export const createNotificationEvent = (
  data: Omit<NotificationEvent, 'id' | 'type' | 'timestamp'>
): NotificationEvent => ({
  id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'notification_sent',
  timestamp: Date.now(),
  ...data
})

export const createSystemEvent = (
  data: Omit<SystemEvent, 'id' | 'type' | 'timestamp'>
): SystemEvent => ({
  id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'system_alert',
  timestamp: Date.now(),
  ...data
})

export default eventSystem