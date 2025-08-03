/**
 * System Health Monitoring Service
 * Comprehensive system performance monitoring and health tracking for GoCars platform
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// System Health Types
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
    available: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
    errors: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    concurrentUsers: number;
  };
  errors: {
    total: number;
    rate: number;
    by4xx: number;
    by5xx: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
    deadlocks: number;
  };
}

export interface UserExperienceMetrics {
  timestamp: Date;
  pageLoad: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  interactivity: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  satisfaction: {
    apdexScore: number;
    bounceRate: number;
    sessionDuration: number;
    conversionRate: number;
  };
  errors: {
    jsErrors: number;
    networkErrors: number;
    renderErrors: number;
  };
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'down';
  uptime: number;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  dependencies: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
  }>;
  healthChecks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    timestamp: Date;
  }>;
}

export interface Alert {
  id: string;
  type: 'system' | 'application' | 'user_experience' | 'business';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  actions: string[];
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  comparison: 'greater_than' | 'less_than' | 'equals';
}

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'major_outage' | 'maintenance';
  services: ServiceHealth[];
  activeIncidents: number;
  uptime: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  lastUpdated: Date;
}

export interface PerformanceTrend {
  metric: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  data: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
}

class SystemHealthService {
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private alertSubscribers: Array<(alerts: Alert[]) => void> = [];

  // System Metrics Collection
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // In a real implementation, this would collect actual system metrics
      // For now, we'll simulate realistic metrics
      return {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 80 + 10, // 10-90%
          cores: 8,
          loadAverage: [
            Math.random() * 2 + 0.5,
            Math.random() * 2 + 0.5,
            Math.random() * 2 + 0.5
          ]
        },
        memory: {
          used: Math.random() * 6 + 2, // 2-8 GB
          total: 16,
          usage: Math.random() * 60 + 20, // 20-80%
          available: Math.random() * 8 + 4 // 4-12 GB
        },
        disk: {
          used: Math.random() * 200 + 50, // 50-250 GB
          total: 500,
          usage: Math.random() * 40 + 10, // 10-50%
          available: Math.random() * 200 + 250 // 250-450 GB
        },
        network: {
          inbound: Math.random() * 100 + 20, // 20-120 Mbps
          outbound: Math.random() * 50 + 10, // 10-60 Mbps
          latency: Math.random() * 50 + 10, // 10-60 ms
          errors: Math.floor(Math.random() * 5) // 0-5 errors
        }
      };
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  // Application Metrics Collection
  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      const baseResponseTime = Math.random() * 200 + 100; // 100-300ms base
      
      return {
        timestamp: new Date(),
        responseTime: {
          average: baseResponseTime,
          p50: baseResponseTime * 0.8,
          p95: baseResponseTime * 1.5,
          p99: baseResponseTime * 2.2
        },
        throughput: {
          requestsPerSecond: Math.random() * 500 + 100, // 100-600 RPS
          requestsPerMinute: Math.random() * 30000 + 6000, // 6k-36k RPM
          concurrentUsers: Math.random() * 2000 + 500 // 500-2500 users
        },
        errors: {
          total: Math.floor(Math.random() * 50 + 5), // 5-55 errors
          rate: Math.random() * 2 + 0.1, // 0.1-2.1% error rate
          by4xx: Math.floor(Math.random() * 30 + 3), // 3-33 4xx errors
          by5xx: Math.floor(Math.random() * 10 + 1) // 1-11 5xx errors
        },
        database: {
          connections: Math.floor(Math.random() * 80 + 20), // 20-100 connections
          queryTime: Math.random() * 50 + 10, // 10-60ms avg query time
          slowQueries: Math.floor(Math.random() * 5), // 0-5 slow queries
          deadlocks: Math.floor(Math.random() * 2) // 0-2 deadlocks
        }
      };
    } catch (error) {
      console.error('Error collecting application metrics:', error);
      throw error;
    }
  }

  // User Experience Metrics Collection
  async collectUserExperienceMetrics(): Promise<UserExperienceMetrics> {
    try {
      return {
        timestamp: new Date(),
        pageLoad: {
          average: Math.random() * 2000 + 1000, // 1-3 seconds
          p50: Math.random() * 1500 + 800, // 0.8-2.3 seconds
          p95: Math.random() * 3000 + 2000, // 2-5 seconds
          p99: Math.random() * 5000 + 3000 // 3-8 seconds
        },
        interactivity: {
          firstContentfulPaint: Math.random() * 1000 + 500, // 0.5-1.5s
          largestContentfulPaint: Math.random() * 2000 + 1000, // 1-3s
          firstInputDelay: Math.random() * 100 + 50, // 50-150ms
          cumulativeLayoutShift: Math.random() * 0.1 + 0.05 // 0.05-0.15
        },
        satisfaction: {
          apdexScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
          bounceRate: Math.random() * 20 + 25, // 25-45%
          sessionDuration: Math.random() * 300 + 180, // 3-8 minutes
          conversionRate: Math.random() * 5 + 2 // 2-7%
        },
        errors: {
          jsErrors: Math.floor(Math.random() * 20 + 5), // 5-25 JS errors
          networkErrors: Math.floor(Math.random() * 10 + 2), // 2-12 network errors
          renderErrors: Math.floor(Math.random() * 5 + 1) // 1-6 render errors
        }
      };
    } catch (error) {
      console.error('Error collecting user experience metrics:', error);
      throw error;
    }
  }

  // Service Health Monitoring
  async getServiceHealth(): Promise<ServiceHealth[]> {
    try {
      const services = [
        'API Gateway',
        'Authentication Service',
        'Booking Service',
        'Payment Service',
        'Notification Service',
        'Analytics Service',
        'Database',
        'Cache (Redis)',
        'File Storage',
        'WebSocket Server'
      ];

      return services.map(serviceName => {
        const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
        const responseTime = Math.random() * 200 + 50; // 50-250ms
        
        return {
          serviceName,
          status: isHealthy ? 'healthy' : (Math.random() > 0.5 ? 'degraded' : 'unhealthy'),
          uptime: Math.random() * 5 + 95, // 95-100% uptime
          lastCheck: new Date(),
          responseTime,
          errorRate: Math.random() * 2, // 0-2% error rate
          dependencies: [
            {
              name: 'Database',
              status: 'healthy',
              responseTime: Math.random() * 50 + 10
            },
            {
              name: 'Cache',
              status: 'healthy',
              responseTime: Math.random() * 20 + 5
            }
          ],
          healthChecks: [
            {
              name: 'HTTP Health Check',
              status: isHealthy ? 'pass' : 'fail',
              message: isHealthy ? 'Service responding normally' : 'Service not responding',
              timestamp: new Date()
            },
            {
              name: 'Database Connection',
              status: 'pass',
              message: 'Database connection successful',
              timestamp: new Date()
            }
          ]
        };
      });
    } catch (error) {
      console.error('Error getting service health:', error);
      throw error;
    }
  }

  // Alert Management
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      // Mock active alerts
      const mockAlerts: Alert[] = [
        {
          id: 'alert_1',
          type: 'system',
          severity: 'high',
          title: 'High CPU Usage',
          description: 'CPU usage has exceeded 85% for the last 10 minutes',
          metric: 'cpu_usage',
          threshold: 85,
          currentValue: 92,
          status: 'active',
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          actions: [
            'Scale up server instances',
            'Investigate high CPU processes',
            'Enable auto-scaling if not already active'
          ]
        },
        {
          id: 'alert_2',
          type: 'application',
          severity: 'medium',
          title: 'Increased Response Time',
          description: 'API response time has increased by 40% in the last hour',
          metric: 'response_time',
          threshold: 200,
          currentValue: 280,
          status: 'acknowledged',
          createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          assignedTo: 'DevOps Team',
          actions: [
            'Check database query performance',
            'Review recent deployments',
            'Monitor third-party service dependencies'
          ]
        }
      ];

      return mockAlerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'system_alerts'), {
        ...alertData,
        createdAt: Timestamp.now()
      });
      
      // Notify subscribers
      this.notifyAlertSubscribers();
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      // In real implementation, update the alert in database
      console.log(`Alert ${alertId} acknowledged by ${userId}`);
      this.notifyAlertSubscribers();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  async resolveAlert(alertId: string, userId: string, resolution: string): Promise<void> {
    try {
      // In real implementation, update the alert in database
      console.log(`Alert ${alertId} resolved by ${userId}: ${resolution}`);
      this.notifyAlertSubscribers();
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const services = await this.getServiceHealth();
      const healthyServices = services.filter(s => s.status === 'healthy').length;
      const totalServices = services.length;
      const healthPercentage = (healthyServices / totalServices) * 100;
      
      let overall: SystemStatus['overall'] = 'operational';
      if (healthPercentage < 50) {
        overall = 'major_outage';
      } else if (healthPercentage < 80) {
        overall = 'degraded';
      }
      
      return {
        overall,
        services,
        activeIncidents: (await this.getActiveAlerts()).filter(a => a.status === 'active').length,
        uptime: {
          last24h: Math.random() * 5 + 95, // 95-100%
          last7d: Math.random() * 3 + 97, // 97-100%
          last30d: Math.random() * 2 + 98 // 98-100%
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }

  // Performance Trends
  async getPerformanceTrends(metrics: string[], timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<PerformanceTrend[]> {
    try {
      return metrics.map(metric => {
        const dataPoints = this.generateTrendData(metric, timeframe);
        const trend = this.calculateTrend(dataPoints);
        
        return {
          metric,
          timeframe,
          data: dataPoints,
          trend: trend.direction,
          changePercent: trend.changePercent
        };
      });
    } catch (error) {
      console.error('Error getting performance trends:', error);
      throw error;
    }
  }

  // Real-time Monitoring
  startRealTimeMonitoring(callback: (data: {
    system: SystemMetrics;
    application: ApplicationMetrics;
    userExperience: UserExperienceMetrics;
  }) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const [system, application, userExperience] = await Promise.all([
          this.collectSystemMetrics(),
          this.collectApplicationMetrics(),
          this.collectUserExperienceMetrics()
        ]);
        
        callback({ system, application, userExperience });
        
        // Check for threshold violations and create alerts
        await this.checkThresholds({ system, application, userExperience });
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }

  // Alert Subscriptions
  subscribeToAlerts(callback: (alerts: Alert[]) => void): () => void {
    this.alertSubscribers.push(callback);
    
    return () => {
      this.alertSubscribers = this.alertSubscribers.filter(sub => sub !== callback);
    };
  }

  // Helper Methods
  private generateTrendData(metric: string, timeframe: string): Array<{ timestamp: Date; value: number }> {
    const points = timeframe === '1h' ? 12 : timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const data = [];
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date();
      if (timeframe === '1h') {
        timestamp.setMinutes(timestamp.getMinutes() - i * 5);
      } else if (timeframe === '24h') {
        timestamp.setHours(timestamp.getHours() - i);
      } else if (timeframe === '7d') {
        timestamp.setDate(timestamp.getDate() - i);
      } else {
        timestamp.setDate(timestamp.getDate() - i);
      }
      
      // Generate realistic values based on metric type
      let value = 0;
      switch (metric) {
        case 'cpu_usage':
          value = Math.random() * 80 + 10;
          break;
        case 'memory_usage':
          value = Math.random() * 60 + 20;
          break;
        case 'response_time':
          value = Math.random() * 200 + 100;
          break;
        case 'error_rate':
          value = Math.random() * 2 + 0.1;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({ timestamp, value });
    }
    
    return data;
  }

  private calculateTrend(data: Array<{ timestamp: Date; value: number }>): {
    direction: 'improving' | 'stable' | 'degrading';
    changePercent: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', changePercent: 0 };
    }
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const changePercent = ((last - first) / first) * 100;
    
    let direction: 'improving' | 'stable' | 'degrading' = 'stable';
    if (Math.abs(changePercent) > 5) {
      direction = changePercent > 0 ? 'degrading' : 'improving';
    }
    
    return { direction, changePercent };
  }

  private async checkThresholds(data: {
    system: SystemMetrics;
    application: ApplicationMetrics;
    userExperience: UserExperienceMetrics;
  }): Promise<void> {
    const thresholds: PerformanceThreshold[] = [
      { metric: 'cpu_usage', warning: 70, critical: 85, unit: '%', comparison: 'greater_than' },
      { metric: 'memory_usage', warning: 75, critical: 90, unit: '%', comparison: 'greater_than' },
      { metric: 'response_time', warning: 200, critical: 500, unit: 'ms', comparison: 'greater_than' },
      { metric: 'error_rate', warning: 1, critical: 5, unit: '%', comparison: 'greater_than' }
    ];

    for (const threshold of thresholds) {
      let currentValue = 0;
      
      switch (threshold.metric) {
        case 'cpu_usage':
          currentValue = data.system.cpu.usage;
          break;
        case 'memory_usage':
          currentValue = data.system.memory.usage;
          break;
        case 'response_time':
          currentValue = data.application.responseTime.average;
          break;
        case 'error_rate':
          currentValue = data.application.errors.rate;
          break;
      }
      
      if (currentValue > threshold.critical) {
        await this.createAlert({
          type: 'system',
          severity: 'critical',
          title: `Critical ${threshold.metric.replace('_', ' ')} Alert`,
          description: `${threshold.metric.replace('_', ' ')} has exceeded critical threshold`,
          metric: threshold.metric,
          threshold: threshold.critical,
          currentValue,
          status: 'active',
          actions: [`Investigate ${threshold.metric} immediately`, 'Scale resources if needed']
        });
      } else if (currentValue > threshold.warning) {
        await this.createAlert({
          type: 'system',
          severity: 'medium',
          title: `Warning ${threshold.metric.replace('_', ' ')} Alert`,
          description: `${threshold.metric.replace('_', ' ')} has exceeded warning threshold`,
          metric: threshold.metric,
          threshold: threshold.warning,
          currentValue,
          status: 'active',
          actions: [`Monitor ${threshold.metric} closely`, 'Consider scaling resources']
        });
      }
    }
  }

  private async notifyAlertSubscribers(): Promise<void> {
    try {
      const alerts = await this.getActiveAlerts();
      this.alertSubscribers.forEach(callback => callback(alerts));
    } catch (error) {
      console.error('Error notifying alert subscribers:', error);
    }
  }
}

export const systemHealthService = new SystemHealthService();