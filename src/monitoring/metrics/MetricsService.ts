/**
 * Metrics Collection Service
 * Collects and exports metrics for monitoring and alerting
 */

import * as prometheus from 'prom-client'
import { EventEmitter } from 'events'

export interface MetricDefinition {
  name: string
  help: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  labels?: string[]
  buckets?: number[]
  percentiles?: number[]
}

export interface MetricValue {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp?: number
}

export interface MetricsConfig {
  prefix: string
  defaultLabels: Record<string, string>
  collectDefaultMetrics: boolean
  pushGateway?: {
    url: string
    jobName: string
    interval: number
  }
  customMetrics: MetricDefinition[]
}

export class MetricsService extends EventEmitter {
  private registry: prometheus.Registry
  private config: MetricsConfig
  private metrics: Map<string, prometheus.Metric<string>> = new Map()
  private pushGatewayTimer?: NodeJS.Timeout

  // Built-in metrics
  private httpRequestsTotal: prometheus.Counter<string>
  private httpRequestDuration: prometheus.Histogram<string>
  private testExecutionsTotal: prometheus.Counter<string>
  private testExecutionDuration: prometheus.Histogram<string>
  private testFailuresTotal: prometheus.Counter<string>
  private activeTestsGauge: prometheus.Gauge<string>
  private systemResourcesGauge: prometheus.Gauge<string>
  private businessMetricsGauge: prometheus.Gauge<string>

  constructor(config: MetricsConfig) {
    super()
    this.config = config
    this.registry = new prometheus.Registry()
    
    // Set default labels
    this.registry.setDefaultLabels(config.defaultLabels)

    // Collect default Node.js metrics
    if (config.collectDefaultMetrics) {
      prometheus.collectDefaultMetrics({ register: this.registry })
    }

    // Initialize built-in metrics
    this.initializeBuiltInMetrics()

    // Initialize custom metrics
    this.initializeCustomMetrics()

    // Setup push gateway if configured
    if (config.pushGateway) {
      this.setupPushGateway()
    }
  }

  /**
   * Initialize built-in metrics
   */
  private initializeBuiltInMetrics(): void {
    // HTTP request metrics
    this.httpRequestsTotal = new prometheus.Counter({
      name: `${this.config.prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    })

    this.httpRequestDuration = new prometheus.Histogram({
      name: `${this.config.prefix}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    })

    // Test execution metrics
    this.testExecutionsTotal = new prometheus.Counter({
      name: `${this.config.prefix}_test_executions_total`,
      help: 'Total number of test executions',
      labelNames: ['suite', 'test_name', 'status'],
      registers: [this.registry]
    })

    this.testExecutionDuration = new prometheus.Histogram({
      name: `${this.config.prefix}_test_execution_duration_seconds`,
      help: 'Duration of test executions in seconds',
      labelNames: ['suite', 'test_name', 'status'],
      buckets: [1, 5, 10, 30, 60, 300, 600],
      registers: [this.registry]
    })

    this.testFailuresTotal = new prometheus.Counter({
      name: `${this.config.prefix}_test_failures_total`,
      help: 'Total number of test failures',
      labelNames: ['suite', 'test_name', 'error_type'],
      registers: [this.registry]
    })

    this.activeTestsGauge = new prometheus.Gauge({
      name: `${this.config.prefix}_active_tests`,
      help: 'Number of currently active tests',
      labelNames: ['suite'],
      registers: [this.registry]
    })

    // System resource metrics
    this.systemResourcesGauge = new prometheus.Gauge({
      name: `${this.config.prefix}_system_resources`,
      help: 'System resource usage',
      labelNames: ['resource_type', 'unit'],
      registers: [this.registry]
    })

    // Business metrics
    this.businessMetricsGauge = new prometheus.Gauge({
      name: `${this.config.prefix}_business_metrics`,
      help: 'Business-related metrics',
      labelNames: ['metric_type', 'category'],
      registers: [this.registry]
    })

    // Store built-in metrics
    this.metrics.set('http_requests_total', this.httpRequestsTotal)
    this.metrics.set('http_request_duration', this.httpRequestDuration)
    this.metrics.set('test_executions_total', this.testExecutionsTotal)
    this.metrics.set('test_execution_duration', this.testExecutionDuration)
    this.metrics.set('test_failures_total', this.testFailuresTotal)
    this.metrics.set('active_tests', this.activeTestsGauge)
    this.metrics.set('system_resources', this.systemResourcesGauge)
    this.metrics.set('business_metrics', this.businessMetricsGauge)
  }

  /**
   * Initialize custom metrics from configuration
   */
  private initializeCustomMetrics(): void {
    this.config.customMetrics.forEach(metricDef => {
      const fullName = `${this.config.prefix}_${metricDef.name}`
      let metric: prometheus.Metric<string>

      switch (metricDef.type) {
        case 'counter':
          metric = new prometheus.Counter({
            name: fullName,
            help: metricDef.help,
            labelNames: metricDef.labels || [],
            registers: [this.registry]
          })
          break

        case 'gauge':
          metric = new prometheus.Gauge({
            name: fullName,
            help: metricDef.help,
            labelNames: metricDef.labels || [],
            registers: [this.registry]
          })
          break

        case 'histogram':
          metric = new prometheus.Histogram({
            name: fullName,
            help: metricDef.help,
            labelNames: metricDef.labels || [],
            buckets: metricDef.buckets || prometheus.exponentialBuckets(0.1, 2, 10),
            registers: [this.registry]
          })
          break

        case 'summary':
          metric = new prometheus.Summary({
            name: fullName,
            help: metricDef.help,
            labelNames: metricDef.labels || [],
            percentiles: metricDef.percentiles || [0.5, 0.9, 0.95, 0.99],
            registers: [this.registry]
          })
          break

        default:
          throw new Error(`Unsupported metric type: ${metricDef.type}`)
      }

      this.metrics.set(metricDef.name, metric)
    })
  }

  /**
   * Setup push gateway for metrics
   */
  private setupPushGateway(): void {
    if (!this.config.pushGateway) return

    const pushGateway = new prometheus.Pushgateway(
      this.config.pushGateway.url,
      {},
      this.registry
    )

    this.pushGatewayTimer = setInterval(async () => {
      try {
        await pushGateway.pushAdd({ jobName: this.config.pushGateway!.jobName })
        this.emit('pushGatewaySuccess')
      } catch (error) {
        this.emit('pushGatewayError', error)
      }
    }, this.config.pushGateway.interval)
  }

  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    const labels = { method, route, status_code: statusCode.toString() }
    
    this.httpRequestsTotal.inc(labels)
    this.httpRequestDuration.observe(labels, duration / 1000) // Convert to seconds
  }

  /**
   * Record test execution metrics
   */
  public recordTestExecution(
    suite: string,
    testName: string,
    status: 'pass' | 'fail' | 'skip',
    duration: number,
    errorType?: string
  ): void {
    const labels = { suite, test_name: testName, status }
    
    this.testExecutionsTotal.inc(labels)
    this.testExecutionDuration.observe(labels, duration / 1000) // Convert to seconds

    if (status === 'fail' && errorType) {
      this.testFailuresTotal.inc({ suite, test_name: testName, error_type: errorType })
    }
  }

  /**
   * Update active tests count
   */
  public setActiveTests(suite: string, count: number): void {
    this.activeTestsGauge.set({ suite }, count)
  }

  /**
   * Record system resource usage
   */
  public recordSystemResource(
    resourceType: 'cpu' | 'memory' | 'disk' | 'network',
    value: number,
    unit: string
  ): void {
    this.systemResourcesGauge.set({ resource_type: resourceType, unit }, value)
  }

  /**
   * Record business metrics
   */
  public recordBusinessMetric(
    metricType: string,
    category: string,
    value: number
  ): void {
    this.businessMetricsGauge.set({ metric_type: metricType, category }, value)
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metric = this.metrics.get(name)
    if (metric && 'inc' in metric) {
      (metric as prometheus.Counter<string>).inc(labels || {}, value)
    }
  }

  /**
   * Set a gauge metric value
   */
  public setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name)
    if (metric && 'set' in metric) {
      (metric as prometheus.Gauge<string>).set(labels || {}, value)
    }
  }

  /**
   * Observe a histogram metric
   */
  public observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name)
    if (metric && 'observe' in metric) {
      (metric as prometheus.Histogram<string>).observe(labels || {}, value)
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return await this.registry.metrics()
  }

  /**
   * Get metrics as JSON
   */
  public async getMetricsJSON(): Promise<prometheus.MetricObjectWithValues<prometheus.MetricValue<string>>[]> {
    return await this.registry.getMetricsAsJSON()
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.registry.clear()
  }

  /**
   * Get metric by name
   */
  public getMetric(name: string): prometheus.Metric<string> | undefined {
    return this.metrics.get(name)
  }

  /**
   * Create a timer for measuring duration
   */
  public createTimer(metricName: string, labels?: Record<string, string>): () => void {
    const start = Date.now()
    
    return () => {
      const duration = Date.now() - start
      this.observeHistogram(metricName, duration / 1000, labels) // Convert to seconds
    }
  }

  /**
   * Collect custom application metrics
   */
  public async collectApplicationMetrics(): Promise<void> {
    try {
      // Collect memory usage
      const memUsage = process.memoryUsage()
      this.recordSystemResource('memory', memUsage.heapUsed, 'bytes')
      this.recordSystemResource('memory', memUsage.heapTotal, 'bytes')
      this.recordSystemResource('memory', memUsage.external, 'bytes')

      // Collect CPU usage (simplified)
      const cpuUsage = process.cpuUsage()
      this.recordSystemResource('cpu', cpuUsage.user, 'microseconds')
      this.recordSystemResource('cpu', cpuUsage.system, 'microseconds')

      // Collect event loop lag
      const start = process.hrtime.bigint()
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6 // Convert to milliseconds
        this.recordSystemResource('event_loop_lag', lag, 'milliseconds')
      })

      this.emit('metricsCollected')
    } catch (error) {
      this.emit('metricsCollectionError', error)
    }
  }

  /**
   * Start automatic metrics collection
   */
  public startMetricsCollection(interval: number = 30000): void {
    setInterval(() => {
      this.collectApplicationMetrics()
    }, interval)
  }

  /**
   * Get health check metrics
   */
  public getHealthMetrics(): {
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    activeHandles: number
    activeRequests: number
  } {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    }
  }

  /**
   * Shutdown metrics service
   */
  public shutdown(): void {
    if (this.pushGatewayTimer) {
      clearInterval(this.pushGatewayTimer)
    }
    
    this.registry.clear()
    this.removeAllListeners()
  }
}

// Singleton instance
let metricsServiceInstance: MetricsService | null = null

/**
 * Get singleton metrics service instance
 */
export function getMetricsService(config?: MetricsConfig): MetricsService {
  if (!metricsServiceInstance) {
    const defaultConfig: MetricsConfig = {
      prefix: process.env.METRICS_PREFIX || 'gocars_testing',
      defaultLabels: {
        service: 'gocars-testing-agent',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      collectDefaultMetrics: true,
      customMetrics: []
    }

    metricsServiceInstance = new MetricsService(config || defaultConfig)
  }

  return metricsServiceInstance
}

/**
 * Initialize metrics service with configuration
 */
export function initializeMetrics(config: MetricsConfig): MetricsService {
  metricsServiceInstance = new MetricsService(config)
  return metricsServiceInstance
}