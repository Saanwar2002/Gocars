/**
 * AI Feature Test Runner
 * 
 * This module provides a convenient way to run AI feature tests
 * and generate comprehensive reports.
 */

import { AIFeatureTestSuite } from './ai/AIFeatureTestSuite';
import { TestConfiguration, TestResult } from './core/types';

/**
 * Run AI feature tests with default configuration
 */
export async function runAIFeatureTests(): Promise<TestResult[]> {
  console.log('🤖 Starting AI Feature Tests...');
  
  const config: TestConfiguration = {
    id: 'ai-feature-test-config',
    name: 'AI Feature Test Configuration',
    environment: 'development',
    testSuites: ['ai-feature-test-suite'],
    userProfiles: [
      {
        id: 'test-user-1',
        role: 'passenger',
        demographics: {
          age: 30,
          location: 'downtown',
          deviceType: 'mobile',
          experience: 'regular'
        },
        preferences: {
          paymentMethod: 'credit_card',
          notificationSettings: {},
          language: 'en'
        },
        behaviorPatterns: {
          bookingFrequency: 5,
          averageRideDistance: 10,
          preferredTimes: ['morning', 'evening'],
          cancellationRate: 0.05
        }
      }
    ],
    concurrencyLevel: 1,
    timeout: 30000,
    retryAttempts: 2,
    reportingOptions: {
      formats: ['json'],
      includeScreenshots: false,
      includeLogs: true,
      realTimeUpdates: true
    },
    autoFixEnabled: false,
    notificationSettings: {
      enabled: false,
      channels: [],
      thresholds: {
        criticalErrors: 1,
        failureRate: 0.1
      }
    }
  };

  const testSuite = new AIFeatureTestSuite(config);
  
  try {
    await testSuite.setup();
    const results = await testSuite.runTests();
    await testSuite.teardown();
    
    // Generate summary
    const summary = generateTestSummary(results);
    console.log('\n📊 AI Feature Test Summary:');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Errors: ${summary.errors} 🚨`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    
    if (summary.failed > 0 || summary.errors > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter(r => r.status === 'failed' || r.status === 'error')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ AI Feature Tests failed:', error);
    throw error;
  }
}

/**
 * Run AI feature tests with custom configuration
 */
export async function runAIFeatureTestsWithConfig(config: TestConfiguration): Promise<TestResult[]> {
  console.log(`🤖 Starting AI Feature Tests with config: ${config.name}`);
  
  const testSuite = new AIFeatureTestSuite(config);
  
  try {
    await testSuite.setup();
    const results = await testSuite.runTests();
    await testSuite.teardown();
    
    return results;
    
  } catch (error) {
    console.error('❌ AI Feature Tests failed:', error);
    throw error;
  }
}

/**
 * Generate test summary statistics
 */
function generateTestSummary(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  return {
    total,
    passed,
    failed,
    errors,
    skipped,
    successRate
  };
}

/**
 * Generate detailed test report
 */
export function generateAITestReport(results: TestResult[]): any {
  const summary = generateTestSummary(results);
  
  // Group results by test type
  const resultsByType: { [key: string]: TestResult[] } = {};
  results.forEach(result => {
    const testType = result.id.split('-')[0] || 'unknown';
    if (!resultsByType[testType]) {
      resultsByType[testType] = [];
    }
    resultsByType[testType].push(result);
  });
  
  // Calculate metrics by type
  const metricsByType: { [key: string]: any } = {};
  Object.entries(resultsByType).forEach(([type, typeResults]) => {
    const typeSummary = generateTestSummary(typeResults);
    const avgDuration = typeResults.reduce((sum, r) => sum + r.duration, 0) / typeResults.length;
    
    metricsByType[type] = {
      ...typeSummary,
      avgDuration: avgDuration.toFixed(0)
    };
  });
  
  return {
    timestamp: new Date().toISOString(),
    summary,
    metricsByType,
    resultsByType,
    detailedResults: results,
    recommendations: generateRecommendations(results)
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];
  const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error');
  
  if (failedResults.length === 0) {
    recommendations.push('✅ All AI feature tests are passing. System is performing well.');
    return recommendations;
  }
  
  // Analyze failure patterns
  const responseTimeIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('timeout') || 
    r.message?.toLowerCase().includes('response time')
  );
  
  if (responseTimeIssues.length > 0) {
    recommendations.push('⚠️ Consider optimizing AI model response times or increasing timeout thresholds.');
  }
  
  const accuracyIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('accuracy') || 
    r.message?.toLowerCase().includes('validation')
  );
  
  if (accuracyIssues.length > 0) {
    recommendations.push('⚠️ Review AI model accuracy and consider retraining or fine-tuning.');
  }
  
  const resourceIssues = failedResults.filter(r => 
    r.message?.toLowerCase().includes('memory') || 
    r.message?.toLowerCase().includes('resource')
  );
  
  if (resourceIssues.length > 0) {
    recommendations.push('⚠️ Monitor resource usage and consider scaling AI infrastructure.');
  }
  
  const errorRate = (failedResults.length / results.length) * 100;
  if (errorRate > 20) {
    recommendations.push('🚨 High failure rate detected. Investigate AI service health and dependencies.');
  } else if (errorRate > 10) {
    recommendations.push('⚠️ Moderate failure rate. Monitor AI service stability.');
  }
  
  return recommendations;
}

// Export for direct usage
export { AIFeatureTestSuite };