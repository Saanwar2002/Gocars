/**
 * Behavior Simulation Runner
 * Orchestrates and executes behavior simulation tests
 */

import { BehaviorSimulationEngine, ConcurrentSimulationConfig, SimulationResult } from './BehaviorSimulationEngine'
import { VirtualUserFactory, VirtualUser } from '../core/VirtualUserFactory'

export interface SimulationTestConfig {
  name: string
  description: string
  userCount: number
  userDistribution: {
    new: number
    regular: number
    power: number
  }
  scenarioDistribution: {
    [scenarioId: string]: number
  }
  concurrentConfig?: ConcurrentSimulationConfig
  expectedSuccessRate: number
  maxDuration: number
}

export interface SimulationTestResult {
  testName: string
  startTime: Date
  endTime: Date
  totalDuration: number
  userResults: SimulationResult[]
  statistics: any
  success: boolean
  errors: string[]
  recommendations: string[]
}

export class BehaviorSimulationRunner {
  private engine: BehaviorSimulationEngine
  private testResults: Map<string, SimulationTestResult> = new Map()

  constructor() {
    this.engine = new BehaviorSimulationEngine()
  }

  /**
   * Run a comprehensive behavior simulation test
   */
  public async runSimulationTest(config: SimulationTestConfig): Promise<SimulationTestResult> {
    console.log(`Starting behavior simulation test: ${config.name}`)
    
    const testResult: SimulationTestResult = {
      testName: config.name,
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 0,
      userResults: [],
      statistics: {},
      success: false,
      errors: [],
      recommendations: []
    }

    try {
      // Generate virtual users based on distribution
      const users = this.generateTestUsers(config.userCount, config.userDistribution)
      console.log(`Generated ${users.length} virtual users for testing`)

      // Run simulations
      if (config.concurrentConfig) {
        // Run concurrent simulation
        testResult.userResults = await this.engine.runConcurrentSimulation(config.concurrentConfig)
      } else {
        // Run sequential simulations
        testResult.userResults = await this.runSequentialSimulations(users, config.scenarioDistribution)
      }

      // Calculate statistics
      testResult.statistics = this.engine.getSimulationStatistics(testResult.userResults)
      
      // Determine success
      testResult.success = this.evaluateTestSuccess(testResult, config)
      
      // Generate recommendations
      testResult.recommendations = this.generateRecommendations(testResult, config)

    } catch (error) {
      testResult.errors.push(error instanceof Error ? error.message : String(error))
      testResult.success = false
    } finally {
      testResult.endTime = new Date()
      testResult.totalDuration = testResult.endTime.getTime() - testResult.startTime.getTime()
      this.testResults.set(config.name, testResult)
    }

    console.log(`Behavior simulation test completed: ${config.name} - Success: ${testResult.success}`)
    return testResult
  }

  /**
   * Generate virtual users for testing
   */
  private generateTestUsers(
    userCount: number,
    distribution: { new: number; regular: number; power: number }
  ): VirtualUser[] {
    const users: VirtualUser[] = []
    const total = distribution.new + distribution.regular + distribution.power

    const newCount = Math.floor((distribution.new / total) * userCount)
    const regularCount = Math.floor((distribution.regular / total) * userCount)
    const powerCount = userCount - newCount - regularCount

    // Create new users
    for (let i = 0; i < newCount; i++) {
      users.push(VirtualUserFactory.createPassengerUser('new'))
    }

    // Create regular users
    for (let i = 0; i < regularCount; i++) {
      users.push(VirtualUserFactory.createPassengerUser('regular'))
    }

    // Create power users
    for (let i = 0; i < powerCount; i++) {
      users.push(VirtualUserFactory.createPassengerUser('power'))
    }

    return users
  }

  /**
   * Run sequential simulations
   */
  private async runSequentialSimulations(
    users: VirtualUser[],
    scenarioDistribution: { [scenarioId: string]: number }
  ): Promise<SimulationResult[]> {
    return await this.engine.handleConcurrentUserScenarios(users, scenarioDistribution)
  }

  /**
   * Evaluate test success based on criteria
   */
  private evaluateTestSuccess(result: SimulationTestResult, config: SimulationTestConfig): boolean {
    const stats = result.statistics
    
    // Check success rate
    if (stats.successRate < config.expectedSuccessRate) {
      result.errors.push(`Success rate ${stats.successRate}% below expected ${config.expectedSuccessRate}%`)
      return false
    }

    // Check duration
    if (result.totalDuration > config.maxDuration) {
      result.errors.push(`Test duration ${result.totalDuration}ms exceeded maximum ${config.maxDuration}ms`)
      return false
    }

    // Check for critical errors
    const criticalErrors = result.userResults.filter(r => 
      r.errors.some(e => e.severity === 'critical')
    ).length

    if (criticalErrors > result.userResults.length * 0.05) { // More than 5% critical errors
      result.errors.push(`Too many critical errors: ${criticalErrors}`)
      return false
    }

    return true
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(result: SimulationTestResult, config: SimulationTestConfig): string[] {
    const recommendations: string[] = []
    const stats = result.statistics

    // Performance recommendations
    if (stats.averageDuration > 30000) { // More than 30 seconds
      recommendations.push('Consider optimizing user journey flow to reduce completion time')
    }

    if (stats.performanceMetrics.averageApiResponseTime > 2000) { // More than 2 seconds
      recommendations.push('API response times are high, consider backend optimization')
    }

    if (stats.performanceMetrics.averagePageLoadTime > 3000) { // More than 3 seconds
      recommendations.push('Page load times are slow, consider frontend optimization')
    }

    // Error rate recommendations
    if (stats.errorRate > 10) { // More than 10% error rate
      recommendations.push('High error rate detected, investigate common failure points')
    }

    // User experience recommendations
    const newUserFailures = result.userResults.filter(r => 
      r.userId.includes('new') && r.status === 'failed'
    ).length

    if (newUserFailures > 0) {
      recommendations.push('New users experiencing failures, consider improving onboarding flow')
    }

    // Concurrency recommendations
    if (config.concurrentConfig && stats.successRate < 90) {
      recommendations.push('Concurrent user performance issues detected, consider load balancing improvements')
    }

    return recommendations
  }

  /**
   * Run predefined test suites
   */
  public async runPredefinedTestSuites(): Promise<SimulationTestResult[]> {
    const testSuites: SimulationTestConfig[] = [
      {
        name: 'Basic Booking Flow Test',
        description: 'Test basic ride booking functionality with mixed user types',
        userCount: 10,
        userDistribution: { new: 3, regular: 5, power: 2 },
        scenarioDistribution: { 'simple_booking': 1.0 },
        expectedSuccessRate: 90,
        maxDuration: 60000
      },
      {
        name: 'Multi-Stop Booking Test',
        description: 'Test complex multi-stop booking scenarios',
        userCount: 5,
        userDistribution: { new: 1, regular: 2, power: 2 },
        scenarioDistribution: { 'multi_stop_booking': 1.0 },
        expectedSuccessRate: 85,
        maxDuration: 90000
      },
      {
        name: 'Group Booking Test',
        description: 'Test group booking and cost splitting functionality',
        userCount: 8,
        userDistribution: { new: 2, regular: 4, power: 2 },
        scenarioDistribution: { 'group_booking': 1.0 },
        expectedSuccessRate: 80,
        maxDuration: 120000
      },
      {
        name: 'Mixed Scenario Test',
        description: 'Test all booking scenarios with realistic distribution',
        userCount: 20,
        userDistribution: { new: 4, regular: 12, power: 4 },
        scenarioDistribution: { 
          'simple_booking': 0.6,
          'multi_stop_booking': 0.25,
          'group_booking': 0.15
        },
        expectedSuccessRate: 88,
        maxDuration: 180000
      },
      {
        name: 'Concurrent Load Test',
        description: 'Test system behavior under concurrent user load',
        userCount: 50,
        userDistribution: { new: 10, regular: 30, power: 10 },
        scenarioDistribution: { 
          'simple_booking': 0.7,
          'multi_stop_booking': 0.2,
          'group_booking': 0.1
        },
        concurrentConfig: {
          maxConcurrentUsers: 50,
          userSpawnRate: 5,
          rampUpDuration: 10,
          sustainDuration: 30,
          rampDownDuration: 5,
          scenarios: [], // Will be populated from available scenarios
          userDistribution: { new: 0.2, regular: 0.6, power: 0.2 }
        },
        expectedSuccessRate: 85,
        maxDuration: 300000
      }
    ]

    const results: SimulationTestResult[] = []

    for (const testConfig of testSuites) {
      try {
        // Populate scenarios for concurrent config if needed
        if (testConfig.concurrentConfig) {
          testConfig.concurrentConfig.scenarios = this.engine.getScenarios()
        }

        const result = await this.runSimulationTest(testConfig)
        results.push(result)

        // Add delay between test suites
        await this.delay(5000)
      } catch (error) {
        console.error(`Test suite failed: ${testConfig.name}`, error)
      }
    }

    return results
  }

  /**
   * Generate comprehensive test report
   */
  public generateTestReport(results: SimulationTestResult[]): string {
    let report = '# Behavior Simulation Test Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    // Summary
    const totalTests = results.length
    const passedTests = results.filter(r => r.success).length
    const overallSuccessRate = (passedTests / totalTests) * 100

    report += '## Summary\n\n'
    report += `- Total Tests: ${totalTests}\n`
    report += `- Passed: ${passedTests}\n`
    report += `- Failed: ${totalTests - passedTests}\n`
    report += `- Overall Success Rate: ${overallSuccessRate.toFixed(1)}%\n\n`

    // Individual test results
    report += '## Test Results\n\n'

    for (const result of results) {
      report += `### ${result.testName}\n\n`
      report += `- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`
      report += `- **Duration**: ${result.totalDuration}ms\n`
      report += `- **Users Tested**: ${result.userResults.length}\n`
      report += `- **Success Rate**: ${result.statistics.successRate?.toFixed(1) || 0}%\n`
      report += `- **Average Duration**: ${result.statistics.averageDuration?.toFixed(0) || 0}ms\n`
      report += `- **Error Rate**: ${result.statistics.errorRate?.toFixed(1) || 0}%\n\n`

      if (result.errors.length > 0) {
        report += '**Errors:**\n'
        result.errors.forEach(error => {
          report += `- ${error}\n`
        })
        report += '\n'
      }

      if (result.recommendations.length > 0) {
        report += '**Recommendations:**\n'
        result.recommendations.forEach(rec => {
          report += `- ${rec}\n`
        })
        report += '\n'
      }
    }

    // Performance metrics
    report += '## Performance Metrics\n\n'
    const avgApiTime = results.reduce((sum, r) => 
      sum + (r.statistics.performanceMetrics?.averageApiResponseTime || 0), 0
    ) / results.length

    const avgPageLoad = results.reduce((sum, r) => 
      sum + (r.statistics.performanceMetrics?.averagePageLoadTime || 0), 0
    ) / results.length

    report += `- Average API Response Time: ${avgApiTime.toFixed(0)}ms\n`
    report += `- Average Page Load Time: ${avgPageLoad.toFixed(0)}ms\n\n`

    // Recommendations
    const allRecommendations = results.flatMap(r => r.recommendations)
    const uniqueRecommendations = [...new Set(allRecommendations)]

    if (uniqueRecommendations.length > 0) {
      report += '## Overall Recommendations\n\n'
      uniqueRecommendations.forEach(rec => {
        report += `- ${rec}\n`
      })
    }

    return report
  }

  /**
   * Get test results
   */
  public getTestResults(): Map<string, SimulationTestResult> {
    return this.testResults
  }

  /**
   * Clear test results
   */
  public clearTestResults(): void {
    this.testResults.clear()
  }

  /**
   * Get behavior simulation engine
   */
  public getEngine(): BehaviorSimulationEngine {
    return this.engine
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}