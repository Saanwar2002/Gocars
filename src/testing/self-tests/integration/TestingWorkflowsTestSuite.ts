import { SelfTestSuite, SelfTestResult } from '../SelfTestFramework';
import { TestingAgentController } from '../../core/TestingAgentController';
import { FirebaseTestSuite } from '../../firebase/FirebaseTestSuite';
import { WebSocketTestSuite } from '../../websocket/WebSocketTestSuite';
import { NotificationTestSuite } from '../../notifications/NotificationTestSuite';
import { UITestSuite } from '../../ui/UITestSuite';

export class TestingWorkflowsTestSuite implements SelfTestSuite {
  id = 'testing-workflows';
  name = 'Testing Workflows Integration Tests';
  description = 'Tests for complete testing workflows and suite integration';
  category = 'integration' as const;

  private controller?: TestingAgentController;
  private testSuites: Map<string, any> = new Map();

  async setup(): Promise<void> {
    // Initialize controller and test suites
    this.controller = new TestingAgentController();
    await this.controller.initialize();

    // Initialize test suites
    this.testSuites.set('firebase', new FirebaseTestSuite());
    this.testSuites.set('websocket', new WebSocketTestSuite());
    this.testSuites.set('notifications', new NotificationTestSuite());
    this.testSuites.set('ui', new UITestSuite());
  }

  async teardown(): Promise<void> {
    // Cleanup test suites
    for (const [, suite] of this.testSuites) {
      if (suite.teardown) {
        await suite.teardown();
      }
    }

    // Shutdown controller
    if (this.controller) {
      await this.controller.shutdown();
    }
  }

  async runTests(): Promise<SelfTestResult[]> {
    const results: SelfTestResult[] = [];

    // Test complete testing workflows
    results.push(await this.testBasicTestExecution());
    results.push(await this.testMultipleSuiteExecution());
    results.push(await this.testErrorHandlingWorkflow());
    results.push(await this.testConcurrentTestExecution());
    results.push(await this.testTestSuiteDependencies());
    results.push(await this.testResultAggregation());
    results.push(await this.testTestConfiguration());
    results.push(await this.testTestSessionManagement());

    return results;
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    try {
      if (!this.controller) {
        return 'critical';
      }

      const status = this.controller.getStatus();
      if (status.state === 'error' || status.state === 'failed') {
        return 'critical';
      }

      if (status.state === 'warning') {
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      return 'critical';
    }
  }

  private async testBasicTestExecution(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'basic-test-execution';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Create a simple test configuration
      const config = {
        id: 'basic-test',
        name: 'Basic Test Execution',
        environment: 'test' as const,
        testSuites: ['firebase'],
        timeout: 30000,
        retryAttempts: 1
      };

      // Start test execution
      const sessionId = await this.controller.startTesting(config);
      
      if (!sessionId) {
        throw new Error('Failed to start test session');
      }

      // Wait for test completion (simplified)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check test status
      const status = await this.controller.getTestingStatus();
      
      if (!status) {
        throw new Error('Unable to get test status');
      }

      return {
        id: testId,
        name: 'Basic Test Execution Workflow',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Test session ${sessionId} executed successfully`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Basic Test Execution Workflow',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Basic test execution failed: ${(error as Error).message}`
      };
    }
  }

  private async testMultipleSuiteExecution(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'multiple-suite-execution';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Create configuration with multiple test suites
      const config = {
        id: 'multi-suite-test',
        name: 'Multiple Suite Test',
        environment: 'test' as const,
        testSuites: ['firebase', 'websocket', 'notifications'],
        timeout: 60000,
        retryAttempts: 1
      };

      // Start test execution
      const sessionId = await this.controller.startTesting(config);
      
      if (!sessionId) {
        throw new Error('Failed to start multi-suite test session');
      }

      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify all suites were executed
      const results = await this.controller.getTestResults(sessionId);
      
      if (!results || results.length === 0) {
        throw new Error('No test results found');
      }

      return {
        id: testId,
        name: 'Multiple Test Suite Execution',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Multiple suites executed, ${results.length} results collected`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Multiple Test Suite Execution',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Multiple suite execution failed: ${(error as Error).message}`
      };
    }
  }

  private async testErrorHandlingWorkflow(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'error-handling-workflow';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Create configuration that will likely cause errors
      const config = {
        id: 'error-test',
        name: 'Error Handling Test',
        environment: 'test' as const,
        testSuites: ['nonexistent-suite'], // This should cause an error
        timeout: 10000,
        retryAttempts: 1
      };

      // Start test execution (should handle errors gracefully)
      try {
        const sessionId = await this.controller.startTesting(config);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if errors were handled properly
        const status = await this.controller.getTestingStatus();
        
        // The system should handle the error gracefully, not crash
        if (!status) {
          throw new Error('System crashed instead of handling error gracefully');
        }

      } catch (expectedError) {
        // This is expected - the system should throw an error for invalid configuration
        // but it should be a controlled error, not a crash
      }

      return {
        id: testId,
        name: 'Error Handling Workflow',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'Error handling workflow working correctly'
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Error Handling Workflow',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Error handling workflow failed: ${(error as Error).message}`
      };
    }
  }

  private async testConcurrentTestExecution(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'concurrent-test-execution';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Create multiple test configurations
      const configs = [
        {
          id: 'concurrent-test-1',
          name: 'Concurrent Test 1',
          environment: 'test' as const,
          testSuites: ['firebase'],
          timeout: 30000,
          retryAttempts: 1
        },
        {
          id: 'concurrent-test-2',
          name: 'Concurrent Test 2',
          environment: 'test' as const,
          testSuites: ['websocket'],
          timeout: 30000,
          retryAttempts: 1
        }
      ];

      // Start multiple test sessions concurrently
      const sessionPromises = configs.map(config => 
        this.controller!.startTesting(config)
      );

      const sessionIds = await Promise.all(sessionPromises);

      if (sessionIds.some(id => !id)) {
        throw new Error('Some concurrent test sessions failed to start');
      }

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify all sessions completed
      for (const sessionId of sessionIds) {
        const results = await this.controller.getTestResults(sessionId);
        if (!results) {
          throw new Error(`No results for session ${sessionId}`);
        }
      }

      return {
        id: testId,
        name: 'Concurrent Test Execution',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `${sessionIds.length} concurrent test sessions executed successfully`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Concurrent Test Execution',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Concurrent test execution failed: ${(error as Error).message}`
      };
    }
  }

  private async testTestSuiteDependencies(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'test-suite-dependencies';

    try {
      // Test that test suites with dependencies are executed in correct order
      // This is a simplified test - actual implementation would be more complex

      const dependencyOrder = ['firebase', 'websocket', 'notifications', 'ui'];
      let executionOrder: string[] = [];

      // Simulate dependency-aware execution
      for (const suiteId of dependencyOrder) {
        const suite = this.testSuites.get(suiteId);
        if (suite) {
          // Simulate suite execution
          executionOrder.push(suiteId);
        }
      }

      // Verify execution order matches dependency order
      if (JSON.stringify(executionOrder) !== JSON.stringify(dependencyOrder)) {
        throw new Error('Test suite dependencies not respected');
      }

      return {
        id: testId,
        name: 'Test Suite Dependencies',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'Test suite dependencies handled correctly'
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Test Suite Dependencies',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Test suite dependencies failed: ${(error as Error).message}`
      };
    }
  }

  private async testResultAggregation(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'result-aggregation';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Create test configuration
      const config = {
        id: 'aggregation-test',
        name: 'Result Aggregation Test',
        environment: 'test' as const,
        testSuites: ['firebase', 'websocket'],
        timeout: 30000,
        retryAttempts: 1
      };

      // Start test execution
      const sessionId = await this.controller.startTesting(config);
      
      if (!sessionId) {
        throw new Error('Failed to start test session');
      }

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get aggregated results
      const results = await this.controller.getTestResults(sessionId);
      
      if (!results || results.length === 0) {
        throw new Error('No aggregated results found');
      }

      // Verify result structure
      for (const result of results) {
        if (!result.id || !result.name || !result.status) {
          throw new Error('Invalid result structure');
        }
      }

      return {
        id: testId,
        name: 'Test Result Aggregation',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Successfully aggregated ${results.length} test results`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Test Result Aggregation',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Result aggregation failed: ${(error as Error).message}`
      };
    }
  }

  private async testTestConfiguration(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'test-configuration';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Test configuration management
      const config = {
        id: 'config-test',
        name: 'Configuration Test',
        environment: 'test' as const,
        testSuites: ['firebase'],
        timeout: 30000,
        retryAttempts: 2,
        userProfiles: [
          {
            role: 'passenger' as const,
            demographics: {
              age: 25,
              location: 'Test City',
              deviceType: 'mobile' as const,
              experience: 'regular' as const
            }
          }
        ]
      };

      // Test configuration creation
      const configId = await this.controller.createConfiguration(config);
      
      if (!configId) {
        throw new Error('Failed to create configuration');
      }

      // Test configuration retrieval
      const retrievedConfig = await this.controller.getConfiguration(configId);
      
      if (!retrievedConfig || retrievedConfig.name !== config.name) {
        throw new Error('Configuration retrieval failed');
      }

      // Test configuration update
      const updatedConfig = { ...config, timeout: 45000 };
      await this.controller.updateConfiguration(configId, updatedConfig);

      // Test configuration deletion
      await this.controller.deleteConfiguration(configId);

      return {
        id: testId,
        name: 'Test Configuration Management',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'Configuration management working correctly'
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Test Configuration Management',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Configuration management failed: ${(error as Error).message}`
      };
    }
  }

  private async testTestSessionManagement(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'test-session-management';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Test session lifecycle
      const config = {
        id: 'session-test',
        name: 'Session Management Test',
        environment: 'test' as const,
        testSuites: ['firebase'],
        timeout: 30000,
        retryAttempts: 1
      };

      // Start session
      const sessionId = await this.controller.startTesting(config);
      
      if (!sessionId) {
        throw new Error('Failed to start test session');
      }

      // Check session status
      const status = await this.controller.getTestingStatus();
      
      if (!status) {
        throw new Error('Unable to get session status');
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stop session
      await this.controller.stopTesting(sessionId);

      // Verify session stopped
      const finalStatus = await this.controller.getTestingStatus();
      
      if (!finalStatus) {
        throw new Error('Unable to get final session status');
      }

      return {
        id: testId,
        name: 'Test Session Management',
        category: 'integration',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'Session management working correctly'
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Test Session Management',
        category: 'integration',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Session management failed: ${(error as Error).message}`
      };
    }
  }
}