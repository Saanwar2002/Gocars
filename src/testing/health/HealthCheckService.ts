import { EventEmitter } from 'events';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
      timestamp: Date;
    };
  };
}

export interface HealthCheck {
  name: string;
  check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>;
  timeout?: number;
  interval?: number;
}

export class HealthCheckService extends EventEmitter {
  private checks: Map<string, HealthCheck> = new Map();
  private lastResults: Map<string, any> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: Date = new Date();

  constructor() {
    super();
    this.setupDefaultChecks();
  }

  private setupDefaultChecks(): void {
    // Memory usage check
    this.addCheck({
      name: 'memory',
      check: async () => {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

        if (usagePercent > 90) {
          return {
            status: 'fail',
            message: `High memory usage: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
          };
        } else if (usagePercent > 75) {
          return {
            status: 'warn',
            message: `Elevated memory usage: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
          };
        }

        return {
          status: 'pass',
          message: `Memory usage: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
        };
      },
      timeout: 5000,
      interval: 30000
    });

    // Event loop lag check
    this.addCheck({
      name: 'eventloop',
      check: async () => {
        return new Promise((resolve) => {
          const start = process.hrtime.bigint();
          setImmediate(() => {
            const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
            
            if (lag > 100) {
              resolve({
                status: 'fail',
                message: `High event loop lag: ${lag.toFixed(2)}ms`
              });
            } else if (lag > 50) {
              resolve({
                status: 'warn',
                message: `Elevated event loop lag: ${lag.toFixed(2)}ms`
              });
            } else {
              resolve({
                status: 'pass',
                message: `Event loop lag: ${lag.toFixed(2)}ms`
              });
            }
          });
        });
      },
      timeout: 5000,
      interval: 15000
    });

    // Disk space check (if applicable)
    this.addCheck({
      name: 'disk',
      check: async () => {
        try {
          const fs = require('fs');
          const stats = fs.statSync('/app');
          
          // This is a simplified check - in production you'd want to check actual disk usage
          return {
            status: 'pass',
            message: 'Disk space check passed'
          };
        } catch (error) {
          return {
            status: 'warn',
            message: `Disk check failed: ${error.message}`
          };
        }
      },
      timeout: 5000,
      interval: 60000
    });

    // Database connectivity check (placeholder)
    this.addCheck({
      name: 'database',
      check: async () => {
        try {
          // In a real implementation, you'd check actual database connectivity
          // For now, we'll simulate a check
          const isConnected = true; // Replace with actual DB check
          
          if (isConnected) {
            return {
              status: 'pass',
              message: 'Database connection healthy'
            };
          } else {
            return {
              status: 'fail',
              message: 'Database connection failed'
            };
          }
        } catch (error) {
          return {
            status: 'fail',
            message: `Database check error: ${error.message}`
          };
        }
      },
      timeout: 10000,
      interval: 30000
    });

    // Redis connectivity check (placeholder)
    this.addCheck({
      name: 'redis',
      check: async () => {
        try {
          // In a real implementation, you'd check actual Redis connectivity
          const isConnected = true; // Replace with actual Redis check
          
          if (isConnected) {
            return {
              status: 'pass',
              message: 'Redis connection healthy'
            };
          } else {
            return {
              status: 'fail',
              message: 'Redis connection failed'
            };
          }
        } catch (error) {
          return {
            status: 'fail',
            message: `Redis check error: ${error.message}`
          };
        }
      },
      timeout: 5000,
      interval: 30000
    });
  }

  public addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    
    if (check.interval) {
      this.startPeriodicCheck(check);
    }
  }

  public removeCheck(name: string): void {
    this.checks.delete(name);
    this.lastResults.delete(name);
    
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  private startPeriodicCheck(check: HealthCheck): void {
    if (check.interval) {
      const interval = setInterval(async () => {
        await this.runSingleCheck(check.name);
      }, check.interval);
      
      this.intervals.set(check.name, interval);
    }
  }

  private async runSingleCheck(name: string): Promise<void> {
    const check = this.checks.get(name);
    if (!check) return;

    const startTime = Date.now();
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout || 10000);
      });

      const result = await Promise.race([
        check.check(),
        timeoutPromise
      ]) as any;

      const duration = Date.now() - startTime;
      
      this.lastResults.set(name, {
        ...result,
        duration,
        timestamp: new Date()
      });

      this.emit('checkComplete', name, result);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        status: 'fail',
        message: error.message,
        duration,
        timestamp: new Date()
      };
      
      this.lastResults.set(name, result);
      this.emit('checkFailed', name, error);
    }
  }

  public async runAllChecks(): Promise<HealthStatus> {
    const checkPromises = Array.from(this.checks.keys()).map(name => 
      this.runSingleCheck(name)
    );

    await Promise.allSettled(checkPromises);

    return this.getHealthStatus();
  }

  public getHealthStatus(): HealthStatus {
    const checks: { [key: string]: any } = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    for (const [name, result] of this.lastResults.entries()) {
      checks[name] = result;
      
      if (result.status === 'fail') {
        overallStatus = 'unhealthy';
      } else if (result.status === 'warn' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || '1.0.0',
      checks
    };
  }

  public async getReadinessStatus(): Promise<{ ready: boolean; message?: string }> {
    // Check critical services for readiness
    const criticalChecks = ['database', 'redis'];
    
    for (const checkName of criticalChecks) {
      const result = this.lastResults.get(checkName);
      if (!result || result.status === 'fail') {
        return {
          ready: false,
          message: `Critical service ${checkName} is not ready`
        };
      }
    }

    return { ready: true };
  }

  public startPeriodicChecks(): void {
    for (const check of this.checks.values()) {
      if (check.interval) {
        this.startPeriodicCheck(check);
      }
    }
  }

  public stopPeriodicChecks(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  public destroy(): void {
    this.stopPeriodicChecks();
    this.removeAllListeners();
  }
}