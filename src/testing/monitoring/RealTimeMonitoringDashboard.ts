/**
 * Real-Time Monitoring Dashboard
 * 
 * This module provides comprehensive real-time monitoring capabilities for the
 * testing agent, including test execution progress, error tracking, performance
 * metrics visualization, and system health indicators.
 * 
 * Requirements: 10.1, 10.5
 */

import { EventEmitter } from 'events';
import { TestResult, ErrorEntry } from '../core/types';

export interface MonitoringMetrics {
  testExecution: TestExecutionMetrics;
  errorTracking: ErrorTrackingMetrics;
  performance: PerformanceMetrics;
  systemHealth: SystemHealthMetrics;
  timestamp: Date;
}

export interface TestExecutionMetrics {
  totalTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  skippedTests: number;
  currentTest?: string;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // milliseconds
  averageTestDuration: number; // milliseconds
  testsPerSecond: number;
}

export interface ErrorTrackingMetrics {
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  errorsByCategory: Record<string, number>;
  recentErrors: ErrorEntry[];
  errorTrend: 'increasing' | 'decreasing' | 'stable';
  errorRate: number; // errors per minute
}

export interface PerformanceMetrics {
  responseTime: {
    current: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  throughput: {
    current: number; // requests per second
    average: number;
    peak: number;
  };
  resourceUsage: {
    cpu: number; // percentage
    memory: number; // MB
    memoryPercentage: number;
    diskIO: number; // MB/s
    networkIO: number; // MB/s
  };
  concurrency: {
    activeTests: number;
    maxConcurrency: number;
    queuedTests: number;
  };
}export
 interface SystemHealthMetrics {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  healthScore: number; // 0-100
  components: {
    database: ComponentHealth;
    webSocket: ComponentHealth;
    api: ComponentHealth;
    fileSystem: ComponentHealth;
    network: ComponentHealth;
  };
  alerts: Alert[];
  uptime: number; // milliseconds
  lastHealthCheck: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  details?: string;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardConfig {
  updateInterval: number; // milliseconds
  maxDataPoints: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  enableAlerts: boolean;
  enableNotifications: boolean;
}

export class RealTimeMonitoringDashboard extends EventEmitter {
  private metrics: MonitoringMetrics;
  private config: DashboardConfig;
  private updateTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private startTime: Date;
  private testHistory: TestResult[] = [];
  private errorHistory: ErrorEntry[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];

  constructor(config?: Partial<DashboardConfig>) {
    super();
    
    this.config = {
      updateInterval: 1000, // 1 second
      maxDataPoints: 100,
      alertThresholds: {
        errorRate: 10, // errors per minute
        responseTime: 5000, // 5 seconds
        memoryUsage: 80, // 80%
        cpuUsage: 90 // 90%
      },
      enableAlerts: true,
      enableNotifications: true,
      ...config
    };

    this.startTime = new Date();
    this.initializeMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      testExecution: {
        totalTests: 0,
        completedTests: 0,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        skippedTests: 0,
        progress: 0,
        estimatedTimeRemaining: 0,
        averageTestDuration: 0,
        testsPerSecond: 0
      },
      errorTracking: {
        totalErrors: 0,
        criticalErrors: 0,
        highSeverityErrors: 0,
        mediumSeverityErrors: 0,
        lowSeverityErrors: 0,
        errorsByCategory: {},
        recentErrors: [],
        errorTrend: 'stable',
        errorRate: 0
      },
      performance: {
        responseTime: {
          current: 0,
          average: 0,
          min: 0,
          max: 0,
          p95: 0,
          p99: 0
        },
        throughput: {
          current: 0,
          average: 0,
          peak: 0
        },
        resourceUsage: {
          cpu: 0,
          memory: 0,
          memoryPercentage: 0,
          diskIO: 0,
          networkIO: 0
        },
        concurrency: {
          activeTests: 0,
          maxConcurrency: 0,
          queuedTests: 0
        }
      },
      systemHealth: {
        overallHealth: 'healthy',
        healthScore: 100,
        components: {
          database: { status: 'healthy', responseTime: 0, errorRate: 0, lastCheck: new Date() },
          webSocket: { status: 'healthy', responseTime: 0, errorRate: 0, lastCheck: new Date() },
          api: { status: 'healthy', responseTime: 0, errorRate: 0, lastCheck: new Date() },
          fileSystem: { status: 'healthy', responseTime: 0, errorRate: 0, lastCheck: new Date() },
          network: { status: 'healthy', responseTime: 0, errorRate: 0, lastCheck: new Date() }
        },
        alerts: [],
        uptime: 0,
        lastHealthCheck: new Date()
      },
      timestamp: new Date()
    };
  }  /
**
   * Start the monitoring dashboard
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ Monitoring dashboard is already running');
      return;
    }

    console.log('🚀 Starting real-time monitoring dashboard...');
    this.isRunning = true;
    this.startTime = new Date();
    
    // Start periodic updates
    this.updateTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.updateInterval);

    // Emit start event
    this.emit('started', this.metrics);
    
    console.log(`✅ Monitoring dashboard started (Update interval: ${this.config.updateInterval}ms)`);
  }

  /**
   * Stop the monitoring dashboard
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Monitoring dashboard is not running');
      return;
    }

    console.log('🛑 Stopping real-time monitoring dashboard...');
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    // Emit stop event
    this.emit('stopped', this.metrics);
    
    console.log('✅ Monitoring dashboard stopped');
  }

  /**
   * Update test execution progress
   */
  public updateTestExecution(testResult: TestResult, totalTests: number, currentTestIndex: number): void {
    const execution = this.metrics.testExecution;
    
    // Update basic counts
    execution.totalTests = totalTests;
    execution.completedTests = currentTestIndex + 1;
    execution.progress = (execution.completedTests / execution.totalTests) * 100;
    
    // Update status counts
    switch (testResult.status) {
      case 'passed':
        execution.passedTests++;
        break;
      case 'failed':
        execution.failedTests++;
        break;
      case 'error':
        execution.errorTests++;
        break;
      case 'skipped':
        execution.skippedTests++;
        break;
    }

    // Update performance metrics
    this.testHistory.push(testResult);
    if (this.testHistory.length > this.config.maxDataPoints) {
      this.testHistory.shift();
    }

    // Calculate average test duration
    const durations = this.testHistory.map(t => t.duration);
    execution.averageTestDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Calculate tests per second
    const timeElapsed = (Date.now() - this.startTime.getTime()) / 1000;
    execution.testsPerSecond = execution.completedTests / timeElapsed;

    // Estimate remaining time
    const remainingTests = execution.totalTests - execution.completedTests;
    execution.estimatedTimeRemaining = remainingTests * execution.averageTestDuration;

    // Set current test
    execution.currentTest = testResult.name;

    // Emit update event
    this.emit('testExecutionUpdate', execution);
  }

  /**
   * Track error occurrence
   */
  public trackError(error: ErrorEntry): void {
    const tracking = this.metrics.errorTracking;
    
    // Update error counts
    tracking.totalErrors++;
    
    switch (error.severity) {
      case 'critical':
        tracking.criticalErrors++;
        break;
      case 'high':
        tracking.highSeverityErrors++;
        break;
      case 'medium':
        tracking.mediumSeverityErrors++;
        break;
      case 'low':
        tracking.lowSeverityErrors++;
        break;
    }

    // Update category counts
    tracking.errorsByCategory[error.category] = (tracking.errorsByCategory[error.category] || 0) + 1;

    // Add to recent errors
    tracking.recentErrors.unshift(error);
    if (tracking.recentErrors.length > 10) {
      tracking.recentErrors.pop();
    }

    // Add to error history
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.config.maxDataPoints) {
      this.errorHistory.shift();
    }

    // Calculate error rate (errors per minute)
    const timeWindow = 60000; // 1 minute
    const recentErrors = this.errorHistory.filter(e => 
      Date.now() - e.timestamp.getTime() < timeWindow
    );
    tracking.errorRate = recentErrors.length;

    // Determine error trend
    tracking.errorTrend = this.calculateErrorTrend();

    // Create alert if error rate is high
    if (this.config.enableAlerts && tracking.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('critical', 'High Error Rate', 
        `Error rate is ${tracking.errorRate} errors/minute (threshold: ${this.config.alertThresholds.errorRate})`,
        'error_tracking'
      );
    }

    // Emit update event
    this.emit('errorTrackingUpdate', tracking);
  }  /**
   *
 Update performance metrics
   */
  public updatePerformanceMetrics(responseTime: number, throughput: number): void {
    const performance = this.metrics.performance;
    
    // Update response time metrics
    performance.responseTime.current = responseTime;
    
    const responseTimes = this.testHistory.map(t => t.duration);
    if (responseTimes.length > 0) {
      performance.responseTime.average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      performance.responseTime.min = Math.min(...responseTimes);
      performance.responseTime.max = Math.max(...responseTimes);
      performance.responseTime.p95 = this.calculatePercentile(responseTimes, 95);
      performance.responseTime.p99 = this.calculatePercentile(responseTimes, 99);
    }

    // Update throughput metrics
    performance.throughput.current = throughput;
    performance.throughput.peak = Math.max(performance.throughput.peak, throughput);
    
    // Calculate average throughput
    const timeElapsed = (Date.now() - this.startTime.getTime()) / 1000;
    performance.throughput.average = this.metrics.testExecution.completedTests / timeElapsed;

    // Update resource usage
    this.updateResourceUsage();

    // Update concurrency metrics
    performance.concurrency.activeTests = this.metrics.testExecution.totalTests - this.metrics.testExecution.completedTests;
    performance.concurrency.maxConcurrency = Math.max(performance.concurrency.maxConcurrency, performance.concurrency.activeTests);

    // Store performance history
    this.performanceHistory.push({ ...performance });
    if (this.performanceHistory.length > this.config.maxDataPoints) {
      this.performanceHistory.shift();
    }

    // Check performance thresholds
    if (this.config.enableAlerts) {
      if (responseTime > this.config.alertThresholds.responseTime) {
        this.createAlert('warning', 'High Response Time', 
          `Response time is ${responseTime}ms (threshold: ${this.config.alertThresholds.responseTime}ms)`,
          'performance'
        );
      }

      if (performance.resourceUsage.memoryPercentage > this.config.alertThresholds.memoryUsage) {
        this.createAlert('warning', 'High Memory Usage', 
          `Memory usage is ${performance.resourceUsage.memoryPercentage}% (threshold: ${this.config.alertThresholds.memoryUsage}%)`,
          'performance'
        );
      }

      if (performance.resourceUsage.cpu > this.config.alertThresholds.cpuUsage) {
        this.createAlert('critical', 'High CPU Usage', 
          `CPU usage is ${performance.resourceUsage.cpu}% (threshold: ${this.config.alertThresholds.cpuUsage}%)`,
          'performance'
        );
      }
    }

    // Emit update event
    this.emit('performanceUpdate', performance);
  }

  /**
   * Update system health metrics
   */
  public async updateSystemHealth(): Promise<void> {
    const health = this.metrics.systemHealth;
    
    // Update uptime
    health.uptime = Date.now() - this.startTime.getTime();
    health.lastHealthCheck = new Date();

    // Check component health
    await this.checkComponentHealth();

    // Calculate overall health score
    health.healthScore = this.calculateHealthScore();
    
    // Determine overall health status
    health.overallHealth = this.determineOverallHealth(health.healthScore);

    // Update alerts
    health.alerts = this.alerts.filter(alert => !alert.acknowledged);

    // Emit update event
    this.emit('systemHealthUpdate', health);
  }

  /**
   * Create an alert
   */
  private createAlert(type: Alert['type'], title: string, message: string, source: string): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false,
      source,
      severity: type === 'critical' ? 'critical' : type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low'
    };

    this.alerts.unshift(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // Emit alert event
    this.emit('alert', alert);

    console.log(`🚨 Alert created: [${type.toUpperCase()}] ${title} - ${message}`);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Get error history
   */
  public getErrorHistory(): ErrorEntry[] {
    return [...this.errorHistory];
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }  /
**
   * Update metrics periodically
   */
  private updateMetrics(): void {
    if (!this.isRunning) return;

    // Update timestamp
    this.metrics.timestamp = new Date();

    // Update system health
    this.updateSystemHealth();

    // Emit general update event
    this.emit('metricsUpdate', this.metrics);
  }

  /**
   * Calculate error trend
   */
  private calculateErrorTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.errorHistory.length < 10) return 'stable';

    const recentErrors = this.errorHistory.slice(-10);
    const olderErrors = this.errorHistory.slice(-20, -10);

    if (olderErrors.length === 0) return 'stable';

    const recentRate = recentErrors.length;
    const olderRate = olderErrors.length;

    if (recentRate > olderRate * 1.2) return 'increasing';
    if (recentRate < olderRate * 0.8) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Update resource usage
   */
  private updateResourceUsage(): void {
    const memoryUsage = process.memoryUsage();
    const performance = this.metrics.performance;
    
    // Update memory usage
    performance.resourceUsage.memory = Math.round(memoryUsage.heapUsed / 1024 / 1024); // MB
    performance.resourceUsage.memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    // Simulate CPU usage (in a real implementation, this would use actual CPU monitoring)
    performance.resourceUsage.cpu = Math.min(100, Math.max(0, 
      performance.resourceUsage.cpu + (Math.random() - 0.5) * 10
    ));

    // Simulate disk and network I/O
    performance.resourceUsage.diskIO = Math.random() * 10; // MB/s
    performance.resourceUsage.networkIO = Math.random() * 5; // MB/s
  }

  /**
   * Check component health
   */
  private async checkComponentHealth(): Promise<void> {
    const components = this.metrics.systemHealth.components;
    const now = new Date();

    // Check database health
    components.database = await this.checkDatabaseHealth();
    components.database.lastCheck = now;

    // Check WebSocket health
    components.webSocket = await this.checkWebSocketHealth();
    components.webSocket.lastCheck = now;

    // Check API health
    components.api = await this.checkApiHealth();
    components.api.lastCheck = now;

    // Check file system health
    components.fileSystem = await this.checkFileSystemHealth();
    components.fileSystem.lastCheck = now;

    // Check network health
    components.network = await this.checkNetworkHealth();
    components.network.lastCheck = now;
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      
      // Simulate database health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 5; // 0-5% error rate
      
      return {
        status: errorRate > 2 ? 'degraded' : 'healthy',
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: errorRate > 2 ? 'High error rate detected' : 'All connections healthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        details: `Database check failed: ${error}`
      };
    }
  }

  /**
   * Check WebSocket health
   */
  private async checkWebSocketHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      
      // Simulate WebSocket health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 3; // 0-3% error rate
      
      return {
        status: errorRate > 1 ? 'degraded' : 'healthy',
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: errorRate > 1 ? 'Some connection issues' : 'All connections stable'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        details: `WebSocket check failed: ${error}`
      };
    }
  }

  /**
   * Check API health
   */
  private async checkApiHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 2; // 0-2% error rate
      
      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: responseTime > 1000 ? 'High response times' : 'API responding normally'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        details: `API check failed: ${error}`
      };
    }
  }

  /**
   * Check file system health
   */
  private async checkFileSystemHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      
      // Simulate file system health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 1; // 0-1% error rate
      
      return {
        status: 'healthy',
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: 'File system operations normal'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        details: `File system check failed: ${error}`
      };
    }
  }

  /**
   * Check network health
   */
  private async checkNetworkHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      
      // Simulate network health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 2; // 0-2% error rate
      
      return {
        status: errorRate > 1 ? 'degraded' : 'healthy',
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: errorRate > 1 ? 'Network latency detected' : 'Network connectivity good'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        details: `Network check failed: ${error}`
      };
    }
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(): number {
    const components = this.metrics.systemHealth.components;
    const componentScores: number[] = [];

    Object.values(components).forEach(component => {
      let score = 100;
      
      switch (component.status) {
        case 'healthy':
          score = 100;
          break;
        case 'degraded':
          score = 70;
          break;
        case 'unhealthy':
          score = 30;
          break;
        case 'critical':
          score = 0;
          break;
      }
      
      // Adjust score based on error rate
      score -= component.errorRate;
      
      componentScores.push(Math.max(0, score));
    });

    return Math.round(componentScores.reduce((a, b) => a + b, 0) / componentScores.length);
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(healthScore: number): SystemHealthMetrics['overallHealth'] {
    if (healthScore >= 90) return 'healthy';
    if (healthScore >= 70) return 'degraded';
    if (healthScore >= 30) return 'unhealthy';
    return 'critical';
  }

  /**
   * Export metrics to JSON
   */
  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      performanceHistory: this.performanceHistory,
      errorHistory: this.errorHistory,
      alerts: this.alerts,
      config: this.config,
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    console.log('🔄 Resetting monitoring dashboard metrics...');
    
    this.testHistory = [];
    this.errorHistory = [];
    this.performanceHistory = [];
    this.alerts = [];
    this.startTime = new Date();
    
    this.initializeMetrics();
    
    this.emit('reset', this.metrics);
    
    console.log('✅ Monitoring dashboard metrics reset');
  }
}

// Export singleton instance
export const realTimeMonitoringDashboard = new RealTimeMonitoringDashboard();