import { EventEmitter } from 'events';

export interface LoadTestConfiguration {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  testDuration: number; // in milliseconds
  rampUpTime: number; // time to reach max users
  rampDownTime: number; // time to scale down
  maxConcurrentUsers: number;
  requestsPerSecond?: number;
  testScenarios: LoadTestScenario[];
  performanceThresholds: PerformanceThresholds;
  resourceLimits: ResourceLimits;
  monitoringConfig: MonitoringConfiguration;
}

export interface LoadTestScenario {
  id: string;
  name: string;
  weight: number; // percentage of users running this scenario
  steps: LoadTestStep[];
  userProfile: UserProfile;
  thinkTime: {
    min: number;
    max: number;
  };
}

export interface LoadTestStep {
  id: string;
  name: string;
  type: 'http' | 'websocket' | 'database' | 'custom';
  action: string;
  parameters: Record<string, any>;
  expectedResponse?: {
    statusCode?: number;
    responseTime?: number;
    bodyContains?: string[];
  };
  validations: StepValidation[];
}

export interface StepValidation {
  type: 'response_time' | 'status_code' | 'content' | 'custom';
  condition: string;
  expectedValue: any;
  failOnError: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  characteristics: {
    deviceType: 'mobile' | 'desktop' | 'tablet';
    connectionSpeed: 'slow' | 'medium' | 'fast';
    location: string;
    userAgent: string;
  };
  sessionData: Record<string, any>;
}

export interface PerformanceThresholds {
  averageResponseTime: number; // ms
  maxResponseTime: number; // ms
  errorRate: number; // percentage
  throughput: number; // requests per second
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  networkLatency: number; // ms
}

export interface ResourceLimits {
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxNetworkBandwidth: number; // Mbps
  maxDatabaseConnections: number;
  maxFileHandles: number;
}

export interface MonitoringConfiguration {
  metricsInterval: number; // ms
  enableDetailedLogging: boolean;
  captureScreenshots: boolean;
  recordNetworkTraffic: boolean;
  trackResourceUsage: boolean;
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  responseTimeAlert: number; // ms
  errorRateAlert: number; // percentage
  cpuUsageAlert: number; // percentage
  memoryUsageAlert: number; // MB
}

export interface LoadTestResult {
  testId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  summary: TestSummary;
  metrics: PerformanceMetrics;
  errors: ErrorSummary[];
  userMetrics: UserMetrics[];
  resourceUsage: ResourceUsageMetrics;
  alerts: Alert[];
}

export interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
  concurrentUsers: {
    max: number;
    average: number;
  };
}

export interface PerformanceMetrics {
  responseTimeDistribution: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughputOverTime: TimeSeriesData[];
  responseTimeOverTime: TimeSeriesData[];
  errorRateOverTime: TimeSeriesData[];
  concurrentUsersOverTime: TimeSeriesData[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface ErrorSummary {
  type: string;
  count: number;
  percentage: number;
  examples: string[];
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface UserMetrics {
  userId: string;
  scenarioId: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  errors: number;
  sessionDuration: number;
}

export interface ResourceUsageMetrics {
  cpu: {
    average: number;
    max: number;
    overTime: TimeSeriesData[];
  };
  memory: {
    average: number;
    max: number;
    overTime: TimeSeriesData[];
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    bandwidth: TimeSeriesData[];
  };
  database: {
    connections: number;
    queryTime: number;
    overTime: TimeSeriesData[];
  };
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  details: any;
}

export interface VirtualUser {
  id: string;
  scenarioId: string;
  profile: UserProfile;
  currentStep: number;
  startTime: Date;
  lastActionTime: Date;
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  isActive: boolean;
  sessionData: Map<string, any>;
}

export class LoadTestingEngine extends EventEmitter {
  private activeTests: Map<string, LoadTestExecution> = new Map();
  private virtualUsers: Map<string, VirtualUser> = new Map();
  private metricsCollector: MetricsCollector;
  private resourceMonitor: ResourceMonitor;
  private alertManager: AlertManager;

  constructor() {
    super();
    this.metricsCollector = new MetricsCollector();
    this.resourceMonitor = new ResourceMonitor();
    this.alertManager = new AlertManager();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.resourceMonitor.on('thresholdExceeded', (alert: Alert) => {
      this.alertManager.triggerAlert(alert);
      this.emit('alert', alert);
    });

    this.alertManager.on('criticalAlert', (alert: Alert) => {
      this.emit('criticalAlert', alert);
    });
  }

  public async startLoadTest(config: LoadTestConfiguration): Promise<string> {
    const testId = this.generateTestId();
    
    try {
      // Validate configuration
      this.validateConfiguration(config);
      
      // Create test execution
      const execution = new LoadTestExecution(testId, config, this.metricsCollector, this.resourceMonitor);
      this.activeTests.set(testId, execution);
      
      // Start monitoring
      await this.resourceMonitor.startMonitoring(config.monitoringConfig);
      
      // Initialize virtual users
      await this.initializeVirtualUsers(config);
      
      // Start test execution
      execution.start();
      
      this.emit('testStarted', { testId, config });
      
      return testId;
      
    } catch (error) {
      this.emit('testError', { testId, error });
      throw error;
    }
  }

  public async stopLoadTest(testId: string): Promise<LoadTestResult> {
    const execution = this.activeTests.get(testId);
    if (!execution) {
      throw new Error(`Load test with ID ${testId} not found`);
    }

    try {
      // Stop test execution
      await execution.stop();
      
      // Stop monitoring
      await this.resourceMonitor.stopMonitoring();
      
      // Cleanup virtual users
      await this.cleanupVirtualUsers(testId);
      
      // Generate results
      const result = await execution.getResults();
      
      // Cleanup
      this.activeTests.delete(testId);
      
      this.emit('testCompleted', { testId, result });
      
      return result;
      
    } catch (error) {
      this.emit('testError', { testId, error });
      throw error;
    }
  }

  public getTestStatus(testId: string): LoadTestStatus | null {
    const execution = this.activeTests.get(testId);
    return execution ? execution.getStatus() : null;
  }

  public getAllActiveTests(): LoadTestStatus[] {
    return Array.from(this.activeTests.values()).map(execution => execution.getStatus());
  }

  private validateConfiguration(config: LoadTestConfiguration): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Test name is required');
    }

    if (!config.targetUrl || !this.isValidUrl(config.targetUrl)) {
      throw new Error('Valid target URL is required');
    }

    if (config.maxConcurrentUsers <= 0) {
      throw new Error('Max concurrent users must be greater than 0');
    }

    if (config.testDuration <= 0) {
      throw new Error('Test duration must be greater than 0');
    }

    if (config.testScenarios.length === 0) {
      throw new Error('At least one test scenario is required');
    }

    // Validate scenario weights sum to 100
    const totalWeight = config.testScenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Scenario weights must sum to 100%');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async initializeVirtualUsers(config: LoadTestConfiguration): Promise<void> {
    const usersPerScenario = this.calculateUsersPerScenario(config);
    
    for (const scenario of config.testScenarios) {
      const userCount = usersPerScenario.get(scenario.id) || 0;
      
      for (let i = 0; i < userCount; i++) {
        const user: VirtualUser = {
          id: this.generateUserId(),
          scenarioId: scenario.id,
          profile: scenario.userProfile,
          currentStep: 0,
          startTime: new Date(),
          lastActionTime: new Date(),
          requestCount: 0,
          errorCount: 0,
          responseTimeSum: 0,
          isActive: false,
          sessionData: new Map()
        };
        
        this.virtualUsers.set(user.id, user);
      }
    }
  }

  private calculateUsersPerScenario(config: LoadTestConfiguration): Map<string, number> {
    const usersPerScenario = new Map<string, number>();
    
    for (const scenario of config.testScenarios) {
      const userCount = Math.floor((scenario.weight / 100) * config.maxConcurrentUsers);
      usersPerScenario.set(scenario.id, userCount);
    }
    
    return usersPerScenario;
  }

  private async cleanupVirtualUsers(testId: string): Promise<void> {
    // Remove virtual users associated with this test
    const usersToRemove = Array.from(this.virtualUsers.keys());
    for (const userId of usersToRemove) {
      this.virtualUsers.delete(userId);
    }
  }

  private generateTestId(): string {
    return `load-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getPerformanceMetrics(testId: string): PerformanceMetrics | null {
    const execution = this.activeTests.get(testId);
    return execution ? execution.getPerformanceMetrics() : null;
  }

  public getResourceUsage(testId: string): ResourceUsageMetrics | null {
    const execution = this.activeTests.get(testId);
    return execution ? execution.getResourceUsage() : null;
  }

  public getActiveAlerts(testId: string): Alert[] {
    return this.alertManager.getActiveAlerts(testId);
  }

  public async pauseTest(testId: string): Promise<void> {
    const execution = this.activeTests.get(testId);
    if (execution) {
      await execution.pause();
      this.emit('testPaused', { testId });
    }
  }

  public async resumeTest(testId: string): Promise<void> {
    const execution = this.activeTests.get(testId);
    if (execution) {
      await execution.resume();
      this.emit('testResumed', { testId });
    }
  }

  public async adjustLoad(testId: string, newUserCount: number): Promise<void> {
    const execution = this.activeTests.get(testId);
    if (execution) {
      await execution.adjustLoad(newUserCount);
      this.emit('loadAdjusted', { testId, newUserCount });
    }
  }
}

export interface LoadTestStatus {
  testId: string;
  name: string;
  status: 'initializing' | 'ramping_up' | 'running' | 'ramping_down' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  elapsedTime: number;
  progress: {
    percentage: number;
    currentUsers: number;
    targetUsers: number;
    completedRequests: number;
    failedRequests: number;
  };
  currentMetrics: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

class LoadTestExecution {
  private testId: string;
  private config: LoadTestConfiguration;
  private metricsCollector: MetricsCollector;
  private resourceMonitor: ResourceMonitor;
  private status: LoadTestStatus['status'] = 'initializing';
  private startTime: Date = new Date();
  private virtualUsers: VirtualUser[] = [];
  private activeUserCount = 0;
  private completedRequests = 0;
  private failedRequests = 0;
  private responseTimeSum = 0;
  private isPaused = false;

  constructor(
    testId: string,
    config: LoadTestConfiguration,
    metricsCollector: MetricsCollector,
    resourceMonitor: ResourceMonitor
  ) {
    this.testId = testId;
    this.config = config;
    this.metricsCollector = metricsCollector;
    this.resourceMonitor = resourceMonitor;
  }

  public start(): void {
    this.status = 'ramping_up';
    this.startRampUp();
  }

  public async stop(): Promise<void> {
    this.status = 'ramping_down';
    await this.stopAllUsers();
    this.status = 'completed';
  }

  public async pause(): Promise<void> {
    this.isPaused = true;
    this.status = 'paused';
  }

  public async resume(): Promise<void> {
    this.isPaused = false;
    this.status = 'running';
  }

  public async adjustLoad(newUserCount: number): Promise<void> {
    // Implementation for dynamic load adjustment
    const currentCount = this.activeUserCount;
    if (newUserCount > currentCount) {
      await this.addUsers(newUserCount - currentCount);
    } else if (newUserCount < currentCount) {
      await this.removeUsers(currentCount - newUserCount);
    }
  }

  public getStatus(): LoadTestStatus {
    const elapsedTime = Date.now() - this.startTime.getTime();
    const progress = this.calculateProgress();

    return {
      testId: this.testId,
      name: this.config.name,
      status: this.status,
      startTime: this.startTime,
      elapsedTime,
      progress: {
        percentage: progress,
        currentUsers: this.activeUserCount,
        targetUsers: this.config.maxConcurrentUsers,
        completedRequests: this.completedRequests,
        failedRequests: this.failedRequests
      },
      currentMetrics: {
        averageResponseTime: this.completedRequests > 0 ? this.responseTimeSum / this.completedRequests : 0,
        throughput: this.calculateThroughput(),
        errorRate: this.calculateErrorRate(),
        cpuUsage: this.resourceMonitor.getCurrentCpuUsage(),
        memoryUsage: this.resourceMonitor.getCurrentMemoryUsage()
      }
    };
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return this.metricsCollector.getPerformanceMetrics(this.testId);
  }

  public getResourceUsage(): ResourceUsageMetrics {
    return this.resourceMonitor.getResourceUsage(this.testId);
  }

  public async getResults(): Promise<LoadTestResult> {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    return {
      testId: this.testId,
      startTime: this.startTime,
      endTime,
      totalDuration,
      summary: this.generateTestSummary(),
      metrics: this.getPerformanceMetrics(),
      errors: this.generateErrorSummary(),
      userMetrics: this.generateUserMetrics(),
      resourceUsage: this.getResourceUsage(),
      alerts: this.resourceMonitor.getAlerts(this.testId)
    };
  }

  private startRampUp(): void {
    const rampUpInterval = this.config.rampUpTime / this.config.maxConcurrentUsers;
    let currentUsers = 0;

    const rampUpTimer = setInterval(() => {
      if (this.isPaused) return;

      if (currentUsers < this.config.maxConcurrentUsers) {
        this.addUser();
        currentUsers++;
      } else {
        clearInterval(rampUpTimer);
        this.status = 'running';
        this.startMainTest();
      }
    }, rampUpInterval);
  }

  private startMainTest(): void {
    // Main test execution logic
    setTimeout(() => {
      if (this.status === 'running') {
        this.startRampDown();
      }
    }, this.config.testDuration - this.config.rampUpTime - this.config.rampDownTime);
  }

  private startRampDown(): void {
    this.status = 'ramping_down';
    const rampDownInterval = this.config.rampDownTime / this.activeUserCount;

    const rampDownTimer = setInterval(() => {
      if (this.activeUserCount > 0) {
        this.removeUser();
      } else {
        clearInterval(rampDownTimer);
        this.status = 'completed';
      }
    }, rampDownInterval);
  }

  private addUser(): void {
    // Implementation to add a virtual user
    this.activeUserCount++;
  }

  private removeUser(): void {
    // Implementation to remove a virtual user
    this.activeUserCount--;
  }

  private async addUsers(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      this.addUser();
    }
  }

  private async removeUsers(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      this.removeUser();
    }
  }

  private async stopAllUsers(): Promise<void> {
    this.activeUserCount = 0;
  }

  private calculateProgress(): number {
    const elapsedTime = Date.now() - this.startTime.getTime();
    const totalTime = this.config.testDuration;
    return Math.min((elapsedTime / totalTime) * 100, 100);
  }

  private calculateThroughput(): number {
    const elapsedSeconds = (Date.now() - this.startTime.getTime()) / 1000;
    return elapsedSeconds > 0 ? this.completedRequests / elapsedSeconds : 0;
  }

  private calculateErrorRate(): number {
    const totalRequests = this.completedRequests + this.failedRequests;
    return totalRequests > 0 ? (this.failedRequests / totalRequests) * 100 : 0;
  }

  private generateTestSummary(): TestSummary {
    const totalRequests = this.completedRequests + this.failedRequests;
    
    return {
      totalRequests,
      successfulRequests: this.completedRequests,
      failedRequests: this.failedRequests,
      averageResponseTime: this.completedRequests > 0 ? this.responseTimeSum / this.completedRequests : 0,
      maxResponseTime: 0, // Would be tracked during execution
      minResponseTime: 0, // Would be tracked during execution
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate(),
      concurrentUsers: {
        max: this.config.maxConcurrentUsers,
        average: this.config.maxConcurrentUsers / 2 // Simplified calculation
      }
    };
  }

  private generateErrorSummary(): ErrorSummary[] {
    // Implementation would collect and categorize errors
    return [];
  }

  private generateUserMetrics(): UserMetrics[] {
    // Implementation would generate metrics for each virtual user
    return [];
  }
}

// Supporting classes (simplified implementations)
class MetricsCollector {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  public getPerformanceMetrics(testId: string): PerformanceMetrics {
    return this.metrics.get(testId) || this.getDefaultMetrics();
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      responseTimeDistribution: { p50: 0, p90: 0, p95: 0, p99: 0 },
      throughputOverTime: [],
      responseTimeOverTime: [],
      errorRateOverTime: [],
      concurrentUsersOverTime: []
    };
  }
}

class ResourceMonitor extends EventEmitter {
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  public async startMonitoring(config: MonitoringConfiguration): Promise<void> {
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, config.metricsInterval);
  }

  public async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  public getCurrentCpuUsage(): number {
    // Implementation would return actual CPU usage
    return Math.random() * 100;
  }

  public getCurrentMemoryUsage(): number {
    // Implementation would return actual memory usage
    return Math.random() * 1000;
  }

  public getResourceUsage(testId: string): ResourceUsageMetrics {
    // Implementation would return actual resource usage metrics
    return {
      cpu: { average: 50, max: 80, overTime: [] },
      memory: { average: 500, max: 800, overTime: [] },
      network: { bytesIn: 1000000, bytesOut: 500000, bandwidth: [] },
      database: { connections: 10, queryTime: 50, overTime: [] }
    };
  }

  public getAlerts(testId: string): Alert[] {
    // Implementation would return alerts for the test
    return [];
  }

  private collectMetrics(): void {
    // Implementation would collect actual system metrics
    const cpuUsage = this.getCurrentCpuUsage();
    const memoryUsage = this.getCurrentMemoryUsage();

    // Check thresholds and emit alerts if needed
    if (cpuUsage > 80) {
      this.emit('thresholdExceeded', {
        id: `cpu-alert-${Date.now()}`,
        type: 'resource',
        severity: 'high',
        message: `CPU usage exceeded threshold: ${cpuUsage}%`,
        timestamp: new Date(),
        resolved: false,
        details: { cpuUsage }
      });
    }
  }
}

class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();

  public triggerAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    
    if (alert.severity === 'critical') {
      this.emit('criticalAlert', alert);
    }
  }

  public getActiveAlerts(testId?: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }
}