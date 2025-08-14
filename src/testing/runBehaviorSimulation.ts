/**
 * Behavior Simulation Demo
 * Demonstrates the behavior simulation engine capabilities
 */

import { BehaviorSimulationRunner } from './simulation/BehaviorSimulationRunner'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runBehaviorSimulationDemo() {
  console.log('🚀 Starting Behavior Simulation Engine Demo')
  console.log('=' .repeat(50))

  const runner = new BehaviorSimulationRunner()
  const engine = runner.getEngine()

  try {
    // Demo 1: Single User Journey Simulation
    console.log('\n📱 Demo 1: Single User Journey Simulation')
    console.log('-'.repeat(40))

    const testUser = VirtualUserFactory.createPassengerUser('regular')
    console.log(`Created test user: ${testUser.id} (${testUser.profile.demographics.experience} user)`)

    const customJourney = engine.generateUserJourney(testUser)
    console.log(`Generated custom journey with ${customJourney.steps.length} steps`)

    const singleResult = await engine.runScenarioSimulation(customJourney.id, testUser)
    console.log(`Journey completed: ${singleResult.status}`)
    console.log(`Duration: ${singleResult.performanceMetrics.totalDuration}ms`)
    console.log(`Steps completed: ${singleResult.completedSteps}/${singleResult.totalSteps}`)

    // Demo 2: Multiple User Types Comparison
    console.log('\n👥 Demo 2: Multiple User Types Comparison')
    console.log('-'.repeat(40))

    const userTypes = ['new', 'regular', 'power'] as const
    const comparisonResults = []

    for (const userType of userTypes) {
      const user = VirtualUserFactory.createPassengerUser(userType)
      const journey = engine.generateUserJourney(user)
      const result = await engine.runScenarioSimulation(journey.id, user)
      
      comparisonResults.push({
        userType,
        duration: result.performanceMetrics.totalDuration,
        success: result.status === 'completed',
        steps: result.completedSteps
      })

      console.log(`${userType.toUpperCase()} user: ${result.status} in ${result.performanceMetrics.totalDuration}ms`)
    }

    // Demo 3: Predefined Scenarios Test
    console.log('\n🎯 Demo 3: Predefined Scenarios Test')
    console.log('-'.repeat(40))

    const scenarios = engine.getScenarios()
    console.log(`Available scenarios: ${scenarios.map(s => s.name).join(', ')}`)

    // Test simple booking scenario
    const simpleUser = VirtualUserFactory.createPassengerUser('regular')
    const simpleResult = await engine.runScenarioSimulation('simple_booking', simpleUser)
    console.log(`Simple booking: ${simpleResult.status} (${simpleResult.errors.length} errors)`)

    // Demo 4: Concurrent User Simulation
    console.log('\n⚡ Demo 4: Concurrent User Simulation')
    console.log('-'.repeat(40))

    const concurrentConfig = {
      maxConcurrentUsers: 10,
      userSpawnRate: 2,
      rampUpDuration: 5,
      sustainDuration: 10,
      rampDownDuration: 3,
      scenarios: scenarios,
      userDistribution: { new: 0.3, regular: 0.5, power: 0.2 }
    }

    console.log('Starting concurrent simulation with 10 users...')
    const concurrentResults = await engine.runConcurrentSimulation(concurrentConfig)
    const stats = engine.getSimulationStatistics(concurrentResults)

    console.log(`Concurrent simulation completed:`)
    console.log(`- Total simulations: ${stats.totalSimulations}`)
    console.log(`- Success rate: ${stats.successRate.toFixed(1)}%`)
    console.log(`- Average duration: ${stats.averageDuration.toFixed(0)}ms`)
    console.log(`- Error rate: ${stats.errorRate.toFixed(1)}%`)

    // Demo 5: Comprehensive Test Suite
    console.log('\n🧪 Demo 5: Comprehensive Test Suite')
    console.log('-'.repeat(40))

    console.log('Running predefined test suites...')
    const testResults = await runner.runPredefinedTestSuites()

    console.log(`\nTest Suite Results:`)
    testResults.forEach(result => {
      console.log(`- ${result.testName}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
      console.log(`  Duration: ${result.totalDuration}ms, Success Rate: ${result.statistics.successRate?.toFixed(1)}%`)
    })

    // Generate comprehensive report
    console.log('\n📊 Demo 6: Test Report Generation')
    console.log('-'.repeat(40))

    const report = runner.generateTestReport(testResults)
    console.log('Generated comprehensive test report:')
    console.log(report.substring(0, 500) + '...')

    // Demo 7: Custom Interaction Patterns
    console.log('\n🎨 Demo 7: Custom Interaction Patterns')
    console.log('-'.repeat(40))

    const customPattern = engine.createInteractionPattern('quick_booking', [
      { type: 'click', target: '[data-testid="quick-book"]', timing: 500 },
      { type: 'input', target: '[data-testid="destination"]', data: { value: 'Airport' }, timing: 2000 },
      { type: 'click', target: '[data-testid="confirm"]', timing: 1000 },
      { type: 'wait', target: 'confirmation', timing: 3000 }
    ])

    console.log(`Created custom interaction pattern with ${customPattern.length} steps`)

    const customScenario = engine.createCustomScenario(
      'quick_booking_demo',
      'Quick Booking Demo',
      'Demonstrates custom interaction patterns',
      customPattern
    )

    const patternUser = VirtualUserFactory.createPassengerUser('power')
    const patternResult = await engine.runScenarioSimulation(customScenario.id, patternUser)
    console.log(`Custom pattern result: ${patternResult.status}`)

    // Demo 8: Performance Analysis
    console.log('\n📈 Demo 8: Performance Analysis')
    console.log('-'.repeat(40))

    const allResults = [singleResult, simpleResult, ...concurrentResults, ...testResults.flatMap(r => r.userResults)]
    const overallStats = engine.getSimulationStatistics(allResults)

    console.log('Overall Performance Analysis:')
    console.log(`- Total simulations run: ${overallStats.totalSimulations}`)
    console.log(`- Overall success rate: ${overallStats.successRate.toFixed(1)}%`)
    console.log(`- Average completion time: ${overallStats.averageDuration.toFixed(0)}ms`)
    console.log(`- Average API calls per simulation: ${overallStats.performanceMetrics.averageApiCalls.toFixed(1)}`)
    console.log(`- Average API response time: ${overallStats.performanceMetrics.averageApiResponseTime.toFixed(0)}ms`)

    console.log('\n✅ Behavior Simulation Engine Demo Completed Successfully!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Demo failed:', error)
  } finally {
    // Cleanup
    engine.stopAllSimulations()
    runner.clearTestResults()
  }
}

// Export for use in other modules
export { runBehaviorSimulationDemo }

// Run demo if this file is executed directly
if (require.main === module) {
  runBehaviorSimulationDemo().catch(console.error)
}