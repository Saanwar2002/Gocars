# Monitoring and Logging Infrastructure

This module provides comprehensive monitoring, logging, metrics collection, alerting, and dashboard capabilities for the GoCars Testing Agent. It includes centralized logging, real-time metrics, intelligent alerting, and customizable dashboards.

## Features

- **Centralized Logging**: Structured logging with multiple transports (console, file, Elasticsearch, syslog)
- **Metrics Collection**: Prometheus-compatible metrics with custom KPIs and business metrics
- **Intelligent Alerting**: Rule-based alerting with escalation policies and multiple notification channels
- **Real-time Dashboards**: Customizable dashboards with widgets for monitoring and visualization
- **Health Monitoring**: Comprehensive system health checks with auto-remediation capabilities
- **Performance Tracking**: Resource usage monitoring and performance optimization

## Quick Start

### Basic Setup

```typescript
import { initializeMonitoring, getMonitoringConfig } from './src/monitoring'

// Initialize monitoring with environment-specific configuration
const config = getMonitoringConfig(process.env.NODE_ENV || 'development')
const monitoring = initializeMonitoring(config)

await monitoring.initialize()

// Access individual services
const { logging, metrics, alerting, dashboard } = monitoring.getServices()

// Log application events
logging.info('Application started', { version: '1.0.0' })

// Record metrics
metrics.recordHttpRequest('GET', '/api/health', 200, 150)

// Get system health
const health = await monitoring.performHealthCheck()
console.log(`System health: ${health.status} (${health.score}/100)`)
```

### Advanced Configuration

```typescript
import { MonitoringService } from './src/monitoring'

const customConfig = {
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableElastic: true,
    fileConfig: {
      directory: './logs',
      maxSize: '50m',
      maxFiles: 10,
      datePattern: 'YYYY-MM-DD'
    },
    elasticConfig: {
      host: 'elasticsearch.company.com',
      port: 9200,
      index: 'gocars-testing',
      username: 'elastic',
      password: process.env.ELASTIC_PASSWORD
    }
  },
  metrics: {
    prefix: 'gocars_testing',
    defaultLabels: {
      service: 'testing-agent',
      environment: 'production'
    },
    collectDefaultMetrics: true,
    customMetrics: [
      {
        name: 'business_metric',
        help: 'Custom business metric',
        type: 'gauge',
        labels: ['category', 'type']
      }
    ]
  },
  alerting: {
    evaluationInterval: 30000,
    channels: [
      {
        id: 'slack-alerts',
        name: 'Slack Notifications',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        },
        enabled: true
      }
    ],
    rules: []
  },
  enableHealthChecks: true,
  healthCheckInterval: 30000,
  enableAutoRemediation: true
}

const monitoring = new MonitoringService(customConfig)
await monitoring.initialize()
```

## Core Components

### 1. Logging Service

Provides structured logging with multiple output destinations.

```typescript
import { getLoggingService } from './src/monitoring'

const logger = getLoggingService('my-service')

// Basic logging
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' })
logger.warn('High memory usage detected', { usage: 85 })
logger.error('Database connection failed', new Error('Connection timeout'))

// Specialized logging
logger.logTestEvent({
  type: 'pass',
  testId: 'test-123',
  testName: 'User Authentication Test',
  suiteName: 'Authentication Suite',
  duration: 1500
})

logger.logSecurityEvent({
  type: 'authentication',
  severity: 'medium',
  description: 'Failed login attempt',
  userId: '123',
  ipAddress: '192.168.1.1'
})

logger.logBusinessEvent({
  type: 'booking_completed',
  description: 'Ride booking completed successfully',
  userId: '123',
  value: 25.50,
  currency: 'USD'
})
```

### 2. Metrics Service

Collects and exports Prometheus-compatible metrics.

```typescript
import { getMetricsService } from './src/monitoring'

const metrics = getMetricsService()

// Record HTTP requests
metrics.recordHttpRequest('POST', '/api/bookings', 201, 250)

// Record test executions
metrics.recordTestExecution('integration', 'booking-flow', 'pass', 2500)

// Record system resources
metrics.recordSystemResource('cpu', 75, 'percent')
metrics.recordSystemResource('memory', 1024, 'MB')

// Record business metrics
metrics.recordBusinessMetric('user_satisfaction', 'rating', 4.5)

// Custom metrics
metrics.incrementCounter('custom_events_total', { type: 'user_action' })
metrics.setGauge('queue_size', 42, { queue: 'test_execution' })
metrics.observeHistogram('request_duration', 0.25, { endpoint: '/api/health' })

// Create timers
const timer = metrics.createTimer('operation_duration', { operation: 'data_processing' })
// ... perform operation
timer() // Records the duration
```

### 3. Alerting Service

Manages alerts, notifications, and escalation policies.

```typescript
import { getAlertingService } from './src/monitoring'

const alerting = getAlertingService()

// Create alert rules
const rule = alerting.createAlertRule({
  name: 'HighErrorRate',
  description: 'Error rate is above acceptable threshold',
  query: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
  condition: '>',
  threshold: 5,
  duration: '5m',
  severity: 'high',
  labels: { component: 'api', type: 'error_rate' },
  annotations: {
    summary: 'High error rate detected',
    description: 'API error rate is {{ $value }}% which exceeds the 5% threshold'
  },
  enabled: true
})

// Test notification channels
const success = await alerting.testNotificationChannel('slack-alerts')
console.log(`Notification test: ${success ? 'passed' : 'failed'}`)

// Get alert statistics
const stats = alerting.getAlertStatistics()
console.log(`Active alerts: ${stats.active}, Total: ${stats.total}`)

// Silence alerts
alerting.silenceAlert('alert-fingerprint', 3600000) // 1 hour
```

### 4. Dashboard Service

Creates and manages monitoring dashboards.

```typescript
import { getDashboardService } from './src/monitoring'

const dashboard = getDashboardService()

// Create custom dashboard
const customDashboard = dashboard.createDashboard({
  title: 'API Performance',
  description: 'API performance and health metrics',
  tags: ['api', 'performance'],
  widgets: [
    {
      id: 'api-requests',
      title: 'API Requests per Second',
      type: 'chart',
      config: {
        query: 'rate(http_requests_total[5m])',
        visualization: 'line',
        timeRange: '1h',
        refreshInterval: 30000
      },
      position: { x: 0, y: 0, width: 12, height: 4 }
    },
    {
      id: 'response-time',
      title: 'Average Response Time',
      type: 'metric',
      config: {
        query: 'avg(http_request_duration_seconds)',
        visualization: 'gauge',
        thresholds: [
          { value: 0.5, color: 'green' },
          { value: 1.0, color: 'yellow' },
          { value: 2.0, color: 'red' }
        ]
      },
      position: { x: 0, y: 4, width: 6, height: 3 }
    }
  ],
  variables: [],
  timeRange: { from: 'now-1h', to: 'now' },
  refreshInterval: 30000
})

// Get dashboard data
const data = await dashboard.getDashboardData(customDashboard.id)
console.log(`Dashboard has ${data?.widgets.length} widgets`)

// Export/import dashboards
const exported = dashboard.exportDashboard(customDashboard.id)
const imported = dashboard.importDashboard(exported!)
```

## Configuration

### Environment-Specific Configurations

The monitoring system supports different configurations for different environments:

```typescript
import { getMonitoringConfig } from './src/monitoring/config/monitoring-config.example'

// Get configuration for current environment
const config = getMonitoringConfig(process.env.NODE_ENV)

// Available environments: 'development', 'staging', 'production'
const devConfig = getMonitoringConfig('development')
const prodConfig = getMonitoringConfig('production')
```

### Logging Configuration

```typescript
const loggingConfig = {
  level: 'info',                    // Log level: error, warn, info, debug, verbose
  enableConsole: true,              // Enable console output
  enableFile: true,                 // Enable file logging
  enableElastic: false,             // Enable Elasticsearch logging
  enableSyslog: false,              // Enable syslog
  fileConfig: {
    directory: './logs',            // Log file directory
    maxSize: '10m',                 // Maximum file size
    maxFiles: 5,                    // Number of files to keep
    datePattern: 'YYYY-MM-DD'       // Date pattern for rotation
  },
  elasticConfig: {
    host: 'elasticsearch.com',      // Elasticsearch host
    port: 9200,                     // Elasticsearch port
    index: 'gocars-testing',        // Index name
    username: 'elastic',            // Username (optional)
    password: 'password'            // Password (optional)
  }
}
```

### Metrics Configuration

```typescript
const metricsConfig = {
  prefix: 'gocars_testing',         // Metric name prefix
  defaultLabels: {                  // Default labels for all metrics
    service: 'testing-agent',
    version: '1.0.0',
    environment: 'production'
  },
  collectDefaultMetrics: true,      // Collect Node.js default metrics
  pushGateway: {                    // Push Gateway configuration (optional)
    url: 'http://pushgateway:9091',
    jobName: 'testing-agent',
    interval: 30000
  },
  customMetrics: [                  // Custom metric definitions
    {
      name: 'business_metric',
      help: 'Custom business metric',
      type: 'gauge',
      labels: ['category', 'type']
    }
  ]
}
```

### Alerting Configuration

```typescript
const alertingConfig = {
  evaluationInterval: 30000,        // How often to evaluate rules (ms)
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // Alert retention period
  groupWait: 10000,                 // Wait time before sending grouped alerts
  groupInterval: 300000,            // Interval for sending grouped alerts
  repeatInterval: 3600000,          // Interval for repeating alerts
  channels: [                       // Notification channels
    {
      id: 'email-alerts',
      name: 'Email Notifications',
      type: 'email',
      config: {
        host: 'smtp.company.com',
        port: 587,
        secure: false,
        username: 'alerts@company.com',
        password: 'password',
        from: 'alerts@company.com',
        to: 'team@company.com'
      },
      enabled: true
    },
    {
      id: 'slack-alerts',
      name: 'Slack Notifications',
      type: 'slack',
      config: {
        webhookUrl: 'https://hooks.slack.com/...'
      },
      enabled: true
    }
  ],
  escalationPolicies: [             // Escalation policies
    {
      id: 'critical-escalation',
      name: 'Critical Alert Escalation',
      rules: [
        {
          delay: 0,                 // Immediate notification
          channels: ['slack-alerts'],
          severity: 'critical'
        },
        {
          delay: 15,                // 15 minutes later
          channels: ['email-alerts'],
          severity: 'critical'
        }
      ]
    }
  ]
}
```

## Notification Channels

### Email Notifications

```typescript
{
  id: 'email-channel',
  name: 'Email Alerts',
  type: 'email',
  config: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: 'alerts@company.com',
    password: process.env.EMAIL_PASSWORD,
    from: 'GoCars Testing Agent <alerts@company.com>',
    to: 'team@company.com'
  },
  enabled: true
}
```

### Slack Notifications

```typescript
{
  id: 'slack-channel',
  name: 'Slack Alerts',
  type: 'slack',
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL
  },
  enabled: true
}
```

### PagerDuty Integration

```typescript
{
  id: 'pagerduty-channel',
  name: 'PagerDuty Alerts',
  type: 'pagerduty',
  config: {
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
  },
  enabled: true
}
```

### Webhook Notifications

```typescript
{
  id: 'webhook-channel',
  name: 'Custom Webhook',
  type: 'webhook',
  config: {
    url: 'https://api.company.com/alerts',
    headers: {
      'Authorization': 'Bearer ' + process.env.API_TOKEN,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  },
  enabled: true
}
```

## Dashboard Widgets

### Metric Widgets

Display single metric values with optional thresholds:

```typescript
{
  id: 'cpu-usage',
  title: 'CPU Usage',
  type: 'metric',
  config: {
    query: 'system_cpu_usage_percent',
    visualization: 'gauge',
    thresholds: [
      { value: 80, color: 'yellow' },
      { value: 90, color: 'red' }
    ]
  },
  position: { x: 0, y: 0, width: 6, height: 3 }
}
```

### Chart Widgets

Display time-series data as line, bar, or pie charts:

```typescript
{
  id: 'request-rate',
  title: 'Request Rate',
  type: 'chart',
  config: {
    query: 'rate(http_requests_total[5m])',
    visualization: 'line',
    timeRange: '1h',
    refreshInterval: 30000
  },
  position: { x: 0, y: 3, width: 12, height: 4 }
}
```

### Alert Widgets

Display active alerts and their status:

```typescript
{
  id: 'active-alerts',
  title: 'Active Alerts',
  type: 'alert',
  config: {
    filters: { status: 'firing' },
    refreshInterval: 10000
  },
  position: { x: 0, y: 7, width: 12, height: 3 }
}
```

### Log Widgets

Display recent log entries with filtering:

```typescript
{
  id: 'error-logs',
  title: 'Recent Errors',
  type: 'log',
  config: {
    filters: { level: 'error' },
    refreshInterval: 15000
  },
  position: { x: 0, y: 10, width: 12, height: 4 }
}
```

## Health Monitoring

### System Health Checks

The monitoring service performs comprehensive health checks:

```typescript
const monitoring = getMonitoringService()

// Perform health check
const health = await monitoring.performHealthCheck()

console.log(`System Status: ${health.status}`)
console.log(`Health Score: ${health.score}/100`)
console.log(`Uptime: ${health.uptime} seconds`)

// Check individual components
Object.entries(health.components).forEach(([component, status]) => {
  console.log(`${component}: ${status.status} - ${status.message}`)
})
```

### Auto-Remediation

Enable automatic remediation for common issues:

```typescript
const config = {
  // ... other config
  enableAutoRemediation: true
}

// The system will automatically attempt to fix:
// - Memory leaks (restart services)
// - Database connection issues (reconnect)
// - High resource usage (scale resources)
// - Failed health checks (restart components)
```

## Metrics and KPIs

### Built-in Metrics

The system automatically collects:

- **HTTP Metrics**: Request count, duration, status codes
- **Test Metrics**: Execution count, duration, pass/fail rates
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: User satisfaction, revenue impact
- **Node.js Metrics**: Event loop lag, garbage collection

### Custom Metrics

Define application-specific metrics:

```typescript
const customMetrics = [
  {
    name: 'booking_success_rate',
    help: 'Percentage of successful bookings',
    type: 'gauge',
    labels: ['region', 'vehicle_type']
  },
  {
    name: 'user_session_duration',
    help: 'Duration of user sessions',
    type: 'histogram',
    buckets: [1, 5, 10, 30, 60, 300, 600]
  },
  {
    name: 'revenue_per_test',
    help: 'Revenue impact per test execution',
    type: 'gauge',
    labels: ['test_type', 'business_unit']
  }
]
```

## Integration Examples

### Express.js Integration

```typescript
import express from 'express'
import { getMonitoringService } from './src/monitoring'

const app = express()
const monitoring = getMonitoringService()
const { logging, metrics } = monitoring.getServices()

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Log request
    logging.info('HTTP request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
    
    // Record metrics
    metrics.recordHttpRequest(req.method, req.route?.path || req.url, res.statusCode, duration)
  })
  
  next()
})

// Health endpoint
app.get('/health', async (req, res) => {
  const health = await monitoring.performHealthCheck()
  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const metricsData = await metrics.getMetrics()
  res.set('Content-Type', 'text/plain').send(metricsData)
})
```

### Test Framework Integration

```typescript
import { getLoggingService, getMetricsService } from './src/monitoring'

const logger = getLoggingService('test-framework')
const metrics = getMetricsService()

// Test execution wrapper
export function runTest(testName: string, testFn: () => Promise<void>) {
  return async () => {
    const start = Date.now()
    let status: 'pass' | 'fail' | 'skip' = 'pass'
    let error: Error | undefined
    
    try {
      logger.logTestEvent({
        type: 'start',
        testId: generateTestId(),
        testName,
        suiteName: getCurrentSuite()
      })
      
      await testFn()
      
    } catch (err) {
      status = 'fail'
      error = err as Error
      throw err
      
    } finally {
      const duration = Date.now() - start
      
      logger.logTestEvent({
        type: status,
        testId: generateTestId(),
        testName,
        suiteName: getCurrentSuite(),
        duration,
        error
      })
      
      metrics.recordTestExecution(
        getCurrentSuite(),
        testName,
        status,
        duration,
        error?.name
      )
    }
  }
}
```

## Troubleshooting

### Common Issues

#### High Memory Usage

```typescript
// Monitor memory usage
const monitoring = getMonitoringService()
const { metrics } = monitoring.getServices()

setInterval(() => {
  const memUsage = process.memoryUsage()
  const usage = memUsage.heapUsed / memUsage.heapTotal
  
  if (usage > 0.9) {
    console.warn('High memory usage detected:', usage)
    // Trigger garbage collection
    if (global.gc) {
      global.gc()
    }
  }
  
  metrics.recordSystemResource('memory', memUsage.heapUsed, 'bytes')
}, 30000)
```

#### Log Storage Issues

```typescript
// Monitor log file sizes
import * as fs from 'fs'
import * as path from 'path'

const logDir = './logs'
const maxLogSize = 100 * 1024 * 1024 // 100MB

setInterval(() => {
  fs.readdir(logDir, (err, files) => {
    if (err) return
    
    files.forEach(file => {
      const filePath = path.join(logDir, file)
      fs.stat(filePath, (err, stats) => {
        if (err) return
        
        if (stats.size > maxLogSize) {
          console.warn(`Large log file detected: ${file} (${stats.size} bytes)`)
          // Rotate or compress log file
        }
      })
    })
  })
}, 300000) // Check every 5 minutes
```

#### Alert Fatigue

```typescript
// Implement alert suppression
const alerting = getAlertingService()

// Silence noisy alerts during maintenance
alerting.silenceAlert('maintenance-alert-fingerprint', 3600000) // 1 hour

// Group similar alerts
const groupingConfig = {
  groupWait: 30000,      // Wait 30 seconds before sending grouped alerts
  groupInterval: 300000, // Send grouped alerts every 5 minutes
  repeatInterval: 1800000 // Repeat alerts every 30 minutes
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const config = getMonitoringConfig('development')
config.logging.level = 'debug'

const monitoring = initializeMonitoring(config)
await monitoring.initialize()

// This will log detailed information about:
// - Metric collection
// - Alert evaluation
// - Notification delivery
// - Health checks
// - Dashboard updates
```

### Performance Optimization

```typescript
// Optimize metrics collection
const metricsConfig = {
  // ... other config
  collectDefaultMetrics: false, // Disable if not needed
  customMetrics: [
    // Only define metrics you actually use
  ]
}

// Optimize logging
const loggingConfig = {
  level: 'info', // Use 'warn' or 'error' in production
  enableConsole: false, // Disable in production
  fileConfig: {
    maxSize: '50m', // Smaller files for better performance
    maxFiles: 5     // Fewer files to manage
  }
}

// Optimize alerting
const alertingConfig = {
  evaluationInterval: 60000, // Less frequent evaluation
  groupWait: 30000,          // Group alerts to reduce noise
  repeatInterval: 3600000    // Less frequent repeats
}
```

## Best Practices

### 1. Structured Logging

Always use structured logging with consistent field names:

```typescript
// Good
logger.info('User action completed', {
  userId: '123',
  action: 'booking_created',
  duration: 1500,
  success: true
})

// Avoid
logger.info('User 123 created booking in 1500ms successfully')
```

### 2. Meaningful Metrics

Create metrics that provide business value:

```typescript
// Business-focused metrics
metrics.recordBusinessMetric('customer_satisfaction', 'rating', 4.5)
metrics.recordBusinessMetric('revenue_per_booking', 'usd', 25.50)

// Technical metrics that matter
metrics.recordSystemResource('response_time_p95', 250, 'milliseconds')
metrics.recordTestExecution('critical_path', 'booking_flow', 'pass', 2000)
```

### 3. Alert Design

Design alerts that are actionable and not noisy:

```typescript
// Good: Actionable alert
{
  name: 'HighErrorRate',
  threshold: 5, // 5% error rate
  duration: '5m', // Sustained for 5 minutes
  severity: 'high'
}

// Avoid: Noisy alert
{
  name: 'AnyError',
  threshold: 1, // Any single error
  duration: '1m',
  severity: 'critical'
}
```

### 4. Dashboard Organization

Organize dashboards by audience and purpose:

- **Executive Dashboard**: High-level business metrics
- **Operations Dashboard**: System health and performance
- **Development Dashboard**: Test results and code quality
- **Business Dashboard**: Revenue and customer metrics

### 5. Resource Management

Monitor and manage resource usage:

```typescript
// Set up resource monitoring
const monitoring = getMonitoringService()

setInterval(async () => {
  const health = await monitoring.performHealthCheck()
  
  if (health.status === 'critical') {
    // Take corrective action
    console.warn('System health critical, taking corrective action')
    
    // Scale resources, restart services, etc.
  }
}, 60000)
```

## API Reference

See the TypeScript interfaces and classes for complete API documentation:

- `MonitoringService` - Main monitoring orchestrator
- `LoggingService` - Centralized logging
- `MetricsService` - Metrics collection and export
- `AlertingService` - Alert management and notifications
- `DashboardService` - Dashboard creation and management
# En
hanced Monitoring Infrastructure

## 🏗️ Architecture Overview

The monitoring infrastructure consists of four main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Logging        │    │  Metrics        │    │  Alerting       │
│  Service        │    │  Service        │    │  Service        │
│                 │    │                 │    │                 │
│ • File logs     │    │ • Prometheus    │    │ • Rule engine   │
│ • Console logs  │    │ • Custom metrics│    │ • Notifications │
│ • Elasticsearch │    │ • Health checks │    │ • Escalation    │
│ • HTTP transport│    │ • Performance   │    │ • Channels      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Dashboard      │
                    │  Service        │
                    │                 │
                    │ • Real-time UI  │
                    │ • Visualizations│
                    │ • Custom panels │
                    │ • Data sources  │
                    └─────────────────┘
```

## 📊 Enhanced Features

### Advanced Logging
- **Multiple Transports**: Console, File, HTTP, Elasticsearch
- **Log Rotation**: Size and time-based rotation
- **Structured Logging**: JSON format with metadata
- **Performance Logging**: Built-in performance measurement
- **Child Loggers**: Context-aware logging

### Comprehensive Metrics
- **Prometheus Integration**: Native Prometheus metrics
- **System Metrics**: Memory, CPU, Event loop lag
- **Test Metrics**: Execution rates, success rates, durations
- **Custom Metrics**: Counters, Gauges, Histograms
- **Health Metrics**: Service health indicators

### Intelligent Alerting
- **Rule-Based Engine**: Flexible condition evaluation
- **Multiple Channels**: Email, Slack, Webhook, PagerDuty, SMS
- **Escalation Policies**: Multi-level alert escalation
- **Rate Limiting**: Cooldown periods and hourly limits
- **Common Rules**: Pre-built alert rules

### Real-time Dashboards
- **Multiple Data Sources**: Prometheus, Elasticsearch, APIs
- **Widget Types**: Charts, Metrics, Tables, Logs, Alerts
- **Auto-refresh**: Real-time data updates
- **Custom Panels**: Configurable visualizations
- **Export/Import**: Dashboard configuration management

## 🚀 Quick Start

```typescript
import { MonitoringService, createDefaultMonitoringConfig } from './MonitoringService';

// Create with default configuration
const config = createDefaultMonitoringConfig();
const monitoring = new MonitoringService(config);

// Initialize and start
await monitoring.initialize();

// Record metrics
monitoring.recordTestExecution('test-123', 'auth-suite', 'pass', 2.5);
monitoring.recordPerformanceMetric('api_response_time', 0.150, 'seconds', 'api');

// Get health status
const health = await monitoring.getHealthStatus();
console.log('System Health:', health.status);
```

## 📈 Configuration Examples

### Production Configuration
```typescript
import { createMonitoringConfig } from './config/monitoring-config';

const prodConfig = createMonitoringConfig('production');
// Includes Elasticsearch logging, all alerts, production dashboards
```

### Development Configuration
```typescript
const devConfig = createMonitoringConfig('development');
// Console logging, frequent metrics, minimal alerts
```

### Custom Configuration
```typescript
const customConfig = {
  logging: {
    level: 'info',
    enableConsole: true,
    enableElasticsearch: true,
    elasticsearchConfig: {
      host: 'elasticsearch.company.com',
      port: 9200,
      index: 'gocars-logs'
    }
  },
  metrics: {
    enabled: true,
    prometheusEnabled: true,
    collectInterval: 15000
  },
  alerting: {
    enabled: true,
    enableCommonRules: true,
    maxAlertsPerHour: 20
  },
  dashboard: {
    enabled: true,
    autoRefresh: true,
    theme: 'dark'
  }
};
```

## 🔧 Environment Variables

```bash
# Logging
LOG_LEVEL=info
LOG_DIRECTORY=./logs
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# Metrics  
METRICS_PORT=9090
METRICS_COLLECT_INTERVAL=15000

# Alerting
ALERT_EVALUATION_INTERVAL=60
MAX_ALERTS_PER_HOUR=10

# Dashboard
DASHBOARD_REFRESH_INTERVAL=30000
DASHBOARD_THEME=dark
```

## 📊 Available Metrics

### System Metrics
- `memory_usage_bytes{type="heap_used|heap_total|rss|external"}`
- `cpu_usage_percent`
- `event_loop_lag_seconds`

### Test Metrics
- `test_executions_total{suite,status}`
- `test_successes_total{suite}`
- `test_failures_total{suite,error_type}`
- `test_duration_seconds{suite}`

### API Metrics
- `api_request_duration_seconds{endpoint,method}`
- `api_requests_total{endpoint,method,status_code}`

## 🚨 Pre-built Alert Rules

1. **High Error Rate**: Error rate > 5% for 5 minutes
2. **High Memory Usage**: Memory usage > 90% for 2 minutes  
3. **Service Down**: Service not responding to health checks
4. **Test Failure Spike**: Test failure rate increase > 50%
5. **Database Connection Failure**: DB connection errors detected

## 📊 Dashboard Widgets

- **Chart**: Time series visualizations
- **Gauge**: Progress indicators with thresholds
- **Stat**: Single value displays
- **Table**: Tabular data with sorting
- **Log**: Real-time log streaming
- **Alert**: Active alert displays
- **Heatmap**: 2D data visualization

## 🔍 Health Checks

Comprehensive health monitoring includes:
- Service availability checks
- Resource utilization monitoring
- Database connectivity verification
- Memory and performance analysis
- Alert system health

## 🎯 Best Practices

### Logging
- Use structured logging with consistent fields
- Include correlation IDs for request tracking
- Set appropriate log levels for different environments
- Implement log sampling for high-volume events

### Metrics
- Follow Prometheus naming conventions
- Use consistent labels across metrics
- Avoid high-cardinality labels
- Include units in metric names

### Alerting
- Set realistic thresholds based on baselines
- Implement proper cooldown periods
- Use severity levels appropriately
- Test alert rules regularly

### Dashboards
- Design for different audiences (ops, dev, business)
- Use appropriate time ranges
- Implement proper data retention
- Optimize query performance

This enhanced monitoring infrastructure provides production-ready observability for the GoCars Testing Agent with comprehensive logging, metrics, alerting, and visualization capabilities.