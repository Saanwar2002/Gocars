/**
 * Trend Analyzer
 * Analyzes trends in test metrics and provides insights
 */

import { TestMetric, TrendData, KPIDefinition } from './MetricsCollector'

export interface TrendInsight {
  id: string
  metric: string
  type: 'improvement' | 'degradation' | 'anomaly' | 'pattern' | 'forecast'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation: string
  confidence: number
  detectedAt: number
  affectedTimeframe: {
    start: number
    end: number
  }
  data: {
    currentValue: number
    previousValue?: number
    changePercent: number
    threshold?: number
  }
}

export interface SeasonalPattern {
  metric: string
  pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  peaks: number[]
  valleys: number[]
  amplitude: number
  confidence: number
}

export interface AnomalyDetection {
  metric: string
  timestamp: number
  value: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'drop' | 'drift' | 'outlier'
}

export interface CorrelationAnalysis {
  metric1: string
  metric2: string
  correlation: number
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
  significance: number
}

export class TrendAnalyzer {
  private insights: Map<string, TrendInsight[]> = new Map()
  private seasonalPatterns: Map<string, SeasonalPattern[]> = new Map()
  private anomalies: Map<string, AnomalyDetection[]> = new Map()
  private correlations: Map<string, CorrelationAnalysis[]> = new Map()

  /**
   * Analyze trends for a metric
   */
  public analyzeTrend(trendData: TrendData, kpiDefinition?: KPIDefinition): TrendInsight[] {
    const insights: TrendInsight[] = []

    // Analyze overall trend
    insights.push(...this.analyzeOverallTrend(trendData, kpiDefinition))

    // Detect anomalies
    insights.push(...this.detectAnomalies(trendData, kpiDefinition))

    // Analyze patterns
    insights.push(...this.analyzePatterns(trendData))

    // Generate forecasting insights
    if (trendData.forecast && trendData.forecast.length > 0) {
      insights.push(...this.analyzeForecast(trendData, kpiDefinition))
    }

    // Store insights
    this.insights.set(trendData.metric, insights)

    return insights
  }

  /**
   * Detect seasonal patterns
   */
  public detectSeasonalPatterns(
    metricId: string,
    dataPoints: Array<{ timestamp: number; value: number }>,
    minPeriods: number = 3
  ): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = []

    // Detect daily patterns
    const dailyPattern = this.detectDailyPattern(dataPoints, minPeriods)
    if (dailyPattern) patterns.push(dailyPattern)

    // Detect weekly patterns
    const weeklyPattern = this.detectWeeklyPattern(dataPoints, minPeriods)
    if (weeklyPattern) patterns.push(weeklyPattern)

    // Detect monthly patterns
    const monthlyPattern = this.detectMonthlyPattern(dataPoints, minPeriods)
    if (monthlyPattern) patterns.push(monthlyPattern)

    // Store patterns
    this.seasonalPatterns.set(metricId, patterns)

    return patterns
  }

  /**
   * Detect anomalies in metric data
   */
  public detectAnomalies(
    trendData: TrendData,
    kpiDefinition?: KPIDefinition
  ): TrendInsight[] {
    const insights: TrendInsight[] = []
    const anomalies: AnomalyDetection[] = []

    const dataPoints = trendData.dataPoints
    if (dataPoints.length < 10) return insights // Need sufficient data

    // Calculate statistical measures
    const values = dataPoints.map(dp => dp.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )

    // Detect outliers using z-score
    const zScoreThreshold = 2.5
    dataPoints.forEach(dp => {
      const zScore = Math.abs((dp.value - mean) / stdDev)
      
      if (zScore > zScoreThreshold) {
        const severity = this.calculateAnomalySeverity(zScore, kpiDefinition)
        const type = dp.value > mean ? 'spike' : 'drop'

        const anomaly: AnomalyDetection = {
          metric: trendData.metric,
          timestamp: dp.timestamp,
          value: dp.value,
          expectedValue: mean,
          deviation: zScore,
          severity,
          type
        }

        anomalies.push(anomaly)

        // Create insight for significant anomalies
        if (severity === 'high' || severity === 'critical') {
          insights.push({
            id: `anomaly_${trendData.metric}_${dp.timestamp}`,
            metric: trendData.metric,
            type: 'anomaly',
            severity,
            title: `${type === 'spike' ? 'Spike' : 'Drop'} detected in ${trendData.metric}`,
            description: `Detected a significant ${type} in ${trendData.metric}. Value: ${dp.value.toFixed(2)}, Expected: ${mean.toFixed(2)}`,
            recommendation: this.getAnomalyRecommendation(type, trendData.metric, severity),
            confidence: Math.min(0.95, zScore / 5),
            detectedAt: Date.now(),
            affectedTimeframe: {
              start: dp.timestamp,
              end: dp.timestamp
            },
            data: {
              currentValue: dp.value,
              previousValue: mean,
              changePercent: ((dp.value - mean) / mean) * 100,
              threshold: kpiDefinition?.threshold.warning
            }
          })
        }
      }
    })

    // Store anomalies
    this.anomalies.set(trendData.metric, anomalies)

    return insights
  }

  /**
   * Analyze correlations between metrics
   */
  public analyzeCorrelations(
    metrics: Map<string, Array<{ timestamp: number; value: number }>>
  ): CorrelationAnalysis[] {
    const correlations: CorrelationAnalysis[] = []
    const metricIds = Array.from(metrics.keys())

    // Calculate correlations between all pairs of metrics
    for (let i = 0; i < metricIds.length; i++) {
      for (let j = i + 1; j < metricIds.length; j++) {
        const metric1 = metricIds[i]
        const metric2 = metricIds[j]
        
        const correlation = this.calculateCorrelation(
          metrics.get(metric1) || [],
          metrics.get(metric2) || []
        )

        if (correlation && Math.abs(correlation.correlation) > 0.3) {
          correlations.push(correlation)
        }
      }
    }

    // Store correlations
    correlations.forEach(corr => {
      const key = `${corr.metric1}_${corr.metric2}`
      if (!this.correlations.has(key)) {
        this.correlations.set(key, [])
      }
      this.correlations.get(key)!.push(corr)
    })

    return correlations
  }

  /**
   * Get insights for a metric
   */
  public getInsights(metricId: string): TrendInsight[] {
    return this.insights.get(metricId) || []
  }

  /**
   * Get seasonal patterns for a metric
   */
  public getSeasonalPatterns(metricId: string): SeasonalPattern[] {
    return this.seasonalPatterns.get(metricId) || []
  }

  /**
   * Get anomalies for a metric
   */
  public getAnomalies(metricId: string): AnomalyDetection[] {
    return this.anomalies.get(metricId) || []
  }

  /**
   * Get correlations involving a metric
   */
  public getCorrelations(metricId: string): CorrelationAnalysis[] {
    const allCorrelations = Array.from(this.correlations.values()).flat()
    return allCorrelations.filter(corr => 
      corr.metric1 === metricId || corr.metric2 === metricId
    )
  }

  /**
   * Generate summary report
   */
  public generateSummaryReport(): {
    totalInsights: number
    criticalInsights: number
    anomaliesDetected: number
    patternsFound: number
    correlationsFound: number
    topInsights: TrendInsight[]
  } {
    const allInsights = Array.from(this.insights.values()).flat()
    const criticalInsights = allInsights.filter(insight => insight.severity === 'critical')
    const allAnomalies = Array.from(this.anomalies.values()).flat()
    const allPatterns = Array.from(this.seasonalPatterns.values()).flat()
    const allCorrelations = Array.from(this.correlations.values()).flat()

    // Get top 5 most critical insights
    const topInsights = allInsights
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity] || b.confidence - a.confidence
      })
      .slice(0, 5)

    return {
      totalInsights: allInsights.length,
      criticalInsights: criticalInsights.length,
      anomaliesDetected: allAnomalies.length,
      patternsFound: allPatterns.length,
      correlationsFound: allCorrelations.length,
      topInsights
    }
  }

  // Private helper methods

  private analyzeOverallTrend(trendData: TrendData, kpiDefinition?: KPIDefinition): TrendInsight[] {
    const insights: TrendInsight[] = []

    if (trendData.dataPoints.length < 2) return insights

    const firstValue = trendData.dataPoints[0].value
    const lastValue = trendData.dataPoints[trendData.dataPoints.length - 1].value
    const changePercent = ((lastValue - firstValue) / firstValue) * 100

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let type: 'improvement' | 'degradation' = changePercent > 0 ? 'improvement' : 'degradation'

    // Determine severity based on KPI thresholds
    if (kpiDefinition) {
      if (lastValue < kpiDefinition.threshold.critical) {
        severity = 'critical'
      } else if (lastValue < kpiDefinition.threshold.warning) {
        severity = 'high'
      } else if (lastValue < kpiDefinition.threshold.good) {
        severity = 'medium'
      }
    } else {
      // Use change magnitude for severity
      const absChange = Math.abs(changePercent)
      if (absChange > 50) severity = 'critical'
      else if (absChange > 25) severity = 'high'
      else if (absChange > 10) severity = 'medium'
    }

    insights.push({
      id: `trend_${trendData.metric}_${Date.now()}`,
      metric: trendData.metric,
      type,
      severity,
      title: `${trendData.metric} is ${trendData.trend}`,
      description: `${trendData.metric} has ${type === 'improvement' ? 'improved' : 'degraded'} by ${Math.abs(changePercent).toFixed(1)}% over the analyzed period`,
      recommendation: this.getTrendRecommendation(type, trendData.metric, severity),
      confidence: Math.min(0.95, Math.abs(changePercent) / 100),
      detectedAt: Date.now(),
      affectedTimeframe: {
        start: trendData.dataPoints[0].timestamp,
        end: trendData.dataPoints[trendData.dataPoints.length - 1].timestamp
      },
      data: {
        currentValue: lastValue,
        previousValue: firstValue,
        changePercent,
        threshold: kpiDefinition?.threshold.warning
      }
    })

    return insights
  }

  private analyzePatterns(trendData: TrendData): TrendInsight[] {
    const insights: TrendInsight[] = []
    
    // Detect if there's a consistent pattern
    const patterns = this.detectSeasonalPatterns(trendData.metric, trendData.dataPoints)
    
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        insights.push({
          id: `pattern_${trendData.metric}_${pattern.pattern}_${Date.now()}`,
          metric: trendData.metric,
          type: 'pattern',
          severity: 'medium',
          title: `${pattern.pattern} pattern detected in ${trendData.metric}`,
          description: `A recurring ${pattern.pattern} pattern has been detected with ${(pattern.confidence * 100).toFixed(1)}% confidence`,
          recommendation: `Consider optimizing for the detected ${pattern.pattern} pattern to improve performance during peak periods`,
          confidence: pattern.confidence,
          detectedAt: Date.now(),
          affectedTimeframe: {
            start: trendData.dataPoints[0].timestamp,
            end: trendData.dataPoints[trendData.dataPoints.length - 1].timestamp
          },
          data: {
            currentValue: pattern.amplitude,
            changePercent: 0
          }
        })
      }
    })

    return insights
  }

  private analyzeForecast(trendData: TrendData, kpiDefinition?: KPIDefinition): TrendInsight[] {
    const insights: TrendInsight[] = []

    if (!trendData.forecast || trendData.forecast.length === 0) return insights

    const forecast = trendData.forecast
    const currentValue = trendData.dataPoints[trendData.dataPoints.length - 1].value
    const futureValue = forecast[forecast.length - 1].predictedValue
    const changePercent = ((futureValue - currentValue) / currentValue) * 100

    // Check if forecast predicts threshold violations
    if (kpiDefinition) {
      const violatingForecasts = forecast.filter(f => 
        f.predictedValue < kpiDefinition.threshold.warning
      )

      if (violatingForecasts.length > 0) {
        const severity = violatingForecasts.some(f => f.predictedValue < kpiDefinition.threshold.critical) 
          ? 'critical' : 'high'

        insights.push({
          id: `forecast_${trendData.metric}_${Date.now()}`,
          metric: trendData.metric,
          type: 'forecast',
          severity,
          title: `Forecast predicts threshold violation for ${trendData.metric}`,
          description: `Based on current trends, ${trendData.metric} is predicted to fall below acceptable thresholds`,
          recommendation: 'Take preventive action to address the predicted decline before it impacts system performance',
          confidence: violatingForecasts[0].confidence,
          detectedAt: Date.now(),
          affectedTimeframe: {
            start: violatingForecasts[0].timestamp,
            end: violatingForecasts[violatingForecasts.length - 1].timestamp
          },
          data: {
            currentValue,
            previousValue: futureValue,
            changePercent,
            threshold: kpiDefinition.threshold.warning
          }
        })
      }
    }

    return insights
  }

  private detectDailyPattern(
    dataPoints: Array<{ timestamp: number; value: number }>,
    minPeriods: number
  ): SeasonalPattern | null {
    // Group data by hour of day
    const hourlyData: Record<number, number[]> = {}
    
    dataPoints.forEach(dp => {
      const hour = new Date(dp.timestamp).getHours()
      if (!hourlyData[hour]) hourlyData[hour] = []
      hourlyData[hour].push(dp.value)
    })

    // Calculate averages for each hour
    const hourlyAverages: Array<{ hour: number; average: number }> = []
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyData[hour] && hourlyData[hour].length >= minPeriods) {
        const average = hourlyData[hour].reduce((sum, val) => sum + val, 0) / hourlyData[hour].length
        hourlyAverages.push({ hour, average })
      }
    }

    if (hourlyAverages.length < 12) return null // Need at least half the day

    const values = hourlyAverages.map(ha => ha.average)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const amplitude = Math.max(...values) - Math.min(...values)
    
    // Find peaks and valleys
    const peaks = hourlyAverages.filter(ha => ha.average > mean + amplitude * 0.2).map(ha => ha.hour)
    const valleys = hourlyAverages.filter(ha => ha.average < mean - amplitude * 0.2).map(ha => ha.hour)

    // Calculate confidence based on pattern consistency
    const confidence = Math.min(0.95, (peaks.length + valleys.length) / 24)

    return {
      metric: 'daily',
      pattern: 'daily',
      peaks,
      valleys,
      amplitude,
      confidence
    }
  }

  private detectWeeklyPattern(
    dataPoints: Array<{ timestamp: number; value: number }>,
    minPeriods: number
  ): SeasonalPattern | null {
    // Group data by day of week
    const dailyData: Record<number, number[]> = {}
    
    dataPoints.forEach(dp => {
      const dayOfWeek = new Date(dp.timestamp).getDay()
      if (!dailyData[dayOfWeek]) dailyData[dayOfWeek] = []
      dailyData[dayOfWeek].push(dp.value)
    })

    // Calculate averages for each day
    const dailyAverages: Array<{ day: number; average: number }> = []
    for (let day = 0; day < 7; day++) {
      if (dailyData[day] && dailyData[day].length >= minPeriods) {
        const average = dailyData[day].reduce((sum, val) => sum + val, 0) / dailyData[day].length
        dailyAverages.push({ day, average })
      }
    }

    if (dailyAverages.length < 5) return null // Need most days of the week

    const values = dailyAverages.map(da => da.average)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const amplitude = Math.max(...values) - Math.min(...values)
    
    const peaks = dailyAverages.filter(da => da.average > mean + amplitude * 0.2).map(da => da.day)
    const valleys = dailyAverages.filter(da => da.average < mean - amplitude * 0.2).map(da => da.day)

    const confidence = Math.min(0.95, (peaks.length + valleys.length) / 7)

    return {
      metric: 'weekly',
      pattern: 'weekly',
      peaks,
      valleys,
      amplitude,
      confidence
    }
  }

  private detectMonthlyPattern(
    dataPoints: Array<{ timestamp: number; value: number }>,
    minPeriods: number
  ): SeasonalPattern | null {
    // Group data by day of month
    const monthlyData: Record<number, number[]> = {}
    
    dataPoints.forEach(dp => {
      const dayOfMonth = new Date(dp.timestamp).getDate()
      if (!monthlyData[dayOfMonth]) monthlyData[dayOfMonth] = []
      monthlyData[dayOfMonth].push(dp.value)
    })

    // Calculate averages for each day of month
    const monthlyAverages: Array<{ day: number; average: number }> = []
    for (let day = 1; day <= 31; day++) {
      if (monthlyData[day] && monthlyData[day].length >= minPeriods) {
        const average = monthlyData[day].reduce((sum, val) => sum + val, 0) / monthlyData[day].length
        monthlyAverages.push({ day, average })
      }
    }

    if (monthlyAverages.length < 15) return null // Need at least half the month

    const values = monthlyAverages.map(ma => ma.average)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const amplitude = Math.max(...values) - Math.min(...values)
    
    const peaks = monthlyAverages.filter(ma => ma.average > mean + amplitude * 0.2).map(ma => ma.day)
    const valleys = monthlyAverages.filter(ma => ma.average < mean - amplitude * 0.2).map(ma => ma.day)

    const confidence = Math.min(0.95, (peaks.length + valleys.length) / 31)

    return {
      metric: 'monthly',
      pattern: 'monthly',
      peaks,
      valleys,
      amplitude,
      confidence
    }
  }

  private calculateCorrelation(
    data1: Array<{ timestamp: number; value: number }>,
    data2: Array<{ timestamp: number; value: number }>
  ): CorrelationAnalysis | null {
    if (data1.length < 10 || data2.length < 10) return null

    // Align data points by timestamp (simplified - assumes same timestamps)
    const minLength = Math.min(data1.length, data2.length)
    const values1 = data1.slice(0, minLength).map(d => d.value)
    const values2 = data2.slice(0, minLength).map(d => d.value)

    // Calculate Pearson correlation coefficient
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length

    let numerator = 0
    let denominator1 = 0
    let denominator2 = 0

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1
      const diff2 = values2[i] - mean2
      
      numerator += diff1 * diff2
      denominator1 += diff1 * diff1
      denominator2 += diff2 * diff2
    }

    const correlation = numerator / Math.sqrt(denominator1 * denominator2)

    if (isNaN(correlation)) return null

    // Determine strength and direction
    const absCorr = Math.abs(correlation)
    let strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
    
    if (absCorr < 0.3) strength = 'weak'
    else if (absCorr < 0.5) strength = 'moderate'
    else if (absCorr < 0.7) strength = 'strong'
    else strength = 'very_strong'

    return {
      metric1: 'metric1', // Would be passed as parameter
      metric2: 'metric2', // Would be passed as parameter
      correlation,
      strength,
      direction: correlation > 0 ? 'positive' : 'negative',
      significance: absCorr
    }
  }

  private calculateAnomalySeverity(
    zScore: number,
    kpiDefinition?: KPIDefinition
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 4) return 'critical'
    if (zScore > 3) return 'high'
    if (zScore > 2.5) return 'medium'
    return 'low'
  }

  private getTrendRecommendation(
    type: 'improvement' | 'degradation',
    metric: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    if (type === 'improvement') {
      return `Continue current practices that are contributing to the improvement in ${metric}`
    }

    switch (severity) {
      case 'critical':
        return `Immediate action required: ${metric} degradation is critical and may impact system stability`
      case 'high':
        return `Urgent attention needed: Investigate and address the decline in ${metric}`
      case 'medium':
        return `Monitor closely: ${metric} is declining and may require intervention`
      default:
        return `Keep monitoring: ${metric} shows minor decline but is within acceptable range`
    }
  }

  private getAnomalyRecommendation(
    type: 'spike' | 'drop',
    metric: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    const action = type === 'spike' ? 'spike' : 'drop'
    
    switch (severity) {
      case 'critical':
        return `Critical ${action} detected in ${metric}. Investigate immediately and consider emergency response procedures`
      case 'high':
        return `Significant ${action} in ${metric} detected. Review recent changes and system logs`
      case 'medium':
        return `Notable ${action} in ${metric}. Monitor for recurrence and investigate if pattern continues`
      default:
        return `Minor ${action} in ${metric} detected. Continue monitoring`
    }
  }
}