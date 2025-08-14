/**
 * Firebase Authentication Tests Demo
 * Demonstrates the Firebase authentication testing capabilities
 */

import { FirebaseTestSuite } from './firebase/FirebaseTestSuite'
import { FirebaseAuthenticationTester } from './firebase/FirebaseAuthenticationTester'
import { testingAgentController } from './core/TestingAgentController'

async function runFirebaseAuthTestsDemo() {
  console.log('🔥 Starting Firebase Authentication Tests Demo')
  console.log('=' .repeat(60))

  try {
    // Initialize Firebase Test Suite
    const firebaseTestSuite = new FirebaseTestSuite()
    
    // Register with testing agent controller
    testingAgentController.registerTestSuite(firebaseTestSuite)

    // Check health status first
    console.log('\n🏥 Checking Firebase Health Status')
    console.log('-'.repeat(40))
    
    const healthStatus = firebaseTestSuite.getHealthStatus()
    console.log(`Health Status: ${healthStatus.status.toUpperCase()}`)
    console.log(`Message: ${healthStatus.message}`)
    
    if (healthStatus.details) {
      console.log('Details:', JSON.stringify(healthStatus.details, null, 2))
    }

    if (healthStatus.status === 'unhealthy') {
      console.log('⚠️  Firebase services not available. Demo will continue with limited functionality.')
    }

    // Demo 1: Individual Authentication Tester
    console.log('\n🔐 Demo 1: Individual Authentication Tests')
    console.log('-'.repeat(40))

    const authTester = new FirebaseAuthenticationTester()
    const authConfig = {
      testEmail: `demo_${Date.now()}@example.com`,
      testPassword: 'DemoPassword123!',
      newPassword: 'NewDemoPassword456!',
      displayName: 'Demo User',
      timeout: 30000
    }

    console.log(`Testing with email: ${authConfig.testEmail}`)
    
    const authResults = await authTester.runAuthenticationTests(authConfig)
    
    console.log('\nAuthentication Test Results:')
    authResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : 
                        result.status === 'skipped' ? '⏭️' : '⚠️'
      
      console.log(`${statusIcon} ${result.name}: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.authDetails) {
        console.log(`   Auth Details: ${JSON.stringify(result.authDetails, null, 4)}`)
      }
      
      if (result.status === 'failed' && result.details) {
        console.log(`   Error Details: ${JSON.stringify(result.details, null, 4)}`)
      }
      console.log()
    })

    // Demo 2: Full Firebase Test Suite
    console.log('\n🧪 Demo 2: Complete Firebase Test Suite')
    console.log('-'.repeat(40))

    console.log('Setting up Firebase Test Suite...')
    await firebaseTestSuite.setup()

    console.log('Running complete Firebase test suite...')
    const suiteResults = await firebaseTestSuite.runTests()

    console.log('\nFirebase Test Suite Results:')
    console.log(`Total Tests: ${suiteResults.length}`)
    
    const passed = suiteResults.filter(r => r.status === 'passed').length
    const failed = suiteResults.filter(r => r.status === 'failed').length
    const errors = suiteResults.filter(r => r.status === 'error').length
    const skipped = suiteResults.filter(r => r.status === 'skipped').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Errors: ${errors}`)
    console.log(`⏭️  Skipped: ${skipped}`)

    const successRate = ((passed / suiteResults.length) * 100).toFixed(1)
    console.log(`📊 Success Rate: ${successRate}%`)

    // Show detailed results for failed tests
    const failedTests = suiteResults.filter(r => r.status === 'failed' || r.status === 'error')
    if (failedTests.length > 0) {
      console.log('\n❌ Failed/Error Test Details:')
      failedTests.forEach(test => {
        console.log(`- ${test.name}: ${test.message}`)
        if (test.details) {
          console.log(`  Details: ${JSON.stringify(test.details, null, 2)}`)
        }
      })
    }

    // Demo 3: Performance Analysis
    console.log('\n📈 Demo 3: Performance Analysis')
    console.log('-'.repeat(40))

    const performanceTests = suiteResults.filter(r => r.name.includes('Performance'))
    if (performanceTests.length > 0) {
      console.log('Performance Test Results:')
      performanceTests.forEach(test => {
        console.log(`- ${test.name}: ${test.duration}ms`)
        console.log(`  Status: ${test.status}`)
        console.log(`  Message: ${test.message}`)
        if (test.details) {
          console.log(`  Performance Data: ${JSON.stringify(test.details, null, 2)}`)
        }
        console.log()
      })
    } else {
      console.log('No performance tests found in results')
    }

    // Demo 4: Security Test Analysis
    console.log('\n🔒 Demo 4: Security Test Analysis')
    console.log('-'.repeat(40))

    const securityTests = suiteResults.filter(r => r.name.includes('Security'))
    if (securityTests.length > 0) {
      console.log('Security Test Results:')
      securityTests.forEach(test => {
        console.log(`- ${test.name}: ${test.status}`)
        console.log(`  Message: ${test.message}`)
        if (test.details) {
          console.log(`  Security Data: ${JSON.stringify(test.details, null, 2)}`)
        }
        console.log()
      })
    } else {
      console.log('No security tests found in results')
    }

    // Demo 5: Integration with Testing Agent Controller
    console.log('\n🎛️  Demo 5: Testing Agent Controller Integration')
    console.log('-'.repeat(40))

    const testConfig = {
      id: 'firebase_demo_config',
      name: 'Firebase Demo Configuration',
      environment: 'development' as const,
      testSuites: ['firebase_test_suite'],
      userProfiles: [],
      concurrencyLevel: 1,
      timeout: 60000,
      retryAttempts: 2,
      reportingOptions: {
        formats: ['json' as const],
        includeScreenshots: false,
        includeLogs: true,
        realTimeUpdates: true
      },
      autoFixEnabled: false,
      notificationSettings: {
        enabled: false,
        channels: [],
        thresholds: {
          criticalErrors: 1,
          failureRate: 50
        }
      }
    }

    console.log('Starting testing session with Testing Agent Controller...')
    const sessionId = await testingAgentController.startTesting(testConfig)
    console.log(`Session ID: ${sessionId}`)

    // Get results from controller
    const controllerResults = testingAgentController.getTestResults(sessionId)
    console.log(`Controller Results: ${controllerResults.length} tests`)

    // Generate report
    const report = testingAgentController.generateReport(sessionId, 'json')
    console.log('\nGenerated Report Summary:')
    console.log(`- Session ID: ${report.sessionId}`)
    console.log(`- Total Tests: ${report.summary.totalTests}`)
    console.log(`- Passed: ${report.summary.passed}`)
    console.log(`- Failed: ${report.summary.failed}`)
    console.log(`- Errors: ${report.summary.errors}`)
    console.log(`- Health Status: ${report.healthStatus.status}`)

    // Demo 6: Cleanup and Final Status
    console.log('\n🧹 Demo 6: Cleanup and Final Status')
    console.log('-'.repeat(40))

    console.log('Performing cleanup...')
    await firebaseTestSuite.teardown()

    const finalHealthStatus = firebaseTestSuite.getHealthStatus()
    console.log(`Final Health Status: ${finalHealthStatus.status}`)
    console.log(`Final Message: ${finalHealthStatus.message}`)

    console.log('\n✅ Firebase Authentication Tests Demo Completed Successfully!')
    console.log('=' .repeat(60))

    // Summary statistics
    console.log('\n📊 Demo Summary Statistics:')
    console.log(`- Individual Auth Tests: ${authResults.length}`)
    console.log(`- Full Suite Tests: ${suiteResults.length}`)
    console.log(`- Total Tests Executed: ${authResults.length + suiteResults.length}`)
    console.log(`- Overall Success Rate: ${successRate}%`)
    console.log(`- Demo Duration: ${Date.now() - startTime}ms`)

  } catch (error) {
    console.error('❌ Firebase Authentication Tests Demo failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      })
    }
  }
}

// Export for use in other modules
export { runFirebaseAuthTestsDemo }

// Run demo if this file is executed directly
if (require.main === module) {
  const startTime = Date.now()
  runFirebaseAuthTestsDemo()
    .then(() => {
      const duration = Date.now() - startTime
      console.log(`\n🎉 Demo completed in ${duration}ms`)
    })
    .catch(error => {
      console.error('Demo execution failed:', error)
      process.exit(1)
    })
}