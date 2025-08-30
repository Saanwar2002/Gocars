/**
 * Comprehensive Monitoring Service
 * Integrates logging, metrics, alerting, and dashboards
 */

import { EventEmitter } from 'events'
import { LoggingService, LoggingConfig, getLoggingService } from './logging/LoggingService'
import { MetricsService, MetricsConfig, getMetricsService } from './metrics/MetricsService'
import { AlertingService, AlertingConfig, getAlertingService } from './alerting/AlertingService'
import { DashboardService, getDashboardService } from './dashboard/DashboardService'

export interface MonitoringConfig {
  logging: LoggingConfig
  metrics: MetricsConfig
  alerting: AlertingConfig
  enableHealthChecks: boolean
  healthCheckInterval: number
  enableAutoRemediation: boolean
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  score: number
  components: {
    logging: { status: string; message: string }
    metrics: { status: string; message: string }
    alerting: { status: string; message: string }
    dashboard: { status: string; message: string }
    application: { status: string; message: string }
  }
  uptime: number
  version: string
  lastCheck: Date
}

export interface MonitoringStats {
  logging: {
    totalLogs: number
    errorRate: number
    logsByLevel: Record<string, number>
  }
  metrics: {
    totalMetrics: number
    metricsPerSecond: number
    activeAlerts: number
  }
  alerting: {
    totalAlerts: number
    activeAlerts: number
    resolvedAlerts: number
    alertsByseverity: Record<string, number>
  }
  dashboard: {
    totalDashboards: number
    totalWidgets: number
    activeUsers: number
  }
}

export class MonitoringService extends EventEmitter {
  private config: MonitoringConfig
  private loggingService: LoggingService
  private metricsService: MetricsService
  private alertingService: AlertingService
  private dashboardService: DashboardService
  private healthCheckTimer?: NodeJS.Timeout
  private isInitialized: boolean = false
  private startTime: Date = new Date()

  constructor(config: MonitoringConfig) {
    super()
    this.config = config
    
    // Initialize services
    this.loggingService = getLoggingService('monitoring-service', config.logging)
    this.metricsService = getMetricsService(config.metrics)
    this.alertingService = getAlertingService(config.alerting)
    this.dashboardService = getDashboardService(
      this.metricsService,
      this.loggingService,
      this.alertingService
    )

    this.setupEventHandlers()
  }

  /**
   * Initialize monitoring service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.loggingService.info('Initializing monitoring service...')

      // Start metrics collection
      this.metricsService.startMetricsCollection()

      // Setup health checks
      if (this.config.enableHealthChecks) {
        this.startHealthChecks()
      }

      // Setup default alert rules
      this.setupDefaultAlertRules()

      this.isInitialized = true
      this.loggingService.info('Monitoring service initialized successfully')
      this.emit('initialized')

    } catch (error) {
      this.loggingService.error('Failed to initialize monitoring service', error as Error)
      throw error
    }
  }

  /**
   * Setup event handlers for cross-service communication
   */
  private setupEventHandlers(): void {
    // Metrics service events
    this.metricsService.on('metricsCollected', () => {
      this.loggingService.debug('Metrics collected successfully')
    })

    this.metricsService.on('metricsCollectionError', (error) => {
      this.loggingService.error('Metrics collection failed', error)
      this.recordSystemEvent('metrics_collection_error', 'error', { error: error.message })
    })

    // Alerting service events
    this.alertingService.on('alertFiring', (alert) => {
      this.loggingService.warn(`Alert firing: ${alert.name}`, {
        alertId: alert.id,
        severity: alert.severity,
        labels: alert.labels
      })
      this.metricsService.incrementCounter('alerts_total', { severity: alert.severity, status: 'firing' })
    })

    this.alertingService.on('alertResolved', (alert) => {
      this.loggingService.info(`Alert resolved: ${alert.name}`, {
        alertId: alert.id,
        duration: alert.endsAt ? alert.endsAt.getTime() - alert.startsAt.getTime() : 0
      })
      this.metricsService.incrementCounter('alerts_total', { severity: alert.severity, status: 'resolved' })
    })

    this.alertingService.on('notificationSent', ({ alert, channel }) => {
      this.loggingService.info(`Notification sent for alert: ${alert.name}`, {
        alertId: alert.id,
        channel: channel.name,
        channelType: channel.type
      })
      this.metricsService.incrementCounter('notifications_sent_total', { 
        channel_type: channel.type,
        severity: alert.severity
      })
    })

    this.alertingService.on('notificationError', ({ alert, channel, error }) => {
      this.loggingService.error(`Notification failed for alert: ${alert.name}`, error, {
        alertId: alert.id,
        channel: channel.name,
        channelType: channel.type
      })
      this.metricsService.incrementCounter('notifications_failed_total', { 
        channel_type: channel.type,
        severity: alert.severity
      })
    })

    // Dashboard service events
    this.dashboardService.on('dashboardDataUpdated', (data) => {
      this.loggingService.debug(`Dashboard data updated: ${data.dashboardId}`)
      this.metricsService.incrementCounter('dashboard_updates_total', { 
        dashboard_id: data.dashboardId 
      })
    })
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    const defaultRules = [
      {
        name: 'HighTestFailureRate',
        description: 'Test failure rate is above threshold',
        query: 'rate(gocars_testing_test_failures_total[5m]) / rate(gocars_testing_test_executions_total[5m]) * 100',
        condition: '>',
        threshold: 10,
        duration: '5m',
        severity: 'high' as const,
        labels: { component: 'testing', type: 'failure_rate' },
        annotations: { 
          summary: 'High test failure rate detected',
          description: 'Test failure rate is {{ $value }}% which is above the 10% threshold'
        },
        enabled: true
      },
      {
        name: 'HighMemoryUsage',
        description: 'Memory usage is above threshold',
        query: 'process_resident_memory_bytes / 1024 / 1024',
        condition: '>',
        threshold: 1024,
        duration: '5m',
        severity: 'warning' as const,
        labels: { component: 'system', type: 'memory' },
        annotations: {
          summary: 'High memory usage detected',
          description: 'Memory usage is {{ $value }}MB which is above the 1GB threshold'
        },
        enabled: true
      },
      {
        name: 'TestingAgentDown',
        description: 'Testing agent is not responding',
        query: 'up{job="testing-agent"}',
        condition: '==',
        threshold: 0,
        duration: '1m',
        severity: 'critical' as const,
        labels: { component: 'system', type: 'availability' },
        annotations: {
          summary: 'Testing agent is down',
          description: 'Testing agent has been down for more than 1 minute'
        },
        enabled: true
      },
      {
        name: 'DatabaseConnectionFailure',
        description: 'Database connection failures detected',
        query: 'rate(database_connection_errors_total[5m])',
        condition: '>',
        threshold: 0.1,
        duration: '2m',
        severity: 'high' as const,
        labels: { component: 'database', type: 'connection' },
        annotations: {
          summary: 'Database connection failures',
          description: 'Database connection error rate is {{ $value }} per second'
        },
        enabled: true
      }
    ]

    defaultRules.forEach(rule => {
      this.alertingService.createAlertRule(rule)
    })

    this.loggingService.info(`Created ${defaultRules.length} default alert rules`)
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck()
    }, this.config.healthCheckInterval)

    // Perform initial health check
    this.performHealthCheck()
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<SystemHealth> {
    const health: SystemHealth = {
      status: 'healthy',
      score: 100,
      components: {
        logging: { status: 'healthy', message: 'Logging service operational' },
        metrics: { status: 'healthy', message: 'Metrics service operational' },
        alerting: { status: 'healthy', message: 'Alerting service operational' },
        dashboard: { status: 'healthy', message: 'Dashboard service operational' },
        application: { status: 'healthy', message: 'Application healthy' }
      },
      uptime: (Date.now() - this.startTime.getTime()) / 1000,
      version: process.env.APP_VERSION || '1.0.0',
      lastCheck: new Date()
    }

    let totalScore = 0
    let componentCount = 0

    // Check each component
    for (const [componentName, component] of Object.entries(health.components)) {
      try {
        const componentHealth = await this.checkComponentHealth(componentName)
        health.components[componentName as keyof typeof health.components] = componentHealth
        
        const score = componentHealth.status === 'healthy' ? 100 : 
                     componentHealth.status === 'warning' ? 70 : 
                     componentHealth.status === 'critical' ? 30 : 0
        
        totalScore += score
        componentCount++
      } catch (error) {
        health.components[componentName as keyof typeof health.components] = {
          status: 'critical',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
        componentCount++
      }
    }

    // Calculate overall health
    health.score = Math.round(totalScore / componentCount)
    health.status = health.score >= 90 ? 'healthy' :
                   health.score >= 70 ? 'warning' :
                   health.score >= 30 ? 'critical' : 'unknown'

    // Record health metrics
    this.metricsService.setGauge('system_health_score', health.score)
    this.metricsService.setGauge('system_uptime_seconds', health.uptime)

    // Log health status
    if (health.status !== 'healthy') {
      this.loggingService.warn(`System health check: ${health.status}`, {
        score: health.score,
        components: health.components
      })
    } else {
      this.loggingService.debug('System health check: healthy', { score: health.score })
    }

    this.emit('healthCheck', health)
    return health
  }

  /**
   * Check individual component health
   */
  private async checkComponentHealth(componentName: string): Promise<{ status: string; message: string }> {
    switch (componentName) {
      case 'logging':
        return this.checkLoggingHealth()
      case 'metrics':
        return this.checkMetricsHealth()
      case 'alerting':
        return this.checkAlertingHealth()
      case 'dashboard':
        return this.checkDashboardHealth()
      case 'application':
        return this.checkApplicationHealth()
      default:
        return { status: 'unknown', message: 'Unknown component' }
    }
  }

  /**
   * Check logging service health
   */
  private checkLoggingHealth(): { status: string; message: string } {
    try {
      // Test logging functionality
      this.loggingService.debug('Health check test log')
      return { status: 'healthy', message: 'Logging service operational' }
    } catch (error) {
      return { 
        status: 'critical', 
        message: `Logging service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Check metrics service health
   */
  private checkMetricsHealth(): { status: string; message: string } {
    try {
      const healthMetrics = this.metricsService.getHealthMetrics()
      const memoryUsage = healthMetrics.memoryUsage.heapUsed / healthMetrics.memoryUsage.heapTotal

      if (memoryUsage > 0.9) {
        return { status: 'critical', message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%` }
      } else if (memoryUsage > 0.8) {
        return { status: 'warning', message: `Elevated memory usage: ${(memoryUsage * 100).toFixed(1)}%` }
      }

      return { status: 'healthy', message: 'Metrics service operational' }
    } catch (error) {
      return { 
        status: 'critical', 
        message: `Metrics service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Check alerting service health
   */
  private checkAlertingHealth(): { status: string; message: string } {
    try {
      const stats = this.alertingService.getAlertStatistics()
      
      if (stats.active > 10) {
        return { status: 'warning', message: `High number of active alerts: ${stats.active}` }
      }

      const criticalAlerts = this.alertingService.getActiveAlerts()
        .filter(alert => alert.severity === 'critical').length

      if (criticalAlerts > 0) {
        return { status: 'critical', message: `${criticalAlerts} critical alerts active` }
      }

      return { status: 'healthy', message: 'Alerting service operational' }
    } catch (error) {
      return { 
        status: 'critical', 
        message: `Alerting service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Check dashboard service health
   */
  private checkDashboardHealth(): { status: string; message: string } {
    try {
      const stats = this.dashboardService.getDashboardStatistics()
      return { 
        status: 'healthy', 
        message: `Dashboard service operational (${stats.totalDashboards} dashboards)` 
      }
    } catch (error) {
      return { 
        status: 'critical', 
        message: `Dashboard service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Check application health
   */
  private checkApplicationHealth(): { status: string; message: string } {
    try {
      const healthMetrics = this.metricsService.getHealthMetrics()
      
      if (healthMetrics.activeHandles > 1000) {
        return { status: 'warning', message: `High number of active handles: ${healthMetrics.activeHandles}` }
      }

      if (healthMetrics.activeRequests > 100) {
        return { status: 'warning', message: `High number of active requests: ${healthMetrics.activeRequests}` }
      }

      return { status: 'healthy', message: 'Application healthy' }
    } catch (error) {
      return { 
        status: 'critical', 
        message: `Application health check error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Record system event
   */
  public recordSystemEvent(
    eventType: string,
    level: 'info' | 'warn' | 'error',
    metadata?: Record<string, any>
  ): void {
    this.loggingService.log(level, `System event: ${eventType}`, {
      component: 'monitoring',
      eventType,
      ...metadata
    })

    this.metricsService.incrementCounter('system_events_total', { 
      event_type: eventType,
      level 
    })
  }

  /**
   * Get monitoring statistics
   */
  public async getMonitoringStats(): Promise<MonitoringStats> {
    const loggingStats = await this.loggingService.getLogStatistics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    })

    const alertingStats = this.alertingService.getAlertStatistics()
    const dashboardStats = this.dashboardService.getDashboardStatistics()

    return {
      logging: {
        totalLogs: loggingStats.totalLogs,
        errorRate: loggingStats.errorRate,
        logsByLevel: loggingStats.logsByLevel
      },
      metrics: {
        totalMetrics: 0, // Would be calculated from metrics service
        metricsPerSecond: 0, // Would be calculated from metrics service
        activeAlerts: alertingStats.active
      },
      alerting: {
        totalAlerts: alertingStats.total,
        activeAlerts: alertingStats.active,
        resolvedAlerts: alertingStats.resolved,
        alertsByseverity: alertingStats.bySeverity
      },
      dashboard: {
        totalDashboards: dashboardStats.totalDashboards,
        totalWidgets: dashboardStats.totalWidgets,
        activeUsers: 0 // Would be tracked separately
      }
    }
  }

  /**
   * Get service instances
   */
  public getServices(): {
    logging: LoggingService
    metrics: MetricsService
    alerting: AlertingService
    dashboard: DashboardService
  } {
    return {
      logging: this.loggingService,
      metrics: this.metricsService,
      alerting: this.alertingService,
      dashboard: this.dashboardService
    }
  }

  /**
   * Shutdown monitoring service
   */
  public async shutdown(): Promise<void> {
    this.loggingService.info('Shutting down monitoring service...')

    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Shutdown services
    this.metricsService.shutdown()
    this.alertingService.shutdown()
    this.dashboardService.shutdown()

    this.isInitialized = false
    this.removeAllListeners()

    this.loggingService.info('Monitoring service shutdown complete')
  }
}

// Singleton instance
let monitoringServiceInstance: MonitoringService | null = null

/**
 * Get singleton monitoring service instance
 */
export function getMonitoringService(config?: MonitoringConfig): MonitoringService {
  if (!monitoringServiceInstance) {
    if (!config) {
      throw new Error('Monitoring service configuration is required')
    }
    monitoringServiceInstance = new MonitoringService(config)
  }

  return monitoringServiceInstance
}

/**
 * Initialize monitoring service
 */
export function initializeMonitoring(config: MonitoringConfig): MonitoringService {
  monitoringServiceInstance = new MonitoringService(config)
  return monitoringServiceInstance
}