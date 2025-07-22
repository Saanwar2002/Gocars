/**
 * Enhanced Push Notification Service for GoCars
 * Handles Firebase Cloud Messaging and intelligent notification delivery
 */

import { eventSystem } from '@/lib/websocket/event-system'
import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  setDoc,
  getDoc 
} from 'firebase/firestore'
import { 
  initializeMessaging, 
  requestNotificationPermission,
  onForegroundMessage,
  showNotification,
  registerServiceWorker
} from '@/lib/firebase-messaging'

// Push Notification Types
export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  category: 'ride' | 'payment' | 'system' | 'promotion' | 'emergency'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  icon?: string
  actions?: NotificationAction[]
  variables?: string[]
}

export interface UserNotificationSettings {
  userId: string
  enabled: boolean
  categories: {
    ride: boolean
    payment: boolean
    system: boolean
    promotion: boolean
    emergency: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
  }
  deviceTokens: string[]
  preferences: {
    sound: boolean
    vibration: boolean
    badge: boolean
    groupSimilar: boolean
  }
}

export interface NotificationDeliveryLog {
  id: string
  userId: string
  notificationId: string
  status: 'sent' | 'delivered' | 'failed' | 'clicked' | 'dismissed'
  timestamp: number
  deviceToken?: string
  error?: string
  deliveryTime?: number
  engagementScore?: number
}

export interface NotificationSchedule {
  id: string
  userId: string
  templateId: string
  variables: Record<string, string>
  scheduledTime: Date
  timezone: string
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
  status: 'pending' | 'sent' | 'cancelled'
  createdAt: Date
}

export interface NotificationAnalytics {
  userId: string
  period: 'daily' | 'weekly' | 'monthly'
  totalSent: number
  totalDelivered: number
  totalClicked: number
  totalDismissed: number
  engagementRate: number
  categoryBreakdown: Record<string, number>
  deviceBreakdown: Record<string, number>
  timeBreakdown: Record<string, number>
  lastUpdated: Date
}

class PushNotificationService {
  private templates: Map<string, NotificationTemplate> = new Map()
  private userSettings: Map<string, UserNotificationSettings> = new Map()
  private deliveryQueue: PushNotificationPayload[] = []
  private scheduledNotifications: Map<string, NotificationSchedule> = new Map()
  private analytics: Map<string, NotificationAnalytics> = new Map()
  private isProcessing: boolean = false
  private messaging: any = null
  private foregroundMessageUnsubscribe: (() => void) | null = null

  constructor() {
    this.initializeTemplates()
    this.setupEventListeners()
    this.startDeliveryProcessor()
    this.initializeFirebaseMessaging()
    this.startScheduleProcessor()
    this.startAnalyticsProcessor()
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'ride_accepted',
        name: 'Ride Accepted',
        title: 'Ride Accepted!',
        body: 'Your ride has been accepted by {driverName}. ETA: {eta} minutes.',
        category: 'ride',
        priority: 'high',
        icon: '/icons/ride-accepted.png',
        actions: [
          { action: 'view_ride', title: 'View Ride', icon: '/icons/view.png' },
          { action: 'contact_driver', title: 'Contact Driver', icon: '/icons/phone.png' }
        ],
        variables: ['driverName', 'eta']
      },
      {
        id: 'ride_started',
        name: 'Ride Started',
        title: 'Your ride has started',
        body: '{driverName} has started your ride. Track your journey in the app.',
        category: 'ride',
        priority: 'normal',
        icon: '/icons/ride-started.png',
        actions: [
          { action: 'track_ride', title: 'Track Ride', icon: '/icons/map.png' }
        ],
        variables: ['driverName']
      },
      {
        id: 'ride_completed',
        name: 'Ride Completed',
        title: 'Ride completed successfully',
        body: 'Your ride is complete. Total fare: ${fare}. Rate your experience!',
        category: 'ride',
        priority: 'normal',
        icon: '/icons/ride-completed.png',
        actions: [
          { action: 'rate_ride', title: 'Rate Ride', icon: '/icons/star.png' },
          { action: 'view_receipt', title: 'View Receipt', icon: '/icons/receipt.png' }
        ],
        variables: ['fare']
      },
      {
        id: 'payment_processed',
        name: 'Payment Processed',
        title: 'Payment successful',
        body: 'Your payment of ${amount} has been processed successfully.',
        category: 'payment',
        priority: 'normal',
        icon: '/icons/payment.png',
        variables: ['amount']
      },
      {
        id: 'emergency_alert',
        name: 'Emergency Alert',
        title: 'Emergency Alert',
        body: 'Emergency assistance has been requested. Help is on the way.',
        category: 'emergency',
        priority: 'urgent',
        icon: '/icons/emergency.png',
        requireInteraction: true,
        actions: [
          { action: 'view_emergency', title: 'View Details', icon: '/icons/info.png' }
        ]
      },
      {
        id: 'driver_arrived',
        name: 'Driver Arrived',
        title: 'Your driver has arrived',
        body: '{driverName} is waiting for you. Vehicle: {vehicleInfo}',
        category: 'ride',
        priority: 'high',
        icon: '/icons/driver-arrived.png',
        actions: [
          { action: 'im_coming', title: "I'm Coming", icon: '/icons/check.png' },
          { action: 'contact_driver', title: 'Contact Driver', icon: '/icons/phone.png' }
        ],
        variables: ['driverName', 'vehicleInfo']
      },
      {
        id: 'promotion_offer',
        name: 'Promotion Offer',
        title: 'Special offer just for you!',
        body: 'Get {discount}% off your next ride. Valid until {expiry}.',
        category: 'promotion',
        priority: 'low',
        icon: '/icons/promotion.png',
        actions: [
          { action: 'use_offer', title: 'Use Offer', icon: '/icons/gift.png' }
        ],
        variables: ['discount', 'expiry']
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Setup event system listeners
   */
  private setupEventListeners(): void {
    // Listen to ride events
    eventSystem.subscribe({
      eventType: ['ride_accepted', 'ride_started', 'ride_completed'],
      callback: (event) => {
        this.handleRideNotification(event as any)
      }
    })

    // Listen to emergency events
    eventSystem.subscribe({
      eventType: 'emergency_alert',
      callback: (event) => {
        this.handleEmergencyNotification(event as any)
      }
    })

    // Listen to payment events
    eventSystem.subscribe({
      eventType: 'payment_processed',
      callback: (event) => {
        this.handlePaymentNotification(event as any)
      }
    })

    // Listen to notification events
    eventSystem.subscribe({
      eventType: 'notification_sent',
      callback: (event) => {
        this.handleGenericNotification(event as any)
      }
    })
  }

  /**
   * Start delivery processor
   */
  private startDeliveryProcessor(): void {
    setInterval(() => {
      this.processDeliveryQueue()
    }, 1000) // Process every second
  }

  /**
   * Process notification delivery queue
   */
  private async processDeliveryQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) return

    this.isProcessing = true

    try {
      const notification = this.deliveryQueue.shift()
      if (notification) {
        await this.deliverNotification(notification)
      }
    } catch (error) {
      console.error('Error processing notification queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Handle ride notifications
   */
  private async handleRideNotification(event: any): Promise<void> {
    const templateId = event.type.replace('ride_', 'ride_')
    const template = this.templates.get(templateId)
    
    if (!template) return

    const variables = {
      driverName: event.driverId || 'Your driver',
      eta: event.metadata?.eta || '5',
      fare: event.fare || '0.00',
      vehicleInfo: event.metadata?.vehicleInfo || 'Unknown vehicle'
    }

    // Send to passenger
    if (event.passengerId) {
      await this.sendNotificationToUser(event.passengerId, template, variables)
    }

    // Send to driver (for certain events)
    if (event.driverId && ['ride_started', 'ride_completed'].includes(event.type)) {
      await this.sendNotificationToUser(event.driverId, template, variables)
    }
  }

  /**
   * Handle emergency notifications
   */
  private async handleEmergencyNotification(event: any): Promise<void> {
    const template = this.templates.get('emergency_alert')
    if (!template) return

    // Send to all operators and admins
    const operatorUsers = await this.getUsersByRole('operator')
    const adminUsers = await this.getUsersByRole('admin')
    
    const allRecipients = [...operatorUsers, ...adminUsers]
    
    for (const userId of allRecipients) {
      await this.sendNotificationToUser(userId, template, {})
    }
  }

  /**
   * Handle payment notifications
   */
  private async handlePaymentNotification(event: any): Promise<void> {
    const template = this.templates.get('payment_processed')
    if (!template) return

    const variables = {
      amount: event.amount || '0.00'
    }

    await this.sendNotificationToUser(event.userId, template, variables)
  }

  /**
   * Handle generic notifications
   */
  private async handleGenericNotification(event: any): Promise<void> {
    const notification: PushNotificationPayload = {
      title: event.title,
      body: event.message,
      icon: '/icons/notification.png',
      data: {
        category: event.category,
        priority: event.priority,
        actionUrl: event.actionUrl,
        timestamp: event.timestamp
      },
      tag: event.category,
      timestamp: event.timestamp
    }

    await this.sendNotificationToUser(event.recipientId, notification)
  }

  /**
   * Send notification to specific user
   */
  public async sendNotificationToUser(
    userId: string, 
    templateOrPayload: NotificationTemplate | PushNotificationPayload,
    variables: Record<string, string> = {}
  ): Promise<void> {
    const userSettings = await this.getUserNotificationSettings(userId)
    
    if (!userSettings.enabled) {
      console.log(`Notifications disabled for user ${userId}`)
      return
    }

    let payload: PushNotificationPayload

    if ('id' in templateOrPayload) {
      // It's a template
      const template = templateOrPayload as NotificationTemplate
      
      // Check if category is enabled
      if (!userSettings.categories[template.category]) {
        console.log(`Category ${template.category} disabled for user ${userId}`)
        return
      }

      // Check quiet hours
      if (this.isInQuietHours(userSettings)) {
        console.log(`User ${userId} is in quiet hours`)
        return
      }

      payload = this.buildNotificationFromTemplate(template, variables)
    } else {
      // It's already a payload
      payload = templateOrPayload as PushNotificationPayload
    }

    // Add to delivery queue
    this.deliveryQueue.push({
      ...payload,
      data: {
        ...payload.data,
        userId
      }
    })
  }

  /**
   * Build notification from template
   */
  private buildNotificationFromTemplate(
    template: NotificationTemplate, 
    variables: Record<string, string>
  ): PushNotificationPayload {
    let title = template.title
    let body = template.body

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      title = title.replace(new RegExp(placeholder, 'g'), value)
      body = body.replace(new RegExp(placeholder, 'g'), value)
    })

    return {
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      tag: template.category,
      requireInteraction: template.requireInteraction,
      timestamp: Date.now(),
      data: {
        templateId: template.id,
        category: template.category,
        priority: template.priority
      }
    }
  }

  /**
   * Deliver notification
   */
  private async deliverNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      const userId = payload.data?.userId
      if (!userId) return

      const userSettings = await this.getUserNotificationSettings(userId)
      
      // Send to all user's devices
      for (const deviceToken of userSettings.deviceTokens) {
        try {
          await this.sendToDevice(deviceToken, payload)
          
          // Log successful delivery
          await this.logDelivery({
            id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            notificationId: payload.tag || 'unknown',
            status: 'sent',
            timestamp: Date.now(),
            deviceToken
          })
        } catch (error) {
          console.error(`Failed to send notification to device ${deviceToken}:`, error)
          
          // Log failed delivery
          await this.logDelivery({
            id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            notificationId: payload.tag || 'unknown',
            status: 'failed',
            timestamp: Date.now(),
            deviceToken,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    } catch (error) {
      console.error('Error delivering notification:', error)
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private async initializeFirebaseMessaging(): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      // Initialize messaging
      this.messaging = await initializeMessaging()
      
      if (!this.messaging) {
        console.error('Failed to initialize Firebase Messaging')
        return
      }

      // Register service worker
      await registerServiceWorker()

      // Set up foreground message listener
      this.foregroundMessageUnsubscribe = onForegroundMessage((payload) => {
        console.log('Foreground message received:', payload)
        
        // Show notification in foreground
        if (payload.notification) {
          showNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon,
            data: payload.data
          })
        }

        // Update analytics
        this.trackNotificationReceived(payload)
      })

      console.log('Firebase Cloud Messaging initialized successfully')
    } catch (error) {
      console.error('Error initializing Firebase Cloud Messaging:', error)
    }
  }

  /**
   * Start schedule processor
   */
  private startScheduleProcessor(): void {
    setInterval(() => {
      this.processScheduledNotifications()
    }, 60000) // Check every minute
  }

  /**
   * Start analytics processor
   */
  private startAnalyticsProcessor(): void {
    setInterval(() => {
      this.updateAnalytics()
    }, 300000) // Update every 5 minutes
  }

  /**
   * Send notification to device using Firebase Cloud Messaging
   */
  private async sendToDevice(deviceToken: string, payload: PushNotificationPayload): Promise<void> {
    try {
      const startTime = Date.now()

      if (typeof window !== 'undefined' && this.messaging) {
        // For web notifications, we use the Web Push API
        // The actual FCM sending would be done server-side
        console.log(`Sending FCM notification to device ${deviceToken}:`, {
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          data: payload.data
        })

        // In a real implementation, this would make an API call to your backend
        // which would then use Firebase Admin SDK to send the notification
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: deviceToken,
            notification: {
              title: payload.title,
              body: payload.body,
              image: payload.image
            },
            data: payload.data,
            android: {
              notification: {
                icon: payload.icon,
                sound: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
              }
            },
            apns: {
              payload: {
                aps: {
                  badge: payload.badge ? parseInt(payload.badge) : undefined,
                  sound: 'default'
                }
              }
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.error)
        }

        // Track delivery time
        const deliveryTime = Date.now() - startTime
        console.log(`Notification sent successfully in ${deliveryTime}ms`)

      } else {
        // Fallback for server-side or when messaging is not available
        console.log(`Simulating notification send to device ${deviceToken}:`, {
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          data: payload.data
        })

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100))

        // Simulate occasional failures (2% failure rate)
        if (Math.random() < 0.02) {
          throw new Error('Device token invalid or expired')
        }
      }
    } catch (error) {
      console.error(`Failed to send notification to device ${deviceToken}:`, error)
      throw error
    }
  }

  /**
   * Get user notification settings
   */
  private async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
    if (this.userSettings.has(userId)) {
      return this.userSettings.get(userId)!
    }

    try {
      const settingsRef = doc(db, 'userNotificationSettings', userId)
      const settingsDoc = await getDocs(query(collection(db, 'userNotificationSettings'), where('userId', '==', userId)))
      
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data() as UserNotificationSettings
        this.userSettings.set(userId, settings)
        return settings
      }
    } catch (error) {
      console.error('Error fetching user notification settings:', error)
    }

    // Return default settings
    const defaultSettings: UserNotificationSettings = {
      userId,
      enabled: true,
      categories: {
        ride: true,
        payment: true,
        system: true,
        promotion: true,
        emergency: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      deviceTokens: [],
      preferences: {
        sound: true,
        vibration: true,
        badge: true,
        groupSimilar: true
      }
    }

    this.userSettings.set(userId, defaultSettings)
    return defaultSettings
  }

  /**
   * Check if user is in quiet hours
   */
  private isInQuietHours(settings: UserNotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const start = settings.quietHours.start
    const end = settings.quietHours.end

    if (start <= end) {
      // Same day range (e.g., 09:00 to 17:00)
      return currentTime >= start && currentTime <= end
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end
    }
  }

  /**
   * Get users by role
   */
  private async getUsersByRole(role: string): Promise<string[]> {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', '==', role))
      const usersSnapshot = await getDocs(usersQuery)
      return usersSnapshot.docs.map(doc => doc.id)
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error)
      return []
    }
  }

  /**
   * Log notification delivery
   */
  private async logDelivery(log: NotificationDeliveryLog): Promise<void> {
    try {
      await addDoc(collection(db, 'notificationDeliveryLogs'), {
        ...log,
        timestamp: Timestamp.fromMillis(log.timestamp)
      })
    } catch (error) {
      console.error('Error logging notification delivery:', error)
    }
  }

  /**
   * Update user notification settings
   */
  public async updateUserSettings(userId: string, settings: Partial<UserNotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserNotificationSettings(userId)
      const updatedSettings = { ...currentSettings, ...settings }
      
      // Update in cache
      this.userSettings.set(userId, updatedSettings)
      
      // Update in database
      const settingsRef = doc(db, 'userNotificationSettings', userId)
      await updateDoc(settingsRef, updatedSettings)
    } catch (error) {
      console.error('Error updating user notification settings:', error)
    }
  }

  /**
   * Register device token
   */
  public async registerDeviceToken(userId: string, deviceToken: string): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId)
      
      if (!settings.deviceTokens.includes(deviceToken)) {
        settings.deviceTokens.push(deviceToken)
        await this.updateUserSettings(userId, { deviceTokens: settings.deviceTokens })
      }
    } catch (error) {
      console.error('Error registering device token:', error)
    }
  }

  /**
   * Unregister device token
   */
  public async unregisterDeviceToken(userId: string, deviceToken: string): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId)
      settings.deviceTokens = settings.deviceTokens.filter(token => token !== deviceToken)
      await this.updateUserSettings(userId, { deviceTokens: settings.deviceTokens })
    } catch (error) {
      console.error('Error unregistering device token:', error)
    }
  }

  /**
   * Get notification templates
   */
  public getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Add custom template
   */
  public addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Schedule notification for future delivery
   */
  public async scheduleNotification(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledTime: Date,
    timezone: string = 'UTC',
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly'
      interval: number
      endDate?: Date
    }
  ): Promise<string> {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const schedule: NotificationSchedule = {
        id: scheduleId,
        userId,
        templateId,
        variables,
        scheduledTime,
        timezone,
        recurring,
        status: 'pending',
        createdAt: new Date()
      }

      // Store in memory
      this.scheduledNotifications.set(scheduleId, schedule)

      // Store in database
      await setDoc(doc(db, 'notificationSchedules', scheduleId), {
        ...schedule,
        scheduledTime: Timestamp.fromDate(scheduledTime),
        createdAt: Timestamp.fromDate(schedule.createdAt),
        ...(recurring?.endDate && { 'recurring.endDate': Timestamp.fromDate(recurring.endDate) })
      })

      console.log(`Notification scheduled for ${scheduledTime.toISOString()}`)
      return scheduleId
    } catch (error) {
      console.error('Error scheduling notification:', error)
      throw error
    }
  }

  /**
   * Cancel scheduled notification
   */
  public async cancelScheduledNotification(scheduleId: string): Promise<void> {
    try {
      // Update in memory
      const schedule = this.scheduledNotifications.get(scheduleId)
      if (schedule) {
        schedule.status = 'cancelled'
        this.scheduledNotifications.set(scheduleId, schedule)
      }

      // Update in database
      await updateDoc(doc(db, 'notificationSchedules', scheduleId), {
        status: 'cancelled'
      })

      console.log(`Scheduled notification ${scheduleId} cancelled`)
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error)
      throw error
    }
  }

  /**
   * Process scheduled notifications
   */
  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date()
      
      for (const [scheduleId, schedule] of this.scheduledNotifications) {
        if (schedule.status !== 'pending') continue
        
        if (schedule.scheduledTime <= now) {
          // Send the notification
          const template = this.templates.get(schedule.templateId)
          if (template) {
            await this.sendNotificationToUser(schedule.userId, template, schedule.variables)
            
            // Update schedule status
            schedule.status = 'sent'
            this.scheduledNotifications.set(scheduleId, schedule)
            
            // Update in database
            await updateDoc(doc(db, 'notificationSchedules', scheduleId), {
              status: 'sent'
            })

            // Handle recurring notifications
            if (schedule.recurring) {
              await this.createRecurringNotification(schedule)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
    }
  }

  /**
   * Create next recurring notification
   */
  private async createRecurringNotification(schedule: NotificationSchedule): Promise<void> {
    if (!schedule.recurring) return

    const { frequency, interval, endDate } = schedule.recurring
    let nextTime = new Date(schedule.scheduledTime)

    switch (frequency) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + interval)
        break
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + (interval * 7))
        break
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + interval)
        break
    }

    // Check if we should continue recurring
    if (endDate && nextTime > endDate) {
      console.log(`Recurring notification ended for schedule ${schedule.id}`)
      return
    }

    // Create new scheduled notification
    await this.scheduleNotification(
      schedule.userId,
      schedule.templateId,
      schedule.variables,
      nextTime,
      schedule.timezone,
      schedule.recurring
    )
  }

  /**
   * Track notification received (for analytics)
   */
  private async trackNotificationReceived(payload: any): Promise<void> {
    try {
      const userId = payload.data?.userId
      if (!userId) return

      // Update user analytics
      await this.updateUserAnalytics(userId, 'received', payload.data?.category || 'general')
    } catch (error) {
      console.error('Error tracking notification received:', error)
    }
  }

  /**
   * Update user analytics
   */
  private async updateUserAnalytics(
    userId: string, 
    action: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'received',
    category: string
  ): Promise<void> {
    try {
      const today = new Date()
      const analyticsId = `${userId}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`
      
      let analytics = this.analytics.get(analyticsId)
      
      if (!analytics) {
        // Load from database or create new
        const analyticsDoc = await getDoc(doc(db, 'notificationAnalytics', analyticsId))
        
        if (analyticsDoc.exists()) {
          analytics = analyticsDoc.data() as NotificationAnalytics
        } else {
          analytics = {
            userId,
            period: 'daily',
            totalSent: 0,
            totalDelivered: 0,
            totalClicked: 0,
            totalDismissed: 0,
            engagementRate: 0,
            categoryBreakdown: {},
            deviceBreakdown: {},
            timeBreakdown: {},
            lastUpdated: new Date()
          }
        }
        
        this.analytics.set(analyticsId, analytics)
      }

      // Update analytics based on action
      switch (action) {
        case 'sent':
          analytics.totalSent++
          break
        case 'delivered':
          analytics.totalDelivered++
          break
        case 'clicked':
          analytics.totalClicked++
          break
        case 'dismissed':
          analytics.totalDismissed++
          break
      }

      // Update category breakdown
      analytics.categoryBreakdown[category] = (analytics.categoryBreakdown[category] || 0) + 1

      // Update time breakdown
      const hour = today.getHours()
      const timeSlot = `${hour}:00`
      analytics.timeBreakdown[timeSlot] = (analytics.timeBreakdown[timeSlot] || 0) + 1

      // Calculate engagement rate
      if (analytics.totalSent > 0) {
        analytics.engagementRate = (analytics.totalClicked / analytics.totalSent) * 100
      }

      analytics.lastUpdated = new Date()
      
      // Update in memory
      this.analytics.set(analyticsId, analytics)
    } catch (error) {
      console.error('Error updating user analytics:', error)
    }
  }

  /**
   * Update analytics (periodic batch update)
   */
  private async updateAnalytics(): Promise<void> {
    try {
      // Batch update analytics to database
      for (const [analyticsId, analytics] of this.analytics) {
        await setDoc(doc(db, 'notificationAnalytics', analyticsId), {
          ...analytics,
          lastUpdated: Timestamp.fromDate(analytics.lastUpdated)
        })
      }
      
      console.log(`Updated ${this.analytics.size} analytics records`)
    } catch (error) {
      console.error('Error updating analytics:', error)
    }
  }

  /**
   * Get user engagement analytics
   */
  public async getUserAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<NotificationAnalytics | null> {
    try {
      const today = new Date()
      let analyticsId: string

      switch (period) {
        case 'daily':
          analyticsId = `${userId}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`
          break
        case 'weekly':
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
          analyticsId = `${userId}_${weekStart.getFullYear()}_${weekStart.getMonth()}_${weekStart.getDate()}_weekly`
          break
        case 'monthly':
          analyticsId = `${userId}_${today.getFullYear()}_${today.getMonth()}_monthly`
          break
      }

      // Check memory first
      if (this.analytics.has(analyticsId)) {
        return this.analytics.get(analyticsId)!
      }

      // Load from database
      const analyticsDoc = await getDoc(doc(db, 'notificationAnalytics', analyticsId))
      
      if (analyticsDoc.exists()) {
        const analytics = analyticsDoc.data() as NotificationAnalytics
        this.analytics.set(analyticsId, analytics)
        return analytics
      }

      return null
    } catch (error) {
      console.error('Error getting user analytics:', error)
      return null
    }
  }

  /**
   * Get notification personalization data
   */
  public async getPersonalizationData(userId: string): Promise<any> {
    try {
      const analytics = await this.getUserAnalytics(userId, 'monthly')
      
      if (!analytics) {
        return {
          preferredCategories: ['ride', 'payment'],
          optimalTimes: ['09:00', '17:00'],
          engagementScore: 50
        }
      }

      // Find preferred categories
      const preferredCategories = Object.entries(analytics.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category)

      // Find optimal delivery times
      const optimalTimes = Object.entries(analytics.timeBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([time]) => time)

      return {
        preferredCategories,
        optimalTimes,
        engagementScore: Math.round(analytics.engagementRate)
      }
    } catch (error) {
      console.error('Error getting personalization data:', error)
      return {
        preferredCategories: ['ride', 'payment'],
        optimalTimes: ['09:00', '17:00'],
        engagementScore: 50
      }
    }
  }

  /**
   * Request FCM token for user
   */
  public async requestFCMToken(userId: string): Promise<string | null> {
    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        await this.registerDeviceToken(userId, token)
        console.log('FCM token registered for user:', userId)
      }
      
      return token
    } catch (error) {
      console.error('Error requesting FCM token:', error)
      return null
    }
  }

  /**
   * Get delivery statistics with enhanced analytics
   */
  public async getDeliveryStats(userId?: string, timeRange?: { start: Date; end: Date }): Promise<any> {
    try {
      let logsQuery = collection(db, 'notificationDeliveryLogs')
      
      if (userId) {
        logsQuery = query(logsQuery, where('userId', '==', userId)) as any
      }
      
      if (timeRange) {
        logsQuery = query(
          logsQuery, 
          where('timestamp', '>=', Timestamp.fromDate(timeRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(timeRange.end))
        ) as any
      }
      
      const logsSnapshot = await getDocs(logsQuery)
      const logs = logsSnapshot.docs.map(doc => doc.data())
      
      const stats = {
        total: logs.length,
        sent: logs.filter(log => log.status === 'sent').length,
        delivered: logs.filter(log => log.status === 'delivered').length,
        failed: logs.filter(log => log.status === 'failed').length,
        clicked: logs.filter(log => log.status === 'clicked').length,
        dismissed: logs.filter(log => log.status === 'dismissed').length
      }

      // Calculate advanced metrics
      const avgDeliveryTime = logs
        .filter(log => log.deliveryTime)
        .reduce((sum, log) => sum + (log.deliveryTime || 0), 0) / logs.length || 0

      const categoryBreakdown = logs.reduce((acc, log) => {
        const category = log.category || 'general'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const hourlyBreakdown = logs.reduce((acc, log) => {
        const hour = new Date(log.timestamp).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      return {
        ...stats,
        successRate: stats.total > 0 ? (stats.sent / stats.total) * 100 : 0,
        clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
        engagementRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        categoryBreakdown,
        hourlyBreakdown
      }
    } catch (error) {
      console.error('Error getting delivery stats:', error)
      return null
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.foregroundMessageUnsubscribe) {
      this.foregroundMessageUnsubscribe()
      this.foregroundMessageUnsubscribe = null
    }
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()

export default pushNotificationService