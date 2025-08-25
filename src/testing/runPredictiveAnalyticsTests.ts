/**
 * Predictive Analytics Test Runner
 * 
 * This module provides a comprehensive test runner for predictive analytics
 * capabilities, including forecasting accuracy, data quality validation,
 * and model performance benchmarks.
 * 
 * Requirements: 9.3, 9.5
 */

import { PredictiveAnalyticsTester } from './ai/PredictiveAnalyticsTester';
import { TestConfiguration, TestResult } from './core/types';

/**
 * Run comprehensive predictive analytics tests
 */
export async function runPredictiveAnalyticsTests(): Promise<TestResult[]> {
  console.log('🔮 Starting Comprehensive Predictive Analytics Tests...');
  
  const config: TestConfiguration = {
    id: 'predictive-analytics-test-config',
    name: 'Predictive Analytics Test Configuration',
    environment: 'development',
    testSuites: ['predictive-analytics-test-suite'],
    userProfiles: [
      {
        id: 'analytics-test-user',
        role: 'admin',
        demographics: {
          age: 35,
          location: 'headquarters',
          deviceType: 'desktop',
          experience: 'power'
        },
        preferences: {
          paymentMethod: 'corporate',
          notificationSettings: {},
          language: 'en'
        },
        behaviorPatterns: {
          bookingFrequency: 0,
          averageRideDistance: 0,
          preferredTimes: [],
          cancellationRate: 0
        }
      }
    ],
    concurrencyLevel: 5,
    timeout: 60000, // 60 seconds for complex analytics
    retryAttempts: 2,
    reportingOptions: {
      formats: ['json', 'html'],
      includeScreenshots: false,
      includeLogs: true,
      realTimeUpdates: true
    },
    autoFixEnabled: false,
    notificationSettings: {
      enabled: true,
      channels: ['console'],
      thresholds: {
        criticalErrors: 1,
        failureRate: 0.2
      }
    }
  };

  const tester = new PredictiveAnalyticsTester(config);
  
  try {
    await tester.initialize();
    const results = await tester.runTests();
    await tester.cleanup();
    
    // Generate comprehensive summary
    const summary = generatePredictiveAnalyticsSummary(results);
    console.log('\n📊 Predictive Analytics Test Summary:');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Errors: ${summary.errors} 🚨`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${summary.avgResponseTime.toFixed(0)}ms`);
    
    // Display performance metrics
    if (summary.performanceMetrics) {
      console.log('\n⚡ Performance Metrics:');
      console.log(`Forecasting Accuracy: ${summary.performanceMetrics.avgAccuracy.toFixed(3)}`);
      console.log(`Data Quality Score: ${summary.performanceMetrics.avgDataQuality.toFixed(3)}`);
      console.log(`Model Consistency: ${summary.performanceMetrics.modelConsistency ? '✅' : '❌'}`);
    }
    
    // Display failed tests details
    if (summary.failed > 0 || summary.errors > 0) {
      console.log('\n❌ Failed/Error Tests:');
      results
        .filter(r => r.status === 'failed' || r.status === 'error')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
          if (r.details && r.details.validationResults) {
            console.log(`    Validation Issues: ${JSON.stringify(r.details.validationResults, null, 2)}`);
          }
        });
    }
    
    // Display recommendations
    const recommendations = generateRecommendations(results);
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Predictive Analytics Tests failed:', error);
    throw error;
  }
}

/**
 * Run predictive analytics tests with custom configuration
 */
export async function runPredictiveAnalyticsTestsWithConfig(config: TestConfiguration): Promise<TestResult[]> {
  console.log(`🔮 Starting Predictive Analytics Tests with config: ${config.name}`);
  
  const tester = new PredictiveAnalyticsTester(config);
  
  try {
    await tester.initialize();
    const results = await tester.runTests();
    await tester.cleanup();
    
    return results;
    
  } catch (error) {
    console.error('❌ Predictive Analytics Tests failed:', error);
    throw error;
  }
}

/**
 * Generate comprehensive test summary with analytics-specific metrics
 */
function generatePredictiveAnalyticsSummary(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  // Calculate average response time
  const responseTimes = results
    .filter(r => r.duration > 0)
    .map(r => r.duration);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  // Extract performance metrics from test details
  const performanceMetrics = extractPerformanceMetrics(results);
  
  // Categorize results by test type
  const resultsByType = categorizeResultsByType(results);
  
  return {
    total,
    passed,
    failed,
    errors,
    skipped,
    successRate,
    avgResponseTime,
    performanceMetrics,
    resultsByType
  };
}

/**
 * Extract performance metrics from test results
 */
function extractPerformanceMetrics(results: TestResult[]) {
  const accuracyValues: number[] = [];
  const dataQualityValues: number[] = [];
  const confidenceValues: number[] = [];
  let modelConsistency = true;
  
  results.forEach(result => {
    if (result.details) {
      // Extract accuracy values
      if (result.details.metrics && typeof result.details.metrics.accuracy === 'number') {
        accuracyValues.push(result.details.metrics.accuracy);
      }
      if (result.details.accuracy && typeof result.details.accuracy === 'number') {
        accuracyValues.push(result.details.accuracy);
      }
      
      // Extract data quality values
      if (result.details.metrics && typeof result.details.metrics.dataQuality === 'number') {
        dataQualityValues.push(result.details.metrics.dataQuality);
      }
      if (result.details.dataQuality && typeof result.details.dataQuality === 'number') {
        dataQualityValues.push(result.details.dataQuality);
      }
      
      // Extract confidence values
      if (result.details.metrics && typeof result.details.metrics.confidence === 'number') {
        confidenceValues.push(result.details.metrics.confidence);
      }
      if (result.details.confidence && typeof result.details.confidence === 'number') {
        confidenceValues.push(result.details.confidence);
      }
      
      // Check model consistency
      if (result.id.includes('consistency') && result.status !== 'passed') {
        modelConsistency = false;
      }
    }
  });
  
  const avgAccuracy = accuracyValues.length > 0 
    ? accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length 
    : 0;
  
  const avgDataQuality = dataQualityValues.length > 0 
    ? dataQualityValues.reduce((a, b) => a + b, 0) / dataQualityValues.length 
    : 0;
  
  const avgConfidence = confidenceValues.length > 0 
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length 
    : 0;
  
  return {
    avgAccuracy,
    avgDataQuality,
    avgConfidence,
    modelConsistency,
    totalAccuracyMeasurements: accuracyValues.length,
    totalDataQualityMeasurements: dataQualityValues.length,
    totalConfidenceMeasurements: confidenceValues.length
  };
}

/**
 * Categorize results by test type for detailed analysis
 */
function categorizeResultsByType(results: TestResult[]) {
  const categories = {
    forecasting: [] as TestResult[],
    performance: [] as TestResult[],
    anomaly: [] as TestResult[],
    trend: [] as TestResult[],
    benchmark: [] as TestResult[]
  };
  
  results.forEach(result => {
    if (result.id.includes('forecast') || result.id.includes('demand')) {
      categories.forecasting.push(result);
    } else if (result.id.includes('performance') || result.id.includes('model')) {
      categories.performance.push(result);
    } else if (result.id.includes('anomaly')) {
      categories.anomaly.push(result);
    } else if (result.id.includes('trend')) {
      categories.trend.push(result);
    } else if (result.id.includes('benchmark')) {
      categories.benchmark.push(result);
    }
  });
  
  return categories;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];
  const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error');
  
  if (failedResults.length === 0) {
    recommendations.push('✅ All predictive analytics tests are passing. System is performing optimally.');
    return recommendations;
  }
  
  // Analyze failure patterns
  const accuracyIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('accuracy') || 
    r.message?.toLowerCase().includes('threshold')
  );
  
  if (accuracyIssues.length > 0) {
    recommendations.push('⚠️ Consider retraining predictive models or adjusting accuracy thresholds.');
  }
  
  const responseTimeIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('response time') || 
    r.message?.toLowerCase().includes('timeout')
  );
  
  if (responseTimeIssues.length > 0) {
    recommendations.push('⚠️ Optimize predictive analytics service performance or increase timeout limits.');
  }
  
  const dataQualityIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('data quality') || 
    r.message?.toLowerCase().includes('validation')
  );
  
  if (dataQualityIssues.length > 0) {
    recommendations.push('⚠️ Improve data quality validation and preprocessing pipelines.');
  }
  
  const consistencyIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('consistency') || 
    r.message?.toLowerCase().includes('variance')
  );
  
  if (consistencyIssues.length > 0) {
    recommendations.push('⚠️ Investigate model consistency issues and consider ensemble methods.');
  }
  
  const concurrencyIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('concurrent') || 
    r.message?.toLowerCase().includes('load')
  );
  
  if (concurrencyIssues.length > 0) {
    recommendations.push('⚠️ Scale predictive analytics infrastructure to handle concurrent requests.');
  }
  
  const errorRate = (failedResults.length / results.length) * 100;
  if (errorRate > 30) {
    recommendations.push('🚨 High failure rate detected. Conduct comprehensive system health check.');
  } else if (errorRate > 15) {
    recommendations.push('⚠️ Moderate failure rate. Monitor predictive analytics service stability.');
  }
  
  return recommendations;
}

/**
 * Generate detailed predictive analytics test report
 */
export function generatePredictiveAnalyticsReport(results: TestResult[]): any {
  const summary = generatePredictiveAnalyticsSummary(results);
  const recommendations = generateRecommendations(results);
  
  // Calculate additional metrics
  const testDuration = results.reduce((total, result) => total + result.duration, 0);
  const avgTestDuration = results.length > 0 ? testDuration / results.length : 0;
  
  return {
    timestamp: new Date().toISOString(),
    testType: 'predictive_analytics',
    summary,
    recommendations,
    metrics: {
      totalTestDuration: testDuration,
      avgTestDuration,
      testsPerSecond: testDuration > 0 ? (results.length / (testDuration / 1000)) : 0
    },
    detailedResults: results,
    performanceAnalysis: {
      forecastingTests: summary.resultsByType.forecasting.length,
      performanceTests: summary.resultsByType.performance.length,
      anomalyTests: summary.resultsByType.anomaly.length,
      trendTests: summary.resultsByType.trend.length,
      benchmarkTests: summary.resultsByType.benchmark.length
    }
  };
}

// Export for direct usage
export { PredictiveAnalyticsTester };