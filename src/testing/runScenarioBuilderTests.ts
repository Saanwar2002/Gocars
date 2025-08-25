import { ScenarioBuilder, TestScenario, UserJourney, ScenarioStep } from '../scenarios/ScenarioBuilder';
import { ScenarioTestExecutionOrchestrator } from '../scenarios/TestExecutionOrchestrator';
import { TestExecutionOrchestrator } from '../orchestration/TestExecutionOrchestrator';
import { ExecutionQueue } from '../orchestration/ExecutionQueue';
import { ResourcePool } from '../orchestration/ResourcePool';
import { DependencyResolver } from '../orchestration/DependencyResolver';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class ScenarioBuilderTestSuite {
  private scenarioBuilder: ScenarioBuilder;
  private orchestrator: ScenarioTestExecutionOrchestrator;
  private results: TestResult[] = [];

  constructor() {
    this.scenarioBuilder = new ScenarioBuilder();
    
    // Initialize dependencies for orchestrator
    const baseOrchestrator = new TestExecutionOrchestrator();
    const executionQueue = new ExecutionQueue();
    const resourcePool = new ResourcePool();
    const dependencyResolver = new DependencyResolver();
    
    this.orchestrator = new ScenarioTestExecutionOrchestrator(
      this.scenarioBuilder,
      baseOrchestrator,
      executionQueue,
      resourcePool,
      dependencyResolver
    );
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🎭 Starting Scenario Builder Test Suite...\n');

    // Core functionality tests
    await this.testScenarioCreation();
    await this.testScenarioValidation();
    await this.testUserJourneyManagement();
    await this.testStepManagement();
    await this.testTemplateSystem();
    await this.testExecutionPlanGeneration();
    
    // Orchestration tests
    await this.testScenarioExecution();
    await this.testConcurrentExecution();
    await this.testErrorHandling();
    await this.testSessionManagement();

    this.printResults();
    return this.results;
  }

  private async testScenarioCreation(): Promise<void> {
    await this.runTest('Scenario Creation', async () => {
      const scenarioData = {
        name: 'Test Registration Flow',
        description: 'Test user registration process',
        category: 'functional' as const,
        priority: 'high' as const,
        tags: ['registration', 'user-flow']
      };

      const scenarioId = this.scenarioBuilder.createScenario(scenarioData);
      const scenario = this.scenarioBuilder.getScenario(scenarioId);

      if (!scenario) {
        throw new Error('Scenario not created');
      }

      if (scenario.name !== scenarioData.name) {
        throw new Error('Scenario name mismatch');
      }

      if (scenario.category !== scenarioData.category) {
        throw new Error('Scenario category mismatch');
      }

      return { scenarioId, scenario };
    });
  }

  private async testScenarioValidation(): Promise<void> {
    await this.runTest('Scenario Validation', async () => {
      // Test invalid scenario (no name)
      try {
        this.scenarioBuilder.createScenario({ name: '' });
        throw new Error('Should have failed validation');
      } catch (error) {
        if (!(error as Error).message.includes('validation failed')) {
          throw error;
        }
      }

      // Test valid scenario
      const validScenario: Partial<TestScenario> = {
        name: 'Valid Test Scenario',
        category: 'functional',
        priority: 'medium',
        userJourneys: []
      };

      const scenarioId = this.scenarioBuilder.createScenario(validScenario);
      const validation = this.scenarioBuilder.validateScenario(this.scenarioBuilder.getScenario(scenarioId)!);

      return { validation, hasWarnings: validation.warnings.length > 0 };
    });
  }

  private async testUserJourneyManagement(): Promise<void> {
    await this.runTest('User Journey Management', async () => {
      // Create scenario
      const scenarioId = this.scenarioBuilder.createScenario({
        name: 'Journey Test Scenario',
        category: 'functional'
      });

      // Create user journey
      const journeyData: Partial<UserJourney> = {
        name: 'Test User Journey',
        description: 'A test journey for validation',
        userProfile: 'test_user',
        complexity: 'simple',
        variables: [
          { name: 'testVar', type: 'string', required: true, description: 'Test variable' }
        ]
      };

      const journeyId = this.scenarioBuilder.createUserJourney(scenarioId, journeyData);
      const scenario = this.scenarioBuilder.getScenario(scenarioId)!;
      const journey = scenario.userJourneys.find(j => j.id === journeyId);

      if (!journey) {
        throw new Error('Journey not created');
      }

      if (journey.name !== journeyData.name) {
        throw new Error('Journey name mismatch');
      }

      return { scenarioId, journeyId, journey };
    });
  }

  private async testStepManagement(): Promise<void> {
    await this.runTest('Step Management', async () => {
      // Create scenario and journey
      const scenarioId = this.scenarioBuilder.createScenario({
        name: 'Step Test Scenario',
        category: 'functional'
      });

      const journeyId = this.scenarioBuilder.createUserJourney(scenarioId, {
        name: 'Step Test Journey',
        userProfile: 'test_user'
      });

      // Add steps
      const step1: Partial<ScenarioStep> = {
        name: 'Navigate to Login',
        type: 'action',
        description: 'Navigate to login page',
        parameters: { url: '/login' },
        timeout: 10000
      };

      const step2: Partial<ScenarioStep> = {
        name: 'Fill Username',
        type: 'action',
        description: 'Fill username field',
        parameters: { selector: '#username', value: '{{user.username}}' },
        timeout: 5000
      };

      const step3: Partial<ScenarioStep> = {
        name: 'Verify Login Success',
        type: 'assertion',
        description: 'Verify successful login',
        parameters: { selector: '.welcome-message', expectedText: 'Welcome' }
      };

      const stepId1 = this.scenarioBuilder.addStepToJourney(scenarioId, journeyId, step1);
      const stepId2 = this.scenarioBuilder.addStepToJourney(scenarioId, journeyId, step2);
      const stepId3 = this.scenarioBuilder.addStepToJourney(scenarioId, journeyId, step3);

      // Set up step flow
      const scenario = this.scenarioBuilder.getScenario(scenarioId)!;
      const journey = scenario.userJourneys.find(j => j.id === journeyId)!;
      
      // Update steps to create flow
      journey.steps[0].onSuccess = stepId2;
      journey.steps[1].onSuccess = stepId3;
      journey.startStepId = stepId1;

      this.scenarioBuilder.updateScenario(scenarioId, scenario);

      const updatedScenario = this.scenarioBuilder.getScenario(scenarioId)!;
      const updatedJourney = updatedScenario.userJourneys.find(j => j.id === journeyId)!;

      if (updatedJourney.steps.length !== 3) {
        throw new Error('Incorrect number of steps');
      }

      if (updatedJourney.startStepId !== stepId1) {
        throw new Error('Start step not set correctly');
      }

      return { 
        scenarioId, 
        journeyId, 
        stepIds: [stepId1, stepId2, stepId3],
        journey: updatedJourney
      };
    });
  }

  private async testTemplateSystem(): Promise<void> {
    await this.runTest('Template System', async () => {
      // Get available templates
      const templates = this.scenarioBuilder.getTemplates();
      
      if (templates.length === 0) {
        throw new Error('No templates available');
      }

      // Create scenario from template
      const template = templates[0];
      const scenarioId = this.scenarioBuilder.createFromTemplate(template.id, {
        name: 'Scenario from Template Test'
      });

      const scenario = this.scenarioBuilder.getScenario(scenarioId)!;
      
      if (scenario.name !== 'Scenario from Template Test') {
        throw new Error('Template override not applied');
      }

      if (scenario.userJourneys.length === 0) {
        throw new Error('Template journeys not copied');
      }

      return { templateId: template.id, scenarioId, scenario };
    });
  }

  private async testExecutionPlanGeneration(): Promise<void> {
    await this.runTest('Execution Plan Generation', async () => {
      // Create scenario with multiple journeys
      const scenarioId = this.scenarioBuilder.createScenario({
        name: 'Execution Plan Test',
        category: 'functional',
        executionSettings: {
          parallelExecution: true,
          maxConcurrentUsers: 5,
          rampUpTime: 1000,
          sustainTime: 5000,
          rampDownTime: 1000
        }
      });

      // Add journeys
      const journey1Id = this.scenarioBuilder.createUserJourney(scenarioId, {
        name: 'Journey 1',
        userProfile: 'user1'
      });

      const journey2Id = this.scenarioBuilder.createUserJourney(scenarioId, {
        name: 'Journey 2',
        userProfile: 'user2'
      });

      // Add steps to journeys
      this.scenarioBuilder.addStepToJourney(scenarioId, journey1Id, {
        name: 'Step 1',
        type: 'action',
        parameters: { url: '/page1' }
      });

      this.scenarioBuilder.addStepToJourney(scenarioId, journey2Id, {
        name: 'Step 2',
        type: 'action',
        parameters: { url: '/page2' }
      });

      // Generate execution plan
      const executionPlan = this.scenarioBuilder.generateExecutionPlan(scenarioId);

      if (executionPlan.totalSteps !== 2) {
        throw new Error('Incorrect total steps in execution plan');
      }

      if (executionPlan.executionOrder.length === 0) {
        throw new Error('No execution phases generated');
      }

      if (!executionPlan.executionOrder[0].parallelExecution) {
        throw new Error('Parallel execution not configured correctly');
      }

      return { scenarioId, executionPlan };
    });
  }

  private async testScenarioExecution(): Promise<void> {
    await this.runTest('Scenario Execution', async () => {
      // Create simple scenario
      const scenarioId = this.scenarioBuilder.createFromTemplate('user_registration', {
        name: 'Test Execution Scenario'
      });

      // Execute scenario
      const result = await this.orchestrator.executeScenario(scenarioId, {
        variables: {
          'user.email': 'test@example.com',
          'user.password': 'testpassword123'
        }
      });

      if (!result.success) {
        throw new Error(`Scenario execution failed: ${result.error?.message}`);
      }

      if (result.journeyResults.length === 0) {
        throw new Error('No journey results');
      }

      if (result.summary.completedSteps === 0) {
        throw new Error('No steps completed');
      }

      return { scenarioId, result };
    });
  }

  private async testConcurrentExecution(): Promise<void> {
    await this.runTest('Concurrent Execution', async () => {
      // Create scenario with parallel execution
      const scenarioId = this.scenarioBuilder.createScenario({
        name: 'Concurrent Test Scenario',
        category: 'performance',
        executionSettings: {
          parallelExecution: true,
          maxConcurrentUsers: 3,
          rampUpTime: 500,
          sustainTime: 2000,
          rampDownTime: 500
        }
      });

      // Add multiple journeys
      for (let i = 1; i <= 3; i++) {
        const journeyId = this.scenarioBuilder.createUserJourney(scenarioId, {
          name: `Concurrent Journey ${i}`,
          userProfile: `user${i}`
        });

        this.scenarioBuilder.addStepToJourney(scenarioId, journeyId, {
          name: `Step ${i}`,
          type: 'delay',
          parameters: { duration: 1000, reason: 'Simulated work' }
        });
      }

      // Execute scenario
      const startTime = Date.now();
      const result = await this.orchestrator.executeScenario(scenarioId);
      const executionTime = Date.now() - startTime;

      if (!result.success) {
        throw new Error('Concurrent execution failed');
      }

      // Should complete faster than sequential execution due to parallelism
      if (executionTime > 5000) {
        throw new Error('Concurrent execution took too long');
      }

      return { scenarioId, result, executionTime };
    });
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Create scenario with failing step
      const scenarioId = this.scenarioBuilder.createScenario({
        name: 'Error Handling Test',
        category: 'functional'
      });

      const journeyId = this.scenarioBuilder.createUserJourney(scenarioId, {
        name: 'Failing Journey',
        userProfile: 'test_user'
      });

      // Add step that will timeout
      const stepId = this.scenarioBuilder.addStepToJourney(scenarioId, journeyId, {
        name: 'Timeout Step',
        type: 'action',
        parameters: { url: '/nonexistent' },
        timeout: 100, // Very short timeout
        retryAttempts: 1
      });

      // Set start step
      const scenario = this.scenarioBuilder.getScenario(scenarioId)!;
      scenario.userJourneys[0].startStepId = stepId;
      this.scenarioBuilder.updateScenario(scenarioId, scenario);

      // Execute scenario (should fail gracefully)
      const result = await this.orchestrator.executeScenario(scenarioId);

      if (result.success) {
        throw new Error('Expected scenario to fail but it succeeded');
      }

      if (result.journeyResults.length === 0) {
        throw new Error('No journey results for failed execution');
      }

      const journeyResult = result.journeyResults[0];
      if (journeyResult.stepResults.length === 0) {
        throw new Error('No step results for failed journey');
      }

      const stepResult = journeyResult.stepResults[0];
      if (stepResult.success) {
        throw new Error('Expected step to fail but it succeeded');
      }

      return { scenarioId, result, stepResult };
    });
  }

  private async testSessionManagement(): Promise<void> {
    await this.runTest('Session Management', async () => {
      // Create scenario
      const scenarioId = this.scenarioBuilder.createFromTemplate('booking_flow', {
        name: 'Session Management Test'
      });

      // Start execution (don't await to test session tracking)
      const executionPromise = this.orchestrator.executeScenario(scenarioId, {
        variables: {
          'booking.pickupLocation': 'Test Pickup',
          'booking.destination': 'Test Destination'
        }
      });

      // Check active sessions
      await new Promise(resolve => setTimeout(resolve, 100)); // Give execution time to start
      const activeSessions = this.orchestrator.getAllActiveSessions();

      if (activeSessions.length === 0) {
        throw new Error('No active sessions found');
      }

      const session = activeSessions[0];
      if (session.scenarioId !== scenarioId) {
        throw new Error('Session scenario ID mismatch');
      }

      if (session.status !== 'running') {
        throw new Error('Session status should be running');
      }

      // Wait for execution to complete
      const result = await executionPromise;

      // Check that session is no longer active
      const finalActiveSessions = this.orchestrator.getAllActiveSessions();
      if (finalActiveSessions.length > 0) {
        throw new Error('Session should be removed after completion');
      }

      return { scenarioId, session, result };
    });
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        details: result
      });
      
      console.log(`✅ ${testName} - Passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        testName,
        success: false,
        duration,
        error: errorMessage
      });
      
      console.log(`❌ ${testName} - Failed (${duration}ms): ${errorMessage}`);
    }
  }

  private printResults(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }

    console.log('\n🎭 Scenario Builder Test Suite Complete!\n');
  }
}

// Export function to run the tests
export async function runScenarioBuilderTests(): Promise<TestResult[]> {
  const testSuite = new ScenarioBuilderTestSuite();
  return await testSuite.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runScenarioBuilderTests().catch(console.error);
}