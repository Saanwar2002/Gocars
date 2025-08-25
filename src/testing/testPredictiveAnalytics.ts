#!/usr/bin/env node

/**
 * Simple test script to validate predictive analytics functionality
 * This can be run independently to test the predictive analytics system
 */

import { runPredictiveAnalyticsTests, generatePredictiveAnalyticsReport } from './runPredictiveAnalyticsTests';

async function main() {
  console.log('🔮 Testing Predictive Analytics System...\n');
  
  try {
    // Run the tests
    const results = await runPredictiveAnalyticsTests();
    
    // Generate detailed report
    const report = generatePredictiveAnalyticsReport(results);
    
    // Display summary
    console.log('\n📊 Final Test Summary:');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`Errors: ${report.summary.errors} 🚨`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${report.summary.avgResponseTime.toFixed(0)}ms`);
    
    if (report.summary.performanceMetrics) {
      console.log('\n⚡ Performance Metrics:');
      console.log(`Average Accuracy: ${report.summary.performanceMetrics.avgAccuracy.toFixed(3)}`);
      console.log(`Average Data Quality: ${report.summary.performanceMetrics.avgDataQuality.toFixed(3)}`);
      console.log(`Model Consistency: ${report.summary.performanceMetrics.modelConsistency ? '✅' : '❌'}`);
    }
    
    // Display test breakdown
    console.log('\n📈 Test Breakdown:');
    console.log(`Forecasting Tests: ${report.performanceAnalysis.forecastingTests}`);
    console.log(`Performance Tests: ${report.performanceAnalysis.performanceTests}`);
    console.log(`Anomaly Tests: ${report.performanceAnalysis.anomalyTests}`);
    console.log(`Trend Tests: ${report.performanceAnalysis.trendTests}`);
    console.log(`Benchmark Tests: ${report.performanceAnalysis.benchmarkTests}`);
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    // Save detailed report
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = 'test-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `predictive-analytics-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (report.summary.failed > 0 || report.summary.errors > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All predictive analytics tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as testPredictiveAnalytics };