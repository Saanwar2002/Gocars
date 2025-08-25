#!/usr/bin/env node

/**
 * Simple test script to validate auto-fix engine functionality
 * This can be run independently to test the enhanced auto-fix system
 */

import { runAutoFixEngineTests } from './runAutoFixEngineTests';

async function main() {
  console.log('🔧 Testing Enhanced Auto-Fix Engine System...\n');
  
  try {
    // Run the tests
    const results = await runAutoFixEngineTests();
    
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
      'Basic Fix Application': results.find(r => r.id === 'basic-fix-application'),
      'Database Repairs': results.find(r => r.id === 'database-repairs'),
      'Infrastructure Repairs': results.find(r => r.id === 'infrastructure-repairs'),
      'Rollback Mechanisms': results.find(r => r.id === 'rollback-mechanisms'),
      'Validation Procedures': results.find(r => r.id === 'validation-procedures'),
      'Risk Level Management': results.find(r => r.id === 'risk-level-management'),
      'Backup and Restore': results.find(r => r.id === 'backup-and-restore'),
      'Comprehensive Workflow': results.find(r => r.id === 'comprehensive-repair-workflow'),
      'Error Analysis Integration': results.find(r => r.id === 'error-analysis-integration'),
      'Performance & Scalability': results.find(r => r.id === 'performance-and-scalability')
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
    console.log('\n🚀 Auto-Fix Engine Capabilities:');
    
    const basicFixTest = results.find(r => r.id === 'basic-fix-application');
    if (basicFixTest && basicFixTest.details) {
      console.log(`  Standard Fixes: ${basicFixTest.details.appliedFixes}/${basicFixTest.details.totalFixes} applied`);
    }
    
    const dbRepairTest = results.find(r => r.id === 'database-repairs');
    if (dbRepairTest && dbRepairTest.details) {
      console.log(`  Database Repairs: ${dbRepairTest.details.appliedDbRepairs}/${dbRepairTest.details.totalDbRepairs} applied`);
    }
    
    const infraRepairTest = results.find(r => r.id === 'infrastructure-repairs');
    if (infraRepairTest && infraRepairTest.details) {
      console.log(`  Infrastructure Repairs: ${infraRepairTest.details.appliedInfraRepairs}/${infraRepairTest.details.totalInfraRepairs} applied`);
    }
    
    const rollbackTest = results.find(r => r.id === 'rollback-mechanisms');
    if (rollbackTest && rollbackTest.details) {
      console.log(`  Backup & Rollback: ${rollbackTest.details.repairsWithBackups} repairs with backups`);
    }
    
    const validationTest = results.find(r => r.id === 'validation-procedures');
    if (validationTest && validationTest.details) {
      console.log(`  Validation: ${validationTest.details.validationsPassed}/${validationTest.details.totalValidations} validations passed`);
    }
    
    const perfTest = results.find(r => r.id === 'performance-and-scalability');
    if (perfTest && perfTest.details) {
      console.log(`  Performance: ${perfTest.details.avgProcessingTimePerError.toFixed(1)}ms per error (${perfTest.details.errorsProcessed} errors)`);
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
            !['error', 'fixResults', 'dbRepairs', 'infraRepairs'].includes(key)
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
    
    const reportPath = path.join(reportDir, `auto-fix-engine-report-${Date.now()}.json`);
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary,
      testResults: results,
      testTypes,
      recommendations,
      capabilities: {
        standardFixes: basicFixTest?.details?.appliedFixes || 0,
        databaseRepairs: dbRepairTest?.details?.appliedDbRepairs || 0,
        infrastructureRepairs: infraRepairTest?.details?.appliedInfraRepairs || 0,
        backupAndRollback: rollbackTest?.details?.repairsWithBackups || 0,
        validationRate: validationTest?.details ? 
          (validationTest.details.validationsPassed / validationTest.details.totalValidations * 100) : 0,
        performanceMetrics: perfTest?.details || {}
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (summary.failed > 0 || summary.errors > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All auto-fix engine tests passed!');
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
    recommendations.push('✅ All auto-fix engine tests are passing. System is performing optimally.');
    return recommendations;
  }
  
  // Analyze failure patterns
  const basicFixFailed = failedTests.some(t => t.id === 'basic-fix-application');
  if (basicFixFailed) {
    recommendations.push('⚠️ Basic fix application needs improvement. Review fix strategy patterns.');
  }
  
  const databaseRepairFailed = failedTests.some(t => t.id === 'database-repairs');
  if (databaseRepairFailed) {
    recommendations.push('⚠️ Database repair capabilities need enhancement. Check database connection and schema repair logic.');
  }
  
  const infrastructureRepairFailed = failedTests.some(t => t.id === 'infrastructure-repairs');
  if (infrastructureRepairFailed) {
    recommendations.push('⚠️ Infrastructure repair capabilities need improvement. Review service restart and network repair procedures.');
  }
  
  const rollbackFailed = failedTests.some(t => t.id === 'rollback-mechanisms');
  if (rollbackFailed) {
    recommendations.push('⚠️ Rollback mechanisms not working properly. Check backup creation and restoration procedures.');
  }
  
  const validationFailed = failedTests.some(t => t.id === 'validation-procedures');
  if (validationFailed) {
    recommendations.push('⚠️ Validation procedures need improvement. Review validation test execution and success criteria checking.');
  }
  
  const riskManagementFailed = failedTests.some(t => t.id === 'risk-level-management');
  if (riskManagementFailed) {
    recommendations.push('⚠️ Risk level management not working correctly. Review risk assessment and filtering logic.');
  }
  
  const performanceFailed = failedTests.some(t => t.id === 'performance-and-scalability');
  if (performanceFailed) {
    recommendations.push('⚠️ Performance is below expectations. Consider optimizing fix application algorithms and reducing processing overhead.');
  }
  
  const errorRate = (failedTests.length / results.length) * 100;
  if (errorRate > 30) {
    recommendations.push('🚨 High failure rate detected. Conduct comprehensive auto-fix engine review.');
  } else if (errorRate > 15) {
    recommendations.push('⚠️ Moderate failure rate. Monitor auto-fix engine stability and performance.');
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

export { main as testAutoFixEngine };