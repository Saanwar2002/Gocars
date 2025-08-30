/**
 * Notification and Alerting Service Integration
 * Provides integration with various notification services (Slack, Teams, Email, etc.)
 */

import { TestResult } from '../core/TestingAgentController'

export interface NotificationConfig {
  providers: NotificationProvider[]
  rules: NotificationRule[]
  templates: NotificationTemplate[]
  rateLimiting: {
    enabled: boolean
    maxNotificationsPerHour: number
    cooldownPeriod: number // minutes
  }
  escalation: {
    enabled: boolean
    levels: EscalationLevel[]
  }
}

export interface NotificationProvider {
  id: string
  type: 'slack' | 'teams' | 'email' | 'webhook' | 'sms' | 'discord' | 'pagerduty'
  name: string
  config: {
    apiUrl?: string
    apiToken?: string
    webhookUrl?: string
    channel?: string
    recipients?: string[]
    fromAddress?: string
    smtpServer?: string
    smtpPort?: number
    username?: string
    password?: string
  }
  enabled: boolean
  priority: number
}

export interface NotificationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: NotificationCondition[]
  providers: string[] // Provider IDs
  template: string // Template ID
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // minutes
  escalate: boolean
}

export interface NotificationCondition {
  type: 'test_status' | 'failure_count' | 'success_rate' | 'duration' | 'error_pattern' | 'environment'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches'
  value: any
  field?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'slack' | 'teams' | 'email' | 'webhook' | 'sms' | 'generic'
  subject?: string
  title: string
  message: string
  format: 'text' | 'markdown' | 'html' | 'json'
  attachments?: NotificationAttachment[]
}

export interface NotificationAttachment {
  type: 'image' | 'file' | 'link'
  url: string
  title?: string
  description?: string
}

export interface EscalationLevel {
  level: number
  delay: number // minutes
  providers: string[]
  template?: string
  conditions?: NotificationCondition[]
}

export interface NotificationEvent {
  id: string
  ruleId: string
  providerId: string
  timestamp: number
  status: 'pending' | 'sent' | 'failed' | 'rate_limited'
  message: string
  recipient?: string
  response?: any
  error?: string
  retryCount: number
  escalationLevel?: number
}

export interface NotificationMetrics {
  totalNotifications: number
  successfulNotifications: number
  failedNotifications: number
  rateLimitedNotifications: number
  notificationsByProvider: Record<string, number>
  notificationsByRule: Record<string, number>
  averageDeliveryTime: number
  escalationCount: number
}

export class NotificationIntegration {
  private config: NotificationConfig
  private events: Map<string, NotificationEvent> = new Map()
  private lastNotificationTime: Map<string, number> = new Map()
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()
  private isInitialized: boolean = false

  constructor(config: NotificationConfig) {
    this.config = config
  }

  /**
   * Initialize notification integration
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Notification Integration...')
    
    try {
      // Validate configuration
      await this.validateConfiguration()
      
      // Initialize providers
      await this.initializeProviders()
      
      // Setup rate limiting
      this.setupRateLimiting()
      
      this.isInitialized = true
      console.log('Notification Integration initialized successfully')
    } catch (error) {
      console.error('Notification Integration initialization failed:', error)
      throw error
    }
  }

  /**
   * Process test results and send notifications
   */
  public async processTestResults(testResults: TestResult[]): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('Notification Integration not initialized')
    }

    console.log(`Processing ${testResults.length} test results for notifications...`)

    const sentNotifications: string[] = []

    try {
      // Evaluate notification rules
      for (const rule of this.config.rules.filter(r => r.enabled)) {
        if (await this.evaluateRule(rule, testResults)) {
          const notificationIds = await this.sendNotification(rule, testResults)
          sentNotifications.push(...notificationIds)
        }
      }

      console.log(`Notification processing completed. Sent ${sentNotifications.length} notifications.`)
      return sentNotifications

    } catch (error) {
      console.error('Failed to process test results for notifications:', error)
      throw error
    }
  }

  /**
   * Send immediate notification
   */
  public async sendImmediateNotification(
    providerId: string,
    templateId: string,
    data: any,
    recipient?: string
  ): Promise<string> {
    console.log(`Sending immediate notification via provider: ${providerId}`)

    try {
      const provider = this.config.providers.find(p => p.id === providerId)
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }

      const template = this.config.templates.find(t => t.id === templateId)
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }

      const event = await this.createNotificationEvent('immediate', providerId, template, data, recipient)
      const success = await this.deliverNotification(event, provider, template, data)

      if (success) {
        event.status = 'sent'
        console.log(`Immediate notification sent successfully: ${event.id}`)
      } else {
        event.status = 'failed'
        console.log(`Immediate notification failed: ${event.id}`)
      }

      this.events.set(event.id, event)
      return event.id

    } catch (error) {
      console.error('Failed to send immediate notification:', error)
      throw error
    }
  }

  /**
   * Send test summary notification
   */
  public async sendTestSummary(testResults: TestResult[], customMessage?: string): Promise<string[]> {
    console.log('Sending test summary notifications...')

    const summary = this.generateTestSummary(testResults)
    const data = {
      ...summary,
      customMessage: customMessage || '',
      timestamp: new Date().toISOString()
    }

    const sentNotifications: string[] = []

    try {
      // Find summary notification rules
      const summaryRules = this.config.rules.filter(r => 
        r.enabled && r.name.toLowerCase().includes('summary')
      )

      for (const rule of summaryRules) {
        const notificationIds = await this.sendNotification(rule, testResults, data)
        sentNotifications.push(...notificationIds)
      }

      return sentNotifications

    } catch (error) {
      console.error('Failed to send test summary notifications:', error)
      throw error
    }
  }

  /**
   * Get notification event
   */
  public getNotificationEvent(eventId: string): NotificationEvent | undefined {
    return this.events.get(eventId)
  }

  /**
   * Get recent notification events
   */
  public getRecentEvents(limit: number = 50): NotificationEvent[] {
    return Array.from(this.events.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get notification metrics
   */
  public getNotificationMetrics(): NotificationMetrics {
    const allEvents = Array.from(this.events.values())
    
    const metrics: NotificationMetrics = {
      totalNotifications: allEvents.length,
      successfulNotifications: allEvents.filter(e => e.status === 'sent').length,
      failedNotifications: allEvents.filter(e => e.status === 'failed').length,
      rateLimitedNotifications: allEvents.filter(e => e.status === 'rate_limited').length,
      notificationsByProvider: {},
      notificationsByRule: {},
      averageDeliveryTime: 0,
      escalationCount: allEvents.filter(e => e.escalationLevel && e.escalationLevel > 0).length
    }

    // Group by provider
    allEvents.forEach(event => {
      metrics.notificationsByProvider[event.providerId] = 
        (metrics.notificationsByProvider[event.providerId] || 0) + 1
    })

    // Group by rule
    allEvents.forEach(event => {
      metrics.notificationsByRule[event.ruleId] = 
        (metrics.notificationsByRule[event.ruleId] || 0) + 1
    })

    // Calculate average delivery time (mock calculation)
    const successfulEvents = allEvents.filter(e => e.status === 'sent')
    if (successfulEvents.length > 0) {
      metrics.averageDeliveryTime = 2000 // Mock 2 seconds average
    }

    return metrics
  }

  // Private helper methods

  private async validateConfiguration(): Promise<void> {
    if (!this.config.providers || this.config.providers.length === 0) {
      throw new Error('At least one notification provider must be configured')
    }

    if (!this.config.rules || this.config.rules.length === 0) {
      throw new Error('At least one notification rule must be configured')
    }

    if (!this.config.templates || this.config.templates.length === 0) {
      throw new Error('At least one notification template must be configured')
    }

    // Validate provider configurations
    for (const provider of this.config.providers) {
      await this.validateProvider(provider)
    }
  }

  private async validateProvider(provider: NotificationProvider): Promise<void> {
    switch (provider.type) {
      case 'slack':
        if (!provider.config.webhookUrl && !provider.config.apiToken) {
          throw new Error(`Slack provider ${provider.id} requires webhookUrl or apiToken`)
        }
        break
      case 'email':
        if (!provider.config.smtpServer || !provider.config.fromAddress) {
          throw new Error(`Email provider ${provider.id} requires smtpServer and fromAddress`)
        }
        break
      case 'webhook':
        if (!provider.config.webhookUrl) {
          throw new Error(`Webhook provider ${provider.id} requires webhookUrl`)
        }
        break
      // Add other provider validations as needed
    }
  }

  private async initializeProviders(): Promise<void> {
    console.log(`Initializing ${this.config.providers.length} notification providers...`)
    
    for (const provider of this.config.providers.filter(p => p.enabled)) {
      try {
        await this.initializeProvider(provider)
        console.log(`Provider ${provider.name} (${provider.type}) initialized successfully`)
      } catch (error) {
        console.error(`Failed to initialize provider ${provider.name}:`, error)
        // Continue with other providers
      }
    }
  }

  private async initializeProvider(provider: NotificationProvider): Promise<void> {
    // Provider-specific initialization
    switch (provider.type) {
      case 'slack':
        await this.initializeSlack(provider)
        break
      case 'teams':
        await this.initializeTeams(provider)
        break
      case 'email':
        await this.initializeEmail(provider)
        break
      // Add other provider initializations as needed
      default:
        console.log(`Provider ${provider.type} initialized with default settings`)
    }
  }

  private async initializeSlack(provider: NotificationProvider): Promise<void> {
    // Slack-specific initialization
    console.log(`Initializing Slack provider: ${provider.name}`)
  }

  private async initializeTeams(provider: NotificationProvider): Promise<void> {
    // Teams-specific initialization
    console.log(`Initializing Teams provider: ${provider.name}`)
  }

  private async initializeEmail(provider: NotificationProvider): Promise<void> {
    // Email-specific initialization
    console.log(`Initializing Email provider: ${provider.name}`)
  }

  private setupRateLimiting(): void {
    if (this.config.rateLimiting.enabled) {
      console.log('Rate limiting enabled for notifications')
      
      // Setup cleanup interval for rate limiting data
      setInterval(() => {
        this.cleanupRateLimitingData()
      }, 60000) // Clean up every minute
    }
  }

  private cleanupRateLimitingData(): void {
    const now = Date.now()
    const cutoff = now - (this.config.rateLimiting.cooldownPeriod * 60 * 1000)
    
    for (const [key, timestamp] of this.lastNotificationTime.entries()) {
      if (timestamp < cutoff) {
        this.lastNotificationTime.delete(key)
      }
    }
  }

  private async evaluateRule(rule: NotificationRule, testResults: TestResult[]): Promise<boolean> {
    // Check cooldown
    if (this.isRuleCooledDown(rule)) {
      return false
    }

    // Evaluate all conditions
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, testResults)) {
        return false
      }
    }

    return true
  }

  private isRuleCooledDown(rule: NotificationRule): boolean {
    const lastNotification = this.lastNotificationTime.get(rule.id)
    if (!lastNotification) {
      return false
    }

    const cooldownPeriod = rule.cooldown * 60 * 1000 // Convert to milliseconds
    return (Date.now() - lastNotification) < cooldownPeriod
  }

  private async evaluateCondition(condition: NotificationCondition, testResults: TestResult[]): Promise<boolean> {
    switch (condition.type) {
      case 'test_status':
        return this.evaluateTestStatusCondition(condition, testResults)
      case 'failure_count':
        return this.evaluateFailureCountCondition(condition, testResults)
      case 'success_rate':
        return this.evaluateSuccessRateCondition(condition, testResults)
      case 'duration':
        return this.evaluateDurationCondition(condition, testResults)
      case 'error_pattern':
        return this.evaluateErrorPatternCondition(condition, testResults)
      default:
        return false
    }
  }

  private evaluateTestStatusCondition(condition: NotificationCondition, testResults: TestResult[]): boolean {
    const statusCounts = testResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const value = statusCounts[condition.value] || 0
    
    switch (condition.operator) {
      case 'greater_than':
        return value > condition.value
      case 'equals':
        return value === condition.value
      default:
        return false
    }
  }

  private evaluateFailureCountCondition(condition: NotificationCondition, testResults: TestResult[]): boolean {
    const failureCount = testResults.filter(r => r.status === 'failed' || r.status === 'error').length
    
    switch (condition.operator) {
      case 'greater_than':
        return failureCount > condition.value
      case 'equals':
        return failureCount === condition.value
      case 'less_than':
        return failureCount < condition.value
      default:
        return false
    }
  }

  private evaluateSuccessRateCondition(condition: NotificationCondition, testResults: TestResult[]): boolean {
    if (testResults.length === 0) return false
    
    const successCount = testResults.filter(r => r.status === 'passed').length
    const successRate = (successCount / testResults.length) * 100
    
    switch (condition.operator) {
      case 'less_than':
        return successRate < condition.value
      case 'greater_than':
        return successRate > condition.value
      default:
        return false
    }
  }

  private evaluateDurationCondition(condition: NotificationCondition, testResults: TestResult[]): boolean {
    const totalDuration = testResults.reduce((sum, result) => sum + result.duration, 0)
    
    switch (condition.operator) {
      case 'greater_than':
        return totalDuration > condition.value
      case 'less_than':
        return totalDuration < condition.value
      default:
        return false
    }
  }

  private evaluateErrorPatternCondition(condition: NotificationCondition, testResults: TestResult[]): boolean {
    const pattern = new RegExp(condition.value, 'i')
    
    return testResults.some(result => {
      const message = result.message || ''
      const errorMessage = result.error?.message || ''
      
      return pattern.test(message) || pattern.test(errorMessage)
    })
  }

  private async sendNotification(rule: NotificationRule, testResults: TestResult[], customData?: any): Promise<string[]> {
    const sentNotifications: string[] = []
    
    // Check rate limiting
    if (this.config.rateLimiting.enabled && this.isRateLimited(rule)) {
      console.log(`Notification rate limited for rule: ${rule.name}`)
      return sentNotifications
    }

    const template = this.config.templates.find(t => t.id === rule.template)
    if (!template) {
      console.error(`Template not found for rule ${rule.name}: ${rule.template}`)
      return sentNotifications
    }

    const data = customData || this.generateNotificationData(testResults)

    for (const providerId of rule.providers) {
      const provider = this.config.providers.find(p => p.id === providerId && p.enabled)
      if (!provider) {
        console.error(`Provider not found or disabled: ${providerId}`)
        continue
      }

      try {
        const event = await this.createNotificationEvent(rule.id, providerId, template, data)
        const success = await this.deliverNotification(event, provider, template, data)

        if (success) {
          event.status = 'sent'
          sentNotifications.push(event.id)
          
          // Update last notification time
          this.lastNotificationTime.set(rule.id, Date.now())
          
          // Setup escalation if enabled
          if (rule.escalate && this.config.escalation.enabled) {
            this.setupEscalation(rule, testResults, data)
          }
        } else {
          event.status = 'failed'
        }

        this.events.set(event.id, event)

      } catch (error) {
        console.error(`Failed to send notification via provider ${providerId}:`, error)
      }
    }

    return sentNotifications
  }

  private isRateLimited(rule: NotificationRule): boolean {
    // Simple rate limiting implementation
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    
    const recentNotifications = Array.from(this.events.values()).filter(event =>
      event.ruleId === rule.id && 
      event.timestamp > hourAgo &&
      event.status === 'sent'
    )

    return recentNotifications.length >= this.config.rateLimiting.maxNotificationsPerHour
  }

  private async createNotificationEvent(
    ruleId: string,
    providerId: string,
    template: NotificationTemplate,
    data: any,
    recipient?: string
  ): Promise<NotificationEvent> {
    const message = this.renderTemplate(template, data)
    
    return {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      providerId,
      timestamp: Date.now(),
      status: 'pending',
      message,
      recipient,
      retryCount: 0
    }
  }

  private renderTemplate(template: NotificationTemplate, data: any): string {
    let message = template.message
    
    // Simple template variable replacement
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`
      message = message.replace(new RegExp(placeholder, 'g'), data[key])
    })
    
    return message
  }

  private async deliverNotification(
    event: NotificationEvent,
    provider: NotificationProvider,
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    console.log(`Delivering notification ${event.id} via ${provider.type}`)

    try {
      switch (provider.type) {
        case 'slack':
          return await this.deliverSlackNotification(event, provider, template, data)
        case 'teams':
          return await this.deliverTeamsNotification(event, provider, template, data)
        case 'email':
          return await this.deliverEmailNotification(event, provider, template, data)
        case 'webhook':
          return await this.deliverWebhookNotification(event, provider, template, data)
        default:
          console.log(`Mock delivery for ${provider.type}: ${event.message}`)
          return true
      }
    } catch (error) {
      console.error(`Notification delivery failed:`, error)
      event.error = error.toString()
      return false
    }
  }

  private async deliverSlackNotification(
    event: NotificationEvent,
    provider: NotificationProvider,
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    // Mock Slack delivery
    console.log(`Slack notification sent to ${provider.config.channel}: ${event.message}`)
    return true
  }

  private async deliverTeamsNotification(
    event: NotificationEvent,
    provider: NotificationProvider,
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    // Mock Teams delivery
    console.log(`Teams notification sent: ${event.message}`)
    return true
  }

  private async deliverEmailNotification(
    event: NotificationEvent,
    provider: NotificationProvider,
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    // Mock Email delivery
    const recipients = event.recipient || provider.config.recipients?.join(', ') || 'unknown'
    console.log(`Email notification sent to ${recipients}: ${template.subject || 'Test Notification'}`)
    return true
  }

  private async deliverWebhookNotification(
    event: NotificationEvent,
    provider: NotificationProvider,
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    // Mock Webhook delivery
    console.log(`Webhook notification sent to ${provider.config.webhookUrl}: ${event.message}`)
    return true
  }

  private generateNotificationData(testResults: TestResult[]): any {
    const summary = this.generateTestSummary(testResults)
    
    return {
      ...summary,
      timestamp: new Date().toISOString(),
      testResults: testResults.map(r => ({
        name: r.name,
        status: r.status,
        duration: r.duration,
        message: r.message
      }))
    }
  }

  private generateTestSummary(testResults: TestResult[]): any {
    const total = testResults.length
    const passed = testResults.filter(r => r.status === 'passed').length
    const failed = testResults.filter(r => r.status === 'failed').length
    const errors = testResults.filter(r => r.status === 'error').length
    const skipped = testResults.filter(r => r.status === 'skipped').length
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0)
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'

    return {
      total,
      passed,
      failed,
      errors,
      skipped,
      totalDuration,
      successRate,
      status: failed > 0 || errors > 0 ? 'FAILED' : 'PASSED'
    }
  }

  private setupEscalation(rule: NotificationRule, testResults: TestResult[], data: any): void {
    if (!this.config.escalation.levels || this.config.escalation.levels.length === 0) {
      return
    }

    console.log(`Setting up escalation for rule: ${rule.name}`)

    this.config.escalation.levels.forEach((level, index) => {
      const timerId = setTimeout(async () => {
        try {
          console.log(`Escalating notification for rule ${rule.name} to level ${level.level}`)
          
          // Send escalation notification
          const escalationTemplate = this.config.templates.find(t => t.id === level.template) || 
                                   this.config.templates.find(t => t.id === rule.template)
          
          if (escalationTemplate) {
            for (const providerId of level.providers) {
              const provider = this.config.providers.find(p => p.id === providerId && p.enabled)
              if (provider) {
                const event = await this.createNotificationEvent(rule.id, providerId, escalationTemplate, data)
                event.escalationLevel = level.level
                await this.deliverNotification(event, provider, escalationTemplate, data)
                this.events.set(event.id, event)
              }
            }
          }
        } catch (error) {
          console.error(`Escalation failed for rule ${rule.name}:`, error)
        }
      }, level.delay * 60 * 1000) // Convert minutes to milliseconds

      this.escalationTimers.set(`${rule.id}_${level.level}`, timerId)
    })
  }

  /**
   * Get integration configuration
   */
  public getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Update integration configuration
   */
  public updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get integration health status
   */
  public getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string; details?: any } {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          message: 'Notification Integration not initialized'
        }
      }

      const metrics = this.getNotificationMetrics()
      const successRate = metrics.totalNotifications > 0 ? 
        ((metrics.successfulNotifications / metrics.totalNotifications) * 100) : 100

      return {
        status: successRate >= 90 ? 'healthy' : 'unhealthy',
        message: `Notification Integration is ${successRate >= 90 ? 'healthy' : 'unhealthy'}`,
        details: {
          totalNotifications: metrics.totalNotifications,
          successRate: `${successRate.toFixed(1)}%`,
          enabledProviders: this.config.providers.filter(p => p.enabled).length,
          activeRules: this.config.rules.filter(r => r.enabled).length,
          rateLimitingEnabled: this.config.rateLimiting.enabled
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Notification Integration health check failed: ${error}`,
        details: { error: error.toString() }
      }
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Notification Integration...')
    
    try {
      // Clear escalation timers
      this.escalationTimers.forEach(timer => clearTimeout(timer))
      this.escalationTimers.clear()
      
      // Clear data
      this.events.clear()
      this.lastNotificationTime.clear()
      
      this.isInitialized = false
      console.log('Notification Integration shutdown completed')
      
    } catch (error) {
      console.error('Notification Integration shutdown failed:', error)
      throw error
    }
  }
}