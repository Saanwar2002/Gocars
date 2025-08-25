/**
 * Error Analysis Test Runner
 * 
 * This module provides comprehensive testing for the error analysis and
 * categorization engine, including pattern recognition, correlation analysis,
 * and root cause analysis validation.
 */

import { ErrorAnalysisEngine, ErrorAnalysisResult } from './core/ErrorAnalysisEngine';
import { ErrorEntry, TestResult } from './core/types';

/**
 * Run comprehensive error analysis tests
 */
export async function runErrorAnalysisTests(): Promise<TestResult[]> {
  console.log('🔍 Starting Error Analysis and Categorization Tests...');
  
  const engine = new ErrorAnalysisEngine();
  const results: TestResult[] = [];

  // Test 1: Pattern Recognition
  results.push(await testPatternRecognition(engine));
  
  // Test 2: Error Categorization
  results.push(await testErrorCategorization(engine));
  
  // Test 3: Severity Assessment
  results.push(await testSeverityAssessment(engine));
  
  // Test 4: Correlation Analysis
  results.push(await testCorrelationAnalysis(engine));
  
  // Test 5: Root Cause Analysis
  results.push(await testRootCauseAnalysis(engine));
  
  // Test 6: Impact Assessment
  results.push(await testImpactAssessment(engine));
  
  // Test 7: Trend Analysis
  results.push(await testTrendAnalysis(engine));
  
  // Test 8: Batch Processing
  results.push(await testBatchProcessing(engine));
  
  // Test 9: Performance Testing
  results.push(await testPerformance(engine));
  
  // Test 10: Edge Cases
  results.push(await testEdgeCases(engine));

  // Generate summary
  const summary = generateTestSummary(results);
  console.log('\n📊 Error Analysis Test Summary:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed} ✅`);
  console.log(`Failed: ${summary.failed} ❌`);
  console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);

  return results;
}

/**
 * Test pattern recognition capabilities
 */
async function testPatternRecognition(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing pattern recognition...');
    
    const testErrors: ErrorEntry[] = [
      createMockError('nav-001', 'Navigation failed: /dashboard route not found', 'functional'),
      createMockError('auth-001', 'Authentication failed: Invalid credentials', 'security'),
      createMockError('db-001', 'Database connection timeout after 30 seconds', 'infrastructure'),
      createMockError('api-001', 'API request timeout: /api/bookings', 'performance'),
      createMockError('val-001', 'Validation failed: Email format is invalid', 'data_quality')
    ];

    const analyses: ErrorAnalysisResult[] = [];
    for (const error of testErrors) {
      const analysis = await engine.analyzeError(error);
      analyses.push(analysis);
    }

    // Validate pattern recognition
    let patternsRecognized = 0;
    let correctCategories = 0;

    for (const analysis of analyses) {
      if (analysis.patterns.length > 0) {
        patternsRecognized++;
      }
      
      // Check if pattern category matches error category
      const hasMatchingCategory = analysis.patterns.some(p => 
        p.category === analysis.errorEntry.category
      );
      if (hasMatchingCategory) {
        correctCategories++;
      }
    }

    const patternRecognitionRate = patternsRecognized / testErrors.length;
    const categoryAccuracy = correctCategories / testErrors.length;

    const duration = Date.now() - startTime;
    const success = patternRecognitionRate >= 0.8 && categoryAccuracy >= 0.6;

    return {
      id: 'error-pattern-recognition',
      name: 'Error Pattern Recognition Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Pattern recognition successful (${(patternRecognitionRate * 100).toFixed(1)}% recognition, ${(categoryAccuracy * 100).toFixed(1)}% accuracy)`
        : `Pattern recognition failed (${(patternRecognitionRate * 100).toFixed(1)}% recognition, ${(categoryAccuracy * 100).toFixed(1)}% accuracy)`,
      details: {
        testErrors: testErrors.length,
        patternsRecognized,
        patternRecognitionRate,
        categoryAccuracy,
        analyses: analyses.map(a => ({
          errorId: a.errorEntry.id,
          patternsFound: a.patterns.length,
          categories: a.patterns.map(p => p.category)
        }))
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'error-pattern-recognition',
      name: 'Error Pattern Recognition Test',
      status: 'error',
      duration,
      message: `Pattern recognition test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test error categorization accuracy
 */
async function testErrorCategorization(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('📂 Testing error categorization...');
    
    const testCases = [
      { error: createMockError('func-001', 'Button click handler not working', 'functional'), expectedCategory: 'functional' },
      { error: createMockError('perf-001', 'Page load time exceeds 5 seconds', 'performance'), expectedCategory: 'performance' },
      { error: createMockError('sec-001', 'Unauthorized access attempt detected', 'security'), expectedCategory: 'security' },
      { error: createMockError('ui-001', 'Form validation messages not displaying', 'usability'), expectedCategory: 'usability' },
      { error: createMockError('int-001', 'External API integration failure', 'integration'), expectedCategory: 'integration' }
    ];

    let correctCategorizations = 0;
    const results = [];

    for (const testCase of testCases) {
      const analysis = await engine.analyzeError(testCase.error);
      const hasCorrectCategory = analysis.patterns.some(p => p.category === testCase.expectedCategory);
      
      if (hasCorrectCategory) {
        correctCategorizations++;
      }

      results.push({
        errorId: testCase.error.id,
        expectedCategory: testCase.expectedCategory,
        actualCategories: analysis.patterns.map(p => p.category),
        correct: hasCorrectCategory
      });
    }

    const accuracy = correctCategorizations / testCases.length;
    const duration = Date.now() - startTime;
    const success = accuracy >= 0.8;

    return {
      id: 'error-categorization',
      name: 'Error Categorization Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Categorization accuracy: ${(accuracy * 100).toFixed(1)}%`
        : `Categorization accuracy below threshold: ${(accuracy * 100).toFixed(1)}%`,
      details: {
        testCases: testCases.length,
        correctCategorizations,
        accuracy,
        results
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'error-categorization',
      name: 'Error Categorization Test',
      status: 'error',
      duration,
      message: `Categorization test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test severity assessment
 */
async function testSeverityAssessment(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚠️ Testing severity assessment...');
    
    const testCases = [
      { error: createMockError('crit-001', 'Database connection failed - all services down', 'infrastructure', 'critical'), expectedSeverity: 'critical' },
      { error: createMockError('high-001', 'Payment processing failed for multiple users', 'business_logic', 'high'), expectedSeverity: 'high' },
      { error: createMockError('med-001', 'Search functionality returning incorrect results', 'functional', 'medium'), expectedSeverity: 'medium' },
      { error: createMockError('low-001', 'Minor UI alignment issue on mobile', 'usability', 'low'), expectedSeverity: 'low' }
    ];

    let correctAssessments = 0;
    const results = [];

    for (const testCase of testCases) {
      const analysis = await engine.analyzeError(testCase.error);
      const assessedSeverity = analysis.impactAssessment.overallSeverity;
      
      // Allow for one level of difference (e.g., high vs critical is acceptable)
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const expectedIndex = severityLevels.indexOf(testCase.expectedSeverity);
      const actualIndex = severityLevels.indexOf(assessedSeverity);
      const isCorrect = Math.abs(expectedIndex - actualIndex) <= 1;
      
      if (isCorrect) {
        correctAssessments++;
      }

      results.push({
        errorId: testCase.error.id,
        expectedSeverity: testCase.expectedSeverity,
        assessedSeverity,
        correct: isCorrect,
        impactDetails: analysis.impactAssessment
      });
    }

    const accuracy = correctAssessments / testCases.length;
    const duration = Date.now() - startTime;
    const success = accuracy >= 0.75;

    return {
      id: 'severity-assessment',
      name: 'Severity Assessment Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Severity assessment accuracy: ${(accuracy * 100).toFixed(1)}%`
        : `Severity assessment accuracy below threshold: ${(accuracy * 100).toFixed(1)}%`,
      details: {
        testCases: testCases.length,
        correctAssessments,
        accuracy,
        results
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'severity-assessment',
      name: 'Severity Assessment Test',
      status: 'error',
      duration,
      message: `Severity assessment test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test correlation analysis
 */
async function testCorrelationAnalysis(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔗 Testing correlation analysis...');
    
    // Create related errors that should be correlated
    const baseTime = new Date();
    const relatedErrors: ErrorEntry[] = [
      createMockErrorWithTime('db-001', 'Database connection timeout', 'infrastructure', 'high', baseTime),
      createMockErrorWithTime('api-001', 'API response timeout', 'performance', 'medium', new Date(baseTime.getTime() + 30000)), // 30s later
      createMockErrorWithTime('ui-001', 'Page loading failed', 'functional', 'medium', new Date(baseTime.getTime() + 60000)), // 1m later
      createMockErrorWithTime('db-002', 'Database query failed', 'infrastructure', 'high', new Date(baseTime.getTime() + 90000)) // 1.5m later
    ];

    // Analyze errors to build correlation history
    const analyses: ErrorAnalysisResult[] = [];
    for (const error of relatedErrors) {
      const analysis = await engine.analyzeError(error);
      analyses.push(analysis);
    }

    // Check for correlations in the last analysis
    const lastAnalysis = analyses[analyses.length - 1];
    const hasCorrelations = lastAnalysis.correlations.length > 0;
    
    // Check if database errors are correlated
    const dbCorrelations = lastAnalysis.correlations.filter(c => 
      c.pattern === 'component_related' || c.pattern === 'category_related'
    );

    const duration = Date.now() - startTime;
    const success = hasCorrelations && dbCorrelations.length > 0;

    return {
      id: 'correlation-analysis',
      name: 'Correlation Analysis Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Correlations detected successfully (${lastAnalysis.correlations.length} correlations found)`
        : `Correlation analysis failed (${lastAnalysis.correlations.length} correlations found)`,
      details: {
        testErrors: relatedErrors.length,
        totalCorrelations: lastAnalysis.correlations.length,
        dbCorrelations: dbCorrelations.length,
        correlationDetails: lastAnalysis.correlations.map(c => ({
          pattern: c.pattern,
          strength: c.correlationStrength,
          relatedErrors: c.relatedErrorIds.length
        }))
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'correlation-analysis',
      name: 'Correlation Analysis Test',
      status: 'error',
      duration,
      message: `Correlation analysis test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test root cause analysis
 */
async function testRootCauseAnalysis(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🎯 Testing root cause analysis...');
    
    const testError = createMockError(
      'rca-001', 
      'Payment processing failed: Credit card validation error - Invalid card number format',
      'business_logic',
      'high'
    );

    const analysis = await engine.analyzeError(testError);
    const rootCause = analysis.rootCauseAnalysis;

    // Validate root cause analysis
    const hasCauses = rootCause.possibleCauses.length > 0;
    const hasActions = rootCause.recommendedActions.length > 0;
    const hasConfidence = rootCause.confidence > 0;
    const causesHaveProbabilities = rootCause.possibleCauses.every(c => c.probability > 0 && c.probability <= 1);

    const duration = Date.now() - startTime;
    const success = hasCauses && hasActions && hasConfidence && causesHaveProbabilities;

    return {
      id: 'root-cause-analysis',
      name: 'Root Cause Analysis Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Root cause analysis completed (${rootCause.possibleCauses.length} causes, confidence: ${rootCause.confidence.toFixed(2)})`
        : `Root cause analysis incomplete or invalid`,
      details: {
        possibleCauses: rootCause.possibleCauses.length,
        recommendedActions: rootCause.recommendedActions.length,
        confidence: rootCause.confidence,
        topCause: rootCause.possibleCauses[0],
        topAction: rootCause.recommendedActions[0],
        validationChecks: {
          hasCauses,
          hasActions,
          hasConfidence,
          causesHaveProbabilities
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'root-cause-analysis',
      name: 'Root Cause Analysis Test',
      status: 'error',
      duration,
      message: `Root cause analysis test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test impact assessment
 */
async function testImpactAssessment(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('📊 Testing impact assessment...');
    
    const criticalError = createMockError(
      'impact-001',
      'Authentication service completely down - all users unable to login',
      'security',
      'critical'
    );

    const analysis = await engine.analyzeError(criticalError);
    const impact = analysis.impactAssessment;

    // Validate impact assessment
    const hasUserImpact = impact.userImpact.affectedUsers > 0;
    const hasBusinessImpact = impact.businessImpact.revenueImpact >= 0;
    const hasTechnicalImpact = impact.technicalImpact.performanceImpact >= 0;
    const hasOverallSeverity = ['low', 'medium', 'high', 'critical'].includes(impact.overallSeverity);

    // For a critical authentication error, we expect high impact
    const appropriateUserImpact = impact.userImpact.userJourneyDisruption === 'blocking';
    const appropriateBusinessImpact = impact.businessImpact.reputationRisk === 'high';

    const duration = Date.now() - startTime;
    const success = hasUserImpact && hasBusinessImpact && hasTechnicalImpact && hasOverallSeverity && 
                   appropriateUserImpact && appropriateBusinessImpact;

    return {
      id: 'impact-assessment',
      name: 'Impact Assessment Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Impact assessment completed (Overall severity: ${impact.overallSeverity})`
        : `Impact assessment failed or inappropriate for error severity`,
      details: {
        userImpact: impact.userImpact,
        businessImpact: impact.businessImpact,
        technicalImpact: impact.technicalImpact,
        overallSeverity: impact.overallSeverity,
        validationChecks: {
          hasUserImpact,
          hasBusinessImpact,
          hasTechnicalImpact,
          hasOverallSeverity,
          appropriateUserImpact,
          appropriateBusinessImpact
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'impact-assessment',
      name: 'Impact Assessment Test',
      status: 'error',
      duration,
      message: `Impact assessment test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test trend analysis
 */
async function testTrendAnalysis(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('📈 Testing trend analysis...');
    
    // Create a series of errors showing an increasing trend
    const baseTime = new Date();
    const trendErrors: ErrorEntry[] = [];
    
    for (let i = 0; i < 10; i++) {
      const errorTime = new Date(baseTime.getTime() - (10 - i) * 60 * 60 * 1000); // Hourly errors
      const errorCount = Math.floor(1 + i * 0.5); // Increasing trend
      
      for (let j = 0; j < errorCount; j++) {
        trendErrors.push(createMockErrorWithTime(
          `trend-${i}-${j}`,
          'Database connection timeout',
          'infrastructure',
          'medium',
          new Date(errorTime.getTime() + j * 1000)
        ));
      }
    }

    // Analyze batch for trends
    const batchResult = await engine.analyzeErrorBatch(trendErrors);
    const trends = batchResult.trends;

    // Validate trend detection
    const hasTrends = trends.length > 0;
    const hasIncreasingTrend = trends.some(t => t.trend === 'increasing');
    const hasValidTrendStrength = trends.some(t => t.trendStrength > 0);

    const duration = Date.now() - startTime;
    const success = hasTrends && hasIncreasingTrend && hasValidTrendStrength;

    return {
      id: 'trend-analysis',
      name: 'Trend Analysis Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Trend analysis successful (${trends.length} trends detected)`
        : `Trend analysis failed (${trends.length} trends detected)`,
      details: {
        testErrors: trendErrors.length,
        trendsDetected: trends.length,
        trendTypes: trends.map(t => t.trend),
        strongestTrend: trends[0],
        validationChecks: {
          hasTrends,
          hasIncreasingTrend,
          hasValidTrendStrength
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'trend-analysis',
      name: 'Trend Analysis Test',
      status: 'error',
      duration,
      message: `Trend analysis test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test batch processing capabilities
 */
async function testBatchProcessing(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('📦 Testing batch processing...');
    
    // Create a diverse set of errors
    const batchErrors: ErrorEntry[] = [
      createMockError('batch-001', 'Navigation failed', 'functional', 'medium'),
      createMockError('batch-002', 'Database timeout', 'infrastructure', 'high'),
      createMockError('batch-003', 'API rate limit exceeded', 'performance', 'low'),
      createMockError('batch-004', 'Unauthorized access', 'security', 'critical'),
      createMockError('batch-005', 'Form validation error', 'usability', 'low'),
      createMockError('batch-006', 'Payment processing failed', 'business_logic', 'high'),
      createMockError('batch-007', 'WebSocket connection lost', 'integration', 'medium'),
      createMockError('batch-008', 'Memory leak detected', 'performance', 'high'),
      createMockError('batch-009', 'UI component render error', 'usability', 'medium'),
      createMockError('batch-010', 'External service unavailable', 'integration', 'medium')
    ];

    const batchResult = await engine.analyzeErrorBatch(batchErrors);

    // Validate batch processing results
    const hasAnalyses = batchResult.analyses.length === batchErrors.length;
    const hasSummary = batchResult.summary.totalErrors === batchErrors.length;
    const hasValidCategoryCounts = Object.values(batchResult.summary.categoryCounts).reduce((a, b) => a + b, 0) === batchErrors.length;
    const hasTopPatterns = batchResult.summary.topPatterns.length > 0;

    const duration = Date.now() - startTime;
    const success = hasAnalyses && hasSummary && hasValidCategoryCounts && hasTopPatterns;

    return {
      id: 'batch-processing',
      name: 'Batch Processing Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Batch processing successful (${batchResult.analyses.length} errors processed)`
        : `Batch processing failed`,
      details: {
        inputErrors: batchErrors.length,
        analysesGenerated: batchResult.analyses.length,
        trendsDetected: batchResult.trends.length,
        globalCorrelations: batchResult.globalCorrelations.length,
        summary: batchResult.summary,
        validationChecks: {
          hasAnalyses,
          hasSummary,
          hasValidCategoryCounts,
          hasTopPatterns
        }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'batch-processing',
      name: 'Batch Processing Test',
      status: 'error',
      duration,
      message: `Batch processing test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test performance with large datasets
 */
async function testPerformance(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚡ Testing performance...');
    
    // Create a large batch of errors
    const largeErrorBatch: ErrorEntry[] = [];
    const errorTypes = ['functional', 'performance', 'security', 'usability', 'integration'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 100; i++) {
      largeErrorBatch.push(createMockError(
        `perf-${i}`,
        `Test error ${i}: ${errorTypes[i % errorTypes.length]} issue`,
        errorTypes[i % errorTypes.length] as any,
        severities[i % severities.length] as any
      ));
    }

    const processingStart = Date.now();
    const batchResult = await engine.analyzeErrorBatch(largeErrorBatch);
    const processingTime = Date.now() - processingStart;

    // Performance criteria
    const avgProcessingTimePerError = processingTime / largeErrorBatch.length;
    const totalProcessingTime = processingTime;
    const memoryUsage = process.memoryUsage();

    const duration = Date.now() - startTime;
    const success = avgProcessingTimePerError < 100 && totalProcessingTime < 10000; // < 100ms per error, < 10s total

    return {
      id: 'performance-test',
      name: 'Performance Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Performance acceptable (${avgProcessingTimePerError.toFixed(1)}ms per error)`
        : `Performance below threshold (${avgProcessingTimePerError.toFixed(1)}ms per error)`,
      details: {
        errorsProcessed: largeErrorBatch.length,
        totalProcessingTime,
        avgProcessingTimePerError,
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        },
        analysesGenerated: batchResult.analyses.length,
        trendsDetected: batchResult.trends.length
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'performance-test',
      name: 'Performance Test',
      status: 'error',
      duration,
      message: `Performance test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Test edge cases and error handling
 */
async function testEdgeCases(engine: ErrorAnalysisEngine): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing edge cases...');
    
    const edgeCases = [
      // Empty error message
      createMockError('edge-001', '', 'functional', 'low'),
      // Very long error message
      createMockError('edge-002', 'A'.repeat(10000), 'performance', 'medium'),
      // Special characters in error message
      createMockError('edge-003', 'Error with special chars: !@#$%^&*()[]{}|;:,.<>?', 'usability', 'low'),
      // Null/undefined values in context
      { ...createMockError('edge-004', 'Error with null context', 'integration', 'medium'), context: null },
      // Future timestamp
      createMockErrorWithTime('edge-005', 'Future error', 'security', 'high', new Date(Date.now() + 24 * 60 * 60 * 1000))
    ];

    let successfulAnalyses = 0;
    const results = [];

    for (const edgeCase of edgeCases) {
      try {
        const analysis = await engine.analyzeError(edgeCase);
        successfulAnalyses++;
        results.push({
          errorId: edgeCase.id,
          success: true,
          patternsFound: analysis.patterns.length,
          confidence: analysis.confidence
        });
      } catch (error) {
        results.push({
          errorId: edgeCase.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successRate = successfulAnalyses / edgeCases.length;
    const duration = Date.now() - startTime;
    const success = successRate >= 0.8; // 80% of edge cases should be handled

    return {
      id: 'edge-cases',
      name: 'Edge Cases Test',
      status: success ? 'passed' : 'failed',
      duration,
      message: success 
        ? `Edge cases handled successfully (${(successRate * 100).toFixed(1)}% success rate)`
        : `Edge cases handling failed (${(successRate * 100).toFixed(1)}% success rate)`,
      details: {
        edgeCases: edgeCases.length,
        successfulAnalyses,
        successRate,
        results
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      id: 'edge-cases',
      name: 'Edge Cases Test',
      status: 'error',
      duration,
      message: `Edge cases test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

// Helper functions
function createMockError(
  id: string, 
  description: string, 
  category: any, 
  severity: any = 'medium'
): ErrorEntry {
  return {
    id,
    timestamp: new Date(),
    severity,
    category,
    component: 'test-component',
    description,
    stackTrace: `Error: ${description}\n    at TestFunction (test.js:1:1)`,
    context: {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      url: '/test-page',
      userId: 'test-user-123'
    },
    autoFixable: false
  };
}

function createMockErrorWithTime(
  id: string, 
  description: string, 
  category: any, 
  severity: any, 
  timestamp: Date
): ErrorEntry {
  const error = createMockError(id, description, category, severity);
  error.timestamp = timestamp;
  return error;
}

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

export { runErrorAnalysisTests };