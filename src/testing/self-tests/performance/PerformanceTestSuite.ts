import { SelfTestSuite, SelfTestResult } from '../SelfTestFramework';
import { TestingAgentController } from '../../core/TestingAgentController';
import { VirtualUserFactory } from '../../core/VirtualUserFactory';

export class PerformanceTestSuite implements SelfTestSuite {
  id = 'performance-validation';
  name = 'Performance and Reliability Tests';
  description = 'Tests for performance benchmarks and reliability validation';
  category = 'performance' as const;

  private controller?: TestingAgentController;
  private userFactory?: VirtualUserFactory;
  private performanceMetrics: Map<string, number[]> = new Map();

  async setup(): Promise<void> {
    this.controller = new TestingAgentController();
    this.userFactory = new VirtualUserFactory();
    await this.controller.initialize();
  }

  async teardown(): Promise<void> {
    if (this.controller) {
      await this.controller.shutdown();
    }
  }

  async runTests(): Promise<SelfTestResult[]> {
    const results: SelfTestResult[] = [];

    // Performance tests
    results.push(await this.testMemoryUsage());
    results.push(await this.testCPUUsage());
    results.push(await this.testResponseTimes());
    results.push(await this.testThroughput());
    results.push(await this.testConcurrentUserLoad());
    results.push(await this.testResourceScaling());

    // Reliability tests
    results.push(await this.testSystemStability());
    results.push(await this.testErrorRecovery());
    results.push(await this.testLongRunningTests());
    results.push(await this.testMemoryLeaks());

    return results;
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    try {
      if (!this.controller) {
        return 'critical';
      }

      // Check performance metrics
      const memoryMetrics = this.performanceMetrics.get('memory') || [];
      const avgMemory = memoryMetrics.reduce((a, b) => a + b, 0) / memoryMetrics.length;
      
      // If average memory usage is too high, return warning
      if (avgMemory > 500 * 1024 * 1024) { // 500MB
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      return 'critical';
    }
  }

  private async testMemoryUsage(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'memory-usage';

    try {
      const initialMemory = process.memoryUsage();
      const memoryReadings: number[] = [];

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        // Create virtual users
        if (this.userFactory) {
          await this.userFactory.createVirtualUser({
            role: 'passenger',
            demographics: {
              age: 25,
              location: 'Test City',
              deviceType: 'mobile',
              experience: 'regular'
            }
          });
        }

        // Record memory usage
        const currentMemory = process.memoryUsage();
        memoryReadings.push(currentMemory.heapUsed);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const avgMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;

      // Store metrics
      this.performanceMetrics.set('memory', memoryReadings);

      // Check if memory usage is within acceptable limits
      const maxAcceptableIncrease = 100 * 1024 * 1024; // 100MB
      if (memoryIncrease > maxAcceptableIncrease) {
        throw new Error(`Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB, exceeding limit`);
      }

      return {
        id: testId,
        name: 'Memory Usage Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Memory usage within limits. Average: ${Math.round(avgMemory / 1024 / 1024)}MB`,
        metrics: {
          memoryUsage: avgMemory
        }
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Memory Usage Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Memory usage test failed: ${(error as Error).message}`
      };
    }
  }

  private async testCPUUsage(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'cpu-usage';

    try {
      const cpuReadings: number[] = [];

      // Perform CPU-intensive operations
      for (let i = 0; i < 5; i++) {
        const cpuStart = process.cpuUsage();
        
        // CPU-intensive task
        let sum = 0;
        for (let j = 0; j < 1000000; j++) {
          sum += Math.random();
        }

        const cpuEnd = process.cpuUsage(cpuStart);
        const cpuPercent = (cpuEnd.user + cpuEnd.system) / 1000; // Convert to milliseconds
        cpuReadings.push(cpuPercent);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgCPU = cpuReadings.reduce((a, b) => a + b, 0) / cpuReadings.length;

      // Store metrics
      this.performanceMetrics.set('cpu', cpuReadings);

      return {
        id: testId,
        name: 'CPU Usage Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `CPU usage measured. Average: ${avgCPU.toFixed(2)}ms`,
        metrics: {
          cpuUsage: avgCPU
        }
      };
    } catch (error) {
      return {
        id: testId,
        name: 'CPU Usage Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `CPU usage test failed: ${(error as Error).message}`
      };
    }
  }

  private async testResponseTimes(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'response-times';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      const responseTimes: number[] = [];

      // Test response times for various operations
      for (let i = 0; i < 10; i++) {
        const operationStart = Date.now();
        
        // Test operation (getting status)
        await this.controller.getTestingStatus();
        
        const responseTime = Date.now() - operationStart;
        responseTimes.push(responseTime);

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Store metrics
      this.performanceMetrics.set('responseTime', responseTimes);

      // Check if response times are acceptable
      const maxAcceptableTime = 1000; // 1 second
      if (maxResponseTime > maxAcceptableTime) {
        throw new Error(`Max response time ${maxResponseTime}ms exceeds limit of ${maxAcceptableTime}ms`);
      }

      return {
        id: testId,
        name: 'Response Times Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Response times acceptable. Average: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime}ms`,
        metrics: {
          responseTime: avgResponseTime
        }
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Response Times Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Response times test failed: ${(error as Error).message}`
      };
    }
  }

  private async testThroughput(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'throughput';

    try {
      if (!this.userFactory) {
        throw new Error('User factory not initialized');
      }

      const operationCount = 50;
      const testStart = Date.now();

      // Perform multiple operations concurrently
      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        promises.push(this.userFactory.createVirtualUser({
          role: 'passenger',
          demographics: {
            age: 20 + (i % 40),
            location: `City ${i}`,
            deviceType: i % 2 === 0 ? 'mobile' : 'desktop',
            experience: 'regular'
          }
        }));
      }

      await Promise.all(promises);

      const testDuration = Date.now() - testStart;
      const throughput = (operationCount / testDuration) * 1000; // Operations per second

      // Store metrics
      this.performanceMetrics.set('throughput', [throughput]);

      // Check if throughput is acceptable
      const minAcceptableThroughput = 10; // 10 operations per second
      if (throughput < minAcceptableThroughput) {
        throw new Error(`Throughput ${throughput.toFixed(2)} ops/sec below minimum ${minAcceptableThroughput} ops/sec`);
      }

      return {
        id: testId,
        name: 'Throughput Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Throughput acceptable: ${throughput.toFixed(2)} operations/sec`,
        metrics: {
          throughput
        }
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Throughput Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Throughput test failed: ${(error as Error).message}`
      };
    }
  }

  private async testConcurrentUserLoad(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'concurrent-user-load';

    try {
      if (!this.controller || !this.userFactory) {
        throw new Error('Components not initialized');
      }

      const concurrentUsers = 20;
      const userPromises = [];

      // Create multiple virtual users concurrently
      for (let i = 0; i < concurrentUsers; i++) {
        userPromises.push(this.userFactory.createVirtualUser({
          role: 'passenger',
          demographics: {
            age: 20 + (i % 40),
            location: `City ${i}`,
            deviceType: i % 3 === 0 ? 'mobile' : i % 3 === 1 ? 'desktop' : 'tablet',
            experience: i % 2 === 0 ? 'regular' : 'new'
          }
        }));
      }

      const users = await Promise.all(userPromises);

      // Verify all users were created successfully
      if (users.length !== concurrentUsers) {
        throw new Error(`Expected ${concurrentUsers} users, got ${users.length}`);
      }

      // Verify users are unique
      const userIds = new Set(users.map(u => u.id));
      if (userIds.size !== concurrentUsers) {
        throw new Error('Duplicate user IDs detected under load');
      }

      return {
        id: testId,
        name: 'Concurrent User Load Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Successfully handled ${concurrentUsers} concurrent users`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Concurrent User Load Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Concurrent user load test failed: ${(error as Error).message}`
      };
    }
  }

  private async testResourceScaling(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'resource-scaling';

    try {
      if (!this.userFactory) {
        throw new Error('User factory not initialized');
      }

      const scalingLevels = [5, 10, 20, 30];
      const scalingResults = [];

      for (const userCount of scalingLevels) {
        const levelStart = Date.now();
        const initialMemory = process.memoryUsage().heapUsed;

        // Create users at this scaling level
        const promises = [];
        for (let i = 0; i < userCount; i++) {
          promises.push(this.userFactory.createVirtualUser({
            role: 'passenger',
            demographics: {
              age: 25,
              location: 'Test City',
              deviceType: 'mobile',
              experience: 'regular'
            }
          }));
        }

        await Promise.all(promises);

        const levelDuration = Date.now() - levelStart;
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        scalingResults.push({
          userCount,
          duration: levelDuration,
          memoryIncrease
        });

        // Small delay between levels
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Analyze scaling behavior
      const avgDurationPerUser = scalingResults.map(r => r.duration / r.userCount);
      const isLinearScaling = avgDurationPerUser.every((duration, index) => {
        if (index === 0) return true;
        const previousDuration = avgDurationPerUser[index - 1];
        return duration <= previousDuration * 2; // Allow some variance
      });

      if (!isLinearScaling) {
        throw new Error('Resource scaling is not linear - performance degrades significantly with load');
      }

      return {
        id: testId,
        name: 'Resource Scaling Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `Resource scaling is acceptable across ${scalingLevels.length} levels`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Resource Scaling Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Resource scaling test failed: ${(error as Error).message}`
      };
    }
  }

  private async testSystemStability(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'system-stability';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Run multiple operations to test stability
      const operationCount = 100;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < operationCount; i++) {
        try {
          await this.controller.getTestingStatus();
          successCount++;
        } catch (error) {
          errorCount++;
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const successRate = (successCount / operationCount) * 100;
      const minAcceptableSuccessRate = 95; // 95%

      if (successRate < minAcceptableSuccessRate) {
        throw new Error(`Success rate ${successRate.toFixed(1)}% below minimum ${minAcceptableSuccessRate}%`);
      }

      return {
        id: testId,
        name: 'System Stability Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `System stability good: ${successRate.toFixed(1)}% success rate over ${operationCount} operations`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'System Stability Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `System stability test failed: ${(error as Error).message}`
      };
    }
  }

  private async testErrorRecovery(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'error-recovery';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Test error recovery by causing and recovering from errors
      let recoverySuccessful = true;

      try {
        // Cause an error (invalid configuration)
        await this.controller.startTesting({
          id: 'invalid-config',
          name: 'Invalid Config',
          environment: 'test',
          testSuites: ['nonexistent-suite'],
          timeout: -1, // Invalid timeout
          retryAttempts: -1 // Invalid retry attempts
        });
      } catch (expectedError) {
        // This error is expected
      }

      // Test that system can still function after error
      try {
        const status = await this.controller.getTestingStatus();
        if (!status) {
          recoverySuccessful = false;
        }
      } catch (error) {
        recoverySuccessful = false;
      }

      if (!recoverySuccessful) {
        throw new Error('System did not recover properly from error');
      }

      return {
        id: testId,
        name: 'Error Recovery Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'System recovered successfully from induced errors'
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Error Recovery Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Error recovery test failed: ${(error as Error).message}`
      };
    }
  }

  private async testLongRunningTests(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'long-running-tests';

    try {
      if (!this.controller) {
        throw new Error('Controller not initialized');
      }

      // Simulate a long-running test scenario
      const testDuration = 5000; // 5 seconds
      const checkInterval = 500; // Check every 500ms
      const checks = testDuration / checkInterval;

      let allChecksSuccessful = true;

      for (let i = 0; i < checks; i++) {
        try {
          await this.controller.getTestingStatus();
        } catch (error) {
          allChecksSuccessful = false;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }

      if (!allChecksSuccessful) {
        throw new Error('System became unstable during long-running test');
      }

      return {
        id: testId,
        name: 'Long Running Tests',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `System remained stable during ${testDuration}ms long-running test`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Long Running Tests',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Long running test failed: ${(error as Error).message}`
      };
    }
  }

  private async testMemoryLeaks(): Promise<SelfTestResult> {
    const startTime = new Date();
    const testId = 'memory-leaks';

    try {
      if (!this.userFactory) {
        throw new Error('User factory not initialized');
      }

      const initialMemory = process.memoryUsage().heapUsed;
      const memoryReadings: number[] = [];

      // Perform operations that could cause memory leaks
      for (let cycle = 0; cycle < 5; cycle++) {
        // Create and "dispose" of virtual users
        const users = [];
        for (let i = 0; i < 10; i++) {
          const user = await this.userFactory.createVirtualUser({
            role: 'passenger',
            demographics: {
              age: 25,
              location: 'Test City',
              deviceType: 'mobile',
              experience: 'regular'
            }
          });
          users.push(user);
        }

        // Clear references (simulate cleanup)
        users.length = 0;

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Record memory usage
        const currentMemory = process.memoryUsage().heapUsed;
        memoryReadings.push(currentMemory);

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Check for significant memory increase (potential leak)
      const maxAcceptableIncrease = 50 * 1024 * 1024; // 50MB
      if (memoryIncrease > maxAcceptableIncrease) {
        throw new Error(`Potential memory leak detected: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`);
      }

      return {
        id: testId,
        name: 'Memory Leaks Test',
        category: 'performance',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: `No significant memory leaks detected. Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Memory Leaks Test',
        category: 'performance',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Memory leaks test failed: ${(error as Error).message}`
      };
    }
  }
}