/**
 * Integration Manager
 * Coordinates all external service integrations for the testing agent
 */

import { CIPipelineIntegration, CIPipelineConfig } from './CIPipelineIntegration'
import { IssueTrackingIntegration, IssueTrackingConfig } from './IssueTrackingIntegration'
import { NotificationIntegration, NotificationConfig } from './NotificationIntegration'
import { TestResult } from '../core/TestingAgentController'

export interface IntegrationManagerConfig {
  ciPipeline?: CIPipelineConfig
  issueTracking?: IssueTrackingConfig
  notifications?: NotificationConfig
  enabledIntegrations: string[]
  globalSettings: {
    retryAttempts: number
    retryDelay: number
    timeout: number
    enableHealthChecks: boolean
    healthCheckInterval: number
  }
}

export interface IntegrationStatus {
  name: string
  type: string
  enabled: boolean
  initialized: boolean
  healthy: boolean
  lastHealthCheck: number
  healthMessage: string
  details?: any
}

export interface IntegrationEvent {
  id: string
  integration: string
  type: 'initialization' | 'health_check' | 'test_processing' | 'error' | 'notification'
  timestamp: number
  message: string
  data?: any
  error?: string
}

export class IntegrationManager {
  private config: IntegrationManagerConfig
  private ciPipeline?: CIPipelineIntegration
  private issueTracking?: IssueTrackingIntegration
  private notifications?: NotificationIntegration
  private events: Map<string, IntegrationEvent> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private isInitialized: boolean = false

  constructor(config: IntegrationManagerConfig) {
    this.config = config
  }

  /**
   * Initialize all enabled integrations
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Integration Manager...')
    
    try {
      // Initialize CI/CD Pipeline Integration
      if (this.config.enabledIntegrations.includes('ciPipeline') && this.config.ciPipeline) {
        console.log('Initializing CI/CD Pipeline Integration...')
        this.ciPipeline = new CIPipelineIntegration(this.config.ciPipeline)
        await this.ciPipeline.initialize()
        this.logEvent('ciPipeline', 'initialization', 'CI/CD Pipeline Integration initialized successfully')
      }

      // Initialize Issue Tracking Integration
      if (this.config.enabledIntegrations.includes('issueTracking') && this.config.issueTracking) {
        console.log('Initializing Issue Tracking Integration...')
        this.issueTracking = new IssueTrackingIntegration(this.config.issueTracking)
        await this.issueTracking.initialize()
        this.logEvent('issueTracking', 'initialization', 'Issue Tracking Integration initialized successfully')
      }

      // Initialize Notification Integration
      if (this.config.enabledIntegrations.includes('notifications') && this.config.notifications) {
        console.log('Initializing Notification Integration...')
        this.notifications = new NotificationIntegration(this.config.notifications)
        await this.notifications.initialize()
        this.logEvent('notifications', 'initialization', 'Notification Integration initialized successfully')
      }

      // Setup health checks
      if (this.config.globalSettings.enableHealthChecks) {
        this.setupHealthChecks()
      }

      this.isInitialized = true
      console.log('Integration Manager initialized successfully')

    } catch (error) {
      console.error('Integration Manager initialization failed:', error)
      this.logEvent('manager', 'error', 'Integration Manager initialization failed', undefined, error.toString())
      throw error
    }
  }

  /**
   * Process test results through all enabled integrations
   */
  public async processTestResults(testResults: TestResult[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Integration Manager not initialized')
    }

    console.log(`Processing ${testResults.length} test results through integrations...`)

    const processingPromises: Promise<void>[] = []

    try {
      // Process through Issue Tracking
      if (this.issueTracking) {
        processingPromises.push(
          this.processWithRetry('issueTracking', async () => {
            const createdIssues = await this.issueTracking!.processTestResults(testResults)
            this.logEvent('issueTracking', 'test_processing', 
              `Processed test results, created ${createdIssues.length} issues`, 
              { createdIssues: createdIssues.length })
          })
        )
      }

      // Process through Notifications
      if (this.notifications) {
        processingPromises.push(
          this.processWithRetry('notifications', async () => {
            const sentNotifications = await this.notifications!.processTestResults(testResults)
            this.logEvent('notifications', 'test_processing', 
              `Processed test results, sent ${sentNotifications.length} notifications`, 
              { sentNotifications: sentNotifications.length })
          })
        )
      }

      // Wait for all processing to complete
      await Promise.allSettled(processingPromises)

      console.log('Test results processing completed across all integrations')

    } catch (error) {
      console.error('Failed to process test results through integrations:', error)
      this.logEvent('manager', 'error', 'Test results processing failed', undefined, error.toString())
      throw error
    }
  }

  /**
   * Handle CI/CD webhook
   */
  public async handleCIWebhook(payload: any): Promise<string | null> {
    if (!this.ciPipeline) {
      console.warn('CI/CD Pipeline Integration not available for webhook handling')
      return null
    }

    try {
      console.log('Handling CI/CD webhook...')
      const jobId = await this.ciPipeline.handleWebhook(payload)
      
      this.logEvent('ciPipeline', 'notification', 'CI/CD webhook processed successfully', { jobId })
      return jobId

    } catch (error) {
      console.error('Failed to handle CI/CD webhook:', error)
      this.logEvent('ciPipeline', 'error', 'CI/CD webhook processing failed', undefined, error.toString())
      throw error
    }
  }

  /**
   * Update CI/CD job with test results
   */
  public async updateCIJob(jobId: string, testResults: TestResult[]): Promise<void> {
    if (!this.ciPipeline) {
      console.warn('CI/CD Pipeline Integration not available for job updates')
      return
    }

    try {
      await this.ciPipeline.updateJobResults(jobId, testResults)
      this.logEvent('ciPipeline', 'test_processing', 'CI/CD job updated with test results', { jobId })

    } catch (error) {
      console.error(`Failed to update CI/CD job ${jobId}:`, error)
      this.logEvent('ciPipeline', 'error', 'CI/CD job update failed', { jobId }, error.toString())
      throw error
    }
  }

  /**
   * Create deployment from successful CI/CD job
   */
  public async createDeployment(jobId: string, environment: string): Promise<string | null> {
    if (!this.ciPipeline) {
      console.warn('CI/CD Pipeline Integration not available for deployment creation')
      return null
    }

    try {
      const deploymentId = await this.ciPipeline.createDeployment(jobId, environment)
      this.logEvent('ciPipeline', 'notification', 'Deployment created successfully', { jobId, deploymentId, environment })
      return deploymentId

    } catch (error) {
      console.error(`Failed to create deployment for job ${jobId}:`, error)
      this.logEvent('ciPipeline', 'error', 'Deployment creation failed', { jobId, environment }, error.toString())
      throw error
    }
  }

  /**
   * Send immediate notification
   */
  public async sendNotification(providerId: string, templateId: string, data: any, recipient?: string): Promise<string | null> {
    if (!this.notifications) {
      console.warn('Notification Integration not available for immediate notifications')
      return null
    }

    try {
      const notificationId = await this.notifications.sendImmediateNotification(providerId, templateId, data, recipient)
      this.logEvent('notifications', 'notification', 'Immediate notification sent', { providerId, templateId, notificationId })
      return notificationId

    } catch (error) {
      console.error('Failed to send immediate notification:', error)
      this.logEvent('notifications', 'error', 'Immediate notification failed', { providerId, templateId }, error.toString())
      throw error
    }
  }

  /**
   * Send test summary notification
   */
  public async sendTestSummary(testResults: TestResult[], customMessage?: string): Promise<string[]> {
    if (!this.notifications) {
      console.warn('Notification Integration not available for test summary')
      return []
    }

    try {
      const notificationIds = await this.notifications.sendTestSummary(testResults, customMessage)
      this.logEvent('notifications', 'notification', 'Test summary notifications sent', { notificationCount: notificationIds.length })
      return notificationIds

    } catch (error) {
      console.error('Failed to send test summary notifications:', error)
      this.logEvent('notifications', 'error', 'Test summary notification failed', undefined, error.toString())
      return []
    }
  }

  /**
   * Create issue manually
   */
  public async createIssue(testResult: TestResult, customTitle?: string, customDescription?: string): Promise<string | null> {
    if (!this.issueTracking) {
      console.warn('Issue Tracking Integration not available for manual issue creation')
      return null
    }

    try {
      const issueId = await this.issueTracking.createIssue(testResult, customTitle, customDescription)
      this.logEvent('issueTracking', 'notification', 'Manual issue created', { issueId, testName: testResult.name })
      return issueId

    } catch (error) {
      console.error('Failed to create manual issue:', error)
      this.logEvent('issueTracking', 'error', 'Manual issue creation failed', { testName: testResult.name }, error.toString())
      throw error
    }
  }

  /**
   * Get integration status for all integrations
   */
  public getIntegrationStatus(): IntegrationStatus[] {
    const statuses: IntegrationStatus[] = []

    // CI/CD Pipeline Integration Status
    if (this.config.enabledIntegrations.includes('ciPipeline')) {
      const healthStatus = this.ciPipeline?.getHealthStatus()
      statuses.push({
        name: 'CI/CD Pipeline',
        type: 'ciPipeline',
        enabled: true,
        initialized: !!this.ciPipeline,
        healthy: healthStatus?.status === 'healthy',
        lastHealthCheck: Date.now(),
        healthMessage: healthStatus?.message || 'Not initialized',
        details: healthStatus?.details
      })
    }

    // Issue Tracking Integration Status
    if (this.config.enabledIntegrations.includes('issueTracking')) {
      const healthStatus = this.issueTracking?.getHealthStatus()
      statuses.push({
        name: 'Issue Tracking',
        type: 'issueTracking',
        enabled: true,
        initialized: !!this.issueTracking,
        healthy: healthStatus?.status === 'healthy',
        lastHealthCheck: Date.now(),
        healthMessage: healthStatus?.message || 'Not initialized',
        details: healthStatus?.details
      })
    }

    // Notification Integration Status
    if (this.config.enabledIntegrations.includes('notifications')) {
      const healthStatus = this.notifications?.getHealthStatus()
      statuses.push({
        name: 'Notifications',
        type: 'notifications',
        enabled: true,
        initialized: !!this.notifications,
        healthy: healthStatus?.status === 'healthy',
        lastHealthCheck: Date.now(),
        healthMessage: healthStatus?.message || 'Not initialized',
        details: healthStatus?.details
      })
    }

    return statuses
  }

  /**
   * Get recent integration events
   */
  public getRecentEvents(limit: number = 50): IntegrationEvent[] {
    return Array.from(this.events.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get events for specific integration
   */
  public getIntegrationEvents(integration: string, limit: number = 20): IntegrationEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.integration === integration)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get integration metrics
   */
  public getIntegrationMetrics(): any {
    const metrics = {
      totalIntegrations: this.config.enabledIntegrations.length,
      initializedIntegrations: 0,
      healthyIntegrations: 0,
      totalEvents: this.events.size,
      eventsByType: {} as Record<string, number>,
      eventsByIntegration: {} as Record<string, number>
    }

    // Count initialized and healthy integrations
    const statuses = this.getIntegrationStatus()
    metrics.initializedIntegrations = statuses.filter(s => s.initialized).length
    metrics.healthyIntegrations = statuses.filter(s => s.healthy).length

    // Count events by type and integration
    Array.from(this.events.values()).forEach(event => {
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1
      metrics.eventsByIntegration[event.integration] = (metrics.eventsByIntegration[event.integration] || 0) + 1
    })

    // Add integration-specific metrics
    if (this.ciPipeline) {
      metrics['ciPipeline'] = {
        recentJobs: this.ciPipeline.getRecentJobs(5).length,
        recentDeployments: this.ciPipeline.getRecentDeployments(5).length
      }
    }

    if (this.issueTracking) {
      metrics['issueTracking'] = this.issueTracking.getIssueMetrics()
    }

    if (this.notifications) {
      metrics['notifications'] = this.notifications.getNotificationMetrics()
    }

    return metrics
  }

  // Private helper methods

  private async processWithRetry(integration: string, operation: () => Promise<void>): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.globalSettings.retryAttempts; attempt++) {
      try {
        await operation()
        return
      } catch (error) {
        lastError = error as Error
        console.warn(`Integration ${integration} operation failed (attempt ${attempt}/${this.config.globalSettings.retryAttempts}):`, error)
        
        if (attempt < this.config.globalSettings.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.globalSettings.retryDelay))
        }
      }
    }
    
    throw lastError
  }

  private logEvent(integration: string, type: IntegrationEvent['type'], message: string, data?: any, error?: string): void {
    const event: IntegrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      integration,
      type,
      timestamp: Date.now(),
      message,
      data,
      error
    }

    this.events.set(event.id, event)

    // Keep only recent events (last 1000)
    if (this.events.size > 1000) {
      const oldestEvents = Array.from(this.events.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, this.events.size - 1000)
      
      oldestEvents.forEach(([id]) => this.events.delete(id))
    }
  }

  private setupHealthChecks(): void {
    console.log('Setting up integration health checks...')
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks()
      } catch (error) {
        console.error('Health check failed:', error)
        this.logEvent('manager', 'error', 'Health check failed', undefined, error.toString())
      }
    }, this.config.globalSettings.healthCheckInterval * 1000)
  }

  private async performHealthChecks(): Promise<void> {
    const statuses = this.getIntegrationStatus()
    
    for (const status of statuses) {
      this.logEvent(status.type, 'health_check', 
        `Health check: ${status.healthy ? 'healthy' : 'unhealthy'}`, 
        { healthy: status.healthy, message: status.healthMessage })
    }

    const unhealthyIntegrations = statuses.filter(s => !s.healthy)
    if (unhealthyIntegrations.length > 0) {
      console.warn(`${unhealthyIntegrations.length} integrations are unhealthy:`, 
        unhealthyIntegrations.map(s => s.name))
    }
  }

  /**
   * Get integration manager configuration
   */
  public getConfig(): IntegrationManagerConfig {
    return { ...this.config }
  }

  /**
   * Update integration manager configuration
   */
  public updateConfig(newConfig: Partial<IntegrationManagerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get overall health status
   */
  public getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string; details?: any } {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          message: 'Integration Manager not initialized'
        }
      }

      const statuses = this.getIntegrationStatus()
      const healthyCount = statuses.filter(s => s.healthy).length
      const totalCount = statuses.length
      const healthRatio = totalCount > 0 ? (healthyCount / totalCount) * 100 : 100

      return {
        status: healthRatio >= 80 ? 'healthy' : 'unhealthy',
        message: `Integration Manager is ${healthRatio >= 80 ? 'healthy' : 'unhealthy'}`,
        details: {
          totalIntegrations: totalCount,
          healthyIntegrations: healthyCount,
          healthRatio: `${healthRatio.toFixed(1)}%`,
          enabledIntegrations: this.config.enabledIntegrations,
          recentEvents: this.getRecentEvents(5).length
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Integration Manager health check failed: ${error}`,
        details: { error: error.toString() }
      }
    }
  }

  /**
   * Cleanup and shutdown all integrations
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Integration Manager...')
    
    try {
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
      }

      // Shutdown integrations
      const shutdownPromises: Promise<void>[] = []

      if (this.ciPipeline) {
        shutdownPromises.push(this.ciPipeline.shutdown())
      }

      if (this.issueTracking) {
        shutdownPromises.push(this.issueTracking.shutdown())
      }

      if (this.notifications) {
        shutdownPromises.push(this.notifications.shutdown())
      }

      await Promise.allSettled(shutdownPromises)

      // Clear data
      this.events.clear()
      
      this.isInitialized = false
      console.log('Integration Manager shutdown completed')
      
    } catch (error) {
      console.error('Integration Manager shutdown failed:', error)
      throw error
    }
  }
}