/**
 * Event Integration Service
 * Integrates the event system with Firebase and other external services
 */

import { 
  eventSystem, 
  GoCarsEvent, 
  RideEvent, 
  DriverStatusEvent, 
  LocationEvent, 
  EmergencyEvent,
  createRideEvent,
  createDriverStatusEvent,
  createLocationEvent,
  createEmergencyEvent,
  createNotificationEvent,
  createSystemEvent
} from '@/lib/websocket/event-system'
import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore'

// Firebase Integration
class EventFirebaseIntegration {
  private unsubscribers: (() => void)[] = []

  constructor() {
    this.setupFirebaseListeners()
    this.setupEventSystemListeners()
  }

  /**
   * Setup Firebase listeners to sync with event system
   */
  private setupFirebaseListeners(): void {
    // Listen to ride updates
    this.listenToRideUpdates()
    
    // Listen to driver status updates
    this.listenToDriverStatusUpdates()
    
    // Listen to location updates
    this.listenToLocationUpdates()
    
    // Listen to emergency alerts
    this.listenToEmergencyAlerts()
  }

  /**
   * Setup event system listeners to sync with Firebase
   */
  private setupEventSystemListeners(): void {
    // Subscribe to ride events
    eventSystem.subscribe({
      eventType: ['ride_requested', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled'],
      callback: (event: GoCarsEvent) => {
        this.syncRideEventToFirebase(event as RideEvent)
      }
    })

    // Subscribe to driver status events
    eventSystem.subscribe({
      eventType: ['driver_online', 'driver_offline', 'driver_busy'],
      callback: (event: GoCarsEvent) => {
        this.syncDriverStatusToFirebase(event as DriverStatusEvent)
      }
    })

    // Subscribe to location events
    eventSystem.subscribe({
      eventType: 'location_updated',
      callback: (event: GoCarsEvent) => {
        this.syncLocationToFirebase(event as LocationEvent)
      }
    })

    // Subscribe to emergency events
    eventSystem.subscribe({
      eventType: 'emergency_alert',
      callback: (event: GoCarsEvent) => {
        this.syncEmergencyToFirebase(event as EmergencyEvent)
      }
    })
  }

  /**
   * Listen to Firebase ride updates
   */
  private listenToRideUpdates(): void {
    const ridesRef = collection(db, 'rides')
    const q = query(ridesRef, orderBy('updatedAt', 'desc'), limit(100))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const rideData = change.doc.data()
          this.handleFirebaseRideUpdate(change.doc.id, rideData)
        }
      })
    })

    this.unsubscribers.push(unsubscribe)
  }

  /**
   * Listen to Firebase driver status updates
   */
  private listenToDriverStatusUpdates(): void {
    const driversRef = collection(db, 'drivers')
    const q = query(driversRef, where('isOnline', '==', true))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const driverData = change.doc.data()
        this.handleFirebaseDriverUpdate(change.doc.id, driverData, change.type)
      })
    })

    this.unsubscribers.push(unsubscribe)
  }

  /**
   * Listen to Firebase location updates
   */
  private listenToLocationUpdates(): void {
    const locationsRef = collection(db, 'locations')
    const q = query(locationsRef, orderBy('timestamp', 'desc'), limit(50))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const locationData = change.doc.data()
          this.handleFirebaseLocationUpdate(locationData)
        }
      })
    })

    this.unsubscribers.push(unsubscribe)
  }

  /**
   * Listen to Firebase emergency alerts
   */
  private listenToEmergencyAlerts(): void {
    const emergencyRef = collection(db, 'emergencyAlerts')
    const q = query(emergencyRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const alertData = change.doc.data()
          this.handleFirebaseEmergencyAlert(alertData)
        }
      })
    })

    this.unsubscribers.push(unsubscribe)
  }

  /**
   * Handle Firebase ride updates
   */
  private handleFirebaseRideUpdate(rideId: string, rideData: DocumentData): void {
    const eventType = this.mapRideStatusToEventType(rideData.status)
    if (!eventType) return

    const event = createRideEvent(eventType, {
      userId: rideData.passengerId || rideData.driverId || 'system',
      rideId,
      passengerId: rideData.passengerId,
      driverId: rideData.driverId,
      location: {
        pickup: rideData.pickupLocation,
        dropoff: rideData.dropoffLocation
      },
      fare: rideData.fare,
      estimatedDuration: rideData.estimatedDuration,
      actualDuration: rideData.actualDuration,
      metadata: {
        source: 'firebase',
        updatedAt: rideData.updatedAt?.toDate?.()
      }
    })

    eventSystem.emitEvent(event)
  }

  /**
   * Handle Firebase driver updates
   */
  private handleFirebaseDriverUpdate(driverId: string, driverData: DocumentData, changeType: string): void {
    let eventType: 'driver_online' | 'driver_offline' | 'driver_busy'
    
    if (changeType === 'removed' || !driverData.isOnline) {
      eventType = 'driver_offline'
    } else if (driverData.status === 'busy') {
      eventType = 'driver_busy'
    } else {
      eventType = 'driver_online'
    }

    const event = createDriverStatusEvent(eventType, {
      userId: driverId,
      driverId,
      location: driverData.currentLocation,
      vehicleInfo: driverData.vehicleInfo,
      metadata: {
        source: 'firebase',
        updatedAt: driverData.updatedAt?.toDate?.()
      }
    })

    eventSystem.emitEvent(event)
  }

  /**
   * Handle Firebase location updates
   */
  private handleFirebaseLocationUpdate(locationData: DocumentData): void {
    const event = createLocationEvent({
      userId: locationData.userId,
      location: {
        lat: locationData.latitude,
        lng: locationData.longitude,
        heading: locationData.heading,
        speed: locationData.speed,
        accuracy: locationData.accuracy
      },
      rideId: locationData.rideId,
      metadata: {
        source: 'firebase',
        timestamp: locationData.timestamp?.toDate?.()
      }
    })

    eventSystem.emitEvent(event)
  }

  /**
   * Handle Firebase emergency alerts
   */
  private handleFirebaseEmergencyAlert(alertData: DocumentData): void {
    const event = createEmergencyEvent({
      userId: alertData.userId,
      alertType: alertData.type,
      location: {
        lat: alertData.location.latitude,
        lng: alertData.location.longitude
      },
      severity: alertData.severity,
      description: alertData.description,
      rideId: alertData.rideId,
      metadata: {
        source: 'firebase',
        createdAt: alertData.createdAt?.toDate?.()
      }
    })

    eventSystem.emitEvent(event)
  }

  /**
   * Sync ride event to Firebase
   */
  private async syncRideEventToFirebase(event: RideEvent): Promise<void> {
    try {
      const rideRef = doc(db, 'rides', event.rideId)
      
      const updateData: any = {
        status: this.mapEventTypeToRideStatus(event.type),
        updatedAt: Timestamp.now(),
        lastEventId: event.id,
        lastEventTimestamp: Timestamp.fromMillis(event.timestamp)
      }

      if (event.driverId) {
        updateData.driverId = event.driverId
      }

      if (event.fare) {
        updateData.fare = event.fare
      }

      if (event.actualDuration) {
        updateData.actualDuration = event.actualDuration
      }

      await updateDoc(rideRef, updateData)
      
      // Also log the event
      await addDoc(collection(db, 'rideEvents'), {
        ...event,
        timestamp: Timestamp.fromMillis(event.timestamp),
        createdAt: Timestamp.now()
      })

    } catch (error) {
      console.error('Error syncing ride event to Firebase:', error)
    }
  }

  /**
   * Sync driver status to Firebase
   */
  private async syncDriverStatusToFirebase(event: DriverStatusEvent): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', event.driverId)
      
      const updateData: any = {
        isOnline: event.type !== 'driver_offline',
        status: event.type.replace('driver_', ''),
        updatedAt: Timestamp.now(),
        lastEventId: event.id,
        lastEventTimestamp: Timestamp.fromMillis(event.timestamp)
      }

      if (event.location) {
        updateData.currentLocation = event.location
      }

      if (event.vehicleInfo) {
        updateData.vehicleInfo = event.vehicleInfo
      }

      await updateDoc(driverRef, updateData)

    } catch (error) {
      console.error('Error syncing driver status to Firebase:', error)
    }
  }

  /**
   * Sync location to Firebase
   */
  private async syncLocationToFirebase(event: LocationEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'locations'), {
        userId: event.userId,
        latitude: event.location.lat,
        longitude: event.location.lng,
        heading: event.location.heading,
        speed: event.location.speed,
        accuracy: event.location.accuracy,
        rideId: event.rideId,
        timestamp: Timestamp.fromMillis(event.timestamp),
        createdAt: Timestamp.now()
      })

      // Also update user's current location
      const userRef = doc(db, 'users', event.userId)
      await updateDoc(userRef, {
        currentLocation: {
          latitude: event.location.lat,
          longitude: event.location.lng,
          heading: event.location.heading,
          updatedAt: Timestamp.now()
        }
      })

    } catch (error) {
      console.error('Error syncing location to Firebase:', error)
    }
  }

  /**
   * Sync emergency alert to Firebase
   */
  private async syncEmergencyToFirebase(event: EmergencyEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'emergencyAlerts'), {
        userId: event.userId,
        type: event.alertType,
        severity: event.severity,
        description: event.description,
        location: {
          latitude: event.location.lat,
          longitude: event.location.lng
        },
        rideId: event.rideId,
        status: 'active',
        createdAt: Timestamp.fromMillis(event.timestamp),
        eventId: event.id
      })

      // Create notification for operators and admins
      const notificationEvent = createNotificationEvent({
        userId: 'system',
        recipientId: 'operators',
        title: `Emergency Alert: ${event.alertType.toUpperCase()}`,
        message: `${event.severity.toUpperCase()} emergency reported by user ${event.userId}`,
        category: 'system',
        priority: event.severity === 'critical' ? 'urgent' : 'high',
        metadata: {
          emergencyEventId: event.id,
          location: event.location
        }
      })

      eventSystem.emitEvent(notificationEvent)

    } catch (error) {
      console.error('Error syncing emergency alert to Firebase:', error)
    }
  }

  /**
   * Map ride status to event type
   */
  private mapRideStatusToEventType(status: string): RideEvent['type'] | null {
    const mapping: Record<string, RideEvent['type']> = {
      'requested': 'ride_requested',
      'accepted': 'ride_accepted',
      'in_progress': 'ride_started',
      'completed': 'ride_completed',
      'cancelled': 'ride_cancelled'
    }
    return mapping[status] || null
  }

  /**
   * Map event type to ride status
   */
  private mapEventTypeToRideStatus(eventType: RideEvent['type']): string {
    const mapping: Record<RideEvent['type'], string> = {
      'ride_requested': 'requested',
      'ride_accepted': 'accepted',
      'ride_started': 'in_progress',
      'ride_completed': 'completed',
      'ride_cancelled': 'cancelled'
    }
    return mapping[eventType]
  }

  /**
   * Cleanup listeners
   */
  public cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }
}

// Push Notification Integration
class EventPushNotificationIntegration {
  constructor() {
    this.setupNotificationListeners()
  }

  /**
   * Setup listeners for events that should trigger push notifications
   */
  private setupNotificationListeners(): void {
    // Ride notifications
    eventSystem.subscribe({
      eventType: ['ride_accepted', 'ride_started', 'ride_completed'],
      callback: (event: GoCarsEvent) => {
        this.sendRideNotification(event as RideEvent)
      }
    })

    // Emergency notifications
    eventSystem.subscribe({
      eventType: 'emergency_alert',
      callback: (event: GoCarsEvent) => {
        this.sendEmergencyNotification(event as EmergencyEvent)
      }
    })

    // System notifications
    eventSystem.subscribe({
      eventType: 'notification_sent',
      callback: (event: GoCarsEvent) => {
        this.sendPushNotification(event as any)
      }
    })
  }

  /**
   * Send ride-related push notification
   */
  private async sendRideNotification(event: RideEvent): Promise<void> {
    try {
      const notifications = []

      // Notify passenger
      if (event.passengerId) {
        notifications.push({
          userId: event.passengerId,
          title: this.getRideNotificationTitle(event.type),
          body: this.getRideNotificationBody(event),
          data: {
            type: 'ride',
            rideId: event.rideId,
            eventType: event.type
          }
        })
      }

      // Notify driver
      if (event.driverId && event.type !== 'ride_requested') {
        notifications.push({
          userId: event.driverId,
          title: this.getRideNotificationTitle(event.type),
          body: this.getRideNotificationBody(event),
          data: {
            type: 'ride',
            rideId: event.rideId,
            eventType: event.type
          }
        })
      }

      // Send notifications
      for (const notification of notifications) {
        await this.sendPushToUser(notification.userId, notification)
      }

    } catch (error) {
      console.error('Error sending ride notification:', error)
    }
  }

  /**
   * Send emergency push notification
   */
  private async sendEmergencyNotification(event: EmergencyEvent): Promise<void> {
    try {
      // Notify all operators and admins
      await this.sendPushToRole('operator', {
        title: `Emergency Alert: ${event.alertType.toUpperCase()}`,
        body: `${event.severity.toUpperCase()} emergency reported`,
        data: {
          type: 'emergency',
          alertType: event.alertType,
          severity: event.severity,
          userId: event.userId,
          location: event.location
        }
      })

      await this.sendPushToRole('admin', {
        title: `Emergency Alert: ${event.alertType.toUpperCase()}`,
        body: `${event.severity.toUpperCase()} emergency reported`,
        data: {
          type: 'emergency',
          alertType: event.alertType,
          severity: event.severity,
          userId: event.userId,
          location: event.location
        }
      })

    } catch (error) {
      console.error('Error sending emergency notification:', error)
    }
  }

  /**
   * Send generic push notification
   */
  private async sendPushNotification(event: any): Promise<void> {
    try {
      await this.sendPushToUser(event.recipientId, {
        title: event.title,
        body: event.message,
        data: {
          type: event.category,
          priority: event.priority,
          actionUrl: event.actionUrl
        }
      })
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }

  /**
   * Send push notification to specific user
   */
  private async sendPushToUser(userId: string, notification: any): Promise<void> {
    // This would integrate with Firebase Cloud Messaging or similar service
    console.log(`Push notification to ${userId}:`, notification)
    
    // Example implementation:
    // const userTokens = await getUserPushTokens(userId)
    // await sendFCMNotification(userTokens, notification)
  }

  /**
   * Send push notification to role
   */
  private async sendPushToRole(role: string, notification: any): Promise<void> {
    // This would get all users with the specified role and send notifications
    console.log(`Push notification to role ${role}:`, notification)
    
    // Example implementation:
    // const roleUsers = await getUsersByRole(role)
    // for (const user of roleUsers) {
    //   await this.sendPushToUser(user.id, notification)
    // }
  }

  /**
   * Get ride notification title
   */
  private getRideNotificationTitle(eventType: RideEvent['type']): string {
    const titles = {
      'ride_requested': 'New Ride Request',
      'ride_accepted': 'Ride Accepted',
      'ride_started': 'Ride Started',
      'ride_completed': 'Ride Completed',
      'ride_cancelled': 'Ride Cancelled'
    }
    return titles[eventType]
  }

  /**
   * Get ride notification body
   */
  private getRideNotificationBody(event: RideEvent): string {
    const bodies = {
      'ride_requested': 'A new ride has been requested',
      'ride_accepted': 'Your ride has been accepted by a driver',
      'ride_started': 'Your ride has started',
      'ride_completed': 'Your ride has been completed',
      'ride_cancelled': 'Your ride has been cancelled'
    }
    return bodies[event.type]
  }
}

// Analytics Integration
class EventAnalyticsIntegration {
  constructor() {
    this.setupAnalyticsListeners()
  }

  /**
   * Setup listeners for analytics tracking
   */
  private setupAnalyticsListeners(): void {
    // Track all events for analytics
    eventSystem.subscribe({
      eventType: [
        'ride_requested', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled',
        'driver_online', 'driver_offline', 'driver_busy',
        'location_updated', 'emergency_alert'
      ],
      callback: (event: GoCarsEvent) => {
        this.trackEvent(event)
      }
    })
  }

  /**
   * Track event for analytics
   */
  private async trackEvent(event: GoCarsEvent): Promise<void> {
    try {
      // This would integrate with analytics services like Google Analytics, Mixpanel, etc.
      const analyticsData = {
        event_name: event.type,
        user_id: event.userId,
        timestamp: event.timestamp,
        properties: {
          event_id: event.id,
          ...event.metadata
        }
      }

      // Example: Send to Google Analytics
      // gtag('event', event.type, analyticsData)
      
      // Example: Send to custom analytics service
      // await sendToAnalytics(analyticsData)
      
      console.log('Analytics event tracked:', analyticsData)

    } catch (error) {
      console.error('Error tracking analytics event:', error)
    }
  }
}

// Initialize integrations
export const firebaseIntegration = new EventFirebaseIntegration()
export const pushNotificationIntegration = new EventPushNotificationIntegration()
export const analyticsIntegration = new EventAnalyticsIntegration()

// Cleanup function
export const cleanupEventIntegrations = () => {
  firebaseIntegration.cleanup()
}

export default {
  firebaseIntegration,
  pushNotificationIntegration,
  analyticsIntegration,
  cleanupEventIntegrations
}