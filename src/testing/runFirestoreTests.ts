/**
 * Firestore Operations Tests Demo
 * Demonstrates the Firestore operations testing capabilities
 */

import { FirestoreOperationsTester, FirestoreTestConfig } from './firebase/FirestoreOperationsTester'
import { FirebaseTestSuite } from './firebase/FirebaseTestSuite'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runFirestoreTestsDemo() {
  console.log('🔥 Starting Firestore Operations Tests Demo')
  console.log('=' .repeat(60))

  try {
    // Initialize Firestore Operations Tester
    const firestoreTester = new FirestoreOperationsTester()
    
    // Check health status first
    console.log('\n🏥 Checking Firestore Health Status')
    console.log('-'.repeat(40))
    
    const healthStatus = firestoreTester.getHealthStatus()
    console.log(`Health Status: ${healthStatus.status.toUpperCase()}`)
    console.log(`Message: ${healthStatus.message}`)
    
    if (healthStatus.details) {
      console.log('Details:', JSON.stringify(healthStatus.details, null, 2))
    }

    if (healthStatus.status === 'unhealthy') {
      console.log('⚠️  Firestore services not available. Demo will continue with limited functionality.')
    }

    // Demo 1: Individual Firestore Operations Tests
    console.log('\n📊 Demo 1: Individual Firestore Operations Tests')
    console.log('-'.repeat(40))

    const firestoreConfig: FirestoreTestConfig = {
      testCollectionPrefix: `demo_${Date.now()}`,
      testDocumentCount: 5,
      batchSize: 3,
      transactionRetries: 2,
      realtimeTestDuration: 3000,
      timeout: 30000
    }

    console.log(`Testing with collection prefix: ${firestoreConfig.testCollectionPrefix}`)
    
    const firestoreResults = await firestoreTester.runFirestoreTests(firestoreConfig)
    
    console.log('\nFirestore Operations Test Results:')
    firestoreResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : 
                        result.status === 'skipped' ? '⏭️' : '⚠️'
      
      console.log(`${statusIcon} ${result.name}: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.firestoreDetails) {
        console.log(`   Firestore Details:`)
        console.log(`     Collection: ${result.firestoreDetails.collectionPath || 'N/A'}`)
        console.log(`     Document ID: ${result.firestoreDetails.documentId || 'N/A'}`)
        console.log(`     Operation: ${result.firestoreDetails.operationType || 'N/A'}`)
        if (result.firestoreDetails.queryResults !== undefined) {
          console.log(`     Query Results: ${result.firestoreDetails.queryResults}`)
        }
        if (result.firestoreDetails.listenerEvents !== undefined) {
          console.log(`     Listener Events: ${result.firestoreDetails.listenerEvents}`)
        }
      }
      
      if (result.status === 'failed' && result.details) {
        console.log(`   Error Details: ${JSON.stringify(result.details, null, 4)}`)
      }
      console.log()
    })

    // Demo 2: Virtual User Firestore Integration
    console.log('\n👥 Demo 2: Virtual User Firestore Integration')
    console.log('-'.repeat(40))

    const userTypes = ['new', 'regular', 'power'] as const
    const virtualUserResults = []

    for (const userType of userTypes) {
      console.log(`Testing ${userType} user Firestore operations...`)
      
      const virtualUser = VirtualUserFactory.createPassengerUser(userType)
      const result = await firestoreTester.testVirtualUserFirestoreOperations(virtualUser)
      virtualUserResults.push(result)

      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${userType.toUpperCase()} user: ${result.status}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.details) {
        console.log(`   User Details: Role=${result.details.virtualUserRole}, Experience=${result.details.virtualUserExperience}`)
      }
      console.log()
    }

    // Test driver user
    console.log('Testing driver user Firestore operations...')
    const driverUser = VirtualUserFactory.createDriverUser()
    const driverResult = await firestoreTester.testVirtualUserFirestoreOperations(driverUser)
    virtualUserResults.push(driverResult)

    const driverStatusIcon = driverResult.status === 'passed' ? '✅' : '❌'
    console.log(`${driverStatusIcon} DRIVER user: ${driverResult.status}`)
    console.log(`   Duration: ${driverResult.duration}ms`)
    console.log(`   Message: ${driverResult.message}`)

    // Demo 3: Complete Firebase Test Suite with Firestore
    console.log('\n🧪 Demo 3: Complete Firebase Test Suite (Including Firestore)')
    console.log('-'.repeat(40))

    const firebaseTestSuite = new FirebaseTestSuite()
    
    console.log('Setting up Firebase Test Suite...')
    await firebaseTestSuite.setup()

    console.log('Running complete Firebase test suite...')
    const suiteResults = await firebaseTestSuite.runTests()

    console.log('\nFirebase Test Suite Results (with Firestore):')
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

    // Categorize results by test type
    const authTests = suiteResults.filter(r => r.name.includes('Authentication') || r.name.includes('Login') || r.name.includes('Registration'))
    const firestoreTests = suiteResults.filter(r => r.name.includes('Firestore') || r.name.includes('Document') || r.name.includes('Collection'))
    const performanceTests = suiteResults.filter(r => r.name.includes('Performance'))
    const securityTests = suiteResults.filter(r => r.name.includes('Security'))

    console.log('\nTest Categories:')
    console.log(`🔐 Authentication Tests: ${authTests.length}`)
    console.log(`📊 Firestore Tests: ${firestoreTests.length}`)
    console.log(`⚡ Performance Tests: ${performanceTests.length}`)
    console.log(`🔒 Security Tests: ${securityTests.length}`)

    // Demo 4: Firestore-specific Analysis
    console.log('\n📈 Demo 4: Firestore Operations Analysis')
    console.log('-'.repeat(40))

    const firestoreSpecificTests = suiteResults.filter(r => 
      r.name.includes('Firestore') || 
      r.name.includes('Document') || 
      r.name.includes('Collection') ||
      r.name.includes('Batch') ||
      r.name.includes('Transaction')
    )

    if (firestoreSpecificTests.length > 0) {
      console.log('Firestore-specific Test Results:')
      firestoreSpecificTests.forEach(test => {
        console.log(`- ${test.name}: ${test.status} (${test.duration}ms)`)
        if (test.message) {
          console.log(`  Message: ${test.message}`)
        }
      })
    } else {
      console.log('No Firestore-specific tests found in suite results')
    }

    // Demo 5: Performance Analysis
    console.log('\n📊 Demo 5: Performance Analysis')
    console.log('-'.repeat(40))

    const allResults = [...firestoreResults, ...virtualUserResults, ...suiteResults]
    const performanceData = allResults
      .filter(r => r.duration > 0)
      .map(r => ({ name: r.name, duration: r.duration, status: r.status }))
      .sort((a, b) => b.duration - a.duration)

    console.log('Top 10 Longest Running Tests:')
    performanceData.slice(0, 10).forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.duration}ms (${test.status})`)
    })

    const averageDuration = performanceData.reduce((sum, test) => sum + test.duration, 0) / performanceData.length
    console.log(`\nAverage Test Duration: ${averageDuration.toFixed(0)}ms`)

    const slowTests = performanceData.filter(test => test.duration > 5000)
    if (slowTests.length > 0) {
      console.log(`⚠️  Slow Tests (>5s): ${slowTests.length}`)
      slowTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.duration}ms`)
      })
    }

    // Demo 6: Cleanup and Final Status
    console.log('\n🧹 Demo 6: Cleanup and Final Status')
    console.log('-'.repeat(40))

    console.log('Performing cleanup...')
    await firebaseTestSuite.teardown()

    const finalHealthStatus = firebaseTestSuite.getHealthStatus()
    console.log(`Final Health Status: ${finalHealthStatus.status}`)
    console.log(`Final Message: ${finalHealthStatus.message}`)

    if (finalHealthStatus.details) {
      console.log('Final Details:')
      console.log(`  Authentication: ${finalHealthStatus.details.authentication}`)
      console.log(`  Firestore: ${finalHealthStatus.details.firestore}`)
    }

    console.log('\n✅ Firestore Operations Tests Demo Completed Successfully!')
    console.log('=' .repeat(60))

    // Summary statistics
    const totalTests = firestoreResults.length + virtualUserResults.length + suiteResults.length
    const totalPassed = [...firestoreResults, ...virtualUserResults, ...suiteResults]
      .filter(r => r.status === 'passed').length
    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1)

    console.log('\n📊 Demo Summary Statistics:')
    console.log(`- Individual Firestore Tests: ${firestoreResults.length}`)
    console.log(`- Virtual User Integration Tests: ${virtualUserResults.length}`)
    console.log(`- Full Suite Tests: ${suiteResults.length}`)
    console.log(`- Total Tests Executed: ${totalTests}`)
    console.log(`- Overall Success Rate: ${overallSuccessRate}%`)

  } catch (error) {
    console.error('❌ Firestore Operations Tests Demo failed:', error)
    
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
export { runFirestoreTestsDemo }

// Run demo if this file is executed directly
if (require.main === module) {
  const startTime = Date.now()
  runFirestoreTestsDemo()
    .then(() => {
      const duration = Date.now() - startTime
      console.log(`\n🎉 Demo completed in ${duration}ms`)
    })
    .catch(error => {
      console.error('Demo execution failed:', error)
      process.exit(1)
    })
}