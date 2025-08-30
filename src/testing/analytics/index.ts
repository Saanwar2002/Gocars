/**
 * Analytics Module
 * Exports all analytics and metrics functionality
 */

// Core services
export { AnalyticsService } from './AnalyticsService'
export { MetricsCollector } from './MetricsCollector'
export { TrendAnalyzer } from './TrendAnalyzer'
export { BusinessImpactAnalyzer } from './BusinessImpactAnalyzer'

// Type definitions
export type {
  TestMetric,
  KPIDefinition,
  QualityMetrics,
  BusinessImpactMetrics,
  TrendData
} from './MetricsCollector'

export type {
  TrendInsight,
  SeasonalPattern,
  AnomalyDetection,
  CorrelationAnalysis
} from './TrendAnalyzer'

export type {
  BusinessImpactAssessment,
  BusinessCategoryImpact,
  BusinessRecommendation,
  ProjectedImpact,
  CostBenefitAnalysis
} from './BusinessImpactAnalyzer'

export type {
  AnalyticsConfig,
  AnalyticsDashboard,
  AnalyticsReport
} from './AnalyticsService'