/**
 * Dashboard Service
 * Provides real-time monitoring dashboards and visualizations
 */

import { EventEmitter } from 'events'
import { MetricsService } from '../metrics/MetricsService'
import { LoggingService } from '../logging/LoggingService'
import { AlertingService } from '../alerting/AlertingService'

export interface DashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'alert' | 'log' | 'status'
  config: {
    query?: string
    timeRange?: string
    refreshInterval?: number
    visualization?: 'line' | 'bar' | 'pie' | 'gauge' | 'stat'
    thresholds?: Array<{ value: number; color: string }>
    columns?: string[]
    filters?: Record<string, any>
  }
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface Dashboard {
  id: string
  title: string
  description: string
  tags: string[]
  widgets: DashboardWidget[]
  variables: Array<{
    name: string
    type: 'query' | 'constant' | 'interval'
    query?: string
    value?: string
    options?: string[]
  }>
  timeRange: {
    from: string
    to: string
  }
  refreshInterval: number
  createdAt: Date
  updatedAt: Date
}

export interface DashboardData {
  dashboardId: string
  widgets: Array<{
    widgetId: string
    data: any
    lastUpdated: Date
    error?: string
  }>
  alerts: Array<{
    id: string
    name: string
    severity: string
    status: string
    startsAt: Date
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    version: string
    lastCheck: Date
  }
}

export class DashboardService extends EventEmitter {
  private metricsService: MetricsService
  private loggingService: LoggingService
  private alertingService: AlertingService
  private dashboards: Map<string, Dashboard> = new Map()
  private dashboardData: Map<string, DashboardData> = new Map()
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    metricsService: MetricsService,
    loggingService: LoggingService,
    alertingService: AlertingService
  ) {
    super()
    this.metricsService = metricsService
    this.loggingService = loggingService
    this.alertingService = alertingService

    // Initialize default dashboards
    this.initializeDefaultDashboards()
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    // System Overview Dashboard
    const systemDashboard: Dashboard = {
      id: 'system-overview',
      title: 'System Overview',
      description: 'High-level system health and performance metrics',
      tags: ['system', 'overview'],
      widgets: [
        {
          id: 'system-status',
          title: 'System Status',
          type: 'status',
          config: {
            visualization: 'stat',
            thresholds: [
              { value: 0.8, color: 'red' },
              { value: 0.9, color: 'yellow' },
              { value: 1.0, color: 'green' }
            ]
          },
          position: { x: 0, y: 0, width: 6, height: 3 }
        },
        {
          id: 'active-tests',
          title: 'Active Tests',
          type: 'metric',
          config: {
            query: 'gocars_testing_active_tests',
            visualization: 'gauge',
            refreshInterval: 5000
          },
          position: { x: 6, y: 0, width: 6, height: 3 }
        },
        {
          id: 'test-pass-rate',
          title: 'Test Pass Rate',
          type: 'chart',
          config: {
            query: 'rate(gocars_testing_test_executions_total{status="pass"}[5m])',
            visualization: 'line',
            timeRange: '1h',
            refreshInterval: 30000
          },
          position: { x: 0, y: 3, width: 12, height: 4 }
        },
        {
          id: 'system-resources',
          title: 'System Resources',
          type: 'chart',
          config: {
            query: 'gocars_testing_system_resources',
            visualization: 'line',
            timeRange: '1h',
            refreshInterval: 30000
          },
          position: { x: 0, y: 7, width: 12, height: 4 }
        },
        {
          id: 'recent-alerts',
          title: 'Recent Alerts',
          type: 'alert',
          config: {
            filters: { status: 'firing' },
            refreshInterval: 10000
          },
          position: { x: 0, y: 11, width: 12, height: 3 }
        }
      ],
      variables: [
        {
          name: 'environment',
          type: 'constant',
          value: 'production'
        }
      ],
      timeRange: { from: 'now-1h', to: 'now' },
      refreshInterval: 30000,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Test Execution Dashboard
    const testDashboard: Dashboard = {
      id: 'test-execution',
      title: 'Test Execution',
      description: 'Detailed test execution metrics and trends',
      tags: ['testing', 'execution'],
      widgets: [
        {
          id: 'test-executions-total',
          title: 'Total Test Executions',
          type: 'metric',
          config: {
            query: 'sum(gocars_testing_test_executions_total)',
            visualization: 'stat'
          },
          position: { x: 0, y: 0, width: 3, height: 3 }
        },
        {
          id: 'test-failures-total',
          title: 'Total Test Failures',
          type: 'metric',
          config: {
            query: 'sum(gocars_testing_test_failures_total)',
            visualization: 'stat',
            thresholds: [
              { value: 0, color: 'green' },
              { value: 10, color: 'yellow' },
              { value: 50, color: 'red' }
            ]
          },
          position: { x: 3, y: 0, width: 3, height: 3 }
        },
        {
          id: 'test-duration',
          title: 'Average Test Duration',
          type: 'metric',
          config: {
            query: 'avg(gocars_testing_test_execution_duration_seconds)',
            visualization: 'gauge'
          },
          position: { x: 6, y: 0, width: 3, height: 3 }
        },
        {
          id: 'test-success-rate',
          title: 'Test Success Rate',
          type: 'metric',
          config: {
            query: 'rate(gocars_testing_test_executions_total{status="pass"}[5m]) / rate(gocars_testing_test_executions_total[5m]) * 100',
            visualization: 'gauge',
            thresholds: [
              { value: 80, color: 'red' },
              { value: 90, color: 'yellow' },
              { value: 95, color: 'green' }
            ]
          },
          position: { x: 9, y: 0, width: 3, height: 3 }
        },
        {
          id: 'test-executions-by-suite',
          title: 'Test Executions by Suite',
          type: 'chart',
          config: {
            query: 'sum by (suite) (gocars_testing_test_executions_total)',
            visualization: 'pie',
            timeRange: '24h'
          },
          position: { x: 0, y: 3, width: 6, height: 4 }
        },
        {
          id: 'test-failures-by-suite',
          title: 'Test Failures by Suite',
          type: 'chart',
          config: {
            query: 'sum by (suite) (gocars_testing_test_failures_total)',
            visualization: 'bar',
            timeRange: '24h'
          },
          position: { x: 6, y: 3, width: 6, height: 4 }
        }
      ],
      variables: [],
      timeRange: { from: 'now-24h', to: 'now' },
      refreshInterval: 60000,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Performance Dashboard
    const performanceDashboard: Dashboard = {
      id: 'performance',
      title: 'Performance Monitoring',
      description: 'System performance and resource utilization',
      tags: ['performance', 'resources'],
      widgets: [
        {
          id: 'cpu-usage',
          title: 'CPU Usage',
          type: 'chart',
          config: {
            query: 'gocars_testing_system_resources{resource_type="cpu"}',
            visualization: 'line',
            timeRange: '1h',
            thresholds: [
              { value: 80, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          },
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'memory-usage',
          title: 'Memory Usage',
          type: 'chart',
          config: {
            query: 'gocars_testing_system_resources{resource_type="memory"}',
            visualization: 'line',
            timeRange: '1h',
            thresholds: [
              { value: 80, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          },
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: 'http-requests',
          title: 'HTTP Requests',
          type: 'chart',
          config: {
            query: 'rate(gocars_testing_http_requests_total[5m])',
            visualization: 'line',
            timeRange: '1h'
          },
          position: { x: 0, y: 4, width: 6, height: 4 }
        },
        {
          id: 'response-time',
          title: 'Response Time',
          type: 'chart',
          config: {
            query: 'histogram_quantile(0.95, gocars_testing_http_request_duration_seconds_bucket)',
            visualization: 'line',
            timeRange: '1h'
          },
          position: { x: 6, y: 4, width: 6, height: 4 }
        }
      ],
      variables: [],
      timeRange: { from: 'now-1h', to: 'now' },
      refreshInterval: 30000,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store default dashboards
    this.dashboards.set(systemDashboard.id, systemDashboard)
    this.dashboards.set(testDashboard.id, testDashboard)
    this.dashboards.set(performanceDashboard.id, performanceDashboard)

    // Start data collection for default dashboards
    this.startDashboardRefresh(systemDashboard.id)
    this.startDashboardRefresh(testDashboard.id)
    this.startDashboardRefresh(performanceDashboard.id)
  }

  /**
   * Create a new dashboard
   */
  public createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    const newDashboard: Dashboard = {
      id: this.generateDashboardId(),
      ...dashboard,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.dashboards.set(newDashboard.id, newDashboard)
    this.startDashboardRefresh(newDashboard.id)

    this.emit('dashboardCreated', newDashboard)
    return newDashboard
  }

  /**
   * Update a dashboard
   */
  public updateDashboard(id: string, updates: Partial<Dashboard>): Dashboard | null {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) return null

    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date()
    }

    this.dashboards.set(id, updatedDashboard)
    
    // Restart refresh if interval changed
    if (updates.refreshInterval) {
      this.stopDashboardRefresh(id)
      this.startDashboardRefresh(id)
    }

    this.emit('dashboardUpdated', updatedDashboard)
    return updatedDashboard
  }

  /**
   * Delete a dashboard
   */
  public deleteDashboard(id: string): boolean {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) return false

    this.dashboards.delete(id)
    this.dashboardData.delete(id)
    this.stopDashboardRefresh(id)

    this.emit('dashboardDeleted', { id, dashboard })
    return true
  }

  /**
   * Get dashboard by ID
   */
  public getDashboard(id: string): Dashboard | null {
    return this.dashboards.get(id) || null
  }

  /**
   * Get all dashboards
   */
  public getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values())
  }

  /**
   * Get dashboard data
   */
  public getDashboardData(id: string): DashboardData | null {
    return this.dashboardData.get(id) || null
  }

  /**
   * Refresh dashboard data
   */
  public async refreshDashboard(id: string): Promise<DashboardData | null> {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) return null

    const data = await this.collectDashboardData(dashboard)
    this.dashboardData.set(id, data)

    this.emit('dashboardDataUpdated', data)
    return data
  }

  /**
   * Start automatic dashboard refresh
   */
  private startDashboardRefresh(id: string): void {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) return

    // Initial data collection
    this.refreshDashboard(id)

    // Set up periodic refresh
    const timer = setInterval(async () => {
      await this.refreshDashboard(id)
    }, dashboard.refreshInterval)

    this.refreshTimers.set(id, timer)
  }

  /**
   * Stop dashboard refresh
   */
  private stopDashboardRefresh(id: string): void {
    const timer = this.refreshTimers.get(id)
    if (timer) {
      clearInterval(timer)
      this.refreshTimers.delete(id)
    }
  }

  /**
   * Collect data for dashboard widgets
   */
  private async collectDashboardData(dashboard: Dashboard): Promise<DashboardData> {
    const widgetData = await Promise.all(
      dashboard.widgets.map(async (widget) => {
        try {
          const data = await this.collectWidgetData(widget)
          return {
            widgetId: widget.id,
            data,
            lastUpdated: new Date()
          }
        } catch (error) {
          return {
            widgetId: widget.id,
            data: null,
            lastUpdated: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Get active alerts
    const alerts = this.alertingService.getActiveAlerts().map(alert => ({
      id: alert.id,
      name: alert.name,
      severity: alert.severity,
      status: alert.status,
      startsAt: alert.startsAt
    }))

    // Get system health
    const healthMetrics = this.metricsService.getHealthMetrics()
    const systemHealth = {
      status: this.calculateSystemHealthStatus(healthMetrics),
      uptime: healthMetrics.uptime,
      version: process.env.APP_VERSION || '1.0.0',
      lastCheck: new Date()
    }

    return {
      dashboardId: dashboard.id,
      widgets: widgetData,
      alerts,
      systemHealth
    }
  }

  /**
   * Collect data for a specific widget
   */
  private async collectWidgetData(widget: DashboardWidget): Promise<any> {
    switch (widget.type) {
      case 'metric':
        return await this.collectMetricData(widget)
      case 'chart':
        return await this.collectChartData(widget)
      case 'table':
        return await this.collectTableData(widget)
      case 'alert':
        return await this.collectAlertData(widget)
      case 'log':
        return await this.collectLogData(widget)
      case 'status':
        return await this.collectStatusData(widget)
      default:
        throw new Error(`Unsupported widget type: ${widget.type}`)
    }
  }

  /**
   * Collect metric data
   */
  private async collectMetricData(widget: DashboardWidget): Promise<any> {
    // Simulate metric query
    const value = Math.random() * 100
    return {
      value,
      unit: widget.config.query?.includes('duration') ? 'seconds' : 'count',
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: (Math.random() - 0.5) * 20
    }
  }

  /**
   * Collect chart data
   */
  private async collectChartData(widget: DashboardWidget): Promise<any> {
    // Simulate time series data
    const dataPoints = []
    const now = Date.now()
    const interval = 60000 // 1 minute

    for (let i = 0; i < 60; i++) {
      dataPoints.push({
        timestamp: now - (i * interval),
        value: Math.random() * 100 + Math.sin(i / 10) * 20
      })
    }

    return {
      series: [{
        name: widget.title,
        data: dataPoints.reverse()
      }]
    }
  }

  /**
   * Collect table data
   */
  private async collectTableData(widget: DashboardWidget): Promise<any> {
    // Simulate table data
    return {
      columns: widget.config.columns || ['Name', 'Value', 'Status'],
      rows: [
        ['Test Suite 1', '95%', 'Passing'],
        ['Test Suite 2', '87%', 'Passing'],
        ['Test Suite 3', '76%', 'Failing']
      ]
    }
  }

  /**
   * Collect alert data
   */
  private async collectAlertData(widget: DashboardWidget): Promise<any> {
    const alerts = this.alertingService.getActiveAlerts()
    return {
      alerts: alerts.slice(0, 10), // Limit to 10 most recent
      total: alerts.length
    }
  }

  /**
   * Collect log data
   */
  private async collectLogData(widget: DashboardWidget): Promise<any> {
    // This would typically query the logging backend
    return {
      logs: [
        { timestamp: new Date(), level: 'info', message: 'Test execution started' },
        { timestamp: new Date(), level: 'warn', message: 'High memory usage detected' },
        { timestamp: new Date(), level: 'error', message: 'Database connection failed' }
      ],
      total: 150
    }
  }

  /**
   * Collect status data
   */
  private async collectStatusData(widget: DashboardWidget): Promise<any> {
    const healthMetrics = this.metricsService.getHealthMetrics()
    return {
      status: this.calculateSystemHealthStatus(healthMetrics),
      uptime: healthMetrics.uptime,
      memoryUsage: healthMetrics.memoryUsage.heapUsed / healthMetrics.memoryUsage.heapTotal,
      cpuUsage: Math.random() * 100 // Simplified CPU usage
    }
  }

  /**
   * Calculate system health status
   */
  private calculateSystemHealthStatus(healthMetrics: any): 'healthy' | 'warning' | 'critical' {
    const memoryUsage = healthMetrics.memoryUsage.heapUsed / healthMetrics.memoryUsage.heapTotal
    const activeAlerts = this.alertingService.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')

    if (criticalAlerts.length > 0 || memoryUsage > 0.9) {
      return 'critical'
    }

    if (activeAlerts.length > 0 || memoryUsage > 0.8) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * Export dashboard configuration
   */
  public exportDashboard(id: string): string | null {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) return null

    return JSON.stringify(dashboard, null, 2)
  }

  /**
   * Import dashboard configuration
   */
  public importDashboard(config: string): Dashboard | null {
    try {
      const dashboard = JSON.parse(config) as Dashboard
      dashboard.id = this.generateDashboardId()
      dashboard.createdAt = new Date()
      dashboard.updatedAt = new Date()

      this.dashboards.set(dashboard.id, dashboard)
      this.startDashboardRefresh(dashboard.id)

      this.emit('dashboardImported', dashboard)
      return dashboard
    } catch (error) {
      return null
    }
  }

  /**
   * Get dashboard statistics
   */
  public getDashboardStatistics(): {
    totalDashboards: number
    totalWidgets: number
    averageRefreshInterval: number
    mostUsedWidgetType: string
  } {
    const dashboards = Array.from(this.dashboards.values())
    const totalWidgets = dashboards.reduce((sum, dashboard) => sum + dashboard.widgets.length, 0)
    const averageRefreshInterval = dashboards.reduce((sum, dashboard) => sum + dashboard.refreshInterval, 0) / dashboards.length

    const widgetTypes = dashboards.flatMap(dashboard => dashboard.widgets.map(widget => widget.type))
    const widgetTypeCounts = widgetTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostUsedWidgetType = Object.entries(widgetTypeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'metric'

    return {
      totalDashboards: dashboards.length,
      totalWidgets,
      averageRefreshInterval,
      mostUsedWidgetType
    }
  }

  /**
   * Shutdown dashboard service
   */
  public shutdown(): void {
    // Stop all refresh timers
    this.refreshTimers.forEach(timer => clearInterval(timer))
    this.refreshTimers.clear()

    this.removeAllListeners()
  }

  // Private helper methods

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
let dashboardServiceInstance: DashboardService | null = null

/**
 * Get singleton dashboard service instance
 */
export function getDashboardService(
  metricsService?: MetricsService,
  loggingService?: LoggingService,
  alertingService?: AlertingService
): DashboardService {
  if (!dashboardServiceInstance) {
    if (!metricsService || !loggingService || !alertingService) {
      throw new Error('Dashboard service requires metrics, logging, and alerting services')
    }
    dashboardServiceInstance = new DashboardService(metricsService, loggingService, alertingService)
  }

  return dashboardServiceInstance
}

/**
 * Initialize dashboard service
 */
export function initializeDashboard(
  metricsService: MetricsService,
  loggingService: LoggingService,
  alertingService: AlertingService
): DashboardService {
  dashboardServiceInstance = new DashboardService(metricsService, loggingService, alertingService)
  return dashboardServiceInstance
}