/**
 * Metrics Collector
 * Collects and calculates key performance indicators and quality metrics
 */

export interface TestMetric {
  id: string
  name: string
  category: 'performance' | 'quality' | 'reliability' | 'security' | 'usability' | 'business'
  value: number
  unit: string
  timestamp: number
  tags: Record<string, string>
  metadata?: any
}

export interface KPIDefinition {
  id: string
  name: string
  description: string
  category: string
  formula: string
  target: number
  threshold: {
    critical: number
    warning: number
    good: number
  }
  unit: string
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'
}

export interface QualityMetrics {
  testCoverage: {
    overall: number
    byComponent: Record<string, number>
    byFeature: Record<string, number>
  }
  testReliability: {
    passRate: number
    flakyTestRate: number
    averageExecutionTime: number
    failureRate: number
  }
  defectMetrics: {
    defectDensity: number
    defectEscapeRate: number
    meanTimeToDetection: number
    meanTimeToResolution: number
  }
  performanceMetrics: {
    averageResponseTime: number
    throughput: number
    errorRate: number
    availabilityPercentage: number
  }
}

export interface BusinessImpactMetrics {
  userExperience: {
    satisfactionScore: number
    taskCompletionRate: number
    errorRecoveryRate: number
    accessibilityScore: number
  }
  operational: {
    systemUptime: number
    incidentCount: number
    maintenanceTime: number
    resourceUtilization: number
  }
  financial: {
    testingCostPerFeature: number
    defectCostAvoidance: number
    timeToMarket: number
    riskReduction: number
  }
}

export interface TrendData {
  metric: string
  timeframe: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  dataPoints: Array<{
    timestamp: number
    value: number
    metadata?: any
  }>
  trend: 'improving' | 'declining' | 'stable' | 'volatile'
  changeRate: number
  forecast?: Array<{
    timestamp: number
    predictedValue: number
    confidence: number
  }>
}

export class MetricsCollector {
  private metrics: Map<string, TestMetric[]> = new Map()
  private kpiDefinitions: Map<string, KPIDefinition> = new Map()
  private collectionInterval?: NodeJS.Timeout
  private isCollecting: boolean = false

  // Default KPI definitions
  private readonly defaultKPIs: KPIDefinition[] = [
    {
      id: 'test_pass_rate',
      name: 'Test Pass Rate',
      description: 'Percentage of tests that pass successfully',
      category: 'quality',
      formula: '(passed_tests / total_tests) * 100',
      target: 95,
      threshold: { critical: 80, warning: 90, good: 95 },
      unit: '%',
      frequency: 'realtime'
    },
    {
      id: 'defect_escape_rate',
      name: 'Defect Escape Rate',
      description: 'Percentage of defects found in production vs total defects',
      category: 'quality',
      formula: '(production_defects / total_defects) * 100',
      target: 5,
      threshold: { critical: 15, warning: 10, good: 5 },
      unit: '%',
      frequency: 'daily'
    },
    {
      id: 'mean_time_to_detection',
      name: 'Mean Time to Detection (MTTD)',
      description: 'Average time to detect issues',
      category: 'performance',
      formula: 'sum(detection_times) / count(incidents)',
      target: 300,
      threshold: { critical: 900, warning: 600, good: 300 },
      unit: 'seconds',
      frequency: 'daily'
    },
    {
      id: 'test_execution_time',
      name: 'Average Test Execution Time',
      description: 'Average time to execute test suites',
      category: 'performance',
      formula: 'sum(execution_times) / count(test_runs)',
      target: 600,
      threshold: { critical: 1800, warning: 1200, good: 600 },
      unit: 'seconds',
      frequency: 'realtime'
    },
    {
      id: 'system_availability',
      name: 'System Availability',
      description: 'Percentage of time system is available',
      category: 'reliability',
      formula: '(uptime / total_time) * 100',
      target: 99.9,
      threshold: { critical: 95, warning: 98, good: 99.9 },
      unit: '%',
      frequency: 'hourly'
    },
    {
      id: 'user_satisfaction',
      name: 'User Satisfaction Score',
      description: 'Average user satisfaction rating',
      category: 'business',
      formula: 'sum(satisfaction_ratings) / count(ratings)',
      target: 4.5,
      threshold: { critical: 3.0, warning: 4.0, good: 4.5 },
      unit: 'rating',
      frequency: 'daily'
    }
  ]

  constructor() {
    this.initializeDefaultKPIs()
  }

  /**
   * Initialize metrics collection
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Metrics Collector...')
    
    // Load existing metrics if any
    await this.loadHistoricalMetrics()
    
    console.log('Metrics Collector initialized')
  }

  /**
   * Start metrics collection
   */
  public startCollection(intervalMs: number = 60000): void {
    if (this.isCollecting) {
      return
    }

    this.isCollecting = true
    this.collectionInterval = setInterval(async () => {
      await this.collectMetrics()
    }, intervalMs)

    console.log(`Started metrics collection with ${intervalMs}ms interval`)
  }

  /**
   * Stop metrics collection
   */
  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = undefined
    }
    this.isCollecting = false
    console.log('Stopped metrics collection')
  }

  /**
   * Record a metric
   */
  public recordMetric(metric: Omit<TestMetric, 'timestamp'>): void {
    const fullMetric: TestMetric = {
      ...metric,
      timestamp: Date.now()
    }

    if (!this.metrics.has(metric.id)) {
      this.metrics.set(metric.id, [])
    }

    this.metrics.get(metric.id)!.push(fullMetric)

    // Keep only last 1000 data points per metric to manage memory
    const metricData = this.metrics.get(metric.id)!
    if (metricData.length > 1000) {
      metricData.splice(0, metricData.length - 1000)
    }
  }

  /**
   * Calculate KPI value
   */
  public calculateKPI(kpiId: string, timeframe?: { start: number; end: number }): number | null {
    const kpi = this.kpiDefinitions.get(kpiId)
    if (!kpi) {
      return null
    }

    // Get relevant metrics for calculation
    const relevantMetrics = this.getMetricsForTimeframe(kpiId, timeframe)
    
    if (relevantMetrics.length === 0) {
      return null
    }

    // Calculate based on KPI formula (simplified implementation)
    switch (kpiId) {
      case 'test_pass_rate':
        return this.calculateTestPassRate(relevantMetrics)
      case 'defect_escape_rate':
        return this.calculateDefectEscapeRate(relevantMetrics)
      case 'mean_time_to_detection':
        return this.calculateMeanTimeToDetection(relevantMetrics)
      case 'test_execution_time':
        return this.calculateAverageExecutionTime(relevantMetrics)
      case 'system_availability':
        return this.calculateSystemAvailability(relevantMetrics)
      case 'user_satisfaction':
        return this.calculateUserSatisfaction(relevantMetrics)
      default:
        return this.calculateGenericAverage(relevantMetrics)
    }
  }

  /**
   * Get quality metrics
   */
  public getQualityMetrics(timeframe?: { start: number; end: number }): QualityMetrics {
    return {
      testCoverage: {
        overall: this.calculateKPI('test_coverage_overall', timeframe) || 0,
        byComponent: this.calculateCoverageByComponent(timeframe),
        byFeature: this.calculateCoverageByFeature(timeframe)
      },
      testReliability: {
        passRate: this.calculateKPI('test_pass_rate', timeframe) || 0,
        flakyTestRate: this.calculateKPI('flaky_test_rate', timeframe) || 0,
        averageExecutionTime: this.calculateKPI('test_execution_time', timeframe) || 0,
        failureRate: 100 - (this.calculateKPI('test_pass_rate', timeframe) || 0)
      },
      defectMetrics: {
        defectDensity: this.calculateKPI('defect_density', timeframe) || 0,
        defectEscapeRate: this.calculateKPI('defect_escape_rate', timeframe) || 0,
        meanTimeToDetection: this.calculateKPI('mean_time_to_detection', timeframe) || 0,
        meanTimeToResolution: this.calculateKPI('mean_time_to_resolution', timeframe) || 0
      },
      performanceMetrics: {
        averageResponseTime: this.calculateKPI('average_response_time', timeframe) || 0,
        throughput: this.calculateKPI('throughput', timeframe) || 0,
        errorRate: this.calculateKPI('error_rate', timeframe) || 0,
        availabilityPercentage: this.calculateKPI('system_availability', timeframe) || 0
      }
    }
  }

  /**
   * Get business impact metrics
   */
  public getBusinessImpactMetrics(timeframe?: { start: number; end: number }): BusinessImpactMetrics {
    return {
      userExperience: {
        satisfactionScore: this.calculateKPI('user_satisfaction', timeframe) || 0,
        taskCompletionRate: this.calculateKPI('task_completion_rate', timeframe) || 0,
        errorRecoveryRate: this.calculateKPI('error_recovery_rate', timeframe) || 0,
        accessibilityScore: this.calculateKPI('accessibility_score', timeframe) || 0
      },
      operational: {
        systemUptime: this.calculateKPI('system_availability', timeframe) || 0,
        incidentCount: this.calculateKPI('incident_count', timeframe) || 0,
        maintenanceTime: this.calculateKPI('maintenance_time', timeframe) || 0,
        resourceUtilization: this.calculateKPI('resource_utilization', timeframe) || 0
      },
      financial: {
        testingCostPerFeature: this.calculateKPI('testing_cost_per_feature', timeframe) || 0,
        defectCostAvoidance: this.calculateKPI('defect_cost_avoidance', timeframe) || 0,
        timeToMarket: this.calculateKPI('time_to_market', timeframe) || 0,
        riskReduction: this.calculateKPI('risk_reduction', timeframe) || 0
      }
    }
  }

  /**
   * Get trend analysis for a metric
   */
  public getTrendAnalysis(
    metricId: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    periods: number = 30
  ): TrendData {
    const metrics = this.getMetricsForTrendAnalysis(metricId, timeframe, periods)
    
    const dataPoints = metrics.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.value,
      metadata: metric.metadata
    }))

    const trend = this.calculateTrend(dataPoints)
    const changeRate = this.calculateChangeRate(dataPoints)
    const forecast = this.generateForecast(dataPoints, 5) // 5 future periods

    return {
      metric: metricId,
      timeframe,
      dataPoints,
      trend,
      changeRate,
      forecast
    }
  }

  /**
   * Get all KPI definitions
   */
  public getKPIDefinitions(): KPIDefinition[] {
    return Array.from(this.kpiDefinitions.values())
  }

  /**
   * Add custom KPI definition
   */
  public addKPIDefinition(kpi: KPIDefinition): void {
    this.kpiDefinitions.set(kpi.id, kpi)
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(): {
    totalMetrics: number
    activeKPIs: number
    lastCollectionTime: number
    collectionStatus: 'active' | 'inactive'
  } {
    const totalMetrics = Array.from(this.metrics.values())
      .reduce((sum, metricArray) => sum + metricArray.length, 0)

    const lastCollectionTime = Math.max(
      ...Array.from(this.metrics.values())
        .flat()
        .map(metric => metric.timestamp),
      0
    )

    return {
      totalMetrics,
      activeKPIs: this.kpiDefinitions.size,
      lastCollectionTime,
      collectionStatus: this.isCollecting ? 'active' : 'inactive'
    }
  }

  /**
   * Export metrics data
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const allMetrics = Array.from(this.metrics.entries()).reduce((acc, [id, metrics]) => {
      acc[id] = metrics
      return acc
    }, {} as Record<string, TestMetric[]>)

    if (format === 'json') {
      return JSON.stringify({
        kpis: Array.from(this.kpiDefinitions.values()),
        metrics: allMetrics,
        exportTime: Date.now()
      }, null, 2)
    } else {
      // CSV format (simplified)
      const csvLines = ['metric_id,name,category,value,unit,timestamp,tags']
      
      for (const [id, metrics] of this.metrics.entries()) {
        for (const metric of metrics) {
          const tags = Object.entries(metric.tags)
            .map(([key, value]) => `${key}:${value}`)
            .join(';')
          
          csvLines.push(
            `${id},${metric.name},${metric.category},${metric.value},${metric.unit},${metric.timestamp},"${tags}"`
          )
        }
      }
      
      return csvLines.join('\n')
    }
  }

  // Private helper methods

  private initializeDefaultKPIs(): void {
    this.defaultKPIs.forEach(kpi => {
      this.kpiDefinitions.set(kpi.id, kpi)
    })
  }

  private async loadHistoricalMetrics(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('Loading historical metrics...')
  }

  private async collectMetrics(): Promise<void> {
    // This would collect metrics from various sources
    // For now, we'll simulate some basic metrics
    
    const timestamp = Date.now()
    
    // Simulate test execution metrics
    this.recordMetric({
      id: 'test_pass_rate',
      name: 'Test Pass Rate',
      category: 'quality',
      value: Math.random() * 10 + 90, // 90-100%
      unit: '%',
      tags: { source: 'test_runner', environment: 'production' }
    })

    // Simulate performance metrics
    this.recordMetric({
      id: 'average_response_time',
      name: 'Average Response Time',
      category: 'performance',
      value: Math.random() * 500 + 100, // 100-600ms
      unit: 'ms',
      tags: { source: 'api_monitor', endpoint: 'booking' }
    })

    // Simulate system availability
    this.recordMetric({
      id: 'system_availability',
      name: 'System Availability',
      category: 'reliability',
      value: Math.random() * 2 + 98, // 98-100%
      unit: '%',
      tags: { source: 'uptime_monitor', service: 'main_app' }
    })
  }

  private getMetricsForTimeframe(
    metricId: string,
    timeframe?: { start: number; end: number }
  ): TestMetric[] {
    const metrics = this.metrics.get(metricId) || []
    
    if (!timeframe) {
      return metrics
    }

    return metrics.filter(metric => 
      metric.timestamp >= timeframe.start && metric.timestamp <= timeframe.end
    )
  }

  private getMetricsForTrendAnalysis(
    metricId: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    periods: number
  ): TestMetric[] {
    const metrics = this.metrics.get(metricId) || []
    const now = Date.now()
    
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    }

    const startTime = now - (periods * timeframeMs[timeframe])
    
    return metrics.filter(metric => metric.timestamp >= startTime)
  }

  // KPI calculation methods

  private calculateTestPassRate(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateDefectEscapeRate(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateMeanTimeToDetection(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateAverageExecutionTime(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateSystemAvailability(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateUserSatisfaction(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateGenericAverage(metrics: TestMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  }

  private calculateCoverageByComponent(timeframe?: { start: number; end: number }): Record<string, number> {
    // Simplified implementation - would calculate actual coverage by component
    return {
      'authentication': 95,
      'booking': 88,
      'payment': 92,
      'notification': 85,
      'ui': 78
    }
  }

  private calculateCoverageByFeature(timeframe?: { start: number; end: number }): Record<string, number> {
    // Simplified implementation - would calculate actual coverage by feature
    return {
      'user_registration': 98,
      'ride_booking': 90,
      'payment_processing': 95,
      'real_time_tracking': 85,
      'notifications': 88
    }
  }

  private calculateTrend(dataPoints: Array<{ timestamp: number; value: number }>): 'improving' | 'declining' | 'stable' | 'volatile' {
    if (dataPoints.length < 2) return 'stable'

    const values = dataPoints.map(dp => dp.value)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    // Calculate volatility
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const volatility = Math.sqrt(variance) / mean * 100

    if (volatility > 20) return 'volatile'
    if (change > 5) return 'improving'
    if (change < -5) return 'declining'
    return 'stable'
  }

  private calculateChangeRate(dataPoints: Array<{ timestamp: number; value: number }>): number {
    if (dataPoints.length < 2) return 0

    const first = dataPoints[0].value
    const last = dataPoints[dataPoints.length - 1].value

    return ((last - first) / first) * 100
  }

  private generateForecast(
    dataPoints: Array<{ timestamp: number; value: number }>,
    periods: number
  ): Array<{ timestamp: number; predictedValue: number; confidence: number }> {
    if (dataPoints.length < 3) return []

    // Simple linear regression for forecasting
    const n = dataPoints.length
    const sumX = dataPoints.reduce((sum, dp, i) => sum + i, 0)
    const sumY = dataPoints.reduce((sum, dp) => sum + dp.value, 0)
    const sumXY = dataPoints.reduce((sum, dp, i) => sum + (i * dp.value), 0)
    const sumXX = dataPoints.reduce((sum, dp, i) => sum + (i * i), 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const forecast = []
    const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp
    const timeInterval = dataPoints.length > 1 
      ? dataPoints[1].timestamp - dataPoints[0].timestamp 
      : 60000 // 1 minute default

    for (let i = 1; i <= periods; i++) {
      const predictedValue = slope * (n + i - 1) + intercept
      const confidence = Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time

      forecast.push({
        timestamp: lastTimestamp + (i * timeInterval),
        predictedValue: Math.max(0, predictedValue), // Ensure non-negative
        confidence
      })
    }

    return forecast
  }
}