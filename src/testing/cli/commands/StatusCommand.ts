import { CLICommand, CLIContext } from '../CLICommand';
import { TestingAgentServer } from '../../server/TestingAgentServer';
import { HealthCheckService } from '../../health/HealthCheckService';
import { PrometheusMetrics } from '../../metrics/PrometheusMetrics';
import axios from 'axios';
import * as fs from 'fs';

export class StatusCommand extends CLICommand {
  constructor() {
    super({
      name: 'status',
      description: 'Check testing agent status and health',
      usage: 'gocars-test status [options]',
      options: [
        {
          name: 'url',
          alias: 'u',
          description: 'Testing agent URL',
          type: 'string',
          default: 'http://localhost:3000'
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json', 'yaml'],
          default: 'table'
        },
        {
          name: 'watch',
          alias: 'w',
          description: 'Watch mode - continuously monitor status',
          type: 'boolean',
          default: false
        },
        {
          name: 'interval',
          alias: 'i',
          description: 'Watch interval in seconds',
          type: 'number',
          default: 5
        },
        {
          name: 'timeout',
          alias: 't',
          description: 'Request timeout in milliseconds',
          type: 'number',
          default: 10000
        },
        {
          name: 'detailed',
          alias: 'd',
          description: 'Show detailed status information',
          type: 'boolean',
          default: false
        }
      ],
      examples: [
        'gocars-test status',
        'gocars-test status --url http://staging.gocars.com:3000',
        'gocars-test status --format json',
        'gocars-test status --watch --interval 10',
        'gocars-test status --detailed'
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const url = context.options.url || 'http://localhost:3000';
    const format = context.options.format || 'table';
    const watch = context.options.watch || false;
    const interval = (context.options.interval || 5) * 1000;
    const detailed = context.options.detailed || false;

    if (watch) {
      return await this.watchStatus(url, format, interval, detailed, context);
    } else {
      return await this.checkStatus(url, format, detailed, context);
    }
  }

  private async checkStatus(url: string, format: string, detailed: boolean, context: CLIContext): Promise<number> {
    try {
      this.logVerbose(`Checking status at ${url}`, context);

      const status = await this.fetchStatus(url, context);
      if (!status) {
        return 1;
      }

      this.displayStatus(status, format, detailed, context);
      return status.overall === 'healthy' ? 0 : 1;

    } catch (error) {
      this.logError(`Failed to check status: ${error.message}`, context);
      return 1;
    }
  }

  private async watchStatus(url: string, format: string, interval: number, detailed: boolean, context: CLIContext): Promise<number> {
    this.log(`Watching status at ${url} (interval: ${interval / 1000}s)`, context);
    this.log('Press Ctrl+C to stop watching', context);

    let previousStatus: any = null;

    const checkInterval = setInterval(async () => {
      try {
        const status = await this.fetchStatus(url, context);
        if (!status) {
          return;
        }

        // Clear screen for watch mode
        if (format === 'table') {
          console.clear();
          this.log(`Status at ${new Date().toLocaleString()}`, context);
          this.log('='.repeat(60), context);
        }

        this.displayStatus(status, format, detailed, context);

        // Show changes if previous status exists
        if (previousStatus && format === 'table') {
          this.displayStatusChanges(previousStatus, status, context);
        }

        previousStatus = status;

      } catch (error) {
        this.logError(`Status check failed: ${error.message}`, context);
      }
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(checkInterval);
      this.log('\nStopped watching status', context);
      process.exit(0);
    });

    // Keep the process running
    return new Promise(() => {});
  }

  private async fetchStatus(url: string, context: CLIContext): Promise<any | null> {
    try {
      const timeout = context.options.timeout || 10000;
      
      // Fetch basic info
      const infoResponse = await axios.get(`${url}/info`, { timeout });
      const info = infoResponse.data;

      // Fetch health status
      const healthResponse = await axios.get(`${url}/health`, { timeout });
      const health = healthResponse.data;

      // Fetch metrics if available
      let metrics = null;
      try {
        const metricsResponse = await axios.get(`${url}/metrics`, { 
          timeout: timeout / 2,
          headers: { 'Accept': 'application/json' }
        });
        metrics = metricsResponse.data;
      } catch (error) {
        // Metrics endpoint might not be available or might return text format
        this.logVerbose('Metrics endpoint not available or not in JSON format', context);
      }

      return {
        info,
        health,
        metrics,
        overall: health.status,
        timestamp: new Date()
      };

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logError('Testing agent is not running or not accessible', context);
      } else if (error.code === 'ETIMEDOUT') {
        this.logError('Request timed out - testing agent may be overloaded', context);
      } else {
        this.logError(`Failed to fetch status: ${error.message}`, context);
      }
      return null;
    }
  }

  private displayStatus(status: any, format: string, detailed: boolean, context: CLIContext): void {
    switch (format) {
      case 'json':
        this.log(JSON.stringify(status, null, 2), context);
        break;
      case 'yaml':
        this.displayAsYaml(status, context);
        break;
      case 'table':
      default:
        this.displayAsTable(status, detailed, context);
        break;
    }
  }

  private displayAsTable(status: any, detailed: boolean, context: CLIContext): void {
    const { info, health } = status;

    // Overall status
    const statusIcon = this.getStatusIcon(status.overall);
    const statusColor = this.getStatusColor(status.overall);
    
    this.log(`\n${statusIcon} Overall Status: ${statusColor}${status.overall.toUpperCase()}\x1b[0m`, context);
    
    // Basic info
    this.log('\nService Information:', context);
    this.log('='.repeat(40), context);
    this.log(`Name: ${info.name || 'Unknown'}`, context);
    this.log(`Version: ${info.version || 'Unknown'}`, context);
    this.log(`Environment: ${info.environment || 'Unknown'}`, context);
    this.log(`Uptime: ${this.formatUptime(info.uptime || 0)}`, context);
    this.log(`Node Version: ${info.node_version || 'Unknown'}`, context);
    this.log(`Platform: ${info.platform || 'Unknown'} (${info.arch || 'Unknown'})`, context);

    // Health checks
    if (health.checks) {
      this.log('\nHealth Checks:', context);
      this.log('='.repeat(40), context);
      
      for (const [checkName, checkResult] of Object.entries(health.checks)) {
        const check = checkResult as any;
        const checkIcon = this.getStatusIcon(check.status === 'pass' ? 'healthy' : 'unhealthy');
        const checkStatus = check.status === 'pass' ? 'PASS' : 'FAIL';
        const checkColor = check.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
        
        this.log(`${checkIcon} ${checkName.padEnd(15)} ${checkColor}${checkStatus}\x1b[0m`, context);
        
        if (detailed && check.message) {
          this.log(`    ${check.message}`, context);
        }
        
        if (check.duration) {
          this.log(`    Duration: ${check.duration}ms`, context);
        }
      }
    }

    // System metrics (if available)
    if (detailed && status.metrics) {
      this.displayMetrics(status.metrics, context);
    }

    this.log(`\nLast Updated: ${status.timestamp.toLocaleString()}`, context);
  }

  private displayMetrics(metrics: any, context: CLIContext): void {
    this.log('\nSystem Metrics:', context);
    this.log('='.repeat(40), context);

    // Display key metrics if available
    if (metrics.gauges) {
      for (const [metricName, metricData] of Object.entries(metrics.gauges)) {
        const metric = metricData as any;
        if (metricName.includes('memory') || metricName.includes('cpu') || metricName.includes('active')) {
          this.log(`${metricName}: ${metric.value}`, context);
        }
      }
    }

    if (metrics.counters) {
      for (const [metricName, metricData] of Object.entries(metrics.counters)) {
        const metric = metricData as any;
        if (metricName.includes('test') || metricName.includes('request')) {
          this.log(`${metricName}: ${metric.value}`, context);
        }
      }
    }
  }

  private displayAsYaml(obj: any, context: CLIContext, indent: number = 0): void {
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.log(`${spaces}${key}:`, context);
        this.displayAsYaml(value, context, indent + 1);
      } else if (Array.isArray(value)) {
        this.log(`${spaces}${key}:`, context);
        value.forEach(item => {
          if (typeof item === 'object') {
            this.log(`${spaces}  -`, context);
            this.displayAsYaml(item, context, indent + 2);
          } else {
            this.log(`${spaces}  - ${item}`, context);
          }
        });
      } else {
        this.log(`${spaces}${key}: ${value}`, context);
      }
    }
  }

  private displayStatusChanges(previous: any, current: any, context: CLIContext): void {
    if (previous.overall !== current.overall) {
      const prevColor = this.getStatusColor(previous.overall);
      const currColor = this.getStatusColor(current.overall);
      
      this.log(`\n🔄 Status changed: ${prevColor}${previous.overall}\x1b[0m → ${currColor}${current.overall}\x1b[0m`, context);
    }

    // Check for health check changes
    if (previous.health?.checks && current.health?.checks) {
      for (const [checkName, currentCheck] of Object.entries(current.health.checks)) {
        const prevCheck = previous.health.checks[checkName] as any;
        const currCheck = currentCheck as any;
        
        if (prevCheck && prevCheck.status !== currCheck.status) {
          const icon = currCheck.status === 'pass' ? '✅' : '❌';
          this.log(`${icon} ${checkName}: ${prevCheck.status} → ${currCheck.status}`, context);
        }
      }
    }
  }

  private getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'pass':
        return '✅';
      case 'degraded':
      case 'warning':
        return '⚠️';
      case 'unhealthy':
      case 'critical':
      case 'fail':
        return '❌';
      default:
        return '❓';
    }
  }

  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'pass':
        return '\x1b[32m'; // Green
      case 'degraded':
      case 'warning':
        return '\x1b[33m'; // Yellow
      case 'unhealthy':
      case 'critical':
      case 'fail':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[37m'; // White
    }
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}