/**
 * Behavior Simulation Integration Test
 * Tests the integration between behavior simulation engine and the testing framework
 */

import { BehaviorSimulationEngine, SimulationResult } from '../simulation/BehaviorSimulationEngine'
import { BehaviorSimulationRunner } from '../simulation/BehaviorSimulationRunner'
import { VirtualUserFactory } from '../core/VirtualUserFactory'
import { TestSuite, TestResult, HealthStatus } from '../core/TestingAgentController'

export class BehaviorSimulationIntegrationTest implements TestSuite {
  public readonly id = 'behavior_simulation_integration'
  public readonly name = 'Behavior Simulation Integration Test'
  public readonly description = 'Tests the behavior simulation engine integration with the testing framework'
  public readonly dependencies: string[] = []

  private engine: BehaviorSimulationEngine
  private runner: BehaviorSimulationRunner

  constructor() {
    this.engine = new BehaviorSimulationEngine()
    this.runner = new BehaviorSimulationRunner()
  }

  /**
   * Setup test environment
   */
  public async setup(): Promise<void> {
    console.log('Setting up Behavior Simulation Integration Test...')
    // Any setup required before running tests
  }

  /**
   * Cleanup test environment
   */
  public async teardown(): Promise<void> {
    console.log('Tearing down Behavior Simulation Integration Test...')
    this.engine.stopAllSimulations()
    this.runner.clearTestResults()
  }

  /**
   * Run all integration tests
   */
  public async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Test 1: Engine Initialization
    results.push(await this.testEngineInitialization())

    // Test 2: Virtual User Creation
    results.push(await this.testVirtualUserCreation())

    // Test 3: Scenario Execution
    results.push(await this.testScenarioExecution())

    // Test 4: Concurrent Simulation
    results.push(await this.testConcurrentSimulation())

    // Test 5: Custom Journey Generation
    results.push(await this.testCustomJourneyGeneration())

    // Test 6: Performance Metrics
    results.push(await this.testPerformanceMetrics())

    // Test 7: Error Handling
    results.push(await this.testErrorHandling())

    // Test 8: Test Runner Integration
    results.push(await this.testRunnerIntegration())

    return results
  }

  /**
   * Get health status
   */
  public getHealthStatus(): HealthStatus {
    try {
      const scenarioCount = this.engine.getScenarios().length
      const isRunning = this.engine.isSimulationRunning()
      
      if (scenarioCount === 0) {
        return {
          status: 'unhealthy',
          message: 'No scenarios available for testing'
        }
      }

      if (isRunning) {
        return {
          status: 'healthy',
          message: `Simulation engine running with ${scenarioCount} scenarios`
        }
      }

      return {
        status: 'healthy',
        message: `Simulation engine ready with ${scenarioCount} scenarios`
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error}`
      }
    }
  }

  /**
   * Test engine initialization
   */
  private async testEngineInitialization(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const scenarios = this.engine.getScenarios()
      const activeCount = this.engine.getActiveSimulationsCount()
      const concurrentCount = this.engine.getConcurrentUsersCount()

      if (scenarios.length === 0) {
        return {
          id: 'engine_init',
          name: 'Engine Initialization',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'No default scenarios found',
          timestamp: Date.now()
        }
      }

      if (activeCount !== 0 || concurrentCount !== 0) {
        return {
          id: 'engine_init',
          name: 'Engine Initialization',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Engine not in clean initial state',
          timestamp: Date.now()
        }
      }

      return {
        id: 'engine_init',
        name: 'Engine Initialization',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Engine initialized with ${scenarios.length} scenarios`,
        details: { scenarioCount: scenarios.length },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'engine_init',
        name: 'Engine Initialization',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Initialization failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test virtual user creation
   */
  private async testVirtualUserCreation(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const userTypes = ['new', 'regular', 'power'] as const
      const users = userTypes.map(type => VirtualUserFactory.createPassengerUser(type))

      // Validate user properties
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const expectedType = userTypes[i]

        if (user.profile.demographics.experience !== expectedType) {
          return {
            id: 'user_creation',
            name: 'Virtual User Creation',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `User type mismatch: expected ${expectedType}, got ${user.profile.demographics.experience}`,
            timestamp: Date.now()
          }
        }

        if (!user.id || !user.session.id || !user.currentState) {
          return {
            id: 'user_creation',
            name: 'Virtual User Creation',
            status: 'failed',
            duration: Date.now() - startTime,
            message: 'User missing required properties',
            timestamp: Date.now()
          }
        }
      }

      // Test driver user creation
      const driverUser = VirtualUserFactory.createDriverUser()
      if (driverUser.profile.role !== 'driver') {
        return {
          id: 'user_creation',
          name: 'Virtual User Creation',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Driver user creation failed',
          timestamp: Date.now()
        }
      }

      return {
        id: 'user_creation',
        name: 'Virtual User Creation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Successfully created ${users.length + 1} virtual users`,
        details: { passengerUsers: users.length, driverUsers: 1 },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'user_creation',
        name: 'Virtual User Creation',
        status: 'error',
        duration: Date.now() - startTime,
        message: `User creation failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test scenario execution
   */
  private async testScenarioExecution(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const user = VirtualUserFactory.createPassengerUser('regular')
      const scenarios = this.engine.getScenarios()
      
      if (scenarios.length === 0) {
        return {
          id: 'scenario_execution',
          name: 'Scenario Execution',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'No scenarios available for testing',
          timestamp: Date.now()
        }
      }

      const scenario = scenarios[0] // Test first scenario
      const result = await this.engine.runScenarioSimulation(scenario.id, user)

      if (!result) {
        return {
          id: 'scenario_execution',
          name: 'Scenario Execution',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Scenario execution returned no result',
          timestamp: Date.now()
        }
      }

      if (result.status === 'failed' && result.errors.some(e => e.severity === 'critical')) {
        return {
          id: 'scenario_execution',
          name: 'Scenario Execution',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Scenario failed with critical errors: ${result.errors.map(e => e.error).join(', ')}`,
          timestamp: Date.now()
        }
      }

      return {
        id: 'scenario_execution',
        name: 'Scenario Execution',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Scenario executed: ${result.status}`,
        details: {
          scenarioId: scenario.id,
          completedSteps: result.completedSteps,
          totalSteps: result.totalSteps,
          errors: result.errors.length
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'scenario_execution',
        name: 'Scenario Execution',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Scenario execution failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test concurrent simulation
   */
  private async testConcurrentSimulation(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const scenarios = this.engine.getScenarios()
      const config = {
        maxConcurrentUsers: 5,
        userSpawnRate: 2,
        rampUpDuration: 2,
        sustainDuration: 3,
        rampDownDuration: 1,
        scenarios: scenarios,
        userDistribution: { new: 0.2, regular: 0.6, power: 0.2 }
      }

      const results = await this.engine.runConcurrentSimulation(config)
      
      if (results.length === 0) {
        return {
          id: 'concurrent_simulation',
          name: 'Concurrent Simulation',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'No concurrent simulation results',
          timestamp: Date.now()
        }
      }

      const stats = this.engine.getSimulationStatistics(results)
      
      return {
        id: 'concurrent_simulation',
        name: 'Concurrent Simulation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Concurrent simulation completed with ${results.length} users`,
        details: {
          totalSimulations: stats.totalSimulations,
          successRate: stats.successRate,
          averageDuration: stats.averageDuration
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'concurrent_simulation',
        name: 'Concurrent Simulation',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Concurrent simulation failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test custom journey generation
   */
  private async testCustomJourneyGeneration(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const userTypes = ['new', 'regular', 'power'] as const
      const journeys = []

      for (const userType of userTypes) {
        const user = VirtualUserFactory.createPassengerUser(userType)
        const journey = this.engine.generateUserJourney(user)
        journeys.push(journey)

        if (!journey.id || !journey.name || journey.steps.length === 0) {
          return {
            id: 'custom_journey',
            name: 'Custom Journey Generation',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Invalid journey generated for ${userType} user`,
            timestamp: Date.now()
          }
        }
      }

      // Verify different user types have different journey characteristics
      const newUserJourney = journeys[0]
      const powerUserJourney = journeys[2]

      if (newUserJourney.steps.length <= powerUserJourney.steps.length) {
        // New users should typically have more guidance steps
        console.warn('New user journey not longer than power user journey as expected')
      }

      return {
        id: 'custom_journey',
        name: 'Custom Journey Generation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Generated ${journeys.length} custom journeys`,
        details: {
          journeys: journeys.map(j => ({
            id: j.id,
            steps: j.steps.length,
            expectedDuration: j.expectedDuration
          }))
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'custom_journey',
        name: 'Custom Journey Generation',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Custom journey generation failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test performance metrics
   */
  private async testPerformanceMetrics(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const user = VirtualUserFactory.createPassengerUser('regular')
      const scenarios = this.engine.getScenarios()
      const results: SimulationResult[] = []

      // Run a few simulations to get metrics
      for (let i = 0; i < Math.min(3, scenarios.length); i++) {
        const result = await this.engine.runScenarioSimulation(scenarios[i].id, user)
        results.push(result)
      }

      const stats = this.engine.getSimulationStatistics(results)

      // Validate metrics structure
      const requiredMetrics = ['totalSimulations', 'successRate', 'averageDuration', 'errorRate']
      for (const metric of requiredMetrics) {
        if (!(metric in stats)) {
          return {
            id: 'performance_metrics',
            name: 'Performance Metrics',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Missing metric: ${metric}`,
            timestamp: Date.now()
          }
        }
      }

      // Validate metric values
      if (stats.totalSimulations !== results.length) {
        return {
          id: 'performance_metrics',
          name: 'Performance Metrics',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Total simulations count mismatch',
          timestamp: Date.now()
        }
      }

      return {
        id: 'performance_metrics',
        name: 'Performance Metrics',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Performance metrics calculated correctly',
        details: stats,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'performance_metrics',
        name: 'Performance Metrics',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Performance metrics test failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const user = VirtualUserFactory.createPassengerUser('regular')

      // Test invalid scenario ID
      try {
        await this.engine.runScenarioSimulation('invalid_scenario', user)
        return {
          id: 'error_handling',
          name: 'Error Handling',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Invalid scenario should have thrown error',
          timestamp: Date.now()
        }
      } catch (error) {
        // Expected error
      }

      // Test custom scenario with invalid steps
      const invalidScenario = this.engine.createCustomScenario(
        'test_invalid',
        'Test Invalid',
        'Test scenario with invalid steps',
        [
          {
            id: 'invalid_step',
            name: 'Invalid Step',
            action: 'invalid_action' as any,
            target: 'nowhere',
            expectedDelay: 1000,
            maxRetries: 1,
            optional: false
          }
        ]
      )

      const result = await this.engine.runScenarioSimulation(invalidScenario.id, user)
      
      if (result.status !== 'failed' || result.errors.length === 0) {
        return {
          id: 'error_handling',
          name: 'Error Handling',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Invalid scenario should have failed with errors',
          timestamp: Date.now()
        }
      }

      return {
        id: 'error_handling',
        name: 'Error Handling',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Error handling working correctly',
        details: { errorsDetected: result.errors.length },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'error_handling',
        name: 'Error Handling',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Error handling test failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test runner integration
   */
  private async testRunnerIntegration(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const testConfig = {
        name: 'Integration Test',
        description: 'Test runner integration',
        userCount: 3,
        userDistribution: { new: 1, regular: 1, power: 1 },
        scenarioDistribution: { 'simple_booking': 1.0 },
        expectedSuccessRate: 50, // Low threshold for testing
        maxDuration: 60000
      }

      const result = await this.runner.runSimulationTest(testConfig)

      if (!result) {
        return {
          id: 'runner_integration',
          name: 'Runner Integration',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Runner returned no result',
          timestamp: Date.now()
        }
      }

      if (!result.statistics || !result.userResults) {
        return {
          id: 'runner_integration',
          name: 'Runner Integration',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Runner result missing required properties',
          timestamp: Date.now()
        }
      }

      // Test report generation
      const report = this.runner.generateTestReport([result])
      if (!report || report.length === 0) {
        return {
          id: 'runner_integration',
          name: 'Runner Integration',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Report generation failed',
          timestamp: Date.now()
        }
      }

      return {
        id: 'runner_integration',
        name: 'Runner Integration',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Runner integration working correctly',
        details: {
          testResult: result.success,
          userCount: result.userResults.length,
          reportLength: report.length
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'runner_integration',
        name: 'Runner Integration',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Runner integration test failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }
}