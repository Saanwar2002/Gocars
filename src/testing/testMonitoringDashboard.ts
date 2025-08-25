#!/usr/bin/env node

/**
 * Simple test script to validate monitoring dashboard functionality
 * This can be run independently to test the real-time monitoring system
 */

import { runMonitoringDashboardTests } from './runMonitoringDashboardTests';

async function main() {
  console.log('📊 Testing Real-Time Monitoring Dashboard System...\n');
  
  try {
    // Run the tests
    const results = await runMonitoringDashboardTests();
    
    // Display summary
    console.log('\n📊 Final Test Summary:');
    console.log('='.repeat(50));
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      successRate: results.length > 0 ? (results.filter(r => r.status === 'passed').length / results.length) * 100 : 0
    };
    
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Errors: ${summary.errors} 🚨`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    
    // Display test breakdown
    console.log('\n📈 Test Breakdown:');
    const testTypes = {
      'Dashboard Initialization': results.find(r => r.id === 'dashboard-initialization'),
      'Test Execution Tracking': results.find(r => r.id === 'test-execution-tracking'),
      'Error Tracking & Alerting': results.find(r => r.id === 'error-tracking-alerting'),
      'Performance Monitoring': results.find(r => r.id === 'performance-metrics-monitoring'),
      'System Health Monitoring': results.find(r => r.id === 'system-health-monitoring'),
      'Real-time Updates': results.find(r => r.id === 'real-time-updates'),
      'Alert Management': results.find(r => r.id === 'alert-management'),
      'Dashboard Visualization': results.find(r => r.id === 'dashboard-visualization'),
      'Data Export & Persistence': results.find(r => r.id === 'data-export-persistence'),
      'Performance & Scalability': results.find(r => r.id === 'performance-scalability')
    };
    
    for (const [testName, result] of Object.entries(testTypes)) {
      if (result) {
        const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '🚨';
        console.log(`${icon} ${testName}: ${result.status} (${result.duration}ms)`);
        if (result.status !== 'passed' && result.message) {
          console.log(`    ${result.message}`);
        }
      }
    }
    
    // Display capability highlights
    console.log('\n🚀 Monitoring Dashboard Capabilities:');
    
    const initTest = results.find(r => r.id === 'dashboard-initialization');
    if (initTest && initTest.details) {
      console.log(`  ✅ Dashboard Components: ${Object.keys(initTest.details.initialMetrics || {}).length} initialized`);
    }
    
    const trackingTest = results.find(r => r.id === 'test-execution-tracking');
    if (trackingTest && trackingTest.details) {
      const exec = trackingTest.details.executionMetrics;
      if (exec) {
        console.log(`  📊 Test Tracking: ${exec.completedTests}/${exec.totalTests} tests (${exec.progress?.toFixed(1)}% progress)`);
      }
    }
    
    const errorTest = results.find(r => r.id === 'error-tracking-alerting');
    if (errorTest && errorTest.details) {
      console.log(`  🚨 Error Tracking: ${errorTest.details.trackingMetrics?.totalErrors || 0} errors tracked, ${errorTest.details.alertsGenerated || 0} alerts`);
    }
    
    const perfTest = results.find(r => r.id === 'performance-metrics-monitoring');
    if (perfTest && perfTest.details) {
      console.log(`  ⚡ Performance: ${perfTest.details.historyLength || 0} data points collected`);
    }
    
    const healthTest = results.find(r => r.id === 'system-health-monitoring');
    if (healthTest && healthTest.details) {
      console.log(`  🏥 System Health: ${healthTest.details.componentCount || 0} components monitored (${healthTest.details.systemHealth?.healthScore || 0}% score)`);
    }
    
    const alertTest = results.find(r => r.id === 'alert-management');
    if (alertTest && alertTest.details) {
      console.log(`  🔔 Alert Management: ${alertTest.details.totalAlerts || 0} alerts generated, ${alertTest.details.activeAlerts || 0} active`);
    }
    
    const vizTest = results.find(r => r.id === 'dashboard-visualization');
    if (vizTest && vizTest.details) {
      console.log(`  📈 Visualization: HTML (${vizTest.details.htmlDashboardSize || 0} chars), Console (${vizTest.details.consoleDashboardSize || 0} chars)`);
    }
    
    const scalabilityTest = results.find(r => r.id === 'performance-scalability');
    if (scalabilityTest && scalabilityTest.details) {
      console.log(`  ⚡ Scalability: ${scalabilityTest.details.totalUpdates || 0} updates in ${scalabilityTest.details.processingTime || 0}ms (${scalabilityTest.details.avgProcessingTimePerUpdate?.toFixed(2) || 0}ms/update)`);
    }
    
    // Display detailed results for failed tests
    const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Test Details:');
      failedTests.forEach(test => {
        console.log(`\n  Test: ${test.name}`);
        console.log(`  Status: ${test.status}`);
        console.log(`  Message: ${test.message}`);
        if (test.details && typeof test.details === 'object') {
          const detailKeys = Object.keys(test.details).filter(key => 
            !['error', 'initialMetrics', 'executionMetrics', 'trackingMetrics', 'performanceMetrics', 'systemHealth'].includes(key)
          );
          if (detailKeys.length > 0) {
            console.log(`  Key Metrics:`);
            detailKeys.slice(0, 5).forEach(key => {
              const value = test.details[key];
              if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
                console.log(`    ${key}: ${value}`);
              }
            });
          }
        }
      });
    }
    
    // Display recommendations
    const recommendations = generateRecommendations(results);
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    // Save detailed report
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = 'test-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `monitoring-dashboard-report-${Date.now()}.json`);
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary,
      testResults: results,
      testTypes,
      recommendations,
      capabilities: {
        dashboardComponents: initTest?.details?.initialMetrics ? Object.keys(initTest.details.initialMetrics).length : 0,
        testTracking: trackingTest?.details?.executionMetrics || {},
        errorTracking: errorTest?.details?.trackingMetrics || {},
        performanceMonitoring: perfTest?.details?.historyLength || 0,
        systemHealthMonitoring: healthTest?.details?.componentCount || 0,
        alertManagement: alertTest?.details?.totalAlerts || 0,
        visualization: {
          htmlDashboard: vizTest?.details?.htmlDashboardSize || 0,
          consoleDashboard: vizTest?.details?.consoleDashboardSize || 0
        },
        scalabilityMetrics: scalabilityTest?.details || {}
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (summary.failed > 0 || summary.errors > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All monitoring dashboard tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');
  
  if (failedTests.length === 0) {
    recommendations.push('✅ All monitoring dashboard tests are passing. System is performing optimally.');
    return recommendations;
  }
  
  // Analyze failure patterns
  const initFailed = failedTests.some(t => t.id === 'dashboard-initialization');
  if (initFailed) {
    recommendations.push('⚠️ Dashboard initialization issues detected. Check component setup and configuration.');
  }
  
  const trackingFailed = failedTests.some(t => t.id === 'test-execution-tracking');
  if (trackingFailed) {
    recommendations.push('⚠️ Test execution tracking not working properly. Review metric calculation and update logic.');
  }
  
  const errorTrackingFailed = failedTests.some(t => t.id === 'error-tracking-alerting');
  if (errorTrackingFailed) {
    recommendations.push('⚠️ Error tracking and alerting system needs attention. Check error categorization and alert thresholds.');
  }
  
  const performanceFailed = failedTests.some(t => t.id === 'performance-metrics-monitoring');
  if (performanceFailed) {
    recommendations.push('⚠️ Performance metrics monitoring issues detected. Review resource usage calculation and data collection.');
  }
  
  const healthFailed = failedTests.some(t => t.id === 'system-health-monitoring');
  if (healthFailed) {
    recommendations.push('⚠️ System health monitoring not functioning correctly. Check component health checks and scoring logic.');
  }
  
  const updatesFailed = failedTests.some(t => t.id === 'real-time-updates');
  if (updatesFailed) {
    recommendations.push('⚠️ Real-time updates not working properly. Review event emission and update intervals.');
  }
  
  const alertsFailed = failedTests.some(t => t.id === 'alert-management');
  if (alertsFailed) {
    recommendations.push('⚠️ Alert management system needs improvement. Check alert generation, acknowledgment, and threshold logic.');
  }
  
  const vizFailed = failedTests.some(t => t.id === 'dashboard-visualization');
  if (vizFailed) {
    recommendations.push('⚠️ Dashboard visualization issues detected. Review chart generation and HTML/console output formatting.');
  }
  
  const exportFailed = failedTests.some(t => t.id === 'data-export-persistence');
  if (exportFailed) {
    recommendations.push('⚠️ Data export and persistence not working correctly. Check data serialization and retrieval methods.');
  }
  
  const scalabilityFailed = failedTests.some(t => t.id === 'performance-scalability');
  if (scalabilityFailed) {
    recommendations.push('⚠️ Performance and scalability issues detected. Consider optimizing data processing and memory usage.');
  }
  
  const errorRate = (failedTests.length / results.length) * 100;
  if (errorRate > 30) {
    recommendations.push('🚨 High failure rate detected. Conduct comprehensive monitoring dashboard system review.');
  } else if (errorRate > 15) {
    recommendations.push('⚠️ Moderate failure rate. Monitor dashboard system stability and performance.');
  }
  
  return recommendations;
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as testMonitoringDashboard };