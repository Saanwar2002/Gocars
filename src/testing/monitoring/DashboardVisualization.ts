/**
 * Dashboard Visualization Components
 * 
 * This module provides visualization components for the real-time monitoring
 * dashboard, including charts, graphs, and visual indicators.
 */

import { MonitoringMetrics, Alert, PerformanceMetrics } from './RealTimeMonitoringDashboard';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }>;
}

export interface VisualizationConfig {
  theme: 'light' | 'dark';
  colors: {
    primary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  animations: boolean;
  refreshRate: number;
}

export class DashboardVisualization {
  private config: VisualizationConfig;

  constructor(config?: Partial<VisualizationConfig>) {
    this.config = {
      theme: 'dark',
      colors: {
        primary: '#007bff',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8'
      },
      animations: true,
      refreshRate: 1000,
      ...config
    };
  }

  /**
   * Generate test execution progress visualization
   */
  public generateTestExecutionChart(metrics: MonitoringMetrics): ChartData {
    const execution = metrics.testExecution;
    
    return {
      labels: ['Passed', 'Failed', 'Error', 'Skipped'],
      datasets: [{
        label: 'Test Results',
        data: [
          execution.passedTests,
          execution.failedTests,
          execution.errorTests,
          execution.skippedTests
        ],
        backgroundColor: [
          this.config.colors.success,
          this.config.colors.danger,
          this.config.colors.warning,
          this.config.colors.info
        ]
      }]
    };
  }

  /**
   * Generate error tracking visualization
   */
  public generateErrorTrackingChart(metrics: MonitoringMetrics): ChartData {
    const tracking = metrics.errorTracking;
    
    return {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Errors by Severity',
        data: [
          tracking.criticalErrors,
          tracking.highSeverityErrors,
          tracking.mediumSeverityErrors,
          tracking.lowSeverityErrors
        ],
        backgroundColor: [
          '#dc3545',
          '#fd7e14',
          '#ffc107',
          '#6c757d'
        ]
      }]
    };
  }

  /**
   * Generate performance metrics visualization
   */
  public generatePerformanceChart(performanceHistory: PerformanceMetrics[]): ChartData {
    const labels = performanceHistory.map((_, index) => `T-${performanceHistory.length - index}`);
    
    return {
      labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data: performanceHistory.map(p => p.responseTime.current),
          borderColor: this.config.colors.primary,
          backgroundColor: this.config.colors.primary + '20',
          fill: true
        },
        {
          label: 'Throughput (req/s)',
          data: performanceHistory.map(p => p.throughput.current),
          borderColor: this.config.colors.success,
          backgroundColor: this.config.colors.success + '20',
          fill: false
        }
      ]
    };
  }

  /**
   * Generate system health visualization
   */
  public generateSystemHealthChart(metrics: MonitoringMetrics): ChartData {
    const health = metrics.systemHealth;
    const components = Object.entries(health.components);
    
    const healthScores = components.map(([_, component]) => {
      switch (component.status) {
        case 'healthy': return 100;
        case 'degraded': return 70;
        case 'unhealthy': return 30;
        case 'critical': return 0;
        default: return 50;
      }
    });

    return {
      labels: components.map(([name]) => name.charAt(0).toUpperCase() + name.slice(1)),
      datasets: [{
        label: 'Component Health Score',
        data: healthScores,
        backgroundColor: healthScores.map(score => {
          if (score >= 90) return this.config.colors.success;
          if (score >= 70) return this.config.colors.warning;
          if (score >= 30) return this.config.colors.danger;
          return '#6c757d';
        })
      }]
    };
  }

  /**
   * Generate HTML dashboard
   */
  public generateHtmlDashboard(metrics: MonitoringMetrics, performanceHistory: PerformanceMetrics[]): string {
    const testChart = this.generateTestExecutionChart(metrics);
    const errorChart = this.generateErrorTrackingChart(metrics);
    const perfChart = this.generatePerformanceChart(performanceHistory);
    const healthChart = this.generateSystemHealthChart(metrics);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-Time Testing Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: ${this.config.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
            color: ${this.config.theme === 'dark' ? '#ffffff' : '#333333'};
            padding: 20px;
        }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .card { 
            background: ${this.config.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
            border-radius: 12px; 
            padding: 20px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 1px solid ${this.config.theme === 'dark' ? '#404040' : '#e0e0e0'};
        }
        .card h3 { margin-bottom: 15px; color: ${this.config.colors.primary}; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; }
        .status-indicator { 
            display: inline-block; 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            margin-right: 8px;
        }
        .status-healthy { background: ${this.config.colors.success}; }
        .status-degraded { background: ${this.config.colors.warning}; }
        .status-unhealthy { background: ${this.config.colors.danger}; }
        .status-critical { background: #6c757d; }
        .progress-bar { 
            width: 100%; 
            height: 20px; 
            background: ${this.config.theme === 'dark' ? '#404040' : '#e0e0e0'};
            border-radius: 10px; 
            overflow: hidden; 
            margin: 10px 0;
        }
        .progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, ${this.config.colors.primary}, ${this.config.colors.success});
            transition: width 0.3s ease;
        }
        .alert { 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 6px; 
            border-left: 4px solid;
        }
        .alert-critical { background: rgba(220, 53, 69, 0.1); border-color: #dc3545; }
        .alert-warning { background: rgba(255, 193, 7, 0.1); border-color: #ffc107; }
        .alert-info { background: rgba(23, 162, 184, 0.1); border-color: #17a2b8; }
        .chart-container { position: relative; height: 300px; margin: 20px 0; }
        .refresh-indicator { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: ${this.config.colors.primary};
            color: white; 
            padding: 10px 15px; 
            border-radius: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="refresh-indicator">🔄 Auto-refresh: ${this.config.refreshRate / 1000}s</div>
    
    <h1>🚀 Real-Time Testing Dashboard</h1>
    <p>Last updated: ${metrics.timestamp.toLocaleString()}</p>
    
    <div class="dashboard">
        <!-- Test Execution Card -->
        <div class="card">
            <h3>📊 Test Execution Progress</h3>
            <div class="metric">
                <span>Progress:</span>
                <span class="metric-value">${metrics.testExecution.progress.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${metrics.testExecution.progress}%"></div>
            </div>
            <div class="metric">
                <span>Completed:</span>
                <span class="metric-value">${metrics.testExecution.completedTests}/${metrics.testExecution.totalTests}</span>
            </div>
            <div class="metric">
                <span>Passed:</span>
                <span class="metric-value" style="color: ${this.config.colors.success}">${metrics.testExecution.passedTests}</span>
            </div>
            <div class="metric">
                <span>Failed:</span>
                <span class="metric-value" style="color: ${this.config.colors.danger}">${metrics.testExecution.failedTests}</span>
            </div>
            <div class="metric">
                <span>Avg Duration:</span>
                <span class="metric-value">${metrics.testExecution.averageTestDuration.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>Tests/sec:</span>
                <span class="metric-value">${metrics.testExecution.testsPerSecond.toFixed(2)}</span>
            </div>
            ${metrics.testExecution.currentTest ? `<div class="metric"><span>Current:</span><span class="metric-value">${metrics.testExecution.currentTest}</span></div>` : ''}
            <div class="chart-container">
                <canvas id="testChart"></canvas>
            </div>
        </div>

        <!-- Error Tracking Card -->
        <div class="card">
            <h3>🚨 Error Tracking</h3>
            <div class="metric">
                <span>Total Errors:</span>
                <span class="metric-value">${metrics.errorTracking.totalErrors}</span>
            </div>
            <div class="metric">
                <span>Error Rate:</span>
                <span class="metric-value">${metrics.errorTracking.errorRate}/min</span>
            </div>
            <div class="metric">
                <span>Trend:</span>
                <span class="metric-value">${metrics.errorTracking.errorTrend === 'increasing' ? '📈' : metrics.errorTracking.errorTrend === 'decreasing' ? '📉' : '➡️'} ${metrics.errorTracking.errorTrend}</span>
            </div>
            <div class="chart-container">
                <canvas id="errorChart"></canvas>
            </div>
        </div>

        <!-- Performance Metrics Card -->
        <div class="card">
            <h3>⚡ Performance Metrics</h3>
            <div class="metric">
                <span>Response Time:</span>
                <span class="metric-value">${metrics.performance.responseTime.current.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>P95:</span>
                <span class="metric-value">${metrics.performance.responseTime.p95.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>Throughput:</span>
                <span class="metric-value">${metrics.performance.throughput.current.toFixed(1)} req/s</span>
            </div>
            <div class="metric">
                <span>Memory:</span>
                <span class="metric-value">${metrics.performance.resourceUsage.memory}MB (${metrics.performance.resourceUsage.memoryPercentage}%)</span>
            </div>
            <div class="metric">
                <span>CPU:</span>
                <span class="metric-value">${metrics.performance.resourceUsage.cpu.toFixed(1)}%</span>
            </div>
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>

        <!-- System Health Card -->
        <div class="card">
            <h3>🏥 System Health</h3>
            <div class="metric">
                <span>Overall Health:</span>
                <span class="metric-value">
                    <span class="status-indicator status-${metrics.systemHealth.overallHealth}"></span>
                    ${metrics.systemHealth.overallHealth.toUpperCase()} (${metrics.systemHealth.healthScore}%)
                </span>
            </div>
            <div class="metric">
                <span>Uptime:</span>
                <span class="metric-value">${Math.floor(metrics.systemHealth.uptime / 1000 / 60)} minutes</span>
            </div>
            ${Object.entries(metrics.systemHealth.components).map(([name, component]) => `
                <div class="metric">
                    <span>${name.charAt(0).toUpperCase() + name.slice(1)}:</span>
                    <span class="metric-value">
                        <span class="status-indicator status-${component.status}"></span>
                        ${component.status} (${component.responseTime.toFixed(0)}ms)
                    </span>
                </div>
            `).join('')}
            <div class="chart-container">
                <canvas id="healthChart"></canvas>
            </div>
        </div>

        <!-- Alerts Card -->
        <div class="card">
            <h3>🔔 Active Alerts</h3>
            ${metrics.systemHealth.alerts.length === 0 ? 
                '<p style="color: #6c757d; font-style: italic;">No active alerts</p>' :
                metrics.systemHealth.alerts.slice(0, 5).map(alert => `
                    <div class="alert alert-${alert.type}">
                        <strong>${alert.title}</strong><br>
                        <small>${alert.message}</small><br>
                        <small style="color: #6c757d;">${alert.timestamp.toLocaleString()}</small>
                    </div>
                `).join('')
            }
        </div>
    </div>

    <script>
        // Chart configurations
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        };

        // Test Execution Chart
        new Chart(document.getElementById('testChart'), {
            type: 'doughnut',
            data: ${JSON.stringify(testChart)},
            options: { ...chartOptions, scales: undefined }
        });

        // Error Tracking Chart
        new Chart(document.getElementById('errorChart'), {
            type: 'bar',
            data: ${JSON.stringify(errorChart)},
            options: chartOptions
        });

        // Performance Chart
        new Chart(document.getElementById('performanceChart'), {
            type: 'line',
            data: ${JSON.stringify(perfChart)},
            options: chartOptions
        });

        // System Health Chart
        new Chart(document.getElementById('healthChart'), {
            type: 'radar',
            data: ${JSON.stringify(healthChart)},
            options: { ...chartOptions, scales: { r: { beginAtZero: true, max: 100 } } }
        });

        // Auto-refresh
        setTimeout(() => {
            window.location.reload();
        }, ${this.config.refreshRate});
    </script>
</body>
</html>`;
  }

  /**
   * Generate console dashboard
   */
  public generateConsoleDashboard(metrics: MonitoringMetrics): string {
    const execution = metrics.testExecution;
    const errors = metrics.errorTracking;
    const performance = metrics.performance;
    const health = metrics.systemHealth;

    const progressBar = this.generateProgressBar(execution.progress, 30);
    const healthIndicator = this.getHealthIndicator(health.overallHealth);

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          🚀 REAL-TIME TESTING DASHBOARD                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Last Updated: ${metrics.timestamp.toLocaleString().padEnd(40)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 📊 TEST EXECUTION PROGRESS                                                   ║
║ Progress: ${progressBar} ${execution.progress.toFixed(1).padStart(5)}%        ║
║ Completed: ${execution.completedTests.toString().padStart(4)}/${execution.totalTests.toString().padEnd(4)} │ Passed: ${execution.passedTests.toString().padStart(4)} │ Failed: ${execution.failedTests.toString().padStart(4)} │ Errors: ${execution.errorTests.toString().padStart(4)} ║
║ Avg Duration: ${execution.averageTestDuration.toFixed(0).padStart(6)}ms │ Tests/sec: ${execution.testsPerSecond.toFixed(2).padStart(6)} │ ETA: ${Math.floor(execution.estimatedTimeRemaining / 1000).toString().padStart(4)}s ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 🚨 ERROR TRACKING                                                            ║
║ Total: ${errors.totalErrors.toString().padStart(4)} │ Rate: ${errors.errorRate.toString().padStart(3)}/min │ Trend: ${errors.errorTrend.padEnd(10)} │ Critical: ${errors.criticalErrors.toString().padStart(3)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ⚡ PERFORMANCE METRICS                                                        ║
║ Response: ${performance.responseTime.current.toFixed(0).padStart(5)}ms │ P95: ${performance.responseTime.p95.toFixed(0).padStart(5)}ms │ Throughput: ${performance.throughput.current.toFixed(1).padStart(6)} req/s ║
║ Memory: ${performance.resourceUsage.memory.toString().padStart(4)}MB (${performance.resourceUsage.memoryPercentage.toString().padStart(2)}%) │ CPU: ${performance.resourceUsage.cpu.toFixed(1).padStart(5)}% │ Active: ${performance.concurrency.activeTests.toString().padStart(3)} tests ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 🏥 SYSTEM HEALTH                                                             ║
║ Overall: ${healthIndicator} ${health.overallHealth.toUpperCase().padEnd(10)} (${health.healthScore.toString().padStart(3)}%) │ Uptime: ${Math.floor(health.uptime / 1000 / 60).toString().padStart(4)} min ║
║ DB: ${this.getComponentStatus(health.components.database.status)} │ WS: ${this.getComponentStatus(health.components.webSocket.status)} │ API: ${this.getComponentStatus(health.components.api.status)} │ FS: ${this.getComponentStatus(health.components.fileSystem.status)} │ NET: ${this.getComponentStatus(health.components.network.status)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 🔔 ACTIVE ALERTS: ${health.alerts.length.toString().padStart(2)}                                                        ║
${health.alerts.slice(0, 3).map(alert => 
  `║ ${this.getAlertIcon(alert.type)} ${alert.title.substring(0, 60).padEnd(60)} ║`
).join('\n')}
${health.alerts.length === 0 ? '║ No active alerts                                                             ║' : ''}
╚══════════════════════════════════════════════════════════════════════════════╝
`;
  }

  private generateProgressBar(progress: number, width: number): string {
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private getHealthIndicator(health: string): string {
    switch (health) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  private getComponentStatus(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️ ';
      case 'unhealthy': return '❌';
      case 'critical': return '🚨';
      default: return '❓';
    }
  }

  private getAlertIcon(type: string): string {
    switch (type) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️ ';
      case 'info': return 'ℹ️ ';
      default: return '📢';
    }
  }
}

export const dashboardVisualization = new DashboardVisualization();