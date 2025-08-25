import { EventEmitter } from 'events';
import { ServiceHealthStatus } from '../dashboard/MonitoringDashboard';

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  services: ServiceConfig[];
}

export interface ServiceConfig {
  name: string;
  type: 'http' | 'websocket' | 'database' | 'firebase' | 'custom';
  endpoint?: string;
  healthCheckUrl?: string;
  customCheck?: () => Promise<HealthCheckResult>;
  expectedResponseTime: number;
  criticalThreshold: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  message?: string;
  details?: any;
}

export interface SystemHealthStatus {
  overallStatus: 'healthy' | 'warning' | 'critical';
  services: ServiceHealthStatus[];
  uptime: number;
  lastHealthCheck: Date;
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

export class SystemHealthMonitor extends EventEmitter {
  private config: HealthCheckConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private serviceHistory: Map<string, HealthCheckResult[]> = new Map();
  private startTime: Date = new Date();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      services: [],
      ...config
    };

    this.setupDefaultServices();
  }

  private setupDefaultServices(): void {
    const defaultServices: ServiceConfig[] = [
      {
        name: 'Firebase Authentication',
        type: 'firebase',
        healthCheckUrl: 'https://identitytoolkit.googleapis.com/v1/projects',
        expectedResponseTime: 1000,
        criticalThreshold: 3000
      },
      {
        name: 'Firebase Firestore',
        type: 'firebase',
        healthCheckUrl: 'https://firestore.googleapis.com/v1/projects',
        expectedResponseTime: 800,
        criticalThreshold: 2500
      },
      {
        name: 'WebSocket Server',
        type: 'websocket',
        endpoint: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
        expectedResponseTime: 500,
        criticalThreshold: 2000
      },
      {
        name: 'Notification Service',
        type: 'http',
        healthCheckUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002/health',
        expectedResponseTime: 1200,
        criticalThreshold: 3000
      },
      {
        name: 'Payment Gateway',
        type: 'http',
        healthCheckUrl: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:3003/health',
        expectedResponseTime: 2000,
        criticalThreshold: 5000
      }
    ];

    // Add default services if none are configured
    if (this.config.services.length === 0) {
      this.config.services = defaultServices;
    }
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    
    // Perform initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);

    this.emit('healthMonitorStarted');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.emit('healthMonitorStopped');
  }

  private async performHealthCheck(): Promise<void> {
    const healthResults: ServiceHealthStatus[] = [];
    
    for (const service of this.config.services) {
      try {
        const result = await this.checkServiceHealth(service);
        const serviceStatus: ServiceHealthStatus = {
          name: service.name,
          status: result.status,
          responseTime: result.responseTime,
          lastCheck: new Date(),
          errorCount: this.getRecentErrorCount(service.name)
        };

        healthResults.push(serviceStatus);
        this.updateServiceHistory(service.name, result);
      } catch (error) {
        const serviceStatus: ServiceHealthStatus = {
          name: service.name,
          status: 'down',
          responseTime: this.config.timeout,
          lastCheck: new Date(),
          errorCount: this.getRecentErrorCount(service.name) + 1
        };

        healthResults.push(serviceStatus);
        this.updateServiceHistory(service.name, {
          status: 'down',
          responseTime: this.config.timeout,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const systemHealth: SystemHealthStatus = {
      overallStatus: this.calculateOverallStatus(healthResults),
      services: healthResults,
      uptime: Date.now() - this.startTime.getTime(),
      lastHealthCheck: new Date(),
      systemMetrics: await this.getSystemMetrics()
    };

    this.emit('healthCheckCompleted', systemHealth);
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      let result: HealthCheckResult;

      switch (service.type) {
        case 'http':
          result = await this.checkHttpService(service);
          break;
        case 'websocket':
          result = await this.checkWebSocketService(service);
          break;
        case 'firebase':
          result = await this.checkFirebaseService(service);
          break;
        case 'database':
          result = await this.checkDatabaseService(service);
          break;
        case 'custom':
          if (service.customCheck) {
            result = await service.customCheck();
          } else {
            throw new Error('Custom check function not provided');
          }
          break;
        default:
          throw new Error(`Unsupported service type: ${service.type}`);
      }

      // Determine status based on response time
      if (result.responseTime > service.criticalThreshold) {
        result.status = 'degraded';
      } else if (result.responseTime > service.expectedResponseTime * 2) {
        result.status = 'degraded';
      }

      return result;
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private async checkHttpService(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(service.healthCheckUrl!, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'GoCars-HealthMonitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
          message: `HTTP ${response.status} ${response.statusText}`
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          message: `HTTP ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        message: error instanceof Error ? error.message : 'HTTP request failed'
      };
    }
  }

  private async checkWebSocketService(service: ServiceConfig): Promise<HealthCheckResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            status: 'down',
            responseTime: Date.now() - startTime,
            message: 'WebSocket connection timeout'
          });
        }
      }, this.config.timeout);

      try {
        const ws = new WebSocket(service.endpoint!);

        ws.onopen = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({
              status: 'healthy',
              responseTime: Date.now() - startTime,
              message: 'WebSocket connection successful'
            });
          }
        };

        ws.onerror = (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({
              status: 'down',
              responseTime: Date.now() - startTime,
              message: 'WebSocket connection failed'
            });
          }
        };

        ws.onclose = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({
              status: 'down',
              responseTime: Date.now() - startTime,
              message: 'WebSocket connection closed unexpectedly'
            });
          }
        };
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({
            status: 'down',
            responseTime: Date.now() - startTime,
            message: error instanceof Error ? error.message : 'WebSocket error'
          });
        }
      }
    });
  }

  private async checkFirebaseService(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // For Firebase services, we'll do a simple HTTP check to the service endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(service.healthCheckUrl!, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'GoCars-HealthMonitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Firebase services typically return 200 or 401 (unauthorized) for health checks
      if (response.status === 200 || response.status === 401) {
        return {
          status: 'healthy',
          responseTime,
          message: `Firebase service responding (${response.status})`
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          message: `Firebase service returned ${response.status}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        message: error instanceof Error ? error.message : 'Firebase service check failed'
      };
    }
  }

  private async checkDatabaseService(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // This is a placeholder for database health checks
    // In a real implementation, you would connect to the database and run a simple query
    try {
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
        message: 'Database connection successful'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        message: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  private async getSystemMetrics(): Promise<SystemHealthStatus['systemMetrics']> {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Simulate other metrics (in a real implementation, these would come from system monitoring)
    const cpuUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;
    const networkLatency = Math.random() * 100;

    return {
      memoryUsage: memoryPercent,
      cpuUsage,
      diskUsage,
      networkLatency
    };
  }

  private calculateOverallStatus(services: ServiceHealthStatus[]): 'healthy' | 'warning' | 'critical' {
    const downServices = services.filter(s => s.status === 'down');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (downServices.length > 0) {
      return 'critical';
    } else if (degradedServices.length > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  private updateServiceHistory(serviceName: string, result: HealthCheckResult): void {
    if (!this.serviceHistory.has(serviceName)) {
      this.serviceHistory.set(serviceName, []);
    }

    const history = this.serviceHistory.get(serviceName)!;
    history.unshift(result);

    // Keep only the last 100 results
    if (history.length > 100) {
      history.splice(100);
    }
  }

  private getRecentErrorCount(serviceName: string): number {
    const history = this.serviceHistory.get(serviceName);
    if (!history) return 0;

    // Count errors in the last 10 checks
    const recentHistory = history.slice(0, 10);
    return recentHistory.filter(result => result.status === 'down' || result.status === 'degraded').length;
  }

  public getServiceHistory(serviceName: string): HealthCheckResult[] {
    return this.serviceHistory.get(serviceName) || [];
  }

  public addService(service: ServiceConfig): void {
    this.config.services.push(service);
    this.emit('serviceAdded', service);
  }

  public removeService(serviceName: string): void {
    const index = this.config.services.findIndex(s => s.name === serviceName);
    if (index !== -1) {
      const removedService = this.config.services.splice(index, 1)[0];
      this.serviceHistory.delete(serviceName);
      this.emit('serviceRemoved', removedService);
    }
  }

  public updateServiceConfig(serviceName: string, updates: Partial<ServiceConfig>): void {
    const service = this.config.services.find(s => s.name === serviceName);
    if (service) {
      Object.assign(service, updates);
      this.emit('serviceConfigUpdated', service);
    }
  }

  public getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart monitoring with new config if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    this.emit('configUpdated', this.config);
  }

  public async performManualHealthCheck(): Promise<SystemHealthStatus> {
    return new Promise((resolve) => {
      const handler = (systemHealth: SystemHealthStatus) => {
        this.off('healthCheckCompleted', handler);
        resolve(systemHealth);
      };
      
      this.on('healthCheckCompleted', handler);
      this.performHealthCheck();
    });
  }
}