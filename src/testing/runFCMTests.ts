/**
 * Firebase Cloud Messaging Tests Demo
 * Demonstrates the FCM testing capabilities
 */

import { FirebaseCloudMessagingTester, FCMTestConfig } from './firebase/FirebaseCloudMessagingTester'
import { FirebaseTestSuite } from './firebase/FirebaseTestSuite'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runFCMTestsDemo() {
  console.log('🔥 Starting Firebase Cloud Messaging Tests Demo')
  console.log('=' .repeat(60))

  try {
    // Initialize FCM Tester
    const fcmTester = new FirebaseCloudMessagingTester()
    
    // Check health status first
    console.log('\n🏥 Checking FCM Health Status')
    console.log('-'.repeat(40))
    
    const healthStatus = fcmTester.getHealthStatus()
    console.log(`Health Status: ${healthStatus.status.toUpperCase()}`)
    console.log(`Message: ${healthStatus.message}`)
    
    if (healthStatus.details) {
      console.log('Details:', JSON.stringify(healthStatus.details, null, 2))
    }

    if (healthStatus.status === 'unhealthy') {
      console.log('⚠️  FCM services not available. Demo will continue with simulated functionality.')
    }

    // Demo 1: Individual FCM Tests
    console.log('\n📱 Demo 1: Individual FCM Tests')
    console.log('-'.repeat(40))

    const fcmConfig: FCMTestConfig = {
      testNotificationTitle: 'GoCars Test Notification',
      testNotificationBody: 'This is a comprehensive test of Firebase Cloud Messaging functionality',
      testNotificationIcon: '/icons/gocars-notification.png',
      testNotificationData: {
        testId: `fcm_demo_${Date.now()}`,
        category: 'demo',
        actionUrl: 'https://gocars.example.com/demo',
        userId: 'demo_user_123'
      },
      foregroundMessageTimeout: 3000,
      serviceWorkerTimeout: 5000,
      tokenValidationTimeout: 3000,
      timeout: 30000
    }

    console.log(`Testing with notification: "${fcmConfig.testNotificationTitle}"`)
    
    const fcmResults = await fcmTester.runFCMTests(fcmConfig)
    
    console.log('\nFCM Test Results:')
    fcmResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : 
                        result.status === 'skipped' ? '⏭️' : '⚠️'
      
      console.log(`${statusIcon} ${result.name}: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.fcmDetails) {
        console.log(`   FCM Details:`)
        if (result.fcmDetails.token) {
          console.log(`     Token: ${result.fcmDetails.token}`)
        }
        if (result.fcmDetails.permission) {
          console.log(`     Permission: ${result.fcmDetails.permission}`)
        }
        if (result.fcmDetails.serviceWorkerRegistered !== undefined) {
          console.log(`     Service Worker: ${result.fcmDetails.serviceWorkerRegistered ? 'Registered' : 'Not Registered'}`)
        }
        if (result.fcmDetails.notificationSupported !== undefined) {
          console.log(`     Notification Support: ${result.fcmDetails.notificationSupported ? 'Yes' : 'No'}`)
        }
        if (result.fcmDetails.messageReceived !== undefined) {
          console.log(`     Message Received: ${result.fcmDetails.messageReceived ? 'Yes' : 'No'}`)
        }
        if (result.fcmDetails.notificationDisplayed !== undefined) {
          console.log(`     Notification Displayed: ${result.fcmDetails.notificationDisplayed ? 'Yes' : 'No'}`)
        }
      }
      
      if (result.status === 'failed' && result.details) {
        console.log(`   Error Details: ${JSON.stringify(result.details, null, 4)}`)
      }
      console.log()
    })

    // Demo 2: Virtual User FCM Integration
    console.log('\n👥 Demo 2: Virtual User FCM Integration')
    console.log('-'.repeat(40))

    const userTypes = ['new', 'regular', 'power'] as const
    const virtualUserResults = []

    for (const userType of userTypes) {
      console.log(`Testing ${userType} user FCM operations...`)
      
      const virtualUser = VirtualUserFactory.createPassengerUser(userType)
      const result = await fcmTester.testVirtualUserFCM(virtualUser)
      virtualUserResults.push(result)

      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${userType.toUpperCase()} user: ${result.status}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.details) {
        console.log(`   User Details:`)
        console.log(`     Role: ${result.details.virtualUserRole}`)
        console.log(`     Experience: ${result.details.virtualUserExperience}`)
        console.log(`     Notification Preferences: ${JSON.stringify(result.details.notificationPreferences)}`)
        if (result.details.userNotification) {
          console.log(`     Custom Notification: "${result.details.userNotification.title}"`)
          console.log(`     Custom Message: "${result.details.userNotification.body}"`)
        }
      }
      console.log()
    }

    // Test driver user
    console.log('Testing driver user FCM operations...')
    const driverUser = VirtualUserFactory.createDriverUser()
    const driverResult = await fcmTester.testVirtualUserFCM(driverUser)
    virtualUserResults.push(driverResult)

    const driverStatusIcon = driverResult.status === 'passed' ? '✅' : '❌'
    console.log(`${driverStatusIcon} DRIVER user: ${driverResult.status}`)
    console.log(`   Duration: ${driverResult.duration}ms`)
    console.log(`   Message: ${driverResult.message}`)

    // Demo 3: Complete Firebase Test Suite with FCM
    console.log('\n🧪 Demo 3: Complete Firebase Test Suite (Including FCM)')
    console.log('-'.repeat(40))

    const firebaseTestSuite = new FirebaseTestSuite()
    
    console.log('Setting up Firebase Test Suite...')
    await firebaseTestSuite.setup()

    console.log('Running complete Firebase test suite...')
    const suiteResults = await firebaseTestSuite.runTests()

    console.log('\nFirebase Test Suite Results (with FCM):')
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
    const fcmTests = suiteResults.filter(r => r.name.includes('FCM') || r.name.includes('Messaging') || r.name.includes('Notification'))
    const performanceTests = suiteResults.filter(r => r.name.includes('Performance'))
    const securityTests = suiteResults.filter(r => r.name.includes('Security'))

    console.log('\nTest Categories:')
    console.log(`🔐 Authentication Tests: ${authTests.length}`)
    console.log(`📊 Firestore Tests: ${firestoreTests.length}`)
    console.log(`📱 FCM Tests: ${fcmTests.length}`)
    console.log(`⚡ Performance Tests: ${performanceTests.length}`)
    console.log(`🔒 Security Tests: ${securityTests.length}`)

    // Demo 4: FCM-specific Analysis
    console.log('\n📈 Demo 4: FCM Operations Analysis')
    console.log('-'.repeat(40))

    const fcmSpecificTests = suiteResults.filter(r => 
      r.name.includes('FCM') || 
      r.name.includes('Messaging') || 
      r.name.includes('Notification') ||
      r.name.includes('Service Worker') ||
      r.name.includes('Token')
    )

    if (fcmSpecificTests.length > 0) {
      console.log('FCM-specific Test Results:')
      fcmSpecificTests.forEach(test => {
        console.log(`- ${test.name}: ${test.status} (${test.duration}ms)`)
        if (test.message) {
          console.log(`  Message: ${test.message}`)
        }
      })
    } else {
      console.log('No FCM-specific tests found in suite results')
    }

    // Demo 5: Notification Features Analysis
    console.log('\n🔔 Demo 5: Notification Features Analysis')
    console.log('-'.repeat(40))

    const notificationFeatures = [
      'Token Generation',
      'Permission Request',
      'Message Delivery',
      'Notification Display',
      'Service Worker Registration',
      'Foreground Message Handling',
      'Background Message Handling'
    ]

    console.log('FCM Feature Coverage:')
    notificationFeatures.forEach(feature => {
      const relatedTests = [...fcmResults, ...suiteResults].filter(r => 
        r.name.toLowerCase().includes(feature.toLowerCase().replace(' ', '_')) ||
        r.name.toLowerCase().includes(feature.toLowerCase())
      )
      
      const featureStatus = relatedTests.length > 0 ? 
        (relatedTests.some(t => t.status === 'passed') ? '✅ Tested' : '❌ Failed') : 
        '⚠️  Not Tested'
      
      console.log(`  ${feature}: ${featureStatus}`)
    })

    // Demo 6: Performance Analysis
    console.log('\n📊 Demo 6: Performance Analysis')
    console.log('-'.repeat(40))

    const allResults = [...fcmResults, ...virtualUserResults, ...suiteResults]
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

    const fcmPerformanceTests = performanceData.filter(test => 
      test.name.toLowerCase().includes('fcm') || 
      test.name.toLowerCase().includes('notification') ||
      test.name.toLowerCase().includes('messaging')
    )

    if (fcmPerformanceTests.length > 0) {
      const avgFCMDuration = fcmPerformanceTests.reduce((sum, test) => sum + test.duration, 0) / fcmPerformanceTests.length
      console.log(`Average FCM Test Duration: ${avgFCMDuration.toFixed(0)}ms`)
      
      const slowFCMTests = fcmPerformanceTests.filter(test => test.duration > 3000)
      if (slowFCMTests.length > 0) {
        console.log(`⚠️  Slow FCM Tests (>3s): ${slowFCMTests.length}`)
        slowFCMTests.forEach(test => {
          console.log(`   - ${test.name}: ${test.duration}ms`)
        })
      }
    }

    // Demo 7: Cleanup and Final Status
    console.log('\n🧹 Demo 7: Cleanup and Final Status')
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
      console.log(`  FCM: ${finalHealthStatus.details.fcm}`)
    }

    console.log('\n✅ Firebase Cloud Messaging Tests Demo Completed Successfully!')
    console.log('=' .repeat(60))

    // Summary statistics
    const totalTests = fcmResults.length + virtualUserResults.length + suiteResults.length
    const totalPassed = [...fcmResults, ...virtualUserResults, ...suiteResults]
      .filter(r => r.status === 'passed').length
    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1)

    console.log('\n📊 Demo Summary Statistics:')
    console.log(`- Individual FCM Tests: ${fcmResults.length}`)
    console.log(`- Virtual User Integration Tests: ${virtualUserResults.length}`)
    console.log(`- Full Suite Tests: ${suiteResults.length}`)
    console.log(`- Total Tests Executed: ${totalTests}`)
    console.log(`- Overall Success Rate: ${overallSuccessRate}%`)
    console.log(`- FCM-specific Tests: ${fcmSpecificTests.length}`)

    // FCM Feature Summary
    console.log('\n🔔 FCM Feature Summary:')
    const fcmFeatureTests = fcmResults.filter(r => r.status === 'passed').length
    console.log(`- FCM Features Tested: ${fcmFeatureTests}/${fcmResults.length}`)
    console.log(`- FCM Success Rate: ${((fcmFeatureTests / fcmResults.length) * 100).toFixed(1)}%`)
    
    const notificationTests = fcmResults.filter(r => r.name.toLowerCase().includes('notification'))
    const notificationPassed = notificationTests.filter(r => r.status === 'passed').length
    console.log(`- Notification Tests: ${notificationPassed}/${notificationTests.length} passed`)

    const serviceWorkerTests = fcmResults.filter(r => r.name.toLowerCase().includes('service worker'))
    const serviceWorkerPassed = serviceWorkerTests.filter(r => r.status === 'passed').length
    console.log(`- Service Worker Tests: ${serviceWorkerPassed}/${serviceWorkerTests.length} passed`)

  } catch (error) {
    console.error('❌ Firebase Cloud Messaging Tests Demo failed:', error)
    
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
export { runFCMTestsDemo }

// Run demo if this file is executed directly
if (require.main === module) {
  const startTime = Date.now()
  runFCMTestsDemo()
    .then(() => {
      const duration = Date.now() - startTime
      console.log(`\n🎉 Demo completed in ${duration}ms`)
    })
    .catch(error => {
      console.error('Demo execution failed:', error)
      process.exit(1)
    })
}