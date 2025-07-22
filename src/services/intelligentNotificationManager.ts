/**
 * Intelligent Notification Management System
 * Advanced notification grouping, batching, and smart delivery optimization
 */

import { pushNotificationService, PushNotificationPayload } from './pushNotificationService'
import { eventSystem } from '@/lib/websocket/event-system'

// Intelligent Notification Types
export interface NotificationGroup {
  id: string
  userId: string
  category: string
  notifications: PushNotificationPayload[]
  createdAt: number
  lastUpdated: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  deliverySchedule?: Date
  isDelivered: boolean
}

export interface NotificationBatch {
  id: string
  userId: string
  notifications: PushNotificationPayload[]
  scheduledDelivery: Date
  batchType: 'time_based' | 'count_based' | 'priority_based'
  isProcessed: boolean
}

export interface UserEngagementData {
  userId: string
  averageResponseTime: number // in minutes
  preferredDeliveryTimes: string[] // HH:MM format
  engagementScore: number // 0-100
  lastActiveTime: number
  notificationFrequency: 'low' | 'medium' | 'high'
  categoryPreferences: Record<string, number> // category -> engagement score
  doNotDisturbSettings: DoNotDisturbSettings
  contextualPreferences: ContextualPreferences
  actionButtonPreferences: ActionButtonPreferences
}

export interface DoNotDisturbSettings {
  enabled: boolean
  schedules: DoNotDisturbSchedule[]
  emergencyOverride: boolean
  allowedCategories: string[]
  smartMode: boolean // AI-powered DND based on user activity
}

export interface DoNotDisturbSchedule {
  id: string
  name: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  days: number[] // 0-6 (Sunday-Saturday)
  enabled: boolean
}

export interface ContextualPreferences {
  locationBasedFiltering: boolean
  activityBasedFiltering: boolean
  timeBasedFiltering: boolean
  deviceBasedFiltering: boolean
  contextRules: ContextRule[]
}

export interface ContextRule {
  id: string
  name: string
  condition: {
    location?: string
    activity?: string
    timeRange?: { start: string; end: string }
    device?: string
  }
  action: 'allow' | 'suppress' | 'delay' | 'modify'
  parameters: Record<string, any>
}

export interface ActionButtonPreferences {
  maxButtons: number
  preferredActions: Record<string, string[]> // category -> preferred actions
  customActions: CustomAction[]
  smartSuggestions: boolean
}

export interface CustomAction {
  id: string
  title: string
  icon?: string
  category: string
  action: string
  parameters: Record<string, any>
}

export interface NotificationOptimizationRule {
  id: string
  name: string
  condition: (notification: PushNotificationPayload, userData: UserEngagementData) => boolean
  action: 'delay' | 'batch' | 'prioritize' | 'suppress' | 'enhance'
  parameters: Record<string, any>
  enabled: boolean
}

class IntelligentNotificationManager {
  private notificationGroups: Map<string, NotificationGroup> = new Map()
  private notificationBatches: Map<string, NotificationBatch> = new Map()
  private userEngagementData: Map<string, UserEngagementData> = new Map()
  private optimizationRules: NotificationOptimizationRule[] = []
  private processingQueue: PushNotificationPayload[] = []
  private isProcessing: boolean = false

  constructor() {
    this.initializeOptimizationRules()
    this.setupEventListeners()
    this.startIntelligentProcessor()
    this.startEngagementAnalyzer()
    this.startContextualAnalyzer()
    this.startSmartDNDMonitor()
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'quiet_hours_delay',
        name: 'Delay non-urgent notifications during quiet hours',
        condition: (notification, userData) => {
          const now = new Date()
          const currentHour = now.getHours()
          const isQuietHours = currentHour >= 22 || currentHour <= 7
          const isUrgent = notification.data?.priority === 'urgent'
          return isQuietHours && !isUrgent
        },
        action: 'delay',
        parameters: { delayUntil: '08:00' },
        enabled: true
      },
      {
        id: 'batch_similar_notifications',
        name: 'Batch similar notifications within 5 minutes',
        condition: (notification, userData) => {
          const category = notification.data?.category
          return category === 'ride' || category === 'system'
        },
        action: 'batch',
        parameters: { batchWindow: 5 * 60 * 1000, maxBatchSize: 5 },
        enabled: true
      },
      {
        id: 'prioritize_emergency',
        name: 'Immediately deliver emergency notifications',
        condition: (notification, userData) => {
          return notification.data?.category === 'emergency'
        },
        action: 'prioritize',
        parameters: { bypassAllRules: true },
        enabled: true
      },
      {
        id: 'suppress_low_engagement',
        name: 'Suppress promotional notifications for low engagement users',
        condition: (notification, userData) => {
          return notification.data?.category === 'promotion' && userData.engagementScore < 30
        },
        action: 'suppress',
        parameters: {},
        enabled: true
      },
      {
        id: 'optimize_delivery_time',
        name: 'Deliver notifications at optimal times based on user behavior',
        condition: (notification, userData) => {
          const now = new Date()
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
          return !userData.preferredDeliveryTimes.includes(currentTime) &&
            notification.data?.priority !== 'urgent'
        },
        action: 'delay',
        parameters: { useOptimalTime: true },
        enabled: true
      },
      {
        id: 'enhance_high_value_users',
        name: 'Enhance notifications for high engagement users',
        condition: (notification, userData) => {
          return userData.engagementScore > 80
        },
        action: 'enhance',
        parameters: { addPersonalization: true, addActions: true },
        enabled: true
      },
      {
        id: 'frequency_limiting',
        name: 'Limit notification frequency based on user preferences',
        condition: (notification, userData) => {
          const recentNotifications = this.getRecentNotificationCount(userData.userId, 60 * 60 * 1000) // Last hour
          const limits = { low: 2, medium: 5, high: 10 }
          return recentNotifications >= limits[userData.notificationFrequency]
        },
        action: 'delay',
        parameters: { delayMinutes: 60 },
        enabled: true
      }
    ]
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to all notification events for intelligent processing
    eventSystem.subscribe({
      eventType: 'notification_sent',
      callback: (event) => {
        this.processIntelligentNotification(event as any)
      }
    })

    // Listen to user interaction events for engagement tracking
    eventSystem.subscribe({
      eventType: ['ride_requested', 'ride_accepted', 'ride_started'],
      callback: (event) => {
        this.updateUserEngagement(event.userId, 'interaction')
      }
    })
  }

  /**
   * Start intelligent processor
   */
  private startIntelligentProcessor(): void {
    setInterval(() => {
      this.processIntelligentQueue()
      this.processBatches()
      this.processDelayedNotifications()
    }, 30000) // Process every 30 seconds
  }

  /**
   * Start engagement analyzer
   */
  private startEngagementAnalyzer(): void {
    setInterval(() => {
      this.analyzeUserEngagement()
      this.optimizeDeliveryTimes()
    }, 5 * 60 * 1000) // Analyze every 5 minutes
  }

  /**
   * Process intelligent notification
   */
  private async processIntelligentNotification(event: any): Promise<void> {
    const notification: PushNotificationPayload = {
      title: event.title,
      body: event.message,
      data: {
        category: event.category,
        priority: event.priority,
        userId: event.recipientId,
        timestamp: event.timestamp
      },
      timestamp: event.timestamp
    }

    this.processingQueue.push(notification)
  }

  /**
   * Process intelligent queue
   */
  private async processIntelligentQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return

    this.isProcessing = true

    try {
      while (this.processingQueue.length > 0) {
        const notification = this.processingQueue.shift()!
        await this.applyIntelligentRules(notification)
      }
    } catch (error) {
      console.error('Error processing intelligent notification queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Apply intelligent rules to notification
   */
  private async applyIntelligentRules(notification: PushNotificationPayload): Promise<void> {
    // Use enhanced version
    await this.applyIntelligentRulesEnhanced(notification)
  }

  /**
   * Original apply intelligent rules (for backward compatibility)
   */
  private async applyIntelligentRulesOriginal(notification: PushNotificationPayload): Promise<void> {
    const userId = notification.data?.userId
    if (!userId) return

    const userData = await this.getUserEngagementDataEnhanced(userId)
    let finalAction: 'deliver' | 'delay' | 'batch' | 'suppress' | 'enhance' = 'deliver'
    let actionParameters: any = {}

    // Apply optimization rules
    for (const rule of this.optimizationRules) {
      if (!rule.enabled) continue

      try {
        if (rule.condition(notification, userData)) {
          finalAction = rule.action
          actionParameters = rule.parameters

          // Emergency notifications bypass all other rules
          if (rule.parameters.bypassAllRules) {
            break
          }
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error)
      }
    }

    // Execute the determined action
    await this.executeNotificationAction(notification, finalAction, actionParameters, userData)
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(
    notification: PushNotificationPayload,
    action: string,
    parameters: any,
    userData: UserEngagementData
  ): Promise<void> {
    const userId = notification.data?.userId

    switch (action) {
      case 'deliver':
        await pushNotificationService.sendNotificationToUser(userId, notification)
        break

      case 'delay':
        await this.delayNotification(notification, parameters)
        break

      case 'batch':
        await this.batchNotification(notification, parameters)
        break

      case 'suppress':
        console.log(`Suppressing notification for user ${userId}:`, notification.title)
        // Log suppression for analytics
        break

      case 'enhance':
        const enhancedNotification = await this.enhanceNotification(notification, parameters, userData)
        await pushNotificationService.sendNotificationToUser(userId, enhancedNotification)
        break

      case 'prioritize':
        // Send immediately with high priority
        await pushNotificationService.sendNotificationToUser(userId, {
          ...notification,
          requireInteraction: true,
          data: { ...notification.data, priority: 'urgent' }
        })
        break
    }
  }

  /**
   * Delay notification
   */
  private async delayNotification(notification: PushNotificationPayload, parameters: any): Promise<void> {
    const userId = notification.data?.userId
    let deliveryTime: Date

    if (parameters.useOptimalTime) {
      deliveryTime = await this.getOptimalDeliveryTime(userId)
    } else if (parameters.delayUntil) {
      deliveryTime = this.getNextTimeSlot(parameters.delayUntil)
    } else if (parameters.delayMinutes) {
      deliveryTime = new Date(Date.now() + parameters.delayMinutes * 60 * 1000)
    } else {
      deliveryTime = new Date(Date.now() + 30 * 60 * 1000) // Default 30 minutes
    }

    // Store for later delivery
    const groupId = `delayed_${userId}_${Date.now()}`
    const group: NotificationGroup = {
      id: groupId,
      userId,
      category: notification.data?.category || 'general',
      notifications: [notification],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      priority: notification.data?.priority || 'normal',
      deliverySchedule: deliveryTime,
      isDelivered: false
    }

    this.notificationGroups.set(groupId, group)
  }

  /**
   * Batch notification
   */
  private async batchNotification(notification: PushNotificationPayload, parameters: any): Promise<void> {
    const userId = notification.data?.userId
    const category = notification.data?.category || 'general'
    const batchKey = `${userId}_${category}`

    // Find existing batch or create new one
    let batch = Array.from(this.notificationBatches.values())
      .find(b => b.userId === userId && !b.isProcessed &&
        b.notifications.some(n => n.data?.category === category))

    if (!batch) {
      const batchId = `batch_${batchKey}_${Date.now()}`
      batch = {
        id: batchId,
        userId,
        notifications: [],
        scheduledDelivery: new Date(Date.now() + parameters.batchWindow),
        batchType: 'time_based',
        isProcessed: false
      }
      this.notificationBatches.set(batchId, batch)
    }

    batch.notifications.push(notification)
    batch.scheduledDelivery = new Date(Date.now() + parameters.batchWindow)

    // If batch is full, process immediately
    if (batch.notifications.length >= parameters.maxBatchSize) {
      await this.processBatch(batch)
    }
  }

  /**
   * Enhance notification
   */
  private async enhanceNotification(
    notification: PushNotificationPayload,
    parameters: any,
    userData: UserEngagementData
  ): Promise<PushNotificationPayload> {
    let enhanced = { ...notification }

    if (parameters.addPersonalization) {
      // Add personalized content based on user data
      enhanced.title = `Hi there! ${enhanced.title}`
      enhanced.body = enhanced.body.replace(/you/gi, 'you')
    }

    if (parameters.addActions && !enhanced.actions) {
      // Add relevant actions based on notification category
      const category = enhanced.data?.category
      switch (category) {
        case 'ride':
          enhanced.actions = [
            { action: 'view_ride', title: 'View Ride' },
            { action: 'share_eta', title: 'Share ETA' }
          ]
          break
        case 'promotion':
          enhanced.actions = [
            { action: 'use_offer', title: 'Use Offer' },
            { action: 'save_later', title: 'Save for Later' }
          ]
          break
      }
    }

    // Add rich media for high-engagement users
    if (userData.engagementScore > 90) {
      enhanced.image = '/images/premium-notification-bg.jpg'
    }

    return enhanced
  }

  /**
   * Process batches
   */
  private async processBatches(): Promise<void> {
    const now = Date.now()

    for (const batch of this.notificationBatches.values()) {
      if (!batch.isProcessed && batch.scheduledDelivery.getTime() <= now) {
        await this.processBatch(batch)
      }
    }
  }

  /**
   * Process single batch
   */
  private async processBatch(batch: NotificationBatch): Promise<void> {
    if (batch.notifications.length === 0) return

    if (batch.notifications.length === 1) {
      // Single notification, send as is
      await pushNotificationService.sendNotificationToUser(
        batch.userId,
        batch.notifications[0]
      )
    } else {
      // Multiple notifications, create summary
      const summaryNotification = this.createBatchSummary(batch)
      await pushNotificationService.sendNotificationToUser(batch.userId, summaryNotification)
    }

    batch.isProcessed = true
  }

  /**
   * Create batch summary notification
   */
  private createBatchSummary(batch: NotificationBatch): PushNotificationPayload {
    const count = batch.notifications.length
    const categories = [...new Set(batch.notifications.map(n => n.data?.category))]
    const category = categories.length === 1 ? categories[0] : 'mixed'

    let title: string
    let body: string

    if (category === 'ride') {
      title = `${count} ride updates`
      body = `You have ${count} new ride-related notifications`
    } else if (category === 'system') {
      title = `${count} system notifications`
      body = `${count} system updates are waiting for you`
    } else {
      title = `${count} new notifications`
      body = `You have ${count} new notifications from GoCars`
    }

    return {
      title,
      body,
      icon: '/icons/batch-notification.png',
      data: {
        type: 'batch',
        count,
        category,
        notifications: batch.notifications.map(n => n.data)
      },
      actions: [
        { action: 'view_all', title: 'View All' },
        { action: 'dismiss_all', title: 'Dismiss All' }
      ],
      timestamp: Date.now()
    }
  }

  /**
   * Process delayed notifications
   */
  private async processDelayedNotifications(): Promise<void> {
    const now = Date.now()

    for (const group of this.notificationGroups.values()) {
      if (!group.isDelivered && group.deliverySchedule && group.deliverySchedule.getTime() <= now) {
        for (const notification of group.notifications) {
          await pushNotificationService.sendNotificationToUser(group.userId, notification)
        }
        group.isDelivered = true
      }
    }
  }

  /**
   * Get user engagement data
   */
  private async getUserEngagementData(userId: string): Promise<UserEngagementData> {
    // Use enhanced version
    return await this.getUserEngagementDataEnhanced(userId)
  }

  /**
   * Update user engagement
   */
  private async updateUserEngagement(userId: string, interactionType: string): Promise<void> {
    const userData = await this.getUserEngagementData(userId)

    userData.lastActiveTime = Date.now()

    // Increase engagement score based on interaction
    switch (interactionType) {
      case 'notification_click':
        userData.engagementScore = Math.min(100, userData.engagementScore + 5)
        break
      case 'interaction':
        userData.engagementScore = Math.min(100, userData.engagementScore + 2)
        break
      case 'app_open':
        userData.engagementScore = Math.min(100, userData.engagementScore + 1)
        break
    }

    this.userEngagementData.set(userId, userData)
  }

  /**
   * Analyze user engagement patterns
   */
  private async analyzeUserEngagement(): Promise<void> {
    for (const userData of this.userEngagementData.values()) {
      // Decay engagement score over time
      const timeSinceLastActive = Date.now() - userData.lastActiveTime
      const daysSinceActive = timeSinceLastActive / (24 * 60 * 60 * 1000)

      if (daysSinceActive > 7) {
        userData.engagementScore = Math.max(0, userData.engagementScore - 10)
      } else if (daysSinceActive > 3) {
        userData.engagementScore = Math.max(0, userData.engagementScore - 5)
      }
    }
  }

  /**
   * Optimize delivery times based on user behavior
   */
  private async optimizeDeliveryTimes(): Promise<void> {
    // This would analyze user interaction patterns to determine optimal delivery times
    // For now, we'll use default optimization
    console.log('Optimizing delivery times based on user behavior patterns')
  }

  /**
   * Get optimal delivery time for user
   */
  private async getOptimalDeliveryTime(userId: string): Promise<Date> {
    const userData = await this.getUserEngagementData(userId)
    const now = new Date()
    const currentHour = now.getHours()

    // Find next preferred delivery time
    const preferredHours = userData.preferredDeliveryTimes.map(time => parseInt(time.split(':')[0]))
    const nextPreferredHour = preferredHours.find(hour => hour > currentHour) || preferredHours[0]

    const deliveryTime = new Date()
    deliveryTime.setHours(nextPreferredHour, 0, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (deliveryTime.getTime() <= now.getTime()) {
      deliveryTime.setDate(deliveryTime.getDate() + 1)
    }

    return deliveryTime
  }

  /**
   * Get next time slot
   */
  private getNextTimeSlot(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const deliveryTime = new Date()
    deliveryTime.setHours(hours, minutes, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (deliveryTime.getTime() <= Date.now()) {
      deliveryTime.setDate(deliveryTime.getDate() + 1)
    }

    return deliveryTime
  }

  /**
   * Get recent notification count
   */
  private getRecentNotificationCount(userId: string, timeWindow: number): number {
    const cutoff = Date.now() - timeWindow
    let count = 0

    // Count from groups
    for (const group of this.notificationGroups.values()) {
      if (group.userId === userId && group.createdAt >= cutoff) {
        count += group.notifications.length
      }
    }

    // Count from batches
    for (const batch of this.notificationBatches.values()) {
      if (batch.userId === userId && batch.isProcessed) {
        count += batch.notifications.length
      }
    }

    return count
  }

  /**
   * Get notification analytics
   */
  public getAnalytics(): any {
    return {
      totalGroups: this.notificationGroups.size,
      totalBatches: this.notificationBatches.size,
      activeUsers: this.userEngagementData.size,
      averageEngagementScore: Array.from(this.userEngagementData.values())
        .reduce((sum, data) => sum + data.engagementScore, 0) / this.userEngagementData.size,
      optimizationRules: this.optimizationRules.filter(rule => rule.enabled).length
    }
  }

  /**
   * Update optimization rule
   */
  public updateOptimizationRule(ruleId: string, updates: Partial<NotificationOptimizationRule>): void {
    const ruleIndex = this.optimizationRules.findIndex(rule => rule.id === ruleId)
    if (ruleIndex !== -1) {
      this.optimizationRules[ruleIndex] = { ...this.optimizationRules[ruleIndex], ...updates }
    }
  }

  /**
   * Add custom optimization rule
   */
  public addOptimizationRule(rule: NotificationOptimizationRule): void {
    this.optimizationRules.push(rule)
  }

  /**
   * Start contextual analyzer
   */
  private startContextualAnalyzer(): void {
    setInterval(() => {
      this.analyzeUserContext()
      this.updateContextualRules()
    }, 2 * 60 * 1000) // Analyze every 2 minutes
  }

  /**
   * Start smart DND monitor
   */
  private startSmartDNDMonitor(): void {
    setInterval(() => {
      this.updateSmartDoNotDisturb()
    }, 60 * 1000) // Check every minute
  }

  /**
   * Check if user is in do-not-disturb mode
   */
  private async isInDoNotDisturbMode(userId: string, notification: PushNotificationPayload): Promise<boolean> {
    const userData = await this.getUserEngagementData(userId)
    const dndSettings = userData.doNotDisturbSettings

    if (!dndSettings.enabled) return false

    // Check emergency override
    if (dndSettings.emergencyOverride && notification.data?.category === 'emergency') {
      return false
    }

    // Check allowed categories
    if (dndSettings.allowedCategories.includes(notification.data?.category || '')) {
      return false
    }

    // Check scheduled DND
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDay = now.getDay()

    for (const schedule of dndSettings.schedules) {
      if (!schedule.enabled || !schedule.days.includes(currentDay)) continue

      const isInTimeRange = this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime)
      if (isInTimeRange) return true
    }

    // Check smart mode
    if (dndSettings.smartMode) {
      return await this.isSmartDNDActive(userId)
    }

    return false
  }

  /**
   * Check if time is in range
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    if (startTime <= endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  /**
   * Check if smart DND should be active
   */
  private async isSmartDNDActive(userId: string): Promise<boolean> {
    const userData = await this.getUserEngagementData(userId)

    // Check if user has been inactive for a while
    const timeSinceLastActive = Date.now() - userData.lastActiveTime
    const hoursInactive = timeSinceLastActive / (60 * 60 * 1000)

    // If user has been inactive for more than 2 hours during typical sleep hours
    const now = new Date()
    const currentHour = now.getHours()
    const isSleepTime = currentHour >= 23 || currentHour <= 6

    if (isSleepTime && hoursInactive > 2) {
      return true
    }

    // Check if user is in a meeting or busy (this would integrate with calendar APIs)
    // For now, we'll use a simple heuristic based on notification interaction patterns
    const recentInteractionRate = await this.getRecentInteractionRate(userId)
    if (recentInteractionRate < 0.1) { // Less than 10% interaction rate
      return true
    }

    return false
  }

  /**
   * Get recent interaction rate
   */
  private async getRecentInteractionRate(userId: string): Promise<number> {
    // This would typically query the database for recent notification interactions
    // For now, we'll return a simulated rate based on engagement score
    const userData = await this.getUserEngagementData(userId)
    return userData.engagementScore / 100
  }

  /**
   * Apply contextual filtering
   */
  private async applyContextualFiltering(notification: PushNotificationPayload, userData: UserEngagementData): Promise<boolean> {
    const contextPrefs = userData.contextualPreferences

    if (!contextPrefs.locationBasedFiltering && !contextPrefs.activityBasedFiltering &&
      !contextPrefs.timeBasedFiltering && !contextPrefs.deviceBasedFiltering) {
      return true // No filtering enabled
    }

    // Apply context rules
    for (const rule of contextPrefs.contextRules) {
      if (await this.matchesContextRule(rule, notification, userData)) {
        switch (rule.action) {
          case 'suppress':
            return false
          case 'allow':
            return true
          case 'delay':
            await this.delayNotification(notification, rule.parameters)
            return false
          case 'modify':
            await this.modifyNotificationBasedOnContext(notification, rule.parameters)
            break
        }
      }
    }

    return true
  }

  /**
   * Check if notification matches context rule
   */
  private async matchesContextRule(rule: ContextRule, notification: PushNotificationPayload, userData: UserEngagementData): Promise<boolean> {
    const condition = rule.condition

    // Check time-based condition
    if (condition.timeRange) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      if (!this.isTimeInRange(currentTime, condition.timeRange.start, condition.timeRange.end)) {
        return false
      }
    }

    // Check location-based condition (would integrate with location services)
    if (condition.location) {
      // This would check user's current location against the condition
      // For now, we'll simulate based on time patterns
      const isAtWork = await this.isUserAtWork(userData.userId)
      if (condition.location === 'work' && !isAtWork) {
        return false
      }
    }

    // Check activity-based condition (would integrate with activity detection)
    if (condition.activity) {
      const currentActivity = await this.getUserCurrentActivity(userData.userId)
      if (currentActivity !== condition.activity) {
        return false
      }
    }

    return true
  }

  /**
   * Check if user is at work (simplified heuristic)
   */
  private async isUserAtWork(userId: string): Promise<boolean> {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()

    // Simple heuristic: weekdays 9-17
    return currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour <= 17
  }

  /**
   * Get user's current activity (simplified)
   */
  private async getUserCurrentActivity(userId: string): Promise<string> {
    // This would integrate with device sensors, calendar, etc.
    // For now, return a simple activity based on time
    const now = new Date()
    const currentHour = now.getHours()

    if (currentHour >= 23 || currentHour <= 6) return 'sleeping'
    if (currentHour >= 9 && currentHour <= 17) return 'working'
    if (currentHour >= 18 && currentHour <= 22) return 'leisure'

    return 'unknown'
  }

  /**
   * Modify notification based on context
   */
  private async modifyNotificationBasedOnContext(notification: PushNotificationPayload, parameters: any): Promise<void> {
    if (parameters.makeQuiet) {
      notification.silent = true
    }

    if (parameters.addContextInfo) {
      const context = await this.getUserCurrentActivity(notification.data?.userId)
      notification.body += ` (Detected activity: ${context})`
    }

    if (parameters.adjustPriority) {
      notification.data = { ...notification.data, priority: parameters.newPriority }
    }
  }

  /**
   * Generate smart action buttons
   */
  private async generateSmartActionButtons(notification: PushNotificationPayload, userData: UserEngagementData): Promise<NotificationAction[]> {
    const category = notification.data?.category || 'general'
    const actionPrefs = userData.actionButtonPreferences
    const actions: NotificationAction[] = []

    // Get preferred actions for this category
    const preferredActions = actionPrefs.preferredActions[category] || []

    // Add category-specific smart actions
    switch (category) {
      case 'ride':
        if (preferredActions.includes('track') || actionPrefs.smartSuggestions) {
          actions.push({ action: 'track_ride', title: 'Track', icon: '/icons/map.png' })
        }
        if (preferredActions.includes('contact') || actionPrefs.smartSuggestions) {
          actions.push({ action: 'contact_driver', title: 'Contact', icon: '/icons/phone.png' })
        }
        if (preferredActions.includes('share') && userData.engagementScore > 70) {
          actions.push({ action: 'share_eta', title: 'Share ETA', icon: '/icons/share.png' })
        }
        break

      case 'payment':
        if (preferredActions.includes('receipt') || actionPrefs.smartSuggestions) {
          actions.push({ action: 'view_receipt', title: 'Receipt', icon: '/icons/receipt.png' })
        }
        if (preferredActions.includes('dispute') && userData.engagementScore > 60) {
          actions.push({ action: 'dispute_charge', title: 'Dispute', icon: '/icons/alert.png' })
        }
        break

      case 'promotion':
        if (preferredActions.includes('use') || actionPrefs.smartSuggestions) {
          actions.push({ action: 'use_offer', title: 'Use Now', icon: '/icons/gift.png' })
        }
        if (preferredActions.includes('save')) {
          actions.push({ action: 'save_offer', title: 'Save', icon: '/icons/bookmark.png' })
        }
        break

      case 'emergency':
        actions.push({ action: 'view_emergency', title: 'View', icon: '/icons/info.png' })
        actions.push({ action: 'call_support', title: 'Call Support', icon: '/icons/phone.png' })
        break
    }

    // Add custom actions
    const customActions = actionPrefs.customActions.filter(action => action.category === category)
    actions.push(...customActions.map(custom => ({
      action: custom.action,
      title: custom.title,
      icon: custom.icon
    })))

    // Limit to max buttons
    return actions.slice(0, actionPrefs.maxButtons)
  }

  /**
   * Analyze user context
   */
  private async analyzeUserContext(): Promise<void> {
    for (const userData of this.userEngagementData.values()) {
      // Update contextual preferences based on user behavior
      await this.updateContextualPreferences(userData)
    }
  }

  /**
   * Update contextual preferences
   */
  private async updateContextualPreferences(userData: UserEngagementData): Promise<void> {
    // This would analyze user interaction patterns to update contextual rules
    // For now, we'll add some basic context rules if they don't exist

    if (userData.contextualPreferences.contextRules.length === 0) {
      userData.contextualPreferences.contextRules = [
        {
          id: 'work_hours_quiet',
          name: 'Quiet promotional notifications during work hours',
          condition: {
            timeRange: { start: '09:00', end: '17:00' },
            activity: 'working'
          },
          action: 'suppress',
          parameters: { categories: ['promotion'] }
        },
        {
          id: 'sleep_hours_emergency_only',
          name: 'Only emergency notifications during sleep hours',
          condition: {
            timeRange: { start: '23:00', end: '07:00' }
          },
          action: 'suppress',
          parameters: { except: ['emergency'] }
        }
      ]
    }
  }

  /**
   * Update contextual rules
   */
  private async updateContextualRules(): Promise<void> {
    // This would learn from user behavior and update rules automatically
    console.log('Updating contextual rules based on user behavior patterns')
  }

  /**
   * Update smart do-not-disturb
   */
  private async updateSmartDoNotDisturb(): Promise<void> {
    for (const userData of this.userEngagementData.values()) {
      if (userData.doNotDisturbSettings.smartMode) {
        // Update smart DND based on user activity patterns
        const shouldActivate = await this.isSmartDNDActive(userData.userId)

        if (shouldActivate) {
          console.log(`Smart DND activated for user ${userData.userId}`)
        }
      }
    }
  }

  /**
   * Enhanced apply intelligent rules with new features
   */
  private async applyIntelligentRulesEnhanced(notification: PushNotificationPayload): Promise<void> {
    const userId = notification.data?.userId
    if (!userId) return

    const userData = await this.getUserEngagementData(userId)

    // Check do-not-disturb mode first
    if (await this.isInDoNotDisturbMode(userId, notification)) {
      console.log(`Notification suppressed due to DND mode for user ${userId}`)
      return
    }

    // Apply contextual filtering
    if (!(await this.applyContextualFiltering(notification, userData))) {
      return // Notification was filtered out or delayed
    }

    // Generate smart action buttons
    if (userData.actionButtonPreferences.smartSuggestions) {
      const smartActions = await this.generateSmartActionButtons(notification, userData)
      notification.actions = smartActions
    }

    // Apply original intelligent rules
    await this.applyIntelligentRules(notification)
  }

  /**
   * Get default user engagement data with enhanced features
   */
  private async getUserEngagementDataEnhanced(userId: string): Promise<UserEngagementData> {
    if (this.userEngagementData.has(userId)) {
      return this.userEngagementData.get(userId)!
    }

    // Enhanced default engagement data
    const defaultData: UserEngagementData = {
      userId,
      averageResponseTime: 15,
      preferredDeliveryTimes: ['09:00', '12:00', '18:00'],
      engagementScore: 50,
      lastActiveTime: Date.now(),
      notificationFrequency: 'medium',
      categoryPreferences: {
        ride: 80,
        payment: 60,
        system: 40,
        promotion: 30,
        emergency: 100
      },
      doNotDisturbSettings: {
        enabled: false,
        schedules: [
          {
            id: 'sleep_schedule',
            name: 'Sleep Hours',
            startTime: '23:00',
            endTime: '07:00',
            days: [0, 1, 2, 3, 4, 5, 6], // All days
            enabled: false
          }
        ],
        emergencyOverride: true,
        allowedCategories: ['emergency'],
        smartMode: true
      },
      contextualPreferences: {
        locationBasedFiltering: false,
        activityBasedFiltering: false,
        timeBasedFiltering: true,
        deviceBasedFiltering: false,
        contextRules: []
      },
      actionButtonPreferences: {
        maxButtons: 3,
        preferredActions: {
          ride: ['track', 'contact'],
          payment: ['receipt'],
          promotion: ['use', 'save'],
          emergency: ['view', 'call']
        },
        customActions: [],
        smartSuggestions: true
      }
    }

    this.userEngagementData.set(userId, defaultData)
    return defaultData
  }

  /**
   * Update user DND settings
   */
  public async updateUserDNDSettings(userId: string, settings: Partial<DoNotDisturbSettings>): Promise<void> {
    const userData = await this.getUserEngagementData(userId)
    userData.doNotDisturbSettings = { ...userData.doNotDisturbSettings, ...settings }
    this.userEngagementData.set(userId, userData)
  }

  /**
   * Update user action button preferences
   */
  public async updateActionButtonPreferences(userId: string, preferences: Partial<ActionButtonPreferences>): Promise<void> {
    const userData = await this.getUserEngagementData(userId)
    userData.actionButtonPreferences = { ...userData.actionButtonPreferences, ...preferences }
    this.userEngagementData.set(userId, userData)
  }

  /**
   * Add custom context rule
   */
  public async addContextRule(userId: string, rule: ContextRule): Promise<void> {
    const userData = await this.getUserEngagementData(userId)
    userData.contextualPreferences.contextRules.push(rule)
    this.userEngagementData.set(userId, userData)
  }

  /**
   * Get enhanced analytics
   */
  public getEnhancedAnalytics(): any {
    const baseAnalytics = this.getAnalytics()

    const dndUsers = Array.from(this.userEngagementData.values())
      .filter(user => user.doNotDisturbSettings.enabled).length

    const smartDndUsers = Array.from(this.userEngagementData.values())
      .filter(user => user.doNotDisturbSettings.smartMode).length

    const contextualFilteringUsers = Array.from(this.userEngagementData.values())
      .filter(user => user.contextualPreferences.contextRules.length > 0).length

    return {
      ...baseAnalytics,
      dndUsers,
      smartDndUsers,
      contextualFilteringUsers,
      averageActionButtons: Array.from(this.userEngagementData.values())
        .reduce((sum, user) => sum + user.actionButtonPreferences.maxButtons, 0) / this.userEngagementData.size
    }
  }
}

// Singleton instance
export const intelligentNotificationManager = new IntelligentNotificationManager()

export default intelligentNotificationManager