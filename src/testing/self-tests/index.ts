/**
 * Testing Agent Self-Tests
 * 
 * This module provides comprehensive self-testing capabilities for the testing agent,
 * including unit tests, integration tests, and performance validation.
 */

// Core framework
export { SelfTestFramework, SelfTestSuite, SelfTestResult, SelfTestConfig } from './SelfTestFramework';
export { SelfTestRunner, SelfTestRunnerConfig } from './SelfTestRunner';

// Test suites
export { CoreComponentsTestSuite } from './unit/CoreComponentsTestSuite';
export { TestingWorkflowsTestSuite } from './integration/TestingWorkflowsTestSuite';
export { PerformanceTestSuite } from './performance/PerformanceTestSuite';

// Utility functions
export async function runSelfTests(config?: Partial<SelfTestRunnerConfig>): Promise<boolean> {
  const { SelfTestRunner } = await import('./SelfTestRunner');
  const runner = new SelfTestRunner(config);
  return await runner.runAllTests();
}

export async function runSelfTestSuite(suiteId: string, config?: Partial<SelfTestRunnerConfig>): Promise<boolean> {
  const { SelfTestRunner } = await import('./SelfTestRunner');
  const runner = new SelfTestRunner(config);
  return await runner.runSpecificSuite(suiteId);
}

export function getAvailableTestSuites(): string[] {
  return [
    'core-components',
    'testing-workflows', 
    'performance-validation'
  ];
}

// Re-export types for convenience
export type { SelfTestRunnerConfig } from './SelfTestRunner';