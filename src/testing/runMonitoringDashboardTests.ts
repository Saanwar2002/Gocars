import { MonitoringDashboard, DashboardMetrics, Alert } from '../monitoring/dashboard/MonitoringDashboard';
import { DashboardRenderer } from '../monitoring/dashboard/DashboardRenderer';
import { SystemHealthMonitor } from '../monitoring/health/SystemHealthMonitor';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

class MonitoringDashboardTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Monitoring Dashboard Tests...\n');

    await this.testMonitoringDashboardCore();
    await this.testDashboardMetricsUpdates();
    await this.testAlertSystem();
    await this.testSystemHealthMonitor();
    await this.testDashboardRenderer();
    await this.testIntegration();

    this.printSummary();
    return this.results;
  }

  private async testMonitoringDashboardCore(): Promise<void> {
    console.log('📊 Testing Monitoring Dashboard Core...');

    // Test dashboard initialization
    await this.runTest('Dashboard Initialization', async () => {
      const dashboard = new MonitoringDashboard();
      const metrics = dashboard.getMetrics();
      
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Dashboard metrics not initialized properly');
      }

      if (metrics.testExecution.totalTests !== 0 || 
          metrics.performance.averageResponseTime !== 0 ||
          metrics.systemHealth.overallStatus !== 'healthy') {
        throw new Error('Initial metrics values are incorrect');
      }

      return 'Dashboard initialized with correct default metrics';
    });

    // Test dashboard start/stop
    await this.runTest('Dashboard Start/Stop', async () => {
      const dashboard = new MonitoringDashboard();
      let startEventFired = false;
      let stopEventFired = false;

      dashboard.on('dashboardStarted', () => { startEventFired = true; });
      dashboard.on('dashboardStopped', () => { stopEventFired = true; });

      dashboard.start();
      await this.wait(100);
      
      if (!startEventFired) {
        throw new Error('Dashboard start event not fired');
      }

      dashboard.stop();
      await this.wait(100);

      if (!stopEventFired) {
        throw new Error('Dashboard stop event not fired');
      }

      return 'Dashboard start/stop events work correctly';
    });

    // Test metrics update events
    await this.runTest('Metrics Update Events', async () => {
      const dashboard = new MonitoringDashboard();
      let metricsUpdated = false;

      dashboard.on('metricsUpdated', () => { metricsUpdated = true; });
      dashboard.start();
      
      await this.wait(6000); // Wait for at least one update cycle
      dashboard.stop();

      if (!metricsUpdated) {
        throw new Error('Metrics update event not fired');
      }

      return 'Metrics update events fire correctly';
    });
  }

  private async testDashboardMetricsUpdates(): Promise<void> {
    console.log('📈 Testing Dashboard Metrics Updates...');

    // Test test progress updates
    await this.runTest('Test Progress Updates', async () => {
      const dashboard = new MonitoringDashboard();
      let progressUpdated = false;

      dashboard.on('testProgressUpdated', () => { progressUpdated = true; });

      dashboard.updateTestProgress({
        totalTests: 100,
        passedTests: 75,
        failedTests: 20,
        skippedTests: 5,
        runningTests: 0
      });

      const metrics = dashboard.getMetrics();
      
      if (metrics.testExecution.totalTests !== 100 ||
          metrics.testExecution.passedTests !== 75 ||
          metrics.testExecution.progress !== 100) {
        throw new Error('Test progress not updated correctly');
      }

      if (!progressUpdated) {
        throw new Error('Test progress update event not fired');
      }

      return 'Test progress updates work correctly';
    });

    // Test performance metrics updates
    await this.runTest('Performance Metrics Updates', async () => {
      const dashboard = new MonitoringDashboard();
      let performanceUpdated = false;

      dashboard.on('performanceUpdated', () => { performanceUpdated = true; });

      dashboard.updatePerformanceMetrics({
        averageResponseTime: 1500,
        throughput: 250.5,
        errorRate: 2.3,
        memoryUsage: 67.8,
        cpuUsage: 45.2
      });

      const metrics = dashboard.getMetrics();
      
      if (metrics.performance.averageResponseTime !== 1500 ||
          metrics.performance.throughput !== 250.5 ||
          metrics.performance.errorRate !== 2.3) {
        throw new Error('Performance metrics not updated correctly');
      }

      if (!performanceUpdated) {
        throw new Error('Performance update event not fired');
      }

      return 'Performance metrics updates work correctly';
    });

    // Test system health updates
    await this.runTest('System Health Updates', async () => {
      const dashboard = new MonitoringDashboard();
      let healthUpdated = false;

      dashboard.on('systemHealthUpdated', () => { healthUpdated = true; });

      dashboard.updateSystemHealth({
        overallStatus: 'warning',
        uptime: 86400000, // 1 day
        services: [
          {
            name: 'Test Service',
            status: 'healthy',
            responseTime: 250,
            lastCheck: new Date(),
            errorCount: 0
          }
        ]
      });

      const metrics = dashboard.getMetrics();
      
      if (metrics.systemHealth.overallStatus !== 'warning' ||
          metrics.systemHealth.uptime !== 86400000 ||
          metrics.systemHealth.services.length !== 1) {
        throw new Error('System health not updated correctly');
      }

      if (!healthUpdated) {
        throw new Error('System health update event not fired');
      }

      return 'System health updates work correctly';
    });
  }

  private async testAlertSystem(): Promise<void> {
    console.log('🚨 Testing Alert System...');

    // Test alert rules
    await this.runTest('Alert Rules Management', async () => {
      const dashboard = new MonitoringDashboard();
      const initialRules = dashboard.getAlertRules();
      
      if (initialRules.length === 0) {
        throw new Error('No default alert rules found');
      }

      const ruleId = dashboard.addAlertRule({
        name: 'Test Rule',
        condition: 'testValue > threshold',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 60000
      });

      const updatedRules = dashboard.getAlertRules();
      if (updatedRules.length !== initialRules.length + 1) {
        throw new Error('Alert rule not added correctly');
      }

      dashboard.removeAlertRule(ruleId);
      const finalRules = dashboard.getAlertRules();
      if (finalRules.length !== initialRules.length) {
        throw new Error('Alert rule not removed correctly');
      }

      return 'Alert rules management works correctly';
    });

    // Test alert triggering
    await this.runTest('Alert Triggering', async () => {
      const dashboard = new MonitoringDashboard();
      let alertTriggered = false;
      let triggeredAlert: Alert | null = null;

      dashboard.on('alertTriggered', (alert: Alert) => {
        alertTriggered = true;
        triggeredAlert = alert;
      });

      // Update performance to trigger high error rate alert
      dashboard.updatePerformanceMetrics({
        errorRate: 15 // Above critical threshold of 10%
      });

      dashboard.start();
      await this.wait(6000); // Wait for alert check cycle
      dashboard.stop();

      if (!alertTriggered || !triggeredAlert) {
        throw new Error('Alert not triggered when threshold exceeded');
      }

      if (triggeredAlert.severity !== 'critical') {
        throw new Error('Alert severity incorrect');
      }

      return 'Alert triggering works correctly';
    });

    // Test alert acknowledgment and resolution
    await this.runTest('Alert Acknowledgment and Resolution', async () => {
      const dashboard = new MonitoringDashboard();
      let alertTriggered = false;
      let alertAcknowledged = false;
      let alertResolved = false;
      let alertId = '';

      dashboard.on('alertTriggered', (alert: Alert) => {
        alertTriggered = true;
        alertId = alert.id;
      });

      dashboard.on('alertAcknowledged', () => { alertAcknowledged = true; });
      dashboard.on('alertResolved', () => { alertResolved = true; });

      // Trigger an alert
      dashboard.updatePerformanceMetrics({ errorRate: 15 });
      dashboard.start();
      await this.wait(6000);
      dashboard.stop();

      if (!alertTriggered) {
        throw new Error('Alert not triggered');
      }

      // Acknowledge the alert
      dashboard.acknowledgeAlert(alertId);
      if (!alertAcknowledged) {
        throw new Error('Alert acknowledgment event not fired');
      }

      // Resolve the alert
      dashboard.resolveAlert(alertId);
      if (!alertResolved) {
        throw new Error('Alert resolution event not fired');
      }

      const alerts = dashboard.getAlerts();
      const alert = alerts.find(a => a.id === alertId);
      if (!alert || !alert.acknowledged || !alert.resolvedAt) {
        throw new Error('Alert status not updated correctly');
      }

      return 'Alert acknowledgment and resolution work correctly';
    });
  }

  private async testSystemHealthMonitor(): Promise<void> {
    console.log('🏥 Testing System Health Monitor...');

    // Test health monitor initialization
    await this.runTest('Health Monitor Initialization', async () => {
      const monitor = new SystemHealthMonitor();
      const config = monitor.getConfig();
      
      if (!config || config.services.length === 0) {
        throw new Error('Health monitor not initialized with default services');
      }

      if (config.interval <= 0 || config.timeout <= 0) {
        throw new Error('Health monitor configuration invalid');
      }

      return 'Health monitor initialized correctly';
    });

    // Test health check execution
    await this.runTest('Health Check Execution', async () => {
      const monitor = new SystemHealthMonitor({
        interval: 2000,
        services: [
          {
            name: 'Test HTTP Service',
            type: 'http',
            healthCheckUrl: 'https://httpbin.org/status/200',
            expectedResponseTime: 1000,
            criticalThreshold: 3000
          }
        ]
      });

      let healthCheckCompleted = false;
      let systemHealth: any = null;

      monitor.on('healthCheckCompleted', (health) => {
        healthCheckCompleted = true;
        systemHealth = health;
      });

      monitor.start();
      await this.wait(3000); // Wait for health check
      monitor.stop();

      if (!healthCheckCompleted || !systemHealth) {
        throw new Error('Health check not completed');
      }

      if (!systemHealth.services || systemHealth.services.length === 0) {
        throw new Error('No service health results');
      }

      return 'Health check execution works correctly';
    });

    // Test service management
    await this.runTest('Service Management', async () => {
      const monitor = new SystemHealthMonitor();
      const initialConfig = monitor.getConfig();
      const initialServiceCount = initialConfig.services.length;

      monitor.addService({
        name: 'New Test Service',
        type: 'http',
        healthCheckUrl: 'https://example.com',
        expectedResponseTime: 1000,
        criticalThreshold: 3000
      });

      const updatedConfig = monitor.getConfig();
      if (updatedConfig.services.length !== initialServiceCount + 1) {
        throw new Error('Service not added correctly');
      }

      monitor.removeService('New Test Service');
      const finalConfig = monitor.getConfig();
      if (finalConfig.services.length !== initialServiceCount) {
        throw new Error('Service not removed correctly');
      }

      return 'Service management works correctly';
    });
  }

  private async testDashboardRenderer(): Promise<void> {
    console.log('🎨 Testing Dashboard Renderer...');

    // Test renderer initialization
    await this.runTest('Renderer Initialization', async () => {
      const dashboard = new MonitoringDashboard();
      const renderer = new DashboardRenderer(dashboard);
      
      if (!renderer) {
        throw new Error('Dashboard renderer not created');
      }

      return 'Dashboard renderer initialized correctly';
    });

    // Test HTML generation
    await this.runTest('HTML Generation', async () => {
      const dashboard = new MonitoringDashboard();
      const renderer = new DashboardRenderer(dashboard);
      
      // Create a test container
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'test-dashboard';
        document.body.appendChild(container);

        try {
          renderer.render('test-dashboard');
          
          const dashboardElement = document.querySelector('.monitoring-dashboard');
          if (!dashboardElement) {
            throw new Error('Dashboard HTML not generated');
          }

          const sections = dashboardElement.querySelectorAll('.dashboard-section');
          if (sections.length === 0) {
            throw new Error('Dashboard sections not generated');
          }

          return 'Dashboard HTML generated correctly';
        } finally {
          document.body.removeChild(container);
          renderer.destroy();
        }
      } else {
        // Skip DOM tests in Node.js environment
        return 'Dashboard HTML generation test skipped (no DOM)';
      }
    });
  }

  private async testIntegration(): Promise<void> {
    console.log('🔗 Testing Integration...');

    // Test dashboard and health monitor integration
    await this.runTest('Dashboard and Health Monitor Integration', async () => {
      const dashboard = new MonitoringDashboard();
      const healthMonitor = new SystemHealthMonitor({
        interval: 1000,
        services: [
          {
            name: 'Integration Test Service',
            type: 'http',
            healthCheckUrl: 'https://httpbin.org/status/200',
            expectedResponseTime: 1000,
            criticalThreshold: 3000
          }
        ]
      });

      let healthUpdated = false;

      // Connect health monitor to dashboard
      healthMonitor.on('healthCheckCompleted', (systemHealth) => {
        dashboard.updateSystemHealth(systemHealth);
        healthUpdated = true;
      });

      healthMonitor.start();
      await this.wait(2000); // Wait for health check
      healthMonitor.stop();

      if (!healthUpdated) {
        throw new Error('Health monitor data not integrated with dashboard');
      }

      const metrics = dashboard.getMetrics();
      if (metrics.systemHealth.services.length === 0) {
        throw new Error('Service health data not updated in dashboard');
      }

      return 'Dashboard and health monitor integration works correctly';
    });

    // Test error propagation
    await this.runTest('Error Propagation', async () => {
      const dashboard = new MonitoringDashboard();
      
      // Add some errors
      dashboard.addError({
        id: 'test-error-1',
        severity: 'critical',
        message: 'Test critical error',
        component: 'TestComponent',
        timestamp: new Date(),
        count: 1
      });

      dashboard.addError({
        id: 'test-error-2',
        severity: 'medium',
        message: 'Test warning error',
        component: 'TestComponent',
        timestamp: new Date(),
        count: 1
      });

      const metrics = dashboard.getMetrics();
      
      if (metrics.errors.criticalErrors !== 1 || 
          metrics.errors.warnings !== 1 ||
          metrics.errors.totalErrors !== 2) {
        throw new Error('Error counts not updated correctly');
      }

      if (metrics.errors.recentErrors.length !== 2) {
        throw new Error('Recent errors not stored correctly');
      }

      return 'Error propagation works correctly';
    });
  }

  private async runTest(testName: string, testFunction: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        message,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        testName,
        passed: false,
        message,
        duration,
        details: error
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }

    console.log('\n🎉 Monitoring Dashboard testing completed!');
  }
}

// Export for use in other test files
export { MonitoringDashboardTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MonitoringDashboardTester();
  tester.runAllTests().catch(console.error);
}