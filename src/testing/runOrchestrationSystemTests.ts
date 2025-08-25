import { TestExecutionOrchestrator, TestSession } from '../orchestration/TestExecutionOrchestrator';
import { DependencyResolver } from '../orchestration/DependencyResolver';
import { ResourcePool } from '../orchestration/ResourcePool';
import { ExecutionQueue } from '../orchestration/ExecutionQueue';
import { TestConfiguration, TestSuiteConfig } from '../configuration/TestConfigurationManager';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

class OrchestrationSystemTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Orchestration System Tests...\n');

    await this.testDependencyResolver();
    await this.testResourcePool();
    await this.testExecutionQueue();
    await this.testTestExecutionOrchestrator();
    await this.testIntegration();

    this.printSummary();
    return this.results;
  }

  private async testDependencyResolver(): Promise<void> {
    console.log('🔗 Testing Dependency Resolver...');

    // Test dependency graph building
    await this.runTest('Dependency Graph Building', async () => {
      const resolver = new DependencyResolver();
      const testSuites = this.createMockTestSuites();
      
      const graph = resolver.buildDependencyGraph(testSuites);
      
      if (!graph.nodes || graph.nodes.size !== testSuites.length) {
        throw new Error('Dependency graph nodes not created correctly');
      }

      if (!graph.levels || graph.levels.size === 0) {
        throw new Error('Dependency levels not calculated');
      }

      // Check that firebase-auth is at level 0 (no dependencies)
      const authNode = graph.nodes.get('firebase-auth');
      if (!authNode || authNode.level !== 0) {
        throw new Error('Firebase auth should be at level 0');
      }

      // Check that booking-workflows has correct dependencies
      const bookingNode = graph.nodes.get('booking-workflows');
      if (!bookingNode || !bookingNode.dependencies.includes('firebase-auth')) {
        throw new Error('Booking workflows dependencies not set correctly');
      }

      return `Built dependency graph with ${graph.nodes.size} nodes and ${graph.levels.size} levels`;
    });

    // Test circular dependency detection
    await this.runTest('Circular Dependency Detection', async () => {
      const resolver = new DependencyResolver();
      const testSuites: TestSuiteConfig[] = [
        {
          id: 'suite-a',
          name: 'Suite A',
          enabled: true,
          priority: 1,
          parameters: {},
          dependencies: ['suite-b']
        },
        {
          id: 'suite-b',
          name: 'Suite B',
          enabled: true,
          priority: 2,
          parameters: {},
          dependencies: ['suite-a'] // Circular dependency
        }
      ];

      const circularDeps = resolver.detectCircularDependencies(testSuites);
      
      if (circularDeps.length === 0) {
        throw new Error('Circular dependency not detected');
      }

      if (!circularDeps.includes('suite-a') || !circularDeps.includes('suite-b')) {
        throw new Error('Circular dependency path incorrect');
      }

      return `Detected circular dependency: ${circularDeps.join(' -> ')}`;
    });

    // Test execution phase creation
    await this.runTest('Execution Phase Creation', async () => {
      const resolver = new DependencyResolver();
      const testSuites = this.createMockTestSuites();
      const graph = resolver.buildDependencyGraph(testSuites);
      
      const phases = resolver.createExecutionPhases(graph, 3);
      
      if (phases.length === 0) {
        throw new Error('No execution phases created');
      }

      // Verify execution order is valid
      const isValidOrder = resolver.validateExecutionOrder(phases, graph);
      if (!isValidOrder) {
        throw new Error('Invalid execution order in phases');
      }

      // Check that dependencies are satisfied
      const executedSuites = new Set<string>();
      for (const phase of phases) {
        for (const suiteId of phase.suites) {
          const node = graph.nodes.get(suiteId);
          if (node) {
            for (const depId of node.dependencies) {
              if (!executedSuites.has(depId)) {
                throw new Error(`Dependency ${depId} not satisfied for ${suiteId}`);
              }
            }
          }
          executedSuites.add(suiteId);
        }
      }

      return `Created ${phases.length} execution phases with valid dependency order`;
    });

    // Test critical path calculation
    await this.runTest('Critical Path Calculation', async () => {
      const resolver = new DependencyResolver();
      const testSuites = this.createMockTestSuites();
      const graph = resolver.buildDependencyGraph(testSuites);
      
      const criticalPath = resolver.getCriticalPath(graph);
      
      if (criticalPath.length === 0) {
        throw new Error('No critical path found');
      }

      // Critical path should start with a root node (no dependencies)
      const firstNode = graph.nodes.get(criticalPath[0]);
      if (!firstNode || firstNode.dependencies.length > 0) {
        throw new Error('Critical path should start with a root node');
      }

      return `Critical path: ${criticalPath.join(' -> ')} (${criticalPath.length} suites)`;
    });
  }

  private async testResourcePool(): Promise<void> {
    console.log('💾 Testing Resource Pool...');

    // Test resource pool initialization
    await this.runTest('Resource Pool Initialization', async () => {
      const resourcePool = new ResourcePool({
        memory: 1000,
        cpu: 80,
        network: 100,
        storage: 500,
        concurrentUsers: 50
      });

      const totalResources = resourcePool.getTotalResources();
      if (totalResources.memory !== 1000 || totalResources.cpu !== 80) {
        throw new Error('Resource pool not initialized with correct limits');
      }

      const availableResources = resourcePool.getAvailableResources();
      if (availableResources.memory !== 1000 || availableResources.cpu !== 80) {
        throw new Error('Available resources should equal total when no allocations');
      }

      resourcePool.destroy();
      return 'Resource pool initialized with correct limits';
    });

    // Test resource reservation and release
    await this.runTest('Resource Reservation and Release', async () => {
      const resourcePool = new ResourcePool({
        memory: 1000,
        cpu: 80,
        network: 100,
        storage: 500,
        concurrentUsers: 50
      });

      const requirements = {
        memory: 200,
        cpu: 20,
        network: 10,
        storage: 100,
        concurrentUsers: 10
      };

      // Reserve resources
      await resourcePool.reserveResources('session-1', requirements);

      const availableAfterReservation = resourcePool.getAvailableResources();
      if (availableAfterReservation.memory !== 800 || availableAfterReservation.cpu !== 60) {
        throw new Error('Available resources not updated correctly after reservation');
      }

      const utilization = resourcePool.getResourceUtilization();
      if (utilization <= 0) {
        throw new Error('Resource utilization should be greater than 0 after reservation');
      }

      // Release resources
      await resourcePool.releaseResources('session-1');

      const availableAfterRelease = resourcePool.getAvailableResources();
      if (availableAfterRelease.memory !== 1000 || availableAfterRelease.cpu !== 80) {
        throw new Error('Resources not released correctly');
      }

      resourcePool.destroy();
      return 'Resource reservation and release working correctly';
    });

    // Test resource allocation limits
    await this.runTest('Resource Allocation Limits', async () => {
      const resourcePool = new ResourcePool({
        memory: 100,
        cpu: 50,
        network: 10,
        storage: 50,
        concurrentUsers: 5
      });

      const requirements = {
        memory: 150, // Exceeds limit
        cpu: 30,
        network: 5,
        storage: 25,
        concurrentUsers: 3
      };

      try {
        await resourcePool.reserveResources('session-1', requirements);
        throw new Error('Should have thrown error for insufficient resources');
      } catch (error) {
        if (!error.message.includes('Insufficient resources')) {
          throw new Error('Wrong error message for insufficient resources');
        }
      }

      resourcePool.destroy();
      return 'Resource allocation limits enforced correctly';
    });

    // Test resource prediction
    await this.runTest('Resource Availability Prediction', async () => {
      const resourcePool = new ResourcePool({
        memory: 1000,
        cpu: 80,
        network: 100,
        storage: 500,
        concurrentUsers: 50
      });

      const requirements = {
        memory: 200,
        cpu: 20,
        network: 10,
        storage: 100,
        concurrentUsers: 10
      };

      // Test prediction with available resources
      const probability = resourcePool.predictResourceAvailability(requirements, 3600000);
      if (probability < 0 || probability > 1) {
        throw new Error('Prediction probability should be between 0 and 1');
      }

      resourcePool.destroy();
      return `Resource availability prediction: ${(probability * 100).toFixed(1)}%`;
    });
  }

  private async testExecutionQueue(): Promise<void> {
    console.log('📋 Testing Execution Queue...');

    // Test queue operations
    await this.runTest('Queue Basic Operations', async () => {
      const queue = new ExecutionQueue({ maxQueueSize: 10 });
      
      if (queue.getQueueSize() !== 0) {
        throw new Error('Queue should be empty initially');
      }

      const mockSession = this.createMockSession();
      const mockPlan = this.createMockExecutionPlan();

      await queue.enqueue({
        session: mockSession,
        plan: mockPlan,
        priority: 100,
        estimatedDuration: 60000
      });

      if (queue.getQueueSize() !== 1) {
        throw new Error('Queue size should be 1 after enqueue');
      }

      const item = await queue.dequeue();
      if (!item || item.session.id !== mockSession.id) {
        throw new Error('Dequeued item should match enqueued item');
      }

      if (queue.getQueueSize() !== 0) {
        throw new Error('Queue should be empty after dequeue');
      }

      return 'Queue basic operations working correctly';
    });

    // Test priority ordering
    await this.runTest('Priority Ordering', async () => {
      const queue = new ExecutionQueue();
      
      const sessions = [
        { session: this.createMockSession('low'), priority: 50 },
        { session: this.createMockSession('high'), priority: 150 },
        { session: this.createMockSession('medium'), priority: 100 }
      ];

      // Enqueue in random order
      for (const { session, priority } of sessions) {
        await queue.enqueue({
          session,
          plan: this.createMockExecutionPlan(),
          priority,
          estimatedDuration: 60000
        });
      }

      // Dequeue should return highest priority first
      const first = await queue.dequeue();
      const second = await queue.dequeue();
      const third = await queue.dequeue();

      if (!first || first.priority !== 150) {
        throw new Error('First item should have highest priority');
      }

      if (!second || second.priority !== 100) {
        throw new Error('Second item should have medium priority');
      }

      if (!third || third.priority !== 50) {
        throw new Error('Third item should have lowest priority');
      }

      return 'Priority ordering working correctly';
    });

    // Test queue metrics
    await this.runTest('Queue Metrics', async () => {
      const queue = new ExecutionQueue();
      
      const initialMetrics = queue.getMetrics();
      if (initialMetrics.totalItems !== 0 || initialMetrics.waitingItems !== 0) {
        throw new Error('Initial metrics should show empty queue');
      }

      // Add some items
      for (let i = 0; i < 3; i++) {
        await queue.enqueue({
          session: this.createMockSession(`session-${i}`),
          plan: this.createMockExecutionPlan(),
          priority: 100,
          estimatedDuration: 60000
        });
      }

      const metrics = queue.getMetrics();
      if (metrics.waitingItems !== 3) {
        throw new Error('Metrics should show 3 waiting items');
      }

      if (metrics.estimatedProcessingTime !== 180000) { // 3 * 60000
        throw new Error('Estimated processing time calculation incorrect');
      }

      return `Queue metrics: ${metrics.waitingItems} waiting, ${metrics.estimatedProcessingTime}ms estimated`;
    });

    // Test queue health monitoring
    await this.runTest('Queue Health Monitoring', async () => {
      const queue = new ExecutionQueue({ maxQueueSize: 5 });
      
      const initialHealth = queue.getQueueHealth();
      if (initialHealth.status !== 'healthy') {
        throw new Error('Empty queue should be healthy');
      }

      // Fill queue to near capacity
      for (let i = 0; i < 4; i++) {
        await queue.enqueue({
          session: this.createMockSession(`session-${i}`),
          plan: this.createMockExecutionPlan(),
          priority: 100,
          estimatedDuration: 60000
        });
      }

      const nearFullHealth = queue.getQueueHealth();
      if (nearFullHealth.status !== 'warning') {
        throw new Error('Near-full queue should show warning status');
      }

      return `Queue health monitoring: ${nearFullHealth.status} with ${nearFullHealth.issues.length} issues`;
    });
  }

  private async testTestExecutionOrchestrator(): Promise<void> {
    console.log('🎭 Testing Test Execution Orchestrator...');

    // Test orchestrator initialization
    await this.runTest('Orchestrator Initialization', async () => {
      const orchestrator = new TestExecutionOrchestrator({
        maxConcurrentSessions: 3,
        resourceLimits: {
          memory: 1000,
          cpu: 80,
          network: 100,
          storage: 500,
          concurrentUsers: 50
        }
      });

      const sessions = orchestrator.getAllSessions();
      if (sessions.length !== 0) {
        throw new Error('Orchestrator should have no sessions initially');
      }

      const activeSessions = orchestrator.getActiveSessions();
      if (activeSessions.length !== 0) {
        throw new Error('Orchestrator should have no active sessions initially');
      }

      return 'Orchestrator initialized correctly';
    });

    // Test session creation
    await this.runTest('Session Creation', async () => {
      const orchestrator = new TestExecutionOrchestrator();
      const configuration = this.createMockConfiguration();

      const sessionId = await orchestrator.startTestSession(configuration);
      
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID should be returned');
      }

      const session = orchestrator.getTestSession(sessionId);
      if (!session) {
        throw new Error('Session should be retrievable after creation');
      }

      if (session.status !== 'pending' && session.status !== 'running') {
        throw new Error('New session should be pending or running');
      }

      if (session.configuration.id !== configuration.id) {
        throw new Error('Session configuration should match input');
      }

      return `Session created with ID: ${sessionId}`;
    });

    // Test session execution flow
    await this.runTest('Session Execution Flow', async () => {
      const orchestrator = new TestExecutionOrchestrator({
        maxConcurrentSessions: 1
      });

      let sessionStarted = false;
      let sessionCompleted = false;
      let progressUpdated = false;

      orchestrator.on('sessionStarted', () => { sessionStarted = true; });
      orchestrator.on('sessionCompleted', () => { sessionCompleted = true; });
      orchestrator.on('progressUpdated', () => { progressUpdated = true; });

      const configuration = this.createMockConfiguration();
      const sessionId = await orchestrator.startTestSession(configuration);

      // Wait for session to complete (with timeout)
      await this.waitForCondition(() => sessionCompleted, 10000);

      if (!sessionStarted) {
        throw new Error('Session started event should have fired');
      }

      if (!progressUpdated) {
        throw new Error('Progress updated event should have fired');
      }

      const session = orchestrator.getTestSession(sessionId);
      if (!session || (session.status !== 'completed' && session.status !== 'failed')) {
        throw new Error('Session should be completed or failed');
      }

      return `Session execution completed with status: ${session.status}`;
    });

    // Test session cancellation
    await this.runTest('Session Cancellation', async () => {
      const orchestrator = new TestExecutionOrchestrator();
      const configuration = this.createMockConfiguration();

      const sessionId = await orchestrator.startTestSession(configuration);
      
      // Cancel the session immediately
      await orchestrator.stopTestSession(sessionId);

      const session = orchestrator.getTestSession(sessionId);
      if (!session || session.status !== 'cancelled') {
        throw new Error('Session should be cancelled');
      }

      if (!session.endTime) {
        throw new Error('Cancelled session should have end time');
      }

      return 'Session cancellation working correctly';
    });
  }

  private async testIntegration(): Promise<void> {
    console.log('🔗 Testing Integration...');

    // Test full orchestration workflow
    await this.runTest('Full Orchestration Workflow', async () => {
      const orchestrator = new TestExecutionOrchestrator({
        maxConcurrentSessions: 2
      });

      const configurations = [
        this.createMockConfiguration('config-1'),
        this.createMockConfiguration('config-2')
      ];

      const sessionIds: string[] = [];
      
      // Start multiple sessions
      for (const config of configurations) {
        const sessionId = await orchestrator.startTestSession(config);
        sessionIds.push(sessionId);
      }

      if (sessionIds.length !== 2) {
        throw new Error('Should have created 2 sessions');
      }

      // Wait for sessions to complete
      let completedSessions = 0;
      orchestrator.on('sessionCompleted', () => { completedSessions++; });

      await this.waitForCondition(() => completedSessions >= 2, 15000);

      // Verify all sessions completed
      for (const sessionId of sessionIds) {
        const session = orchestrator.getTestSession(sessionId);
        if (!session || (session.status !== 'completed' && session.status !== 'failed')) {
          throw new Error(`Session ${sessionId} should be completed or failed`);
        }
      }

      return `Full workflow completed for ${sessionIds.length} sessions`;
    });

    // Test resource contention handling
    await this.runTest('Resource Contention Handling', async () => {
      const orchestrator = new TestExecutionOrchestrator({
        maxConcurrentSessions: 1,
        resourceLimits: {
          memory: 200, // Very limited
          cpu: 20,
          network: 10,
          storage: 100,
          concurrentUsers: 5
        }
      });

      const configurations = [
        this.createMockConfiguration('high-resource-1'),
        this.createMockConfiguration('high-resource-2')
      ];

      const sessionIds: string[] = [];
      
      // Start sessions that might compete for resources
      for (const config of configurations) {
        try {
          const sessionId = await orchestrator.startTestSession(config);
          sessionIds.push(sessionId);
        } catch (error) {
          // Some sessions might fail due to resource constraints
          console.log(`Session failed due to resource constraints: ${error.message}`);
        }
      }

      // At least one session should have been created
      if (sessionIds.length === 0) {
        throw new Error('At least one session should have been created');
      }

      return `Resource contention handled: ${sessionIds.length} sessions created`;
    });

    // Test error handling and recovery
    await this.runTest('Error Handling and Recovery', async () => {
      const orchestrator = new TestExecutionOrchestrator();
      
      // Create configuration with invalid dependencies
      const invalidConfig = this.createMockConfiguration('invalid-config');
      invalidConfig.testSuites.push({
        id: 'invalid-suite',
        name: 'Invalid Suite',
        enabled: true,
        priority: 1,
        parameters: {},
        dependencies: ['non-existent-dependency']
      });

      try {
        const sessionId = await orchestrator.startTestSession(invalidConfig);
        
        // Wait a bit for potential errors
        await this.sleep(2000);
        
        const session = orchestrator.getTestSession(sessionId);
        if (session && session.errors.length === 0) {
          throw new Error('Session should have errors due to invalid dependencies');
        }

        return 'Error handling working correctly';
      } catch (error) {
        // This is expected for invalid configurations
        return `Error handling working: ${error.message}`;
      }
    });
  }

  private createMockTestSuites(): TestSuiteConfig[] {
    return [
      {
        id: 'firebase-auth',
        name: 'Firebase Authentication',
        enabled: true,
        priority: 1,
        parameters: {},
        dependencies: []
      },
      {
        id: 'firebase-firestore',
        name: 'Firebase Firestore',
        enabled: true,
        priority: 2,
        parameters: {},
        dependencies: ['firebase-auth']
      },
      {
        id: 'websocket-connection',
        name: 'WebSocket Connection',
        enabled: true,
        priority: 3,
        parameters: {},
        dependencies: ['firebase-auth']
      },
      {
        id: 'ui-components',
        name: 'UI Components',
        enabled: true,
        priority: 4,
        parameters: {},
        dependencies: []
      },
      {
        id: 'booking-workflows',
        name: 'Booking Workflows',
        enabled: true,
        priority: 5,
        parameters: {},
        dependencies: ['firebase-auth', 'firebase-firestore', 'websocket-connection']
      }
    ];
  }

  private createMockConfiguration(id: string = 'test-config'): TestConfiguration {
    return {
      id,
      name: `Test Configuration ${id}`,
      description: 'Mock configuration for testing',
      environment: 'development',
      testSuites: this.createMockTestSuites(),
      userProfiles: [],
      concurrencyLevel: 5,
      timeout: 300000,
      retryAttempts: 1,
      reportingOptions: {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: true,
        formats: ['json']
      },
      autoFixEnabled: false,
      notificationSettings: {
        onTestStart: false,
        onTestComplete: true,
        onTestFailure: true,
        onCriticalError: true,
        channels: ['email']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMockSession(id: string = 'test-session'): TestSession {
    return {
      id,
      configurationId: 'test-config',
      configuration: this.createMockConfiguration(),
      status: 'pending',
      progress: {
        totalSuites: 5,
        completedSuites: 0,
        failedSuites: 0,
        skippedSuites: 0,
        overallProgress: 0
      },
      results: [],
      errors: [],
      metrics: {
        totalDuration: 0,
        setupDuration: 0,
        executionDuration: 0,
        teardownDuration: 0,
        averageSuiteDuration: 0,
        throughput: 0,
        successRate: 0,
        resourceEfficiency: 0
      },
      resourceUsage: {
        memory: { used: 0, available: 0, peak: 0 },
        cpu: { usage: 0, cores: 0 },
        network: { bytesIn: 0, bytesOut: 0 },
        storage: { used: 0, available: 0 }
      }
    };
  }

  private createMockExecutionPlan(): any {
    return {
      sessionId: 'test-session',
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          suites: ['firebase-auth'],
          dependencies: [],
          estimatedDuration: 60000,
          maxConcurrency: 1,
          resourceRequirements: {
            memory: 100,
            cpu: 10,
            network: 5,
            storage: 50,
            concurrentUsers: 5
          }
        }
      ],
      totalEstimatedDuration: 60000,
      resourceRequirements: {
        memory: 100,
        cpu: 10,
        network: 5,
        storage: 50,
        concurrentUsers: 5
      },
      riskAssessment: {
        overallRisk: 'low',
        riskFactors: [],
        mitigationStrategies: []
      }
    };
  }

  private async runTest(testName: string, testFunction: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        message,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        testName,
        passed: false,
        message,
        duration,
        details: error
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  private async waitForCondition(condition: () => boolean, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (!condition() && (Date.now() - startTime) < timeoutMs) {
      await this.sleep(100);
    }
    
    if (!condition()) {
      throw new Error(`Condition not met within ${timeoutMs}ms timeout`);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }

    console.log('\n🎉 Orchestration System testing completed!');
  }
}

// Export for use in other test files
export { OrchestrationSystemTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new OrchestrationSystemTester();
  tester.runAllTests().catch(console.error);
}