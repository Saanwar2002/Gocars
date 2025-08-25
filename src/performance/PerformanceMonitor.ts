import { EventEmitter } from 'events';
import { LoadTestConfiguration, PerformanceThresholds, Alert } from './LoadTestingEngine';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'custom';
  tags: Record<string, string>;
}

export interface SystemResourceMetrics {
  cpu: {
    usage: number; // percentage
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number; // MB
    total: number; // MB
    usage: number; // percentage
    heap: {
      used: number;
      total: number;
    };
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
  };
  disk: {
    readBytes: number;
    writeBytes: number;
    readOps: number;
    writeOps: number;
    usage: number; // percentage
  };
  database: {
    activeConnections: number;
    maxConnections: number;
    queryTime: number;
    slowQueries: number;
  };
}

export interface ApplicationMetrics {
  responseTime: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
  errorRate: {
    percentage: number;
    totalErrors: number;
    errorsByType: Record<string, number>;
  };
  concurrency: {
    activeUsers: number;
    maxUsers: number;
    averageUsers: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'resource_exhausted' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  thresholdValue: number;
  message: string;
  timestamp: Date;
  testId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'scale_up' | 'scale_down' | 'restart_service' | 'notify_admin' | 'stop_test';
  description: string;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

export interface PerformanceReport {
  testId: string;
  generatedAt: Date;
  duration: number;
  summary: PerformanceSummary;
  detailedMetrics: DetailedMetrics;
  alerts: PerformanceAlert[];
  recommendations: PerformanceRecommendation[];
  trends: TrendAnalysis;
}

export interface PerformanceSummary {
  overallScore: number; // 0-100
  responseTimeScore: number;
  throughputScore: number;
  reliabilityScore: number;
  resourceEfficiencyScore: number;
  keyFindings: string[];
}

export interface DetailedMetrics {
  systemResources: SystemResourceMetrics;
  applicationMetrics: ApplicationMetrics;
  customMetrics: PerformanceMetric[];
  timeSeriesData: {
    responseTime: TimeSeriesPoint[];
    throughput: TimeSeriesPoint[];
    errorRate: TimeSeriesPoint[];
    cpuUsage: TimeSeriesPoint[];
    memoryUsage: TimeSeriesPoint[];
  };
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface PerformanceRecommendation {
  id: string;
  category: 'performance' | 'scalability' | 'reliability' | 'cost_optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  estimatedImprovement: string;
}

export interface TrendAnalysis {
  performanceTrend: 'improving' | 'stable' | 'degrading';
  trendConfidence: number; // 0-1
  keyTrends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
    significance: 'low' | 'medium' | 'high';
  }[];
  seasonalPatterns: {
    metric: string;
    pattern: string;
    confidence: number;
  }[];
}

export class PerformanceMonitor extends EventEmitter {
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private thresholds: PerformanceThresholds;
  private metricsBuffer: PerformanceMetric[] = [];
  private resourceCollector: ResourceCollector;
  private anomalyDetector: AnomalyDetector;
  private trendAnalyzer: TrendAnalyzer;

  constructor(thresholds: PerformanceThresholds) {
    super();
    this.thresholds = thresholds;
    this.resourceCollector = new ResourceCollector();
    this.anomalyDetector = new AnomalyDetector();
    this.trendAnalyzer = new TrendAnalyzer();
  }

  public async startMonitoring(testId: string, config: LoadTestConfiguration): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Monitoring is already active');
    }

    this.isMonitoring = true;
    this.thresholds = config.performanceThresholds;

    // Start collecting metrics
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics(testId);
    }, config.monitoringConfig.metricsInterval);

    // Start resource monitoring
    await this.resourceCollector.start();

    this.emit('monitoringStarted', { testId });
  }

  public async stopMonitoring(testId: string): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Stop resource monitoring
    await this.resourceCollector.stop();

    // Process final metrics
    await this.processBufferedMetrics(testId);

    this.emit('monitoringStopped', { testId });
  }

  public recordMetric(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);

    // Check thresholds immediately for critical metrics
    this.checkThresholds(metric);

    this.emit('metricRecorded', metric);
  }

  public getMetrics(testId: string, category?: string): PerformanceMetric[] {
    const testMetrics = this.metrics.get(testId) || [];
    
    if (category) {
      return testMetrics.filter(metric => metric.category === category);
    }
    
    return testMetrics;
  }

  public getCurrentSystemMetrics(): SystemResourceMetrics {
    return this.resourceCollector.getCurrentMetrics();
  }

  public getApplicationMetrics(testId: string): ApplicationMetrics {
    const metrics = this.getMetrics(testId);
    return this.calculateApplicationMetrics(metrics);
  }

  public getActiveAlerts(testId?: string): PerformanceAlert[] {
    const allAlerts = Array.from(this.alerts.values());
    
    if (testId) {
      return allAlerts.filter(alert => alert.testId === testId && !alert.resolved);
    }
    
    return allAlerts.filter(alert => !alert.resolved);
  }

  public async generateReport(testId: string): Promise<PerformanceReport> {
    const metrics = this.getMetrics(testId);
    const systemMetrics = this.getCurrentSystemMetrics();
    const appMetrics = this.getApplicationMetrics(testId);
    const alerts = this.getActiveAlerts(testId);

    // Calculate performance scores
    const summary = this.calculatePerformanceSummary(appMetrics, systemMetrics);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(appMetrics, systemMetrics, alerts);
    
    // Analyze trends
    const trends = await this.trendAnalyzer.analyzeTrends(metrics);

    return {
      testId,
      generatedAt: new Date(),
      duration: this.calculateTestDuration(testId),
      summary,
      detailedMetrics: {
        systemResources: systemMetrics,
        applicationMetrics: appMetrics,
        customMetrics: metrics.filter(m => m.category === 'custom'),
        timeSeriesData: this.generateTimeSeriesData(metrics)
      },
      alerts,
      recommendations,
      trends
    };
  }

  private async collectMetrics(testId: string): Promise<void> {
    try {
      // Collect system resource metrics
      const systemMetrics = await this.resourceCollector.collect();
      
      // Convert system metrics to performance metrics
      const performanceMetrics = this.convertSystemMetrics(systemMetrics, testId);
      
      // Add to buffer
      this.metricsBuffer.push(...performanceMetrics);
      
      // Check for anomalies
      const anomalies = await this.anomalyDetector.detectAnomalies(performanceMetrics);
      
      // Generate alerts for anomalies
      for (const anomaly of anomalies) {
        await this.generateAnomalyAlert(anomaly, testId);
      }
      
    } catch (error) {
      this.emit('metricsCollectionError', { testId, error });
    }
  }

  private async processBufferedMetrics(testId: string): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    // Store metrics
    const existingMetrics = this.metrics.get(testId) || [];
    this.metrics.set(testId, [...existingMetrics, ...this.metricsBuffer]);

    // Clear buffer
    this.metricsBuffer = [];
  }

  private checkThresholds(metric: PerformanceMetric): void {
    let thresholdExceeded = false;
    let thresholdValue = 0;

    switch (metric.category) {
      case 'response_time':
        if (metric.value > this.thresholds.averageResponseTime) {
          thresholdExceeded = true;
          thresholdValue = this.thresholds.averageResponseTime;
        }
        break;
      case 'error_rate':
        if (metric.value > this.thresholds.errorRate) {
          thresholdExceeded = true;
          thresholdValue = this.thresholds.errorRate;
        }
        break;
      case 'throughput':
        if (metric.value < this.thresholds.throughput) {
          thresholdExceeded = true;
          thresholdValue = this.thresholds.throughput;
        }
        break;
      case 'resource_usage':
        if (metric.name === 'cpu_usage' && metric.value > this.thresholds.cpuUsage) {
          thresholdExceeded = true;
          thresholdValue = this.thresholds.cpuUsage;
        } else if (metric.name === 'memory_usage' && metric.value > this.thresholds.memoryUsage) {
          thresholdExceeded = true;
          thresholdValue = this.thresholds.memoryUsage;
        }
        break;
    }

    if (thresholdExceeded) {
      this.generateThresholdAlert(metric, thresholdValue);
    }
  }

  private generateThresholdAlert(metric: PerformanceMetric, thresholdValue: number): void {
    const alert: PerformanceAlert = {
      id: `threshold-${metric.id}-${Date.now()}`,
      type: 'threshold_exceeded',
      severity: this.calculateAlertSeverity(metric.value, thresholdValue),
      metric: metric.name,
      currentValue: metric.value,
      thresholdValue,
      message: `${metric.name} exceeded threshold: ${metric.value}${metric.unit} > ${thresholdValue}${metric.unit}`,
      timestamp: new Date(),
      testId: metric.tags.testId,
      resolved: false,
      actions: this.generateAlertActions(metric, thresholdValue)
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);

    // Execute automatic actions if configured
    this.executeAlertActions(alert);
  }

  private async generateAnomalyAlert(anomaly: any, testId: string): Promise<void> {
    const alert: PerformanceAlert = {
      id: `anomaly-${testId}-${Date.now()}`,
      type: 'anomaly_detected',
      severity: 'medium',
      metric: anomaly.metric,
      currentValue: anomaly.value,
      thresholdValue: anomaly.expectedValue,
      message: `Anomaly detected in ${anomaly.metric}: ${anomaly.description}`,
      timestamp: new Date(),
      testId,
      resolved: false,
      actions: []
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);
  }

  private calculateAlertSeverity(currentValue: number, thresholdValue: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = currentValue / thresholdValue;
    
    if (ratio >= 2.0) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  private generateAlertActions(metric: PerformanceMetric, thresholdValue: number): AlertAction[] {
    const actions: AlertAction[] = [];

    // Add common actions based on metric type
    if (metric.category === 'resource_usage') {
      if (metric.name === 'cpu_usage') {
        actions.push({
          type: 'scale_up',
          description: 'Scale up CPU resources',
          executed: false
        });
      } else if (metric.name === 'memory_usage') {
        actions.push({
          type: 'scale_up',
          description: 'Scale up memory resources',
          executed: false
        });
      }
    }

    actions.push({
      type: 'notify_admin',
      description: 'Notify system administrator',
      executed: false
    });

    return actions;
  }

  private async executeAlertActions(alert: PerformanceAlert): Promise<void> {
    for (const action of alert.actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        this.emit('actionExecutionError', { alert, action, error });
      }
    }
  }

  private async executeAction(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    switch (action.type) {
      case 'notify_admin':
        // Implementation would send notification
        action.executed = true;
        action.executedAt = new Date();
        action.result = 'Notification sent successfully';
        break;
      case 'scale_up':
        // Implementation would trigger scaling
        action.executed = true;
        action.executedAt = new Date();
        action.result = 'Scaling initiated';
        break;
      case 'stop_test':
        // Implementation would stop the test
        this.emit('stopTestRequested', { testId: alert.testId, reason: alert.message });
        action.executed = true;
        action.executedAt = new Date();
        action.result = 'Test stop requested';
        break;
    }
  }

  private convertSystemMetrics(systemMetrics: any, testId: string): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = [];
    const timestamp = new Date();
    const tags = { testId };

    // CPU metrics
    metrics.push({
      id: `cpu-${Date.now()}`,
      name: 'cpu_usage',
      value: systemMetrics.cpu?.usage || 0,
      unit: '%',
      timestamp,
      category: 'resource_usage',
      tags
    });

    // Memory metrics
    metrics.push({
      id: `memory-${Date.now()}`,
      name: 'memory_usage',
      value: systemMetrics.memory?.usage || 0,
      unit: '%',
      timestamp,
      category: 'resource_usage',
      tags
    });

    // Network metrics
    metrics.push({
      id: `network-in-${Date.now()}`,
      name: 'network_bytes_in',
      value: systemMetrics.network?.bytesIn || 0,
      unit: 'bytes',
      timestamp,
      category: 'resource_usage',
      tags
    });

    return metrics;
  }

  private calculateApplicationMetrics(metrics: PerformanceMetric[]): ApplicationMetrics {
    const responseTimeMetrics = metrics.filter(m => m.category === 'response_time');
    const throughputMetrics = metrics.filter(m => m.category === 'throughput');
    const errorMetrics = metrics.filter(m => m.category === 'error_rate');

    return {
      responseTime: this.calculateResponseTimeStats(responseTimeMetrics),
      throughput: this.calculateThroughputStats(throughputMetrics),
      errorRate: this.calculateErrorRateStats(errorMetrics),
      concurrency: this.calculateConcurrencyStats(metrics)
    };
  }

  private calculateResponseTimeStats(metrics: PerformanceMetric[]): ApplicationMetrics['responseTime'] {
    if (metrics.length === 0) {
      return { average: 0, median: 0, p95: 0, p99: 0, max: 0, min: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    
    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: this.calculatePercentile(values, 50),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99),
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }

  private calculateThroughputStats(metrics: PerformanceMetric[]): ApplicationMetrics['throughput'] {
    // Implementation would calculate throughput statistics
    return {
      requestsPerSecond: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
  }

  private calculateErrorRateStats(metrics: PerformanceMetric[]): ApplicationMetrics['errorRate'] {
    // Implementation would calculate error rate statistics
    return {
      percentage: 0,
      totalErrors: 0,
      errorsByType: {}
    };
  }

  private calculateConcurrencyStats(metrics: PerformanceMetric[]): ApplicationMetrics['concurrency'] {
    // Implementation would calculate concurrency statistics
    return {
      activeUsers: 0,
      maxUsers: 0,
      averageUsers: 0
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private calculatePerformanceSummary(appMetrics: ApplicationMetrics, systemMetrics: SystemResourceMetrics): PerformanceSummary {
    // Calculate individual scores (0-100)
    const responseTimeScore = this.calculateResponseTimeScore(appMetrics.responseTime);
    const throughputScore = this.calculateThroughputScore(appMetrics.throughput);
    const reliabilityScore = this.calculateReliabilityScore(appMetrics.errorRate);
    const resourceEfficiencyScore = this.calculateResourceEfficiencyScore(systemMetrics);

    // Calculate overall score
    const overallScore = (responseTimeScore + throughputScore + reliabilityScore + resourceEfficiencyScore) / 4;

    return {
      overallScore: Math.round(overallScore),
      responseTimeScore: Math.round(responseTimeScore),
      throughputScore: Math.round(throughputScore),
      reliabilityScore: Math.round(reliabilityScore),
      resourceEfficiencyScore: Math.round(resourceEfficiencyScore),
      keyFindings: this.generateKeyFindings(appMetrics, systemMetrics)
    };
  }

  private calculateResponseTimeScore(responseTime: ApplicationMetrics['responseTime']): number {
    // Score based on average response time (lower is better)
    if (responseTime.average <= 100) return 100;
    if (responseTime.average <= 500) return 80;
    if (responseTime.average <= 1000) return 60;
    if (responseTime.average <= 2000) return 40;
    return 20;
  }

  private calculateThroughputScore(throughput: ApplicationMetrics['throughput']): number {
    // Score based on requests per second (higher is better)
    if (throughput.requestsPerSecond >= 1000) return 100;
    if (throughput.requestsPerSecond >= 500) return 80;
    if (throughput.requestsPerSecond >= 100) return 60;
    if (throughput.requestsPerSecond >= 50) return 40;
    return 20;
  }

  private calculateReliabilityScore(errorRate: ApplicationMetrics['errorRate']): number {
    // Score based on error rate (lower is better)
    if (errorRate.percentage <= 0.1) return 100;
    if (errorRate.percentage <= 1) return 80;
    if (errorRate.percentage <= 5) return 60;
    if (errorRate.percentage <= 10) return 40;
    return 20;
  }

  private calculateResourceEfficiencyScore(systemMetrics: SystemResourceMetrics): number {
    // Score based on resource utilization (balanced is better)
    const cpuScore = systemMetrics.cpu.usage <= 70 ? 100 : Math.max(0, 100 - (systemMetrics.cpu.usage - 70) * 2);
    const memoryScore = systemMetrics.memory.usage <= 80 ? 100 : Math.max(0, 100 - (systemMetrics.memory.usage - 80) * 2);
    
    return (cpuScore + memoryScore) / 2;
  }

  private generateKeyFindings(appMetrics: ApplicationMetrics, systemMetrics: SystemResourceMetrics): string[] {
    const findings: string[] = [];

    if (appMetrics.responseTime.average > 1000) {
      findings.push('High average response time detected');
    }

    if (appMetrics.errorRate.percentage > 5) {
      findings.push('High error rate observed');
    }

    if (systemMetrics.cpu.usage > 80) {
      findings.push('High CPU utilization detected');
    }

    if (systemMetrics.memory.usage > 90) {
      findings.push('High memory usage detected');
    }

    if (findings.length === 0) {
      findings.push('System performance within acceptable ranges');
    }

    return findings;
  }

  private async generateRecommendations(
    appMetrics: ApplicationMetrics,
    systemMetrics: SystemResourceMetrics,
    alerts: PerformanceAlert[]
  ): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = [];

    // Response time recommendations
    if (appMetrics.responseTime.average > 1000) {
      recommendations.push({
        id: 'response-time-optimization',
        category: 'performance',
        priority: 'high',
        title: 'Optimize Response Time',
        description: 'Average response time is above acceptable threshold',
        impact: 'Improved user experience and system efficiency',
        effort: 'medium',
        implementation: [
          'Implement caching strategies',
          'Optimize database queries',
          'Consider CDN implementation',
          'Review and optimize critical code paths'
        ],
        estimatedImprovement: '30-50% reduction in response time'
      });
    }

    // Resource utilization recommendations
    if (systemMetrics.cpu.usage > 80) {
      recommendations.push({
        id: 'cpu-optimization',
        category: 'scalability',
        priority: 'high',
        title: 'Address High CPU Usage',
        description: 'CPU utilization is consistently high',
        impact: 'Improved system stability and performance',
        effort: 'medium',
        implementation: [
          'Scale up CPU resources',
          'Optimize CPU-intensive operations',
          'Implement load balancing',
          'Consider horizontal scaling'
        ],
        estimatedImprovement: '20-40% reduction in CPU usage'
      });
    }

    return recommendations;
  }

  private generateTimeSeriesData(metrics: PerformanceMetric[]): DetailedMetrics['timeSeriesData'] {
    return {
      responseTime: this.extractTimeSeriesData(metrics, 'response_time'),
      throughput: this.extractTimeSeriesData(metrics, 'throughput'),
      errorRate: this.extractTimeSeriesData(metrics, 'error_rate'),
      cpuUsage: this.extractTimeSeriesData(metrics, 'resource_usage', 'cpu_usage'),
      memoryUsage: this.extractTimeSeriesData(metrics, 'resource_usage', 'memory_usage')
    };
  }

  private extractTimeSeriesData(
    metrics: PerformanceMetric[],
    category: string,
    name?: string
  ): TimeSeriesPoint[] {
    return metrics
      .filter(m => m.category === category && (!name || m.name === name))
      .map(m => ({
        timestamp: m.timestamp,
        value: m.value
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateTestDuration(testId: string): number {
    const metrics = this.getMetrics(testId);
    if (metrics.length === 0) return 0;

    const timestamps = metrics.map(m => m.timestamp.getTime());
    return Math.max(...timestamps) - Math.min(...timestamps);
  }
}

// Supporting classes (simplified implementations)
class ResourceCollector {
  private isCollecting = false;

  public async start(): Promise<void> {
    this.isCollecting = true;
  }

  public async stop(): Promise<void> {
    this.isCollecting = false;
  }

  public async collect(): Promise<any> {
    // Implementation would collect actual system metrics
    return {
      cpu: { usage: Math.random() * 100 },
      memory: { usage: Math.random() * 100 },
      network: { bytesIn: Math.random() * 1000000, bytesOut: Math.random() * 1000000 }
    };
  }

  public getCurrentMetrics(): SystemResourceMetrics {
    // Implementation would return current system metrics
    return {
      cpu: { usage: 50, cores: 4, loadAverage: [1.0, 1.2, 1.1] },
      memory: { used: 2048, total: 8192, usage: 25, heap: { used: 512, total: 1024 } },
      network: { bytesIn: 1000000, bytesOut: 500000, packetsIn: 1000, packetsOut: 800, errors: 0 },
      disk: { readBytes: 100000, writeBytes: 50000, readOps: 100, writeOps: 50, usage: 60 },
      database: { activeConnections: 10, maxConnections: 100, queryTime: 50, slowQueries: 2 }
    };
  }
}

class AnomalyDetector {
  public async detectAnomalies(metrics: PerformanceMetric[]): Promise<any[]> {
    // Implementation would use statistical methods or ML to detect anomalies
    return [];
  }
}

class TrendAnalyzer {
  public async analyzeTrends(metrics: PerformanceMetric[]): Promise<TrendAnalysis> {
    // Implementation would analyze trends in the metrics
    return {
      performanceTrend: 'stable',
      trendConfidence: 0.8,
      keyTrends: [],
      seasonalPatterns: []
    };
  }
}