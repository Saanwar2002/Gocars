/**
 * AI Feature Test Suite
 * 
 * This module provides comprehensive testing for AI-powered features in the GoCars platform.
 * It validates AI model responses, recommendation systems, natural language processing,
 * and predictive analytics components.
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.3, 9.5
 */

import { TestSuite, TestResult, TestConfiguration } from '../core/types';
import { AIModelResponseValidator } from './AIModelResponseValidator';
import { RecommendationSystemTester } from './RecommendationSystemTester';
import { NLPAccuracyTester } from './NLPAccuracyTester';
import { PredictiveAnalyticsTester } from './PredictiveAnalyticsTester';
import { AIPerformanceBenchmarker } from './AIPerformanceBenchmarker';

export class AIFeatureTestSuite implements TestSuite {
  id = 'ai-feature-test-suite';
  name = 'AI Feature Test Suite';
  description = 'Comprehensive testing for AI-powered features including model validation, recommendations, NLP, and predictive analytics';
  dependencies = ['firebase-test-suite', 'websocket-test-suite'];

  private modelValidator: AIModelResponseValidator;
  private recommendationTester: RecommendationSystemTester;
  private nlpTester: NLPAccuracyTester;
  private analyticsTester: PredictiveAnalyticsTester;
  private performanceBenchmarker: AIPerformanceBenchmarker;

  constructor(private config: TestConfiguration) {
    this.modelValidator = new AIModelResponseValidator(config);
    this.recommendationTester = new RecommendationSystemTester(config);
    this.nlpTester = new NLPAccuracyTester(config);
    this.analyticsTester = new PredictiveAnalyticsTester(config);
    this.performanceBenchmarker = new AIPerformanceBenchmarker(config);
  }

  async setup(): Promise<void> {
    console.log('🤖 Setting up AI Feature Test Suite...');
    
    // Initialize AI testing components
    await this.modelValidator.initialize();
    await this.recommendationTester.initialize();
    await this.nlpTester.initialize();
    await this.analyticsTester.initialize();
    await this.performanceBenchmarker.initialize();

    console.log('✅ AI Feature Test Suite setup complete');
  }

  async teardown(): Promise<void> {
    console.log('🧹 Cleaning up AI Feature Test Suite...');
    
    // Cleanup AI testing components
    await this.modelValidator.cleanup();
    await this.recommendationTester.cleanup();
    await this.nlpTester.cleanup();
    await this.analyticsTester.cleanup();
    await this.performanceBenchmarker.cleanup();

    console.log('✅ AI Feature Test Suite cleanup complete');
  }

  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      console.log('🚀 Running AI Feature Tests...');

      // Run AI model response validation tests
      const modelValidationResults = await this.modelValidator.runTests();
      results.push(...modelValidationResults);

      // Run recommendation system tests
      const recommendationResults = await this.recommendationTester.runTests();
      results.push(...recommendationResults);

      // Run NLP accuracy tests
      const nlpResults = await this.nlpTester.runTests();
      results.push(...nlpResults);

      // Run predictive analytics tests
      const analyticsResults = await this.analyticsTester.runTests();
      results.push(...analyticsResults);

      // Run performance benchmarking tests
      const performanceResults = await this.performanceBenchmarker.runTests();
      results.push(...performanceResults);

      console.log(`✅ AI Feature Tests completed: ${results.length} tests run`);
      
    } catch (error) {
      console.error('❌ AI Feature Tests failed:', error);
      results.push({
        id: 'ai-feature-suite-error',
        name: 'AI Feature Test Suite Error',
        status: 'error',
        duration: 0,
        message: `AI Feature Test Suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      });
    }

    return results;
  }

  getHealthStatus() {
    return {
      status: 'healthy' as const,
      message: 'AI Feature Test Suite is ready',
      timestamp: new Date().toISOString()
    };
  }
}