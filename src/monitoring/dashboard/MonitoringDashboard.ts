import { EventEmitter } from 'events';

export interface DashboardMetrics {
  testExecution: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    runningTests: number;
    progress: number;
    estimatedTimeRemaining: number;
  };
  performance: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  systemHealth: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    services: ServiceHealthStatus[];
    uptime: number;
    lastHealthCheck: Date;
  };
  errors: {
    criticalErrors: number;
    warnings: number;
    totalErrors: number;
    recentErrors: ErrorSummary[];
  };
}

export interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
}

export interface ErrorSummary {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component: string;
  timestamp: Date;
  count: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownPeriod: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class MonitoringDashboard extends EventEmitter {
  private metrics: DashboardMetrics;
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlertRules();
  }

  private initializeMetrics(): DashboardMetrics {
    return {
      testExecution: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        runningTests: 0,
        progress: 0,
        estimatedTimeRemaining: 0
      },
      performance: {
        averageResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      systemHealth: {
        overallStatus: 'healthy',
        services: [],
        uptime: 0,
        lastHealthCheck: new Date()
      },
      errors: {
        criticalErrors: 0,
        warnings: 0,
        totalErrors: 0,
        recentErrors: []
      }
    };
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'errorRate > threshold',
        threshold: 5, // 5% error rate
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000 // 5 minutes
      },
      {
        id: 'critical-error-rate',
        name: 'Critical Error Rate',
        condition: 'errorRate > threshold',
        threshold: 10, // 10% error rate
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 300000
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: 'averageResponseTime > threshold',
        threshold: 5000, // 5 seconds
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000
      },
      {
        id: 'service-down',
        name: 'Service Down',
        condition: 'serviceStatus == down',
        threshold: 1,
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 60000 // 1 minute
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: 'memoryUsage > threshold',
        threshold: 85, // 85% memory usage
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000
      }
    ];
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
      this.emit('metricsUpdated', this.metrics);
    }, 5000); // Update every 5 seconds

    this.emit('dashboardStarted');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.emit('dashboardStopped');
  }

  public updateTestProgress(progress: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    runningTests: number;
  }): void {
    this.metrics.testExecution = {
      ...progress,
      progress: (progress.passedTests + progress.failedTests + progress.skippedTests) / progress.totalTests * 100,
      estimatedTimeRemaining: this.calculateEstimatedTime(progress)
    };

    this.emit('testProgressUpdated', this.metrics.testExecution);
  }

  private calculateEstimatedTime(progress: any): number {
    const completedTests = progress.passedTests + progress.failedTests + progress.skippedTests;
    const remainingTests = progress.totalTests - completedTests;
    
    if (completedTests === 0) {
      return 0;
    }

    // Estimate based on average time per test (simplified calculation)
    const averageTimePerTest = 30000; // 30 seconds per test (rough estimate)
    return remainingTests * averageTimePerTest;
  }

  public updatePerformanceMetrics(performance: Partial<DashboardMetrics['performance']>): void {
    this.metrics.performance = {
      ...this.metrics.performance,
      ...performance
    };

    this.emit('performanceUpdated', this.metrics.performance);
  }

  public updateSystemHealth(health: Partial<DashboardMetrics['systemHealth']>): void {
    this.metrics.systemHealth = {
      ...this.metrics.systemHealth,
      ...health,
      lastHealthCheck: new Date()
    };

    this.emit('systemHealthUpdated', this.metrics.systemHealth);
  }

  public addError(error: ErrorSummary): void {
    this.metrics.errors.recentErrors.unshift(error);
    
    // Keep only the last 50 errors
    if (this.metrics.errors.recentErrors.length > 50) {
      this.metrics.errors.recentErrors = this.metrics.errors.recentErrors.slice(0, 50);
    }

    // Update error counts
    this.metrics.errors.totalErrors++;
    if (error.severity === 'critical') {
      this.metrics.errors.criticalErrors++;
    } else if (error.severity === 'medium' || error.severity === 'high') {
      this.metrics.errors.warnings++;
    }

    this.emit('errorAdded', error);
  }

  private updateMetrics(): void {
    // Update system metrics (CPU, memory, etc.)
    this.updateSystemMetrics();
    
    // Update service health
    this.updateServiceHealth();
    
    // Calculate overall system status
    this.calculateOverallStatus();
  }

  private updateSystemMetrics(): void {
    // In a real implementation, these would come from system monitoring
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    this.metrics.performance.memoryUsage = memoryPercent;
    this.metrics.performance.cpuUsage = Math.random() * 100; // Placeholder
  }

  private updateServiceHealth(): void {
    // Update uptime
    this.metrics.systemHealth.uptime = process.uptime();
    
    // In a real implementation, this would check actual services
    const services: ServiceHealthStatus[] = [
      {
        name: 'Firebase',
        status: 'healthy',
        responseTime: Math.random() * 1000,
        lastCheck: new Date(),
        errorCount: 0
      },
      {
        name: 'WebSocket Server',
        status: 'healthy',
        responseTime: Math.random() * 500,
        lastCheck: new Date(),
        errorCount: 0
      },
      {
        name: 'Notification Service',
        status: 'healthy',
        responseTime: Math.random() * 800,
        lastCheck: new Date(),
        errorCount: 0
      }
    ];

    this.metrics.systemHealth.services = services;
  }

  private calculateOverallStatus(): void {
    const { services } = this.metrics.systemHealth;
    const { errorRate, memoryUsage, cpuUsage } = this.metrics.performance;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check service health
    const downServices = services.filter(s => s.status === 'down');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (downServices.length > 0) {
      status = 'critical';
    } else if (degradedServices.length > 0 || errorRate > 5 || memoryUsage > 85 || cpuUsage > 90) {
      status = 'warning';
    }

    this.metrics.systemHealth.overallStatus = status;
  }

  private checkAlerts(): void {
    const now = new Date();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered && (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldownPeriod) {
        continue;
      }

      let shouldTrigger = false;

      switch (rule.id) {
        case 'high-error-rate':
        case 'critical-error-rate':
          shouldTrigger = this.metrics.performance.errorRate > rule.threshold;
          break;
        case 'high-response-time':
          shouldTrigger = this.metrics.performance.averageResponseTime > rule.threshold;
          break;
        case 'service-down':
          shouldTrigger = this.metrics.systemHealth.services.some(s => s.status === 'down');
          break;
        case 'high-memory-usage':
          shouldTrigger = this.metrics.performance.memoryUsage > rule.threshold;
          break;
      }

      if (shouldTrigger) {
        this.triggerAlert(rule);
      }
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: this.generateAlertMessage(rule),
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.unshift(alert);
    rule.lastTriggered = new Date();

    // Keep only the last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    this.emit('alertTriggered', alert);
  }

  private generateAlertMessage(rule: AlertRule): string {
    switch (rule.id) {
      case 'high-error-rate':
        return `Error rate is ${this.metrics.performance.errorRate.toFixed(2)}%, exceeding threshold of ${rule.threshold}%`;
      case 'critical-error-rate':
        return `CRITICAL: Error rate is ${this.metrics.performance.errorRate.toFixed(2)}%, exceeding critical threshold of ${rule.threshold}%`;
      case 'high-response-time':
        return `Average response time is ${this.metrics.performance.averageResponseTime}ms, exceeding threshold of ${rule.threshold}ms`;
      case 'service-down':
        const downServices = this.metrics.systemHealth.services.filter(s => s.status === 'down');
        return `Services are down: ${downServices.map(s => s.name).join(', ')}`;
      case 'high-memory-usage':
        return `Memory usage is ${this.metrics.performance.memoryUsage.toFixed(2)}%, exceeding threshold of ${rule.threshold}%`;
      default:
        return `Alert triggered for rule: ${rule.name}`;
    }
  }

  public getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
  }

  public addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.alertRules.push(newRule);
    this.emit('alertRuleAdded', newRule);
    
    return newRule.id;
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.emit('alertRuleUpdated', rule);
    }
  }

  public removeAlertRule(ruleId: string): void {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      const removedRule = this.alertRules.splice(index, 1)[0];
      this.emit('alertRuleRemoved', removedRule);
    }
  }

  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }
}