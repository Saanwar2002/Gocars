import { EventEmitter } from 'events';

export interface PerformanceMetricData {
  id: string;
  timestamp: Date;
  value: number;
  unit: string;
  category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'business_metric';
  subcategory?: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface TrendAnalysisResult {
  metric: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: number; // 0-1, where 1 is strongest trend
    confidence: number; // 0-1, confidence in the trend analysis
    changeRate: number; // percentage change per unit time
  };
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  seasonality: {
    detected: boolean;
    period?: number; // in milliseconds
    amplitude?: number;
    confidence?: number;
  };
  anomalies: AnomalyPoint[];
  forecast: ForecastPoint[];
}

export interface AnomalyPoint {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break';
  description: string;
}

export interface ForecastPoint {
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
}

export interface BottleneckAnalysis {
  id: string;
  timestamp: Date;
  component: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'external_service';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    affectedMetrics: string[];
    performanceDegradation: number; // percentage
    userImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    businessImpact: string;
  };
  rootCause: {
    primary: string;
    contributing: string[];
    evidence: Evidence[];
  };
  recommendations: BottleneckRecommendation[];
  estimatedResolutionTime: number; // minutes
  priority: number; // 1-10, where 10 is highest priority
}

export interface Evidence {
  type: 'metric' | 'log' | 'trace' | 'correlation';
  description: string;
  data: any;
  confidence: number; // 0-1
}

export interface BottleneckRecommendation {
  action: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  expectedImprovement: string;
  implementationSteps: string[];
  risks: string[];
  dependencies: string[];
}

export interface RegressionDetectionResult {
  detected: boolean;
  regressions: PerformanceRegression[];
  summary: {
    totalRegressions: number;
    criticalRegressions: number;
    affectedMetrics: string[];
    overallImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
  };
}

export interface PerformanceRegression {
  id: string;
  detectedAt: Date;
  metric: string;
  timeRange: {
    baseline: { start: Date; end: Date };
    current: { start: Date; end: Date };
  };
  degradation: {
    percentage: number;
    absoluteChange: number;
    significance: number; // statistical significance 0-1
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  possibleCauses: PossibleCause[];
  affectedComponents: string[];
  userImpact: string;
  businessImpact: string;
  recommendations: RegressionRecommendation[];
}

export interface PossibleCause {
  type: 'code_change' | 'configuration_change' | 'infrastructure_change' | 'data_change' | 'external_dependency';
  description: string;
  likelihood: number; // 0-1
  evidence: Evidence[];
  investigationSteps: string[];
}

export interface RegressionRecommendation {
  priority: 'immediate' | 'urgent' | 'high' | 'medium' | 'low';
  action: string;
  description: string;
  expectedOutcome: string;
  timeToImplement: string;
  rollbackPlan?: string;
}

export interface PerformanceBaseline {
  id: string;
  name: string;
  createdAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: BaselineMetric[];
  conditions: {
    environment: string;
    load: string;
    configuration: Record<string, any>;
  };
  quality: {
    dataPoints: number;
    completeness: number; // 0-1
    stability: number; // 0-1
    representativeness: number; // 0-1
  };
}

export interface BaselineMetric {
  name: string;
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: Record<string, number>;
  };
  acceptableRange: {
    min: number;
    max: number;
  };
  alertThresholds: {
    warning: number;
    critical: number;
  };
}

export interface PerformanceReport {
  id: string;
  generatedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    healthScore: number; // 0-100
    keyFindings: string[];
    criticalIssues: number;
    improvements: number;
    regressions: number;
  };
  trendAnalysis: TrendAnalysisResult[];
  bottlenecks: BottleneckAnalysis[];
  regressions: PerformanceRegression[];
  recommendations: PerformanceRecommendation[];
  comparisons: {
    previousPeriod?: PerformanceComparison;
    baseline?: PerformanceComparison;
  };
}

export interface PerformanceRecommendation {
  id: string;
  category: 'performance' | 'scalability' | 'reliability' | 'cost_optimization' | 'user_experience';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    performance: string;
    business: string;
    user: string;
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
    timeframe: string;
    steps: string[];
    prerequisites: string[];
  };
  expectedOutcome: {
    improvement: string;
    metrics: string[];
    timeline: string;
  };
  risks: string[];
  alternatives: string[];
}

export interface PerformanceComparison {
  period: string;
  changes: {
    improved: string[];
    degraded: string[];
    stable: string[];
  };
  overallChange: number; // percentage
  significance: number; // 0-1
}

export class PerformanceAnalyzer extends EventEmitter {
  private metricsData: Map<string, PerformanceMetricData[]> = new Map();
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private trendAnalyzer: TrendAnalyzer;
  private bottleneckDetector: BottleneckDetector;
  private regressionDetector: RegressionDetector;
  private anomalyDetector: AnomalyDetector;
  private forecastEngine: ForecastEngine;

  constructor() {
    super();
    this.trendAnalyzer = new TrendAnalyzer();
    this.bottleneckDetector = new BottleneckDetector();
    this.regressionDetector = new RegressionDetector();
    this.anomalyDetector = new AnomalyDetector();
    this.forecastEngine = new ForecastEngine();
  }

  public addMetricData(data: PerformanceMetricData[]): void {
    data.forEach(metric => {
      const key = `${metric.category}_${metric.subcategory || 'default'}`;
      if (!this.metricsData.has(key)) {
        this.metricsData.set(key, []);
      }
      this.metricsData.get(key)!.push(metric);
    });

    // Sort by timestamp
    this.metricsData.forEach(metrics => {
      metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    this.emit('metricsAdded', data);
  }

  public async analyzeTrends(
    metricName: string,
    timeRange: { start: Date; end: Date },
    options: {
      includeForecasting?: boolean;
      forecastHorizon?: number; // hours
      detectSeasonality?: boolean;
      anomalyDetection?: boolean;
    } = {}
  ): Promise<TrendAnalysisResult> {
    const metrics = this.getMetricsInRange(metricName, timeRange);
    
    if (metrics.length === 0) {
      throw new Error(`No metrics found for ${metricName} in the specified time range`);
    }

    // Calculate basic statistics
    const values = metrics.map(m => m.value);
    const statistics = this.calculateStatistics(values);

    // Analyze trend
    const trend = await this.trendAnalyzer.analyzeTrend(metrics);

    // Detect seasonality if requested
    let seasonality = { detected: false };
    if (options.detectSeasonality) {
      seasonality = await this.trendAnalyzer.detectSeasonality(metrics);
    }

    // Detect anomalies if requested
    let anomalies: AnomalyPoint[] = [];
    if (options.anomalyDetection) {
      anomalies = await this.anomalyDetector.detectAnomalies(metrics);
    }

    // Generate forecast if requested
    let forecast: ForecastPoint[] = [];
    if (options.includeForecasting) {
      const horizonHours = options.forecastHorizon || 24;
      forecast = await this.forecastEngine.generateForecast(metrics, horizonHours);
    }

    const result: TrendAnalysisResult = {
      metric: metricName,
      timeRange,
      trend,
      statistics,
      seasonality,
      anomalies,
      forecast
    };

    this.emit('trendAnalysisCompleted', result);
    return result;
  }

  public async detectBottlenecks(
    timeRange: { start: Date; end: Date },
    options: {
      includeHistorical?: boolean;
      severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
      components?: string[];
    } = {}
  ): Promise<BottleneckAnalysis[]> {
    const allMetrics = this.getAllMetricsInRange(timeRange);
    
    if (allMetrics.length === 0) {
      throw new Error('No metrics found in the specified time range');
    }

    const bottlenecks = await this.bottleneckDetector.detectBottlenecks(
      allMetrics,
      options
    );

    // Sort by priority (highest first)
    bottlenecks.sort((a, b) => b.priority - a.priority);

    this.emit('bottlenecksDetected', bottlenecks);
    return bottlenecks;
  }

  public async detectRegressions(
    baselineId: string,
    currentTimeRange: { start: Date; end: Date },
    options: {
      sensitivityLevel?: 'low' | 'medium' | 'high';
      minSignificance?: number; // 0-1
      excludeMetrics?: string[];
    } = {}
  ): Promise<RegressionDetectionResult> {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new Error(`Baseline with id ${baselineId} not found`);
    }

    const currentMetrics = this.getAllMetricsInRange(currentTimeRange);
    
    const result = await this.regressionDetector.detectRegressions(
      baseline,
      currentMetrics,
      options
    );

    this.emit('regressionsDetected', result);
    return result;
  }

  public createBaseline(
    name: string,
    timeRange: { start: Date; end: Date },
    conditions: {
      environment: string;
      load: string;
      configuration: Record<string, any>;
    }
  ): string {
    const id = this.generateId();
    const metrics = this.getAllMetricsInRange(timeRange);
    
    if (metrics.length === 0) {
      throw new Error('No metrics found in the specified time range for baseline creation');
    }

    // Group metrics by name and calculate baseline statistics
    const metricGroups = this.groupMetricsByName(metrics);
    const baselineMetrics: BaselineMetric[] = [];

    for (const [metricName, metricData] of metricGroups) {
      const values = metricData.map(m => m.value);
      const statistics = this.calculateStatistics(values);
      
      // Calculate acceptable range (mean ± 2 standard deviations)
      const acceptableRange = {
        min: statistics.mean - (2 * statistics.standardDeviation),
        max: statistics.mean + (2 * statistics.standardDeviation)
      };

      // Set alert thresholds
      const alertThresholds = {
        warning: statistics.mean + statistics.standardDeviation,
        critical: statistics.mean + (2 * statistics.standardDeviation)
      };

      baselineMetrics.push({
        name: metricName,
        statistics,
        acceptableRange,
        alertThresholds
      });
    }

    // Calculate baseline quality
    const quality = this.calculateBaselineQuality(metrics, timeRange);

    const baseline: PerformanceBaseline = {
      id,
      name,
      createdAt: new Date(),
      timeRange,
      metrics: baselineMetrics,
      conditions,
      quality
    };

    this.baselines.set(id, baseline);
    this.emit('baselineCreated', baseline);
    
    return id;
  }

  public async generatePerformanceReport(
    timeRange: { start: Date; end: Date },
    options: {
      includeComparisons?: boolean;
      baselineId?: string;
      previousPeriodDays?: number;
      detailLevel?: 'summary' | 'detailed' | 'comprehensive';
    } = {}
  ): Promise<PerformanceReport> {
    const reportId = this.generateId();
    
    // Get all metrics for the time range
    const allMetrics = this.getAllMetricsInRange(timeRange);
    
    if (allMetrics.length === 0) {
      throw new Error('No metrics found in the specified time range');
    }

    // Analyze trends for key metrics
    const keyMetrics = this.identifyKeyMetrics(allMetrics);
    const trendAnalysis: TrendAnalysisResult[] = [];
    
    for (const metricName of keyMetrics) {
      try {
        const trend = await this.analyzeTrends(metricName, timeRange, {
          includeForecasting: true,
          anomalyDetection: true,
          detectSeasonality: true
        });
        trendAnalysis.push(trend);
      } catch (error) {
        console.warn(`Failed to analyze trend for ${metricName}:`, error);
      }
    }

    // Detect bottlenecks
    const bottlenecks = await this.detectBottlenecks(timeRange);

    // Detect regressions if baseline is provided
    let regressions: PerformanceRegression[] = [];
    if (options.baselineId) {
      try {
        const regressionResult = await this.detectRegressions(options.baselineId, timeRange);
        regressions = regressionResult.regressions;
      } catch (error) {
        console.warn('Failed to detect regressions:', error);
      }
    }

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      trendAnalysis,
      bottlenecks,
      regressions
    );

    // Calculate overall health
    const summary = this.calculateOverallHealth(trendAnalysis, bottlenecks, regressions);

    // Generate comparisons if requested
    let comparisons: PerformanceReport['comparisons'] = {};
    if (options.includeComparisons) {
      if (options.previousPeriodDays) {
        comparisons.previousPeriod = await this.generatePeriodComparison(
          timeRange,
          options.previousPeriodDays
        );
      }
      if (options.baselineId) {
        comparisons.baseline = await this.generateBaselineComparison(
          timeRange,
          options.baselineId
        );
      }
    }

    const report: PerformanceReport = {
      id: reportId,
      generatedAt: new Date(),
      timeRange,
      summary,
      trendAnalysis,
      bottlenecks,
      regressions,
      recommendations,
      comparisons
    };

    this.emit('reportGenerated', report);
    return report;
  }

  public getAvailableMetrics(): string[] {
    const metrics = new Set<string>();
    this.metricsData.forEach((data, key) => {
      data.forEach(metric => {
        metrics.add(`${metric.category}_${metric.subcategory || 'default'}`);
      });
    });
    return Array.from(metrics);
  }

  public getBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  public getBaseline(id: string): PerformanceBaseline | undefined {
    return this.baselines.get(id);
  }

  public deleteBaseline(id: string): boolean {
    const deleted = this.baselines.delete(id);
    if (deleted) {
      this.emit('baselineDeleted', id);
    }
    return deleted;
  }

  // Private helper methods
  private getMetricsInRange(metricName: string, timeRange: { start: Date; end: Date }): PerformanceMetricData[] {
    const allMetrics: PerformanceMetricData[] = [];
    
    this.metricsData.forEach(metrics => {
      const filtered = metrics.filter(m => 
        m.timestamp >= timeRange.start &&
        m.timestamp <= timeRange.end &&
        (metricName === 'all' || m.category === metricName || `${m.category}_${m.subcategory}` === metricName)
      );
      allMetrics.push(...filtered);
    });

    return allMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getAllMetricsInRange(timeRange: { start: Date; end: Date }): PerformanceMetricData[] {
    return this.getMetricsInRange('all', timeRange);
  }

  private calculateStatistics(values: number[]): TrendAnalysisResult['statistics'] {
    if (values.length === 0) {
      throw new Error('Cannot calculate statistics for empty array');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      mean,
      median: this.calculatePercentile(sorted, 50),
      standardDeviation,
      min: Math.min(...values),
      max: Math.max(...values),
      percentiles: {
        p25: this.calculatePercentile(sorted, 25),
        p50: this.calculatePercentile(sorted, 50),
        p75: this.calculatePercentile(sorted, 75),
        p90: this.calculatePercentile(sorted, 90),
        p95: this.calculatePercentile(sorted, 95),
        p99: this.calculatePercentile(sorted, 99)
      }
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private groupMetricsByName(metrics: PerformanceMetricData[]): Map<string, PerformanceMetricData[]> {
    const groups = new Map<string, PerformanceMetricData[]>();
    
    metrics.forEach(metric => {
      const key = `${metric.category}_${metric.subcategory || 'default'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    return groups;
  }

  private calculateBaselineQuality(
    metrics: PerformanceMetricData[],
    timeRange: { start: Date; end: Date }
  ): PerformanceBaseline['quality'] {
    const totalDuration = timeRange.end.getTime() - timeRange.start.getTime();
    const expectedDataPoints = totalDuration / (5 * 60 * 1000); // Assuming 5-minute intervals
    
    const completeness = Math.min(metrics.length / expectedDataPoints, 1);
    
    // Calculate stability (inverse of coefficient of variation)
    const metricGroups = this.groupMetricsByName(metrics);
    let totalStability = 0;
    let groupCount = 0;

    metricGroups.forEach(groupMetrics => {
      const values = groupMetrics.map(m => m.value);
      const stats = this.calculateStatistics(values);
      const cv = stats.standardDeviation / stats.mean;
      const stability = Math.max(0, 1 - cv);
      totalStability += stability;
      groupCount++;
    });

    const stability = groupCount > 0 ? totalStability / groupCount : 0;
    
    // Representativeness based on data distribution
    const representativeness = Math.min(completeness * stability, 1);

    return {
      dataPoints: metrics.length,
      completeness,
      stability,
      representativeness
    };
  }

  private identifyKeyMetrics(metrics: PerformanceMetricData[]): string[] {
    const metricCounts = new Map<string, number>();
    
    metrics.forEach(metric => {
      const key = `${metric.category}_${metric.subcategory || 'default'}`;
      metricCounts.set(key, (metricCounts.get(key) || 0) + 1);
    });

    // Return metrics with sufficient data points, sorted by frequency
    return Array.from(metricCounts.entries())
      .filter(([_, count]) => count >= 10) // Minimum 10 data points
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 metrics
      .map(([metric, _]) => metric);
  }

  private async generateRecommendations(
    trends: TrendAnalysisResult[],
    bottlenecks: BottleneckAnalysis[],
    regressions: PerformanceRegression[]
  ): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = [];

    // Generate recommendations based on trends
    trends.forEach(trend => {
      if (trend.trend.direction === 'increasing' && trend.metric.includes('response_time')) {
        recommendations.push({
          id: this.generateId(),
          category: 'performance',
          priority: 'high',
          title: 'Address Increasing Response Times',
          description: `Response times for ${trend.metric} are showing an increasing trend`,
          impact: {
            performance: 'Degraded user experience due to slower response times',
            business: 'Potential customer churn and reduced conversion rates',
            user: 'Frustration with slow application performance'
          },
          implementation: {
            effort: 'medium',
            cost: 'medium',
            timeframe: '1-2 weeks',
            steps: [
              'Analyze application bottlenecks',
              'Optimize database queries',
              'Implement caching strategies',
              'Consider infrastructure scaling'
            ],
            prerequisites: ['Performance profiling tools', 'Database access']
          },
          expectedOutcome: {
            improvement: '20-40% reduction in response times',
            metrics: ['response_time', 'user_satisfaction'],
            timeline: '2-4 weeks'
          },
          risks: ['Temporary performance impact during optimization'],
          alternatives: ['Horizontal scaling', 'CDN implementation']
        });
      }
    });

    // Generate recommendations based on bottlenecks
    bottlenecks.forEach(bottleneck => {
      bottleneck.recommendations.forEach(rec => {
        recommendations.push({
          id: this.generateId(),
          category: 'performance',
          priority: bottleneck.severity === 'critical' ? 'critical' : 'high',
          title: `Resolve ${bottleneck.component} Bottleneck`,
          description: rec.description,
          impact: {
            performance: `${bottleneck.impact.performanceDegradation}% performance improvement expected`,
            business: bottleneck.impact.businessImpact,
            user: `${bottleneck.impact.userImpact} user experience improvement`
          },
          implementation: {
            effort: rec.effort,
            cost: rec.cost,
            timeframe: `${bottleneck.estimatedResolutionTime} minutes`,
            steps: rec.implementationSteps,
            prerequisites: rec.dependencies
          },
          expectedOutcome: {
            improvement: rec.expectedImprovement,
            metrics: bottleneck.impact.affectedMetrics,
            timeline: `${bottleneck.estimatedResolutionTime} minutes`
          },
          risks: rec.risks,
          alternatives: []
        });
      });
    });

    // Generate recommendations based on regressions
    regressions.forEach(regression => {
      regression.recommendations.forEach(rec => {
        recommendations.push({
          id: this.generateId(),
          category: 'reliability',
          priority: rec.priority === 'immediate' ? 'critical' : 'high',
          title: `Address Performance Regression in ${regression.metric}`,
          description: rec.description,
          impact: {
            performance: `${regression.degradation.percentage}% performance degradation detected`,
            business: regression.businessImpact,
            user: regression.userImpact
          },
          implementation: {
            effort: 'high',
            cost: 'medium',
            timeframe: rec.timeToImplement,
            steps: [rec.action],
            prerequisites: []
          },
          expectedOutcome: {
            improvement: rec.expectedOutcome,
            metrics: [regression.metric],
            timeline: rec.timeToImplement
          },
          risks: rec.rollbackPlan ? ['Potential rollback required'] : [],
          alternatives: rec.rollbackPlan ? [rec.rollbackPlan] : []
        });
      });
    });

    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  }

  private calculateOverallHealth(
    trends: TrendAnalysisResult[],
    bottlenecks: BottleneckAnalysis[],
    regressions: PerformanceRegression[]
  ): PerformanceReport['summary'] {
    let healthScore = 100;
    const keyFindings: string[] = [];
    
    // Deduct points for bottlenecks
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;
    
    healthScore -= criticalBottlenecks * 20;
    healthScore -= highBottlenecks * 10;
    
    if (criticalBottlenecks > 0) {
      keyFindings.push(`${criticalBottlenecks} critical bottleneck(s) detected`);
    }

    // Deduct points for regressions
    const criticalRegressions = regressions.filter(r => r.severity === 'critical').length;
    const highRegressions = regressions.filter(r => r.severity === 'high').length;
    
    healthScore -= criticalRegressions * 15;
    healthScore -= highRegressions * 8;
    
    if (criticalRegressions > 0) {
      keyFindings.push(`${criticalRegressions} critical regression(s) detected`);
    }

    // Analyze trends
    const degradingTrends = trends.filter(t => 
      t.trend.direction === 'increasing' && 
      (t.metric.includes('response_time') || t.metric.includes('error_rate'))
    ).length;
    
    healthScore -= degradingTrends * 5;
    
    if (degradingTrends > 0) {
      keyFindings.push(`${degradingTrends} metric(s) showing degrading trends`);
    }

    // Ensure health score is within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Determine overall health category
    let overallHealth: PerformanceReport['summary']['overallHealth'];
    if (healthScore >= 90) overallHealth = 'excellent';
    else if (healthScore >= 75) overallHealth = 'good';
    else if (healthScore >= 60) overallHealth = 'fair';
    else if (healthScore >= 40) overallHealth = 'poor';
    else overallHealth = 'critical';

    if (keyFindings.length === 0) {
      keyFindings.push('System performance within acceptable ranges');
    }

    return {
      overallHealth,
      healthScore,
      keyFindings,
      criticalIssues: criticalBottlenecks + criticalRegressions,
      improvements: 0, // Would be calculated based on historical data
      regressions: regressions.length
    };
  }

  private async generatePeriodComparison(
    currentRange: { start: Date; end: Date },
    previousPeriodDays: number
  ): Promise<PerformanceComparison> {
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const previousRange = {
      start: new Date(currentRange.start.getTime() - (previousPeriodDays * 24 * 60 * 60 * 1000)),
      end: new Date(currentRange.end.getTime() - (previousPeriodDays * 24 * 60 * 60 * 1000))
    };

    const currentMetrics = this.getAllMetricsInRange(currentRange);
    const previousMetrics = this.getAllMetricsInRange(previousRange);

    // Compare metrics (simplified implementation)
    const improved: string[] = [];
    const degraded: string[] = [];
    const stable: string[] = [];

    // This would contain actual comparison logic
    // For now, returning a placeholder
    return {
      period: `Previous ${previousPeriodDays} days`,
      changes: { improved, degraded, stable },
      overallChange: 0,
      significance: 0.5
    };
  }

  private async generateBaselineComparison(
    currentRange: { start: Date; end: Date },
    baselineId: string
  ): Promise<PerformanceComparison> {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new Error(`Baseline ${baselineId} not found`);
    }

    // Compare current metrics with baseline (simplified implementation)
    return {
      period: `Baseline: ${baseline.name}`,
      changes: { improved: [], degraded: [], stable: [] },
      overallChange: 0,
      significance: 0.5
    };
  }

  private generateId(): string {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting classes (simplified implementations)
class TrendAnalyzer {
  public async analyzeTrend(metrics: PerformanceMetricData[]): Promise<TrendAnalysisResult['trend']> {
    if (metrics.length < 2) {
      return {
        direction: 'stable',
        strength: 0,
        confidence: 0,
        changeRate: 0
      };
    }

    const values = metrics.map(m => m.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    const absChangeRate = Math.abs(changeRate);

    let direction: TrendAnalysisResult['trend']['direction'];
    if (absChangeRate < 5) direction = 'stable';
    else if (changeRate > 0) direction = 'increasing';
    else direction = 'decreasing';

    const strength = Math.min(absChangeRate / 50, 1); // Normalize to 0-1
    const confidence = Math.min(values.length / 100, 1); // More data = higher confidence

    return {
      direction,
      strength,
      confidence,
      changeRate
    };
  }

  public async detectSeasonality(metrics: PerformanceMetricData[]): Promise<TrendAnalysisResult['seasonality']> {
    // Simplified seasonality detection
    if (metrics.length < 24) { // Need at least 24 data points
      return { detected: false };
    }

    // This would contain actual seasonality detection logic (FFT, autocorrelation, etc.)
    return {
      detected: false // Placeholder
    };
  }
}

class BottleneckDetector {
  public async detectBottlenecks(
    metrics: PerformanceMetricData[],
    options: any
  ): Promise<BottleneckAnalysis[]> {
    const bottlenecks: BottleneckAnalysis[] = [];

    // Group metrics by component/category
    const metricGroups = new Map<string, PerformanceMetricData[]>();
    metrics.forEach(metric => {
      const key = metric.category;
      if (!metricGroups.has(key)) {
        metricGroups.set(key, []);
      }
      metricGroups.get(key)!.push(metric);
    });

    // Analyze each group for bottlenecks
    for (const [component, componentMetrics] of metricGroups) {
      const bottleneck = await this.analyzeComponentBottleneck(component, componentMetrics);
      if (bottleneck) {
        bottlenecks.push(bottleneck);
      }
    }

    return bottlenecks;
  }

  private async analyzeComponentBottleneck(
    component: string,
    metrics: PerformanceMetricData[]
  ): Promise<BottleneckAnalysis | null> {
    // Simplified bottleneck detection logic
    const values = metrics.map(m => m.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);

    // If max is significantly higher than average, it might be a bottleneck
    if (max > average * 2) {
      return {
        id: `bottleneck-${Date.now()}`,
        timestamp: new Date(),
        component,
        type: 'application',
        severity: 'medium',
        impact: {
          affectedMetrics: [component],
          performanceDegradation: ((max - average) / average) * 100,
          userImpact: 'moderate',
          businessImpact: 'Potential performance degradation affecting user experience'
        },
        rootCause: {
          primary: `High ${component} values detected`,
          contributing: [],
          evidence: []
        },
        recommendations: [
          {
            action: `Optimize ${component} performance`,
            description: `Investigate and optimize ${component} to reduce peak values`,
            effort: 'medium',
            cost: 'low',
            expectedImprovement: '20-30% performance improvement',
            implementationSteps: [`Analyze ${component} patterns`, 'Implement optimizations'],
            risks: [],
            dependencies: []
          }
        ],
        estimatedResolutionTime: 120,
        priority: 6
      };
    }

    return null;
  }
}

class RegressionDetector {
  public async detectRegressions(
    baseline: PerformanceBaseline,
    currentMetrics: PerformanceMetricData[],
    options: any
  ): Promise<RegressionDetectionResult> {
    const regressions: PerformanceRegression[] = [];

    // Compare current metrics with baseline
    for (const baselineMetric of baseline.metrics) {
      const currentMetricData = currentMetrics.filter(m => 
        `${m.category}_${m.subcategory || 'default'}` === baselineMetric.name
      );

      if (currentMetricData.length === 0) continue;

      const currentValues = currentMetricData.map(m => m.value);
      const currentMean = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;

      // Check if current performance is significantly worse than baseline
      const degradationPercentage = ((currentMean - baselineMetric.statistics.mean) / baselineMetric.statistics.mean) * 100;

      if (degradationPercentage > 10) { // 10% degradation threshold
        regressions.push({
          id: `regression-${Date.now()}`,
          detectedAt: new Date(),
          metric: baselineMetric.name,
          timeRange: {
            baseline: baseline.timeRange,
            current: { start: currentMetricData[0].timestamp, end: currentMetricData[currentMetricData.length - 1].timestamp }
          },
          degradation: {
            percentage: degradationPercentage,
            absoluteChange: currentMean - baselineMetric.statistics.mean,
            significance: 0.8 // Simplified
          },
          severity: degradationPercentage > 50 ? 'critical' : degradationPercentage > 25 ? 'high' : 'medium',
          possibleCauses: [
            {
              type: 'code_change',
              description: 'Recent code changes may have introduced performance issues',
              likelihood: 0.7,
              evidence: [],
              investigationSteps: ['Review recent deployments', 'Analyze code changes']
            }
          ],
          affectedComponents: [baselineMetric.name],
          userImpact: 'Users may experience slower response times',
          businessImpact: 'Potential impact on user satisfaction and conversion rates',
          recommendations: [
            {
              priority: 'high',
              action: 'Investigate performance regression',
              description: `Analyze the ${degradationPercentage.toFixed(1)}% performance degradation in ${baselineMetric.name}`,
              expectedOutcome: 'Restore performance to baseline levels',
              timeToImplement: '1-2 days'
            }
          ]
        });
      }
    }

    return {
      detected: regressions.length > 0,
      regressions,
      summary: {
        totalRegressions: regressions.length,
        criticalRegressions: regressions.filter(r => r.severity === 'critical').length,
        affectedMetrics: regressions.map(r => r.metric),
        overallImpact: regressions.length > 3 ? 'severe' : regressions.length > 1 ? 'significant' : 'moderate'
      }
    };
  }
}

class AnomalyDetector {
  public async detectAnomalies(metrics: PerformanceMetricData[]): Promise<AnomalyPoint[]> {
    const anomalies: AnomalyPoint[] = [];

    if (metrics.length < 10) return anomalies;

    const values = metrics.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    // Detect outliers using z-score
    metrics.forEach(metric => {
      const zScore = Math.abs((metric.value - mean) / stdDev);
      
      if (zScore > 3) { // 3 standard deviations
        anomalies.push({
          timestamp: metric.timestamp,
          value: metric.value,
          expectedValue: mean,
          deviation: metric.value - mean,
          severity: zScore > 4 ? 'critical' : 'high',
          type: metric.value > mean ? 'spike' : 'drop',
          description: `Value ${metric.value} is ${zScore.toFixed(2)} standard deviations from the mean`
        });
      }
    });

    return anomalies;
  }
}

class ForecastEngine {
  public async generateForecast(
    metrics: PerformanceMetricData[],
    horizonHours: number
  ): Promise<ForecastPoint[]> {
    const forecast: ForecastPoint[] = [];

    if (metrics.length < 5) return forecast;

    // Simple linear trend forecast
    const values = metrics.map(m => m.value);
    const timestamps = metrics.map(m => m.timestamp.getTime());
    
    // Calculate linear trend
    const n = values.length;
    const sumX = timestamps.reduce((sum, t) => sum + t, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
    const sumXX = timestamps.reduce((sum, t) => sum + t * t, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast points
    const lastTimestamp = timestamps[timestamps.length - 1];
    const intervalMs = 60 * 60 * 1000; // 1 hour intervals
    
    for (let i = 1; i <= horizonHours; i++) {
      const futureTimestamp = lastTimestamp + (i * intervalMs);
      const predictedValue = slope * futureTimestamp + intercept;
      
      // Simple confidence interval (±10% of predicted value)
      const confidence = Math.max(0.5, 1 - (i / horizonHours) * 0.5); // Decreasing confidence over time
      const margin = predictedValue * 0.1;

      forecast.push({
        timestamp: new Date(futureTimestamp),
        predictedValue,
        confidenceInterval: {
          lower: predictedValue - margin,
          upper: predictedValue + margin
        },
        confidence
      });
    }

    return forecast;
  }
}