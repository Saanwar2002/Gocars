import { MonitoringDashboard, DashboardMetrics, Alert, ServiceHealthStatus } from './MonitoringDashboard';

export interface DashboardConfig {
  refreshInterval: number;
  theme: 'light' | 'dark';
  showAlerts: boolean;
  showPerformanceCharts: boolean;
  showSystemHealth: boolean;
  showTestProgress: boolean;
}

export class DashboardRenderer {
  private dashboard: MonitoringDashboard;
  private config: DashboardConfig;
  private container: HTMLElement | null = null;

  constructor(dashboard: MonitoringDashboard, config: Partial<DashboardConfig> = {}) {
    this.dashboard = dashboard;
    this.config = {
      refreshInterval: 5000,
      theme: 'light',
      showAlerts: true,
      showPerformanceCharts: true,
      showSystemHealth: true,
      showTestProgress: true,
      ...config
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.dashboard.on('metricsUpdated', (metrics: DashboardMetrics) => {
      this.updateDisplay(metrics);
    });

    this.dashboard.on('alertTriggered', (alert: Alert) => {
      this.showAlertNotification(alert);
    });

    this.dashboard.on('testProgressUpdated', () => {
      this.updateTestProgressDisplay();
    });

    this.dashboard.on('performanceUpdated', () => {
      this.updatePerformanceDisplay();
    });

    this.dashboard.on('systemHealthUpdated', () => {
      this.updateSystemHealthDisplay();
    });
  }

  public render(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    this.container.innerHTML = this.generateDashboardHTML();
    this.applyStyles();
    this.attachEventHandlers();
    
    // Start the dashboard
    this.dashboard.start();
  }

  private generateDashboardHTML(): string {
    return `
      <div class="monitoring-dashboard ${this.config.theme}">
        <header class="dashboard-header">
          <h1>Testing Agent Monitoring Dashboard</h1>
          <div class="dashboard-controls">
            <button id="refresh-btn" class="btn btn-primary">Refresh</button>
            <button id="alerts-btn" class="btn btn-secondary">Alerts (<span id="alert-count">0</span>)</button>
            <select id="theme-selector">
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>
        </header>

        <div class="dashboard-content">
          ${this.config.showAlerts ? this.generateAlertsSection() : ''}
          ${this.config.showTestProgress ? this.generateTestProgressSection() : ''}
          ${this.config.showPerformanceCharts ? this.generatePerformanceSection() : ''}
          ${this.config.showSystemHealth ? this.generateSystemHealthSection() : ''}
        </div>

        <div id="alert-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Active Alerts</h2>
            <div id="alerts-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  private generateAlertsSection(): string {
    return `
      <section class="dashboard-section alerts-section">
        <h2>System Alerts</h2>
        <div class="alerts-summary">
          <div class="alert-badge critical">
            <span class="count" id="critical-alerts">0</span>
            <span class="label">Critical</span>
          </div>
          <div class="alert-badge warning">
            <span class="count" id="warning-alerts">0</span>
            <span class="label">Warning</span>
          </div>
          <div class="alert-badge info">
            <span class="count" id="info-alerts">0</span>
            <span class="label">Info</span>
          </div>
        </div>
        <div class="recent-alerts" id="recent-alerts">
          <!-- Recent alerts will be populated here -->
        </div>
      </section>
    `;
  }

  private generateTestProgressSection(): string {
    return `
      <section class="dashboard-section test-progress-section">
        <h2>Test Execution Progress</h2>
        <div class="progress-overview">
          <div class="progress-bar-container">
            <div class="progress-bar" id="test-progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <span class="progress-text" id="progress-text">0% Complete</span>
          </div>
          <div class="test-stats">
            <div class="stat-item">
              <span class="stat-value" id="total-tests">0</span>
              <span class="stat-label">Total Tests</span>
            </div>
            <div class="stat-item passed">
              <span class="stat-value" id="passed-tests">0</span>
              <span class="stat-label">Passed</span>
            </div>
            <div class="stat-item failed">
              <span class="stat-value" id="failed-tests">0</span>
              <span class="stat-label">Failed</span>
            </div>
            <div class="stat-item running">
              <span class="stat-value" id="running-tests">0</span>
              <span class="stat-label">Running</span>
            </div>
          </div>
          <div class="time-estimate">
            <span id="estimated-time">Calculating...</span>
          </div>
        </div>
      </section>
    `;
  }

  private generatePerformanceSection(): string {
    return `
      <section class="dashboard-section performance-section">
        <h2>Performance Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Response Time</h3>
            <div class="metric-value" id="response-time">0ms</div>
            <div class="metric-chart" id="response-time-chart"></div>
          </div>
          <div class="metric-card">
            <h3>Throughput</h3>
            <div class="metric-value" id="throughput">0 req/s</div>
            <div class="metric-chart" id="throughput-chart"></div>
          </div>
          <div class="metric-card">
            <h3>Error Rate</h3>
            <div class="metric-value" id="error-rate">0%</div>
            <div class="metric-chart" id="error-rate-chart"></div>
          </div>
          <div class="metric-card">
            <h3>Memory Usage</h3>
            <div class="metric-value" id="memory-usage">0%</div>
            <div class="metric-progress">
              <div class="progress-fill" id="memory-progress" style="width: 0%"></div>
            </div>
          </div>
          <div class="metric-card">
            <h3>CPU Usage</h3>
            <div class="metric-value" id="cpu-usage">0%</div>
            <div class="metric-progress">
              <div class="progress-fill" id="cpu-progress" style="width: 0%"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private generateSystemHealthSection(): string {
    return `
      <section class="dashboard-section system-health-section">
        <h2>System Health</h2>
        <div class="health-overview">
          <div class="overall-status" id="overall-status">
            <div class="status-indicator healthy"></div>
            <span class="status-text">System Healthy</span>
          </div>
          <div class="uptime">
            <span class="uptime-label">Uptime:</span>
            <span class="uptime-value" id="uptime">0s</span>
          </div>
        </div>
        <div class="services-grid" id="services-grid">
          <!-- Service health cards will be populated here -->
        </div>
      </section>
    `;
  }

  private updateDisplay(metrics: DashboardMetrics): void {
    this.updateAlertCounts();
    this.updateTestProgressDisplay();
    this.updatePerformanceDisplay();
    this.updateSystemHealthDisplay();
  }

  private updateAlertCounts(): void {
    const alerts = this.dashboard.getAlerts();
    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length;
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.resolvedAt).length;
    const infoCount = alerts.filter(a => a.severity === 'info' && !a.resolvedAt).length;

    this.updateElement('critical-alerts', criticalCount.toString());
    this.updateElement('warning-alerts', warningCount.toString());
    this.updateElement('info-alerts', infoCount.toString());
    this.updateElement('alert-count', (criticalCount + warningCount + infoCount).toString());

    this.updateRecentAlerts(alerts.slice(0, 5));
  }

  private updateTestProgressDisplay(): void {
    const metrics = this.dashboard.getMetrics();
    const { testExecution } = metrics;

    this.updateElement('total-tests', testExecution.totalTests.toString());
    this.updateElement('passed-tests', testExecution.passedTests.toString());
    this.updateElement('failed-tests', testExecution.failedTests.toString());
    this.updateElement('running-tests', testExecution.runningTests.toString());
    this.updateElement('progress-text', `${testExecution.progress.toFixed(1)}% Complete`);

    const progressBar = document.querySelector('#test-progress-bar .progress-fill') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${testExecution.progress}%`;
    }

    const estimatedTime = this.formatTime(testExecution.estimatedTimeRemaining);
    this.updateElement('estimated-time', `Estimated time remaining: ${estimatedTime}`);
  }

  private updatePerformanceDisplay(): void {
    const metrics = this.dashboard.getMetrics();
    const { performance } = metrics;

    this.updateElement('response-time', `${performance.averageResponseTime.toFixed(0)}ms`);
    this.updateElement('throughput', `${performance.throughput.toFixed(1)} req/s`);
    this.updateElement('error-rate', `${performance.errorRate.toFixed(2)}%`);
    this.updateElement('memory-usage', `${performance.memoryUsage.toFixed(1)}%`);
    this.updateElement('cpu-usage', `${performance.cpuUsage.toFixed(1)}%`);

    // Update progress bars
    const memoryProgress = document.getElementById('memory-progress') as HTMLElement;
    if (memoryProgress) {
      memoryProgress.style.width = `${performance.memoryUsage}%`;
      memoryProgress.className = `progress-fill ${this.getProgressClass(performance.memoryUsage)}`;
    }

    const cpuProgress = document.getElementById('cpu-progress') as HTMLElement;
    if (cpuProgress) {
      cpuProgress.style.width = `${performance.cpuUsage}%`;
      cpuProgress.className = `progress-fill ${this.getProgressClass(performance.cpuUsage)}`;
    }
  }

  private updateSystemHealthDisplay(): void {
    const metrics = this.dashboard.getMetrics();
    const { systemHealth } = metrics;

    // Update overall status
    const statusElement = document.getElementById('overall-status');
    if (statusElement) {
      const indicator = statusElement.querySelector('.status-indicator') as HTMLElement;
      const text = statusElement.querySelector('.status-text') as HTMLElement;
      
      if (indicator && text) {
        indicator.className = `status-indicator ${systemHealth.overallStatus}`;
        text.textContent = `System ${systemHealth.overallStatus.charAt(0).toUpperCase() + systemHealth.overallStatus.slice(1)}`;
      }
    }

    // Update uptime
    this.updateElement('uptime', this.formatTime(systemHealth.uptime * 1000));

    // Update services
    this.updateServicesGrid(systemHealth.services);
  }

  private updateServicesGrid(services: ServiceHealthStatus[]): void {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    grid.innerHTML = services.map(service => `
      <div class="service-card ${service.status}">
        <div class="service-header">
          <h4>${service.name}</h4>
          <div class="service-status ${service.status}"></div>
        </div>
        <div class="service-metrics">
          <div class="service-metric">
            <span class="metric-label">Response Time:</span>
            <span class="metric-value">${service.responseTime.toFixed(0)}ms</span>
          </div>
          <div class="service-metric">
            <span class="metric-label">Errors:</span>
            <span class="metric-value">${service.errorCount}</span>
          </div>
          <div class="service-metric">
            <span class="metric-label">Last Check:</span>
            <span class="metric-value">${this.formatRelativeTime(service.lastCheck)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  private updateRecentAlerts(alerts: Alert[]): void {
    const container = document.getElementById('recent-alerts');
    if (!container) return;

    if (alerts.length === 0) {
      container.innerHTML = '<p class="no-alerts">No recent alerts</p>';
      return;
    }

    container.innerHTML = alerts.map(alert => `
      <div class="alert-item ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}">
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-time">${this.formatRelativeTime(alert.timestamp)}</div>
        </div>
        <div class="alert-actions">
          ${!alert.acknowledged ? `<button onclick="acknowledgeAlert('${alert.id}')" class="btn btn-sm">Acknowledge</button>` : ''}
          ${!alert.resolvedAt ? `<button onclick="resolveAlert('${alert.id}')" class="btn btn-sm">Resolve</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  private showAlertNotification(alert: Alert): void {
    // Create a toast notification for new alerts
    const notification = document.createElement('div');
    notification.className = `alert-notification ${alert.severity}`;
    notification.innerHTML = `
      <div class="notification-content">
        <strong>${alert.severity.toUpperCase()}</strong>
        <p>${alert.message}</p>
      </div>
      <button class="close-notification">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Add click handler for close button
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
    }
  }

  private attachEventHandlers(): void {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.dashboard.emit('manualRefresh');
      });
    }

    // Alerts button
    const alertsBtn = document.getElementById('alerts-btn');
    if (alertsBtn) {
      alertsBtn.addEventListener('click', () => {
        this.showAlertsModal();
      });
    }

    // Theme selector
    const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
    if (themeSelector) {
      themeSelector.value = this.config.theme;
      themeSelector.addEventListener('change', (e) => {
        this.config.theme = (e.target as HTMLSelectElement).value as 'light' | 'dark';
        this.applyTheme();
      });
    }

    // Modal close
    const modal = document.getElementById('alert-modal');
    const closeBtn = modal?.querySelector('.close');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    // Global alert functions
    (window as any).acknowledgeAlert = (alertId: string) => {
      this.dashboard.acknowledgeAlert(alertId);
    };

    (window as any).resolveAlert = (alertId: string) => {
      this.dashboard.resolveAlert(alertId);
    };
  }

  private showAlertsModal(): void {
    const modal = document.getElementById('alert-modal');
    const alertsList = document.getElementById('alerts-list');
    
    if (!modal || !alertsList) return;

    const alerts = this.dashboard.getAlerts();
    alertsList.innerHTML = alerts.map(alert => `
      <div class="modal-alert-item ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''} ${alert.resolvedAt ? 'resolved' : ''}">
        <div class="alert-header">
          <span class="alert-severity">${alert.severity.toUpperCase()}</span>
          <span class="alert-time">${alert.timestamp.toLocaleString()}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
        <div class="alert-status">
          ${alert.acknowledged ? '<span class="status-badge">Acknowledged</span>' : ''}
          ${alert.resolvedAt ? '<span class="status-badge">Resolved</span>' : ''}
        </div>
      </div>
    `).join('');

    modal.style.display = 'block';
  }

  private updateElement(id: string, content: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  }

  private getProgressClass(value: number): string {
    if (value >= 90) return 'critical';
    if (value >= 75) return 'warning';
    return 'normal';
  }

  private applyStyles(): void {
    if (!document.getElementById('dashboard-styles')) {
      const styles = document.createElement('style');
      styles.id = 'dashboard-styles';
      styles.textContent = this.getDashboardCSS();
      document.head.appendChild(styles);
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.container) {
      this.container.className = `monitoring-dashboard ${this.config.theme}`;
    }
  }

  private getDashboardCSS(): string {
    return `
      .monitoring-dashboard {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        min-height: 100vh;
        transition: all 0.3s ease;
      }

      .monitoring-dashboard.light {
        background-color: #f5f5f5;
        color: #333;
      }

      .monitoring-dashboard.dark {
        background-color: #1a1a1a;
        color: #fff;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .dark .dashboard-header {
        background: #2d2d2d;
      }

      .dashboard-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn:hover {
        opacity: 0.8;
      }

      .dashboard-content {
        display: grid;
        gap: 20px;
      }

      .dashboard-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .dark .dashboard-section {
        background: #2d2d2d;
      }

      .alerts-summary {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }

      .alert-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        border-radius: 8px;
        min-width: 80px;
      }

      .alert-badge.critical {
        background: #dc3545;
        color: white;
      }

      .alert-badge.warning {
        background: #ffc107;
        color: #333;
      }

      .alert-badge.info {
        background: #17a2b8;
        color: white;
      }

      .alert-badge .count {
        font-size: 24px;
        font-weight: bold;
      }

      .progress-bar-container {
        margin-bottom: 20px;
      }

      .progress-bar {
        width: 100%;
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: #28a745;
        transition: width 0.3s ease;
      }

      .progress-fill.warning {
        background: #ffc107;
      }

      .progress-fill.critical {
        background: #dc3545;
      }

      .progress-text {
        display: block;
        text-align: center;
        margin-top: 5px;
        font-weight: bold;
      }

      .test-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
      }

      .stat-item {
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        background: #f8f9fa;
      }

      .dark .stat-item {
        background: #3d3d3d;
      }

      .stat-item.passed {
        border-left: 4px solid #28a745;
      }

      .stat-item.failed {
        border-left: 4px solid #dc3545;
      }

      .stat-item.running {
        border-left: 4px solid #007bff;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }

      .metric-card {
        padding: 20px;
        border-radius: 8px;
        background: #f8f9fa;
        text-align: center;
      }

      .dark .metric-card {
        background: #3d3d3d;
      }

      .metric-value {
        font-size: 28px;
        font-weight: bold;
        margin: 10px 0;
        color: #007bff;
      }

      .metric-progress {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
      }

      .health-overview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .dark .health-overview {
        background: #3d3d3d;
      }

      .overall-status {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .status-indicator {
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }

      .status-indicator.healthy {
        background: #28a745;
      }

      .status-indicator.warning {
        background: #ffc107;
      }

      .status-indicator.critical {
        background: #dc3545;
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
      }

      .service-card {
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #28a745;
      }

      .service-card.healthy {
        background: #d4edda;
        border-color: #28a745;
      }

      .service-card.degraded {
        background: #fff3cd;
        border-color: #ffc107;
      }

      .service-card.down {
        background: #f8d7da;
        border-color: #dc3545;
      }

      .dark .service-card.healthy {
        background: #1e4d2b;
      }

      .dark .service-card.degraded {
        background: #4d3d1a;
      }

      .dark .service-card.down {
        background: #4d1e20;
      }

      .service-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .service-status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .service-status.healthy {
        background: #28a745;
      }

      .service-status.degraded {
        background: #ffc107;
      }

      .service-status.down {
        background: #dc3545;
      }

      .service-metrics {
        display: grid;
        gap: 5px;
      }

      .service-metric {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }

      .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
      }

      .alert-item.critical {
        border-color: #dc3545;
        background: #f8d7da;
      }

      .alert-item.warning {
        border-color: #ffc107;
        background: #fff3cd;
      }

      .alert-item.info {
        border-color: #17a2b8;
        background: #d1ecf1;
      }

      .dark .alert-item.critical {
        background: #4d1e20;
      }

      .dark .alert-item.warning {
        background: #4d3d1a;
      }

      .dark .alert-item.info {
        background: #1a3d42;
      }

      .alert-item.acknowledged {
        opacity: 0.7;
      }

      .alert-actions {
        display: flex;
        gap: 10px;
      }

      .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
      }

      .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
      }

      .modal-content {
        background-color: white;
        margin: 5% auto;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .dark .modal-content {
        background-color: #2d2d2d;
      }

      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
      }

      .close:hover {
        color: #000;
      }

      .dark .close:hover {
        color: #fff;
      }

      .alert-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      }

      .alert-notification.critical {
        background: #dc3545;
        color: white;
      }

      .alert-notification.warning {
        background: #ffc107;
        color: #333;
      }

      .alert-notification.info {
        background: #17a2b8;
        color: white;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .close-notification {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        float: right;
        margin-left: 10px;
      }

      .no-alerts {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 20px;
      }
    `;
  }

  public destroy(): void {
    this.dashboard.stop();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}