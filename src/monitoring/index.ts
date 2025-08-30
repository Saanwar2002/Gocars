/**
 * Monitoring Module
 * Exports all monitoring and infrastructure functionality
 */

// Core services
export { MonitoringService, getMonitoringService, initializeMonitoring } from './MonitoringService'
export { LoggingService, getLoggingService, initializeLogging } from './logging/LoggingService'
export { MetricsService, getMetricsService, initializeMetrics } from './metrics/MetricsService'
export { AlertingService, getAlertingService, initializeAlerting } from './alerting/AlertingService'
export { DashboardService, getDashboardService, initializeDashboard } from './dashboard/DashboardService'

// Type definitions
export type {
  MonitoringConfig,
  SystemHealth,
  MonitoringStats
} from './MonitoringService'

export type {
  LogEntry,
  LoggingConfig
} from './logging/LoggingService'

export type {
  MetricDefinition,
  MetricValue,
  MetricsConfig
} from './metrics/MetricsService'

export type {
  Alert,
  AlertRule,
  NotificationChannel,
  EscalationPolicy,
  AlertingConfig
} from './alerting/AlertingService'

export type {
  Dashboard,
  DashboardWidget,
  DashboardData
} from './dashboard/DashboardService'