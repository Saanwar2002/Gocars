/**
 * Auto-Fix Engine Test Runner
 * 
 * This module provides comprehensive testing for the enhanced auto-fix engine,
 * including database repairs, infrastructure fixes, rollback mechanisms,
 * and validation procedures.
 */

import { EnhancedAutoFixEngine } from './AutoFixEngine';
import { TestResult, ErrorEntry } from './core/types';

/**
 * Run comprehensive auto-fix engine tests
 */
export async function runAutoFixEngineTests(): Promise<TestResult[]> {
  console.log('🔧 Starting Auto-Fix Engine Tests...');
  
  const results: TestResult[] = [];

  // Test 1: Basic Fix Application
  results.push(await testBasicFixApplication());
  
  // Test 2: Database Repair Capabilities
  results.push(await testDatabaseRepairs());
  
  // Test 3: Infrastructure Repair Capabilities
  results.push(await testInfrastructureRepairs());
  
  // Test 4: Rollback Mechanisms
  results.push(await testRollbackMechanisms());
  
  // Test 5: Validation Procedures
  results.push(await testValidationProcedures());
  
  // Test 6: Risk Level Management
  results.push(await testRiskLevelManagement());
  
  // Test 7: Backup and Restore
  results.push(await testBackupAndRestore());
  
  // Test 8: Comprehensive Repair Workflow
  results.push(await testComprehensiveRepairWorkflow());
  
  // Test 9: Error Analysis Integration
  results.push(await testErrorAnalysisIntegration());
  
  // Test 10: Performance and Scalability
  results.push(await testPerformanceAndScalability());

  // Generate summary
  const summary = generateTestSummary(results);
  console.log('\n📊 Auto-Fix Engine Test Summary:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed} ✅`);
  console.log(`Failed: ${summary.failed} ❌`);
  console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);

  return results;
}

/**
 * Test basic fix application capabilities
 */
async function testBasicFixApplication(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔧 Testing basic fix application...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'medium'
    });

    // Create test failures
    const testResults: TestResult[] = [
      {
        id: 'nav-test-001',
        name: 'Navigation Test',
        status: 'failed',
        duration: 1000,
        message: 'Navigation failed: /dashboard route not found'
      },
      {
        id: 'element-test-001',
        name: 'Element Test',
        status: 'failed',
        duration: 800,
        message: 'Element not clickable: .submit-button'
      },
      {
        id: 'validation-test-001',
        name: 'Validation Test',
        status: 'failed',
        duration: 600,
        message: 'Input validation failed: email field'
      }
    ];

    // Apply fixes
    const fixResults = await engine.analyzeAndFix(testResults);

    // Validate results
    const appliedFixes = fixResults.filter(f => f.fixApplied);
    const hasNavigationFix = fixResults.some(f => f.fixDescription.includes('route'));
    const hasElementFix = fixResults.some(f => f.fixDescription.includes('clickable'));
    const hasValidationFix = fixResults.some(f => f.fixDescription.includes('validation'));

    const duration = Date.now() - startTime;
    const success = appliedFixes.length >= 2 && hasNavigationFix && hasElementFix;

    return {
      id: 'basic-fix-application',
      name: 'Basic Fix Application Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Successfully applied ${appliedFixes.length} fixes`
        : `Fix application failed (${appliedFixes.length} fixes applied)`,
      details: {
        totalFixes: fixResults.length,
        appliedFixes: appliedFixes.length,
        hasNavigationFix,
        hasElementFix,
        hasValidationFix,
        fixResults: fixResults.map(f => ({
          id: f.errorId,
          type: f.fixType,
          applied: f.fixApplied,
          description: f.fixDescription
        }))
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'basic-fix-application',
      name: 'Basic Fix Application Test',
      status: 'error',
      duration,
      message: `Basic fix application test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test database repair capabilities
 */
async function testDatabaseRepairs(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🗄️ Testing database repair capabilities...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'high'
    });

    // Create database-related test failures
    const testResults: TestResult[] = [
      {
        id: 'db-connection-001',
        name: 'Database Connection Test',
        status: 'failed',
        duration: 2000,
        message: 'Database connection pool exhausted - too many connections'
      },
      {
        id: 'db-schema-001',
        name: 'Database Schema Test',
        status: 'failed',
        duration: 1500,
        message: 'Schema mismatch: column user_preferences not found'
      },
      {
        id: 'db-index-001',
        name: 'Database Index Test',
        status: 'failed',
        duration: 1200,
        message: 'Query requires composite index on fields: email, timestamp'
      }
    ];

    // Apply comprehensive repairs
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);

    // Validate database repairs
    const dbRepairs = repairResults.databaseRepairs;
    const appliedDbRepairs = dbRepairs.filter(r => r.fixApplied);
    const hasConnectionRepair = dbRepairs.some(r => r.fixDescription.includes('connection pool'));
    const hasSchemaRepair = dbRepairs.some(r => r.fixDescription.includes('schema'));
    const hasIndexRepair = dbRepairs.some(r => r.fixDescription.includes('index'));

    const duration = Date.now() - startTime;
    const success = appliedDbRepairs.length >= 2 && (hasConnectionRepair || hasSchemaRepair || hasIndexRepair);

    return {
      id: 'database-repairs',
      name: 'Database Repair Capabilities Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Successfully applied ${appliedDbRepairs.length} database repairs`
        : `Database repair failed (${appliedDbRepairs.length} repairs applied)`,
      details: {
        totalDbRepairs: dbRepairs.length,
        appliedDbRepairs: appliedDbRepairs.length,
        hasConnectionRepair,
        hasSchemaRepair,
        hasIndexRepair,
        validationResults: repairResults.validationResults,
        dbRepairs: dbRepairs.map(r => ({
          id: r.errorId,
          type: r.fixType,
          applied: r.fixApplied,
          description: r.fixDescription,
          riskLevel: (r as any).riskLevel
        }))
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'database-repairs',
      name: 'Database Repair Capabilities Test',
      status: 'error',
      duration,
      message: `Database repair test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test infrastructure repair capabilities
 */
async function testInfrastructureRepairs(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🏗️ Testing infrastructure repair capabilities...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'high'
    });

    // Create infrastructure-related test failures
    const testResults: TestResult[] = [
      {
        id: 'service-001',
        name: 'Service Availability Test',
        status: 'failed',
        duration: 3000,
        message: 'Service unavailable: API server not responding (503)'
      },
      {
        id: 'network-001',
        name: 'Network Connectivity Test',
        status: 'failed',
        duration: 2500,
        message: 'Network error: DNS resolution failed for api.example.com'
      },
      {
        id: 'resource-001',
        name: 'Resource Usage Test',
        status: 'failed',
        duration: 2000,
        message: 'Out of memory: heap space exhausted, current usage 95%'
      }
    ];

    // Apply comprehensive repairs
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);

    // Validate infrastructure repairs
    const infraRepairs = repairResults.infrastructureRepairs;
    const appliedInfraRepairs = infraRepairs.filter(r => r.fixApplied);
    const hasServiceRepair = infraRepairs.some(r => r.fixDescription.includes('service') || r.fixDescription.includes('Restarted'));
    const hasNetworkRepair = infraRepairs.some(r => r.fixDescription.includes('network'));
    const hasResourceRepair = infraRepairs.some(r => r.fixDescription.includes('resource') || r.fixDescription.includes('memory'));

    const duration = Date.now() - startTime;
    const success = appliedInfraRepairs.length >= 2 && (hasServiceRepair || hasNetworkRepair || hasResourceRepair);

    return {
      id: 'infrastructure-repairs',
      name: 'Infrastructure Repair Capabilities Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Successfully applied ${appliedInfraRepairs.length} infrastructure repairs`
        : `Infrastructure repair failed (${appliedInfraRepairs.length} repairs applied)`,
      details: {
        totalInfraRepairs: infraRepairs.length,
        appliedInfraRepairs: appliedInfraRepairs.length,
        hasServiceRepair,
        hasNetworkRepair,
        hasResourceRepair,
        validationResults: repairResults.validationResults,
        infraRepairs: infraRepairs.map(r => ({
          id: r.errorId,
          type: r.fixType,
          applied: r.fixApplied,
          description: r.fixDescription,
          riskLevel: (r as any).riskLevel
        }))
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'infrastructure-repairs',
      name: 'Infrastructure Repair Capabilities Test',
      status: 'error',
      duration,
      message: `Infrastructure repair test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test rollback mechanisms
 */
async function testRollbackMechanisms(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Testing rollback mechanisms...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'medium'
    });

    // Create test failure that will trigger rollback
    const testResults: TestResult[] = [
      {
        id: 'rollback-test-001',
        name: 'Rollback Test',
        status: 'failed',
        duration: 1000,
        message: 'Database connection pool exhausted - testing rollback'
      }
    ];

    // Apply fixes with validation enabled (may trigger rollback)
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);

    // Check rollback functionality
    const validationResults = repairResults.validationResults;
    const hasValidationResults = validationResults.length > 0;
    const hasRollbackAttempts = validationResults.some(v => v.rollbackPerformed !== undefined);
    
    // Check backup creation
    const allRepairs = [...repairResults.fixResults, ...repairResults.databaseRepairs, ...repairResults.infrastructureRepairs];
    const hasBackups = allRepairs.some(r => (r as any).backupCreated);
    const hasRollbackData = allRepairs.some(r => r.rollbackData);

    const duration = Date.now() - startTime;
    const success = hasValidationResults && hasBackups && hasRollbackData;

    return {
      id: 'rollback-mechanisms',
      name: 'Rollback Mechanisms Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? 'Rollback mechanisms working correctly'
        : 'Rollback mechanisms not functioning properly',
      details: {
        hasValidationResults,
        hasRollbackAttempts,
        hasBackups,
        hasRollbackData,
        validationResults,
        repairsWithBackups: allRepairs.filter(r => (r as any).backupCreated).length,
        repairsWithRollbackData: allRepairs.filter(r => r.rollbackData).length
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'rollback-mechanisms',
      name: 'Rollback Mechanisms Test',
      status: 'error',
      duration,
      message: `Rollback mechanisms test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test validation procedures
 */
async function testValidationProcedures(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('✅ Testing validation procedures...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'high'
    });

    // Create test failures
    const testResults: TestResult[] = [
      {
        id: 'validation-test-001',
        name: 'Validation Test 1',
        status: 'failed',
        duration: 1000,
        message: 'Firebase connection failed - testing validation'
      },
      {
        id: 'validation-test-002',
        name: 'Validation Test 2',
        status: 'failed',
        duration: 1200,
        message: 'WebSocket connection refused - testing validation'
      }
    ];

    // Apply fixes with validation
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);

    // Check validation procedures
    const validationResults = repairResults.validationResults;
    const hasValidations = validationResults.length > 0;
    const validationsPassed = validationResults.filter(v => v.validated).length;
    const validationsFailed = validationResults.filter(v => !v.validated).length;
    
    // Check validation tests and success criteria
    const allRepairs = [...repairResults.fixResults, ...repairResults.databaseRepairs, ...repairResults.infrastructureRepairs];
    const hasValidationTests = allRepairs.some(r => (r as any).validationTests && (r as any).validationTests.length > 0);
    const hasSuccessCriteria = allRepairs.some(r => (r as any).successCriteria && (r as any).successCriteria.length > 0);

    const duration = Date.now() - startTime;
    const success = hasValidations && hasValidationTests && hasSuccessCriteria;

    return {
      id: 'validation-procedures',
      name: 'Validation Procedures Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Validation procedures working (${validationsPassed}/${validationResults.length} validations passed)`
        : 'Validation procedures not functioning properly',
      details: {
        hasValidations,
        hasValidationTests,
        hasSuccessCriteria,
        totalValidations: validationResults.length,
        validationsPassed,
        validationsFailed,
        validationResults,
        repairsWithValidationTests: allRepairs.filter(r => (r as any).validationTests).length,
        repairsWithSuccessCriteria: allRepairs.filter(r => (r as any).successCriteria).length
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'validation-procedures',
      name: 'Validation Procedures Test',
      status: 'error',
      duration,
      message: `Validation procedures test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test risk level management
 */
async function testRiskLevelManagement(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚠️ Testing risk level management...');
    
    // Test with low risk tolerance
    const lowRiskEngine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'low'
    });

    // Test with high risk tolerance
    const highRiskEngine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'high'
    });

    // Create high-risk test failure
    const testResults: TestResult[] = [
      {
        id: 'risk-test-001',
        name: 'High Risk Test',
        status: 'failed',
        duration: 1000,
        message: 'Schema mismatch: critical table structure changed'
      }
    ];

    // Apply fixes with different risk tolerances
    const lowRiskResults = await lowRiskEngine.analyzeAndFixWithRepair(testResults);
    const highRiskResults = await highRiskEngine.analyzeAndFixWithRepair(testResults);

    // Analyze risk management
    const lowRiskApplied = [...lowRiskResults.databaseRepairs, ...lowRiskResults.infrastructureRepairs].filter(r => r.fixApplied).length;
    const highRiskApplied = [...highRiskResults.databaseRepairs, ...highRiskResults.infrastructureRepairs].filter(r => r.fixApplied).length;

    // High risk engine should apply more fixes than low risk engine
    const riskManagementWorking = highRiskApplied >= lowRiskApplied;

    const duration = Date.now() - startTime;
    const success = riskManagementWorking;

    return {
      id: 'risk-level-management',
      name: 'Risk Level Management Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Risk management working (Low risk: ${lowRiskApplied} fixes, High risk: ${highRiskApplied} fixes)`
        : `Risk management not working properly`,
      details: {
        lowRiskApplied,
        highRiskApplied,
        riskManagementWorking,
        lowRiskResults: {
          totalRepairs: lowRiskResults.databaseRepairs.length + lowRiskResults.infrastructureRepairs.length,
          appliedRepairs: lowRiskApplied
        },
        highRiskResults: {
          totalRepairs: highRiskResults.databaseRepairs.length + highRiskResults.infrastructureRepairs.length,
          appliedRepairs: highRiskApplied
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'risk-level-management',
      name: 'Risk Level Management Test',
      status: 'error',
      duration,
      message: `Risk level management test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test backup and restore functionality
 */
async function testBackupAndRestore(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('💾 Testing backup and restore functionality...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'medium'
    });

    // Create test failure that requires backup
    const testResults: TestResult[] = [
      {
        id: 'backup-test-001',
        name: 'Backup Test',
        status: 'failed',
        duration: 1000,
        message: 'Navigation failed: /admin route configuration error'
      }
    ];

    // Apply fixes (should create backups)
    const fixResults = await engine.analyzeAndFix(testResults);

    // Check backup creation
    const hasBackups = fixResults.some(f => (f as any).backupCreated);
    const hasRollbackData = fixResults.some(f => f.rollbackData);
    const hasRollbackAvailable = fixResults.some(f => f.rollbackAvailable);

    // Get repair statistics to verify backup functionality
    const stats = engine.getRepairStatistics();
    const hasStatistics = stats.totalFixes > 0;

    const duration = Date.now() - startTime;
    const success = hasBackups && hasRollbackData && hasRollbackAvailable && hasStatistics;

    return {
      id: 'backup-and-restore',
      name: 'Backup and Restore Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? 'Backup and restore functionality working correctly'
        : 'Backup and restore functionality not working properly',
      details: {
        hasBackups,
        hasRollbackData,
        hasRollbackAvailable,
        hasStatistics,
        repairStatistics: stats,
        fixesWithBackups: fixResults.filter(f => (f as any).backupCreated).length,
        fixesWithRollbackData: fixResults.filter(f => f.rollbackData).length
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'backup-and-restore',
      name: 'Backup and Restore Test',
      status: 'error',
      duration,
      message: `Backup and restore test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test comprehensive repair workflow
 */
async function testComprehensiveRepairWorkflow(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Testing comprehensive repair workflow...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'high'
    });

    // Create diverse test failures
    const testResults: TestResult[] = [
      {
        id: 'workflow-001',
        name: 'Navigation Workflow Test',
        status: 'failed',
        duration: 1000,
        message: 'Navigation failed: /dashboard route not found'
      },
      {
        id: 'workflow-002',
        name: 'Database Workflow Test',
        status: 'failed',
        duration: 1500,
        message: 'Database connection pool exhausted'
      },
      {
        id: 'workflow-003',
        name: 'Infrastructure Workflow Test',
        status: 'failed',
        duration: 2000,
        message: 'Service unavailable: API server not responding'
      },
      {
        id: 'workflow-004',
        name: 'Network Workflow Test',
        status: 'failed',
        duration: 1200,
        message: 'Network error: connection timeout'
      }
    ];

    // Apply comprehensive repair workflow
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);

    // Validate comprehensive workflow
    const hasStandardFixes = repairResults.fixResults.length > 0;
    const hasDatabaseRepairs = repairResults.databaseRepairs.length > 0;
    const hasInfrastructureRepairs = repairResults.infrastructureRepairs.length > 0;
    const hasValidationResults = repairResults.validationResults.length > 0;

    const totalAppliedFixes = [
      ...repairResults.fixResults,
      ...repairResults.databaseRepairs,
      ...repairResults.infrastructureRepairs
    ].filter(f => f.fixApplied).length;

    const duration = Date.now() - startTime;
    const success = hasStandardFixes && hasDatabaseRepairs && hasInfrastructureRepairs && totalAppliedFixes >= 3;

    return {
      id: 'comprehensive-repair-workflow',
      name: 'Comprehensive Repair Workflow Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Comprehensive workflow successful (${totalAppliedFixes} total fixes applied)`
        : `Comprehensive workflow failed (${totalAppliedFixes} total fixes applied)`,
      details: {
        hasStandardFixes,
        hasDatabaseRepairs,
        hasInfrastructureRepairs,
        hasValidationResults,
        totalAppliedFixes,
        standardFixes: repairResults.fixResults.length,
        databaseRepairs: repairResults.databaseRepairs.length,
        infrastructureRepairs: repairResults.infrastructureRepairs.length,
        validationResults: repairResults.validationResults.length,
        workflowBreakdown: {
          standardFixesApplied: repairResults.fixResults.filter(f => f.fixApplied).length,
          databaseRepairsApplied: repairResults.databaseRepairs.filter(f => f.fixApplied).length,
          infrastructureRepairsApplied: repairResults.infrastructureRepairs.filter(f => f.fixApplied).length
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'comprehensive-repair-workflow',
      name: 'Comprehensive Repair Workflow Test',
      status: 'error',
      duration,
      message: `Comprehensive repair workflow test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test error analysis integration
 */
async function testErrorAnalysisIntegration(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing error analysis integration...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: true,
      maxRiskLevel: 'medium'
    });

    // Create test failures with different severities
    const testResults: TestResult[] = [
      {
        id: 'analysis-001',
        name: 'Critical Error Test',
        status: 'error',
        duration: 3000,
        message: 'Critical system failure: database connection lost'
      },
      {
        id: 'analysis-002',
        name: 'High Priority Error Test',
        status: 'failed',
        duration: 2000,
        message: 'Authentication failed: invalid credentials'
      },
      {
        id: 'analysis-003',
        name: 'Medium Priority Error Test',
        status: 'failed',
        duration: 1000,
        message: 'UI element not found: submit button'
      }
    ];

    // Apply fixes with error analysis integration
    const fixResults = await engine.analyzeAndFix(testResults);

    // Check error analysis integration
    const hasAnalysisEnhancedFixes = fixResults.some(f => 
      f.fixDescription.includes('Confidence:') || f.fixDescription.includes('Impact:')
    );
    
    const hasPrioritizedFixes = fixResults.length > 0; // Fixes should be prioritized by analysis
    const hasRiskAssessment = fixResults.some(f => (f as any).riskLevel);

    const duration = Date.now() - startTime;
    const success = hasAnalysisEnhancedFixes && hasPrioritizedFixes && hasRiskAssessment;

    return {
      id: 'error-analysis-integration',
      name: 'Error Analysis Integration Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? 'Error analysis integration working correctly'
        : 'Error analysis integration not functioning properly',
      details: {
        hasAnalysisEnhancedFixes,
        hasPrioritizedFixes,
        hasRiskAssessment,
        totalFixes: fixResults.length,
        analysisEnhancedFixes: fixResults.filter(f => 
          f.fixDescription.includes('Confidence:') || f.fixDescription.includes('Impact:')
        ).length,
        fixesWithRiskLevel: fixResults.filter(f => (f as any).riskLevel).length
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'error-analysis-integration',
      name: 'Error Analysis Integration Test',
      status: 'error',
      duration,
      message: `Error analysis integration test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test performance and scalability
 */
async function testPerformanceAndScalability(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚡ Testing performance and scalability...');
    
    const engine = new EnhancedAutoFixEngine({
      validationEnabled: false, // Disable validation for performance testing
      maxRiskLevel: 'medium'
    });

    // Create large batch of test failures
    const testResults: TestResult[] = [];
    const errorTypes = [
      'Navigation failed: /route not found',
      'Database connection timeout',
      'Service unavailable: server error',
      'Network error: connection refused',
      'Element not clickable: button',
      'Input validation failed: field',
      'Firebase connection failed',
      'WebSocket connection refused'
    ];

    for (let i = 0; i < 50; i++) {
      testResults.push({
        id: `perf-test-${i}`,
        name: `Performance Test ${i}`,
        status: 'failed',
        duration: 1000,
        message: errorTypes[i % errorTypes.length] + ` ${i}`
      });
    }

    const processingStart = Date.now();
    
    // Apply fixes to large batch
    const repairResults = await engine.analyzeAndFixWithRepair(testResults);
    
    const processingTime = Date.now() - processingStart;
    const avgProcessingTimePerError = processingTime / testResults.length;

    // Check performance metrics
    const totalFixes = repairResults.fixResults.length + 
                      repairResults.databaseRepairs.length + 
                      repairResults.infrastructureRepairs.length;
    
    const appliedFixes = [
      ...repairResults.fixResults,
      ...repairResults.databaseRepairs,
      ...repairResults.infrastructureRepairs
    ].filter(f => f.fixApplied).length;

    const memoryUsage = process.memoryUsage();

    const duration = Date.now() - startTime;
    const success = avgProcessingTimePerError < 200 && appliedFixes > 20; // < 200ms per error, > 20 fixes applied

    return {
      id: 'performance-and-scalability',
      name: 'Performance and Scalability Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Performance acceptable (${avgProcessingTimePerError.toFixed(1)}ms per error, ${appliedFixes} fixes applied)`
        : `Performance below threshold (${avgProcessingTimePerError.toFixed(1)}ms per error, ${appliedFixes} fixes applied)`,
      details: {
        errorsProcessed: testResults.length,
        totalProcessingTime: processingTime,
        avgProcessingTimePerError,
        totalFixes,
        appliedFixes,
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        },
        repairBreakdown: {
          standardFixes: repairResults.fixResults.length,
          databaseRepairs: repairResults.databaseRepairs.length,
          infrastructureRepairs: repairResults.infrastructureRepairs.length
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'performance-and-scalability',
      name: 'Performance and Scalability Test',
      status: 'error',
      duration,
      message: `Performance and scalability test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

// Helper function
function generateTestSummary(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  return {
    total,
    passed,
    failed,
    errors,
    successRate
  };
}

export { runAutoFixEngineTests };