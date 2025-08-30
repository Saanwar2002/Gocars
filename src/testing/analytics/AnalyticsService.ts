/**
 * Analytics Service
 * Main service for collecting, analyzing, and reporting on test metrics and business impact
 */

import { MetricsCollector, TestMetric, KPIDefinition, QualityMetrics, BusinessImpactMetrics } from './MetricsCollector'
import { TrendAnalyzer, TrendInsight, SeasonalPattern, AnomalyDetection, CorrelationAnalysis } from './TrendAnalyzer'
import { BusinessImpactAnalyzer, BusinessImpactAssessment, CostBenefitAnalysis } from './BusinessImpactAnalyzer'

export interface AnalyticsConfig {
  collectionInterval: number // milliseconds
  retentionPeriod: number // days
  alertThresholds: {
    critical: number
    warning: number
  }
  enableRealTimeAnalysis: boolean
  enableBusinessImpactAnalysis: boolean
}

export interface AnalyticsDashboard {
  timestamp: number
  summary: {
    totalMetrics: number
    activeKPIs: number
    criticalAlerts: number
    overallHealthScore: number
  }
  qualityMetrics: QualityMetrics
  businessMetrics: BusinessImpactMetrics
  topInsights: TrendInsight[]
  businessImpact: BusinessImpactAssessment
  recentAnomalies: AnomalyDetection[]
  keyCorrelations: CorrelationAnalysis[]
}

export interface AnalyticsReport {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  period: {
    start: number
    end: number
  }
  executiveSummary: {
    summary: string
    keyFindings: string[]
    criticalActions: string[]
    businessValue: string
  }
  detailedAnalysis: {
    qualityTrends: Array<{
      metric: string
      trend: 'improving' | 'declining' | 'stable'
      changePercent: number
    }>
    performanceAnalysis: {
      averageResponseTime: number
      throughputTrend: number
      errorRateChange: number
    }
    businessImpactSummary: BusinessImpactAssessment
    costBenefitAnalysis?: CostBenefitAnalysis
  }
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    expectedImpact: string
  }>
  appendices: {
    rawMetrics: Record<string, TestMetric[]>
    detailedInsights: TrendInsight[]
    seasonalPatterns: SeasonalPattern[]
  }
}

export class AnalyticsService {
  private metricsCollector: MetricsCollector
  private trendAnalyzer: TrendAnalyzer
  private businessAnalyzer: BusinessImpactAnalyzer
  private config: AnalyticsConfig
  private isInitialized: boolean = false
  private alertCallbacks: Array<(alert: TrendInsight) => void> = []

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      collectionInterval: 60000, // 1 minute
      retentionPeriod: 30, // 30 days
      alertThresholds: {
        critical: 20,
        warning: 40
      },
      enableRealTimeAnalysis: true,
      enableBusinessImpactAnalysis: true,
      ...config
    }

    this.metricsCollector = new MetricsCollector()
    this.trendAnalyzer = new TrendAnalyzer()
    this.businessAnalyzer = new BusinessImpactAnalyzer()
  }

  /**
   * Initialize the analytics service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    console.log('Initializing Analytics Service...')

    // Initialize components
    await this.metricsCollector.initialize()

    // Start metrics collection
    this.metricsCollector.startCollection(this.config.collectionInterval)

    // Set up real-time analysis if enabled
    if (this.config.enableRealTimeAnalysis) {
      this.setupRealTimeAnalysis()
    }

    this.isInitialized = true
    console.log('Analytics Service initialized successfully')
  }

  /**
   * Record a custom metric
   */
  public recordMetric(metric: Omit<TestMetric, 'timestamp'>): void {
    this.metricsCollector.recordMetric(metric)
  }

  /**
   * Add custom KPI definition
   */
  public addKPI(kpi: KPIDefinition): void {
    this.metricsCollector.addKPIDefinition(kpi)
  }

  /**
   * Get current dashboard data
   */
  public async getDashboard(): Promise<AnalyticsDashboard> {
    const now = Date.now()
    const last24Hours = { start: now - 24 * 60 * 60 * 1000, end: now }

    // Get metrics summary
    const summary = this.metricsCollector.getMetricsSummary()

    // Get quality and business metrics
    const qualityMetrics = this.metricsCollector.getQualityMetrics(last24Hours)
    const businessMetrics = this.metricsCollector.getBusinessImpactMetrics(last24Hours)

    // Get insights and analysis
    const allInsights = this.getAllInsights()
    const topInsights = allInsights
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
      .slice(0, 5)

    // Get business impact assessment
    const businessImpact = this.config.enableBusinessImpactAnalysis
      ? this.businessAnalyzer.assessBusinessImpact(qualityMetrics, businessMetrics, allInsights)
      : this.createEmptyBusinessImpact()

    // Get recent anomalies
    const recentAnomalies = this.getRecentAnomalies(24) // Last 24 hours

    // Get key correlations
    const keyCorrelations = this.getKeyCorrelations()

    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore(qualityMetrics, businessMetrics)

    return {
      timestamp: now,
      summary: {
        ...summary,
        criticalAlerts: allInsights.filter(i => i.severity === 'critical').length,
        overallHealthScore
      },
      qualityMetrics,
      businessMetrics,
      topInsights,
      businessImpact,
      recentAnomalies,
      keyCorrelations
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  public async generateReport(
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom',
    customPeriod?: { start: number; end: number }
  ): Promise<AnalyticsReport> {
    const period = customPeriod || this.getReportPeriod(type)
    const reportId = `report_${type}_${Date.now()}`

    // Get metrics for the period
    const qualityMetrics = this.metricsCollector.getQualityMetrics(period)
    const businessMetrics = this.metricsCollector.getBusinessImpactMetrics(period)

    // Get insights and trends
    const insights = this.getAllInsights()
    const businessImpact = this.config.enableBusinessImpactAnalysis
      ? this.businessAnalyzer.assessBusinessImpact(qualityMetrics, businessMetrics, insights)
      : this.createEmptyBusinessImpact()

    // Generate executive summary
    const executiveSummary = this.businessAnalyzer.generateExecutiveSummary(businessImpact)

    // Analyze quality trends
    const qualityTrends = this.analyzeQualityTrends(period)

    // Analyze performance
    const performanceAnalysis = this.analyzePerformance(period)

    // Get cost-benefit analysis if available
    const costBenefitAnalysis = this.businessAnalyzer.getCostBenefitHistory(1)[0]

    // Generate recommendations
    const recommendations = businessImpact.recommendations.slice(0, 10).map(rec => ({
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      expectedImpact: rec.expectedBenefit
    }))

    // Get raw data for appendices
    const rawMetrics = this.getRawMetricsForPeriod(period)
    const seasonalPatterns = this.getSeasonalPatterns()

    return {
      id: reportId,
      type,
      period,
      executiveSummary,
      detailedAnalysis: {
        qualityTrends,
        performanceAnalysis,
        businessImpactSummary: businessImpact,
        costBenefitAnalysis
      },
      recommendations,
      appendices: {
        rawMetrics,
        detailedInsights: insights,
        seasonalPatterns
      }
    }
  }

  /**
   * Perform cost-benefit analysis
   */
  public performCostBenefitAnalysis(testingCosts: {
    tooling: number
    personnel: number
    infrastructure: number
    training: number
  }): CostBenefitAnalysis {
    const qualityMetrics = this.metricsCollector.getQualityMetrics()
    const businessMetrics = this.metricsCollector.getBusinessImpactMetrics()

    return this.businessAnalyzer.performCostBenefitAnalysis(
      testingCosts,
      qualityMetrics,
      businessMetrics
    )
  }

  /**
   * Get trend analysis for a specific metric
   */
  public getTrendAnalysis(
    metricId: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    periods: number = 30
  ) {
    const trendData = this.metricsCollector.getTrendAnalysis(metricId, timeframe, periods)
    const kpiDefinition = this.metricsCollector.getKPIDefinitions().find(kpi => kpi.id === metricId)
    
    return {
      trendData,
      insights: this.trendAnalyzer.analyzeTrend(trendData, kpiDefinition),
      seasonalPatterns: this.trendAnalyzer.getSeasonalPatterns(metricId),
      anomalies: this.trendAnalyzer.getAnomalies(metricId)
    }
  }

  /**
   * Register alert callback
   */
  public onAlert(callback: (alert: TrendInsight) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Export analytics data
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const dashboard = this.getDashboard()
    const insights = this.getAllInsights()
    const businessAssessments = this.businessAnalyzer.getAssessmentHistory()

    const exportData = {
      timestamp: Date.now(),
      dashboard,
      insights,
      businessAssessments,
      rawMetrics: this.metricsCollector.exportMetrics('json')
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else {
      // Simplified CSV export
      return this.convertToCSV(exportData)
    }
  }

  /**
   * Get analytics summary
   */
  public getSummary(): {
    metricsCollected: number
    insightsGenerated: number
    anomaliesDetected: number
    businessAssessments: number
    lastAnalysisTime: number
  } {
    const metricsSummary = this.metricsCollector.getMetricsSummary()
    const trendSummary = this.trendAnalyzer.generateSummaryReport()
    const businessHistory = this.businessAnalyzer.getAssessmentHistory()

    return {
      metricsCollected: metricsSummary.totalMetrics,
      insightsGenerated: trendSummary.totalInsights,
      anomaliesDetected: trendSummary.anomaliesDetected,
      businessAssessments: businessHistory.length,
      lastAnalysisTime: metricsSummary.lastCollectionTime
    }
  }

  /**
   * Shutdown the analytics service
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Analytics Service...')

    this.metricsCollector.stopCollection()
    this.isInitialized = false

    console.log('Analytics Service shutdown complete')
  }

  // Private helper methods

  private setupRealTimeAnalysis(): void {
    // Set up periodic analysis
    setInterval(async () => {
      await this.performRealTimeAnalysis()
    }, this.config.collectionInterval * 5) // Analyze every 5 collection intervals
  }

  private async performRealTimeAnalysis(): Promise<void> {
    try {
      // Get recent metrics
      const now = Date.now()
      const recentPeriod = { start: now - this.config.collectionInterval * 10, end: now }

      const qualityMetrics = this.metricsCollector.getQualityMetrics(recentPeriod)
      const businessMetrics = this.metricsCollector.getBusinessImpactMetrics(recentPeriod)

      // Analyze trends for key metrics
      const keyMetrics = ['test_pass_rate', 'system_availability', 'user_satisfaction', 'defect_escape_rate']
      
      for (const metricId of keyMetrics) {
        const trendData = this.metricsCollector.getTrendAnalysis(metricId, 'hour', 24)
        const kpiDefinition = this.metricsCollector.getKPIDefinitions().find(kpi => kpi.id === metricId)
        
        if (trendData.dataPoints.length > 0) {
          const insights = this.trendAnalyzer.analyzeTrend(trendData, kpiDefinition)
          
          // Check for critical alerts
          const criticalInsights = insights.filter(insight => insight.severity === 'critical')
          criticalInsights.forEach(insight => {
            this.triggerAlert(insight)
          })
        }
      }

      // Perform business impact analysis if enabled
      if (this.config.enableBusinessImpactAnalysis) {
        const insights = this.getAllInsights()
        const businessImpact = this.businessAnalyzer.assessBusinessImpact(
          qualityMetrics,
          businessMetrics,
          insights
        )

        // Check for critical business impact
        if (businessImpact.riskLevel === 'critical') {
          const criticalRecommendations = businessImpact.recommendations.filter(rec => rec.priority === 'critical')
          criticalRecommendations.forEach(rec => {
            this.triggerAlert({
              id: `business_${rec.id}`,
              metric: 'business_impact',
              type: 'degradation',
              severity: 'critical',
              title: rec.title,
              description: rec.description,
              recommendation: rec.description,
              confidence: 0.9,
              detectedAt: Date.now(),
              affectedTimeframe: { start: now - 3600000, end: now },
              data: { currentValue: businessImpact.overallScore, changePercent: 0 }
            })
          })
        }
      }

    } catch (error) {
      console.error('Real-time analysis failed:', error)
    }
  }

  private triggerAlert(alert: TrendInsight): void {
    console.warn(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`)
    console.warn(`Description: ${alert.description}`)
    console.warn(`Recommendation: ${alert.recommendation}`)

    // Notify registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Alert callback failed:', error)
      }
    })
  }

  private getAllInsights(): TrendInsight[] {
    const keyMetrics = ['test_pass_rate', 'system_availability', 'user_satisfaction', 'defect_escape_rate']
    const allInsights: TrendInsight[] = []

    keyMetrics.forEach(metricId => {
      const insights = this.trendAnalyzer.getInsights(metricId)
      allInsights.push(...insights)
    })

    return allInsights
  }

  private getRecentAnomalies(hours: number): AnomalyDetection[] {
    const keyMetrics = ['test_pass_rate', 'system_availability', 'user_satisfaction']
    const allAnomalies: AnomalyDetection[] = []
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)

    keyMetrics.forEach(metricId => {
      const anomalies = this.trendAnalyzer.getAnomalies(metricId)
      const recentAnomalies = anomalies.filter(anomaly => anomaly.timestamp >= cutoffTime)
      allAnomalies.push(...recentAnomalies)
    })

    return allAnomalies.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
  }

  private getKeyCorrelations(): CorrelationAnalysis[] {
    const keyMetrics = ['test_pass_rate', 'system_availability', 'user_satisfaction', 'defect_escape_rate']
    const allCorrelations: CorrelationAnalysis[] = []

    keyMetrics.forEach(metricId => {
      const correlations = this.trendAnalyzer.getCorrelations(metricId)
      allCorrelations.push(...correlations)
    })

    return allCorrelations
      .filter(corr => corr.strength === 'strong' || corr.strength === 'very_strong')
      .slice(0, 5)
  }

  private calculateOverallHealthScore(
    qualityMetrics: QualityMetrics,
    businessMetrics: BusinessImpactMetrics
  ): number {
    // Weighted average of key health indicators
    const weights = {
      testPassRate: 0.2,
      systemAvailability: 0.2,
      userSatisfaction: 0.2,
      defectEscapeRate: 0.15,
      responseTime: 0.15,
      errorRate: 0.1
    }

    const normalizedMetrics = {
      testPassRate: qualityMetrics.testReliability.passRate,
      systemAvailability: qualityMetrics.performanceMetrics.availabilityPercentage,
      userSatisfaction: businessMetrics.userExperience.satisfactionScore * 20, // Convert to 0-100 scale
      defectEscapeRate: 100 - qualityMetrics.defectMetrics.defectEscapeRate, // Invert so higher is better
      responseTime: Math.max(0, 100 - (qualityMetrics.performanceMetrics.averageResponseTime / 10)), // Normalize response time
      errorRate: 100 - qualityMetrics.performanceMetrics.errorRate // Invert so lower error rate = higher score
    }

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalizedMetrics[metric as keyof typeof normalizedMetrics] * weight)
    }, 0)
  }

  private createEmptyBusinessImpact(): BusinessImpactAssessment {
    return {
      id: 'empty',
      timestamp: Date.now(),
      overallScore: 0,
      riskLevel: 'low',
      categories: {
        userExperience: { score: 0, riskLevel: 'low', keyMetrics: [], issues: [] },
        operational: { score: 0, riskLevel: 'low', keyMetrics: [], issues: [] },
        financial: { score: 0, riskLevel: 'low', keyMetrics: [], issues: [] },
        reputation: { score: 0, riskLevel: 'low', keyMetrics: [], issues: [] }
      },
      recommendations: [],
      projectedImpact: {
        shortTerm: { timeframe: 'short_term', userImpact: { affectedUsers: 0, satisfactionChange: 0, churnRisk: 0 }, financialImpact: { revenueAtRisk: 0, costIncrease: 0, potentialSavings: 0 }, operationalImpact: { downtimeRisk: 0, resourceRequirement: 0, efficiencyChange: 0 } },
        mediumTerm: { timeframe: 'medium_term', userImpact: { affectedUsers: 0, satisfactionChange: 0, churnRisk: 0 }, financialImpact: { revenueAtRisk: 0, costIncrease: 0, potentialSavings: 0 }, operationalImpact: { downtimeRisk: 0, resourceRequirement: 0, efficiencyChange: 0 } },
        longTerm: { timeframe: 'long_term', userImpact: { affectedUsers: 0, satisfactionChange: 0, churnRisk: 0 }, financialImpact: { revenueAtRisk: 0, costIncrease: 0, potentialSavings: 0 }, operationalImpact: { downtimeRisk: 0, resourceRequirement: 0, efficiencyChange: 0 } }
      }
    }
  }

  private getReportPeriod(type: 'daily' | 'weekly' | 'monthly' | 'quarterly'): { start: number; end: number } {
    const now = Date.now()
    const periods = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 90 * 24 * 60 * 60 * 1000
    }

    return {
      start: now - periods[type],
      end: now
    }
  }

  private analyzeQualityTrends(period: { start: number; end: number }): Array<{
    metric: string
    trend: 'improving' | 'declining' | 'stable'
    changePercent: number
  }> {
    const keyMetrics = ['test_pass_rate', 'defect_escape_rate', 'system_availability']
    
    return keyMetrics.map(metricId => {
      const trendData = this.metricsCollector.getTrendAnalysis(metricId, 'day', 30)
      return {
        metric: metricId,
        trend: trendData.trend,
        changePercent: trendData.changeRate
      }
    })
  }

  private analyzePerformance(period: { start: number; end: number }): {
    averageResponseTime: number
    throughputTrend: number
    errorRateChange: number
  } {
    const performanceMetrics = this.metricsCollector.getQualityMetrics(period).performanceMetrics
    
    return {
      averageResponseTime: performanceMetrics.averageResponseTime,
      throughputTrend: 0, // Would calculate trend
      errorRateChange: 0 // Would calculate change
    }
  }

  private getRawMetricsForPeriod(period: { start: number; end: number }): Record<string, TestMetric[]> {
    // This would filter metrics by the specified period
    // For now, return empty object
    return {}
  }

  private getSeasonalPatterns(): SeasonalPattern[] {
    const keyMetrics = ['test_pass_rate', 'system_availability', 'user_satisfaction']
    const allPatterns: SeasonalPattern[] = []

    keyMetrics.forEach(metricId => {
      const patterns = this.trendAnalyzer.getSeasonalPatterns(metricId)
      allPatterns.push(...patterns)
    })

    return allPatterns
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = ['timestamp', 'metric', 'value', 'category', 'severity']
    const rows = [headers.join(',')]

    // Add sample data row
    rows.push(`${Date.now()},sample_metric,100,quality,low`)

    return rows.join('\n')
  }
}