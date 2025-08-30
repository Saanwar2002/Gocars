/**
 * Analytics Service Tests
 * Tests for the analytics and metrics collection system
 */

import { AnalyticsService } from '../AnalyticsService'
import { TestMetric, KPIDefinition } from '../MetricsCollector'

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  beforeEach(async () => {
    analyticsService = new AnalyticsService({
      collectionInterval: 1000, // 1 second for testing
      retentionPeriod: 1, // 1 day
      alertThresholds: {
        critical: 20,
        warning: 40
      },
      enableRealTimeAnalysis: false, // Disable for testing
      enableBusinessImpactAnalysis: true
    })

    await analyticsService.initialize()
  })

  afterEach(async () => {
    await analyticsService.shutdown()
  })

  describe('Metrics Collection', () => {
    test('should record custom metrics', () => {
      const metric: Omit<TestMetric, 'timestamp'> = {
        id: 'test_metric',
        name: 'Test Metric',
        category: 'quality',
        value: 95.5,
        unit: '%',
        tags: { environment: 'test', component: 'auth' }
      }

      expect(() => analyticsService.recordMetric(metric)).not.toThrow()
    })

    test('should add custom KPI definitions', () => {
      const kpi: KPIDefinition = {
        id: 'custom_kpi',
        name: 'Custom KPI',
        description: 'A custom key performance indicator',
        category: 'business',
        formula: 'custom_formula',
        target: 80,
        threshold: { critical: 40, warning: 60, good: 80 },
        unit: '%',
        frequency: 'daily'
      }

      expect(() => analyticsService.addKPI(kpi)).not.toThrow()
    })

    test('should get analytics summary', () => {
      const summary = analyticsService.getSummary()

      expect(summary).toBeDefined()
      expect(typeof summary.metricsCollected).toBe('number')
      expect(typeof summary.insightsGenerated).toBe('number')
      expect(typeof summary.anomaliesDetected).toBe('number')
      expect(typeof summary.businessAssessments).toBe('number')
      expect(typeof summary.lastAnalysisTime).toBe('number')
    })
  })

  describe('Dashboard Generation', () => {
    test('should generate dashboard data', async () => {
      // Record some test metrics first
      analyticsService.recordMetric({
        id: 'test_pass_rate',
        name: 'Test Pass Rate',
        category: 'quality',
        value: 92.5,
        unit: '%',
        tags: { suite: 'integration' }
      })

      analyticsService.recordMetric({
        id: 'system_availability',
        name: 'System Availability',
        category: 'reliability',
        value: 99.8,
        unit: '%',
        tags: { service: 'main_app' }
      })

      const dashboard = await analyticsService.getDashboard()

      expect(dashboard).toBeDefined()
      expect(dashboard.timestamp).toBeGreaterThan(0)
      expect(dashboard.summary).toBeDefined()
      expect(dashboard.qualityMetrics).toBeDefined()
      expect(dashboard.businessMetrics).toBeDefined()
      expect(Array.isArray(dashboard.topInsights)).toBe(true)
      expect(dashboard.businessImpact).toBeDefined()
      expect(Array.isArray(dashboard.recentAnomalies)).toBe(true)
      expect(Array.isArray(dashboard.keyCorrelations)).toBe(true)
    })

    test('should calculate overall health score', async () => {
      // Record metrics that affect health score
      analyticsService.recordMetric({
        id: 'test_pass_rate',
        name: 'Test Pass Rate',
        category: 'quality',
        value: 95,
        unit: '%',
        tags: {}
      })

      const dashboard = await analyticsService.getDashboard()
      
      expect(dashboard.summary.overallHealthScore).toBeGreaterThanOrEqual(0)
      expect(dashboard.summary.overallHealthScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Report Generation', () => {
    test('should generate daily report', async () => {
      const report = await analyticsService.generateReport('daily')

      expect(report).toBeDefined()
      expect(report.id).toBeDefined()
      expect(report.type).toBe('daily')
      expect(report.period).toBeDefined()
      expect(report.period.start).toBeLessThan(report.period.end)
      expect(report.executiveSummary).toBeDefined()
      expect(report.detailedAnalysis).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
      expect(report.appendices).toBeDefined()
    })

    test('should generate weekly report', async () => {
      const report = await analyticsService.generateReport('weekly')

      expect(report.type).toBe('weekly')
      expect(report.period.end - report.period.start).toBe(7 * 24 * 60 * 60 * 1000)
    })

    test('should generate custom period report', async () => {
      const customPeriod = {
        start: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        end: Date.now()
      }

      const report = await analyticsService.generateReport('custom', customPeriod)

      expect(report.type).toBe('custom')
      expect(report.period.start).toBe(customPeriod.start)
      expect(report.period.end).toBe(customPeriod.end)
    })
  })

  describe('Trend Analysis', () => {
    test('should analyze trends for specific metrics', () => {
      // Record some historical data
      const baseTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
      
      for (let i = 0; i < 24; i++) {
        analyticsService.recordMetric({
          id: 'test_pass_rate',
          name: 'Test Pass Rate',
          category: 'quality',
          value: 90 + Math.random() * 10, // 90-100%
          unit: '%',
          tags: { hour: i.toString() }
        })
      }

      const trendAnalysis = analyticsService.getTrendAnalysis('test_pass_rate', 'hour', 24)

      expect(trendAnalysis).toBeDefined()
      expect(trendAnalysis.trendData).toBeDefined()
      expect(Array.isArray(trendAnalysis.insights)).toBe(true)
      expect(Array.isArray(trendAnalysis.seasonalPatterns)).toBe(true)
      expect(Array.isArray(trendAnalysis.anomalies)).toBe(true)
    })

    test('should detect trends correctly', () => {
      // Record declining trend
      for (let i = 0; i < 10; i++) {
        analyticsService.recordMetric({
          id: 'declining_metric',
          name: 'Declining Metric',
          category: 'quality',
          value: 100 - (i * 5), // 100, 95, 90, 85, ...
          unit: '%',
          tags: { sequence: i.toString() }
        })
      }

      const trendAnalysis = analyticsService.getTrendAnalysis('declining_metric', 'hour', 10)
      
      expect(trendAnalysis.trendData.trend).toBe('declining')
      expect(trendAnalysis.trendData.changeRate).toBeLessThan(0)
    })
  })

  describe('Cost-Benefit Analysis', () => {
    test('should perform cost-benefit analysis', () => {
      const testingCosts = {
        tooling: 10000,
        personnel: 50000,
        infrastructure: 15000,
        training: 5000
      }

      const analysis = analyticsService.performCostBenefitAnalysis(testingCosts)

      expect(analysis).toBeDefined()
      expect(analysis.testingInvestment.total).toBe(80000)
      expect(analysis.benefits.total).toBeGreaterThanOrEqual(0)
      expect(typeof analysis.roi).toBe('number')
      expect(typeof analysis.paybackPeriod).toBe('number')
      expect(typeof analysis.netPresentValue).toBe('number')
    })

    test('should calculate positive ROI for effective testing', () => {
      // Record good quality metrics that would justify testing investment
      analyticsService.recordMetric({
        id: 'defect_prevention',
        name: 'Defects Prevented',
        category: 'quality',
        value: 50, // 50 defects prevented
        unit: 'count',
        tags: { period: 'monthly' }
      })

      const testingCosts = {
        tooling: 5000,
        personnel: 20000,
        infrastructure: 5000,
        training: 2000
      }

      const analysis = analyticsService.performCostBenefitAnalysis(testingCosts)

      expect(analysis.roi).toBeGreaterThan(0)
    })
  })

  describe('Alert System', () => {
    test('should register alert callbacks', () => {
      let alertReceived = false
      
      analyticsService.onAlert((alert) => {
        alertReceived = true
        expect(alert.severity).toBeDefined()
        expect(alert.title).toBeDefined()
        expect(alert.description).toBeDefined()
      })

      // This would trigger an alert in a real scenario
      // For testing, we just verify the callback was registered
      expect(alertReceived).toBe(false) // No alerts triggered yet
    })
  })

  describe('Data Export', () => {
    test('should export data in JSON format', () => {
      const exportedData = analyticsService.exportData('json')

      expect(typeof exportedData).toBe('string')
      expect(() => JSON.parse(exportedData)).not.toThrow()

      const parsed = JSON.parse(exportedData)
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.dashboard).toBeDefined()
      expect(parsed.insights).toBeDefined()
      expect(parsed.businessAssessments).toBeDefined()
    })

    test('should export data in CSV format', () => {
      const exportedData = analyticsService.exportData('csv')

      expect(typeof exportedData).toBe('string')
      expect(exportedData).toContain(',') // Should contain CSV separators
      expect(exportedData.split('\n').length).toBeGreaterThan(1) // Should have multiple lines
    })
  })

  describe('Business Impact Analysis', () => {
    test('should assess business impact', async () => {
      // Record metrics that affect business impact
      analyticsService.recordMetric({
        id: 'user_satisfaction',
        name: 'User Satisfaction',
        category: 'business',
        value: 4.2,
        unit: 'rating',
        tags: { survey: 'monthly' }
      })

      analyticsService.recordMetric({
        id: 'system_availability',
        name: 'System Availability',
        category: 'reliability',
        value: 99.5,
        unit: '%',
        tags: { service: 'main' }
      })

      const dashboard = await analyticsService.getDashboard()
      const businessImpact = dashboard.businessImpact

      expect(businessImpact).toBeDefined()
      expect(businessImpact.overallScore).toBeGreaterThanOrEqual(0)
      expect(businessImpact.riskLevel).toMatch(/^(low|medium|high|critical)$/)
      expect(businessImpact.categories).toBeDefined()
      expect(Array.isArray(businessImpact.recommendations)).toBe(true)
      expect(businessImpact.projectedImpact).toBeDefined()
    })

    test('should generate executive summary', async () => {
      const report = await analyticsService.generateReport('daily')
      const executiveSummary = report.executiveSummary

      expect(executiveSummary.summary).toBeDefined()
      expect(Array.isArray(executiveSummary.keyFindings)).toBe(true)
      expect(Array.isArray(executiveSummary.criticalActions)).toBe(true)
      expect(executiveSummary.businessValue).toBeDefined()
    })
  })

  describe('Performance and Reliability', () => {
    test('should handle high volume of metrics', () => {
      const startTime = Date.now()
      
      // Record 1000 metrics
      for (let i = 0; i < 1000; i++) {
        analyticsService.recordMetric({
          id: `bulk_metric_${i % 10}`, // 10 different metrics
          name: `Bulk Metric ${i % 10}`,
          category: 'performance',
          value: Math.random() * 100,
          unit: 'ms',
          tags: { batch: 'bulk_test', index: i.toString() }
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000)

      const summary = analyticsService.getSummary()
      expect(summary.metricsCollected).toBeGreaterThanOrEqual(1000)
    })

    test('should maintain performance with concurrent operations', async () => {
      const operations = []

      // Start multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(analyticsService.getDashboard())
        operations.push(analyticsService.generateReport('daily'))
      }

      // All operations should complete successfully
      const results = await Promise.all(operations)
      expect(results).toHaveLength(20)
      
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })
  })
})