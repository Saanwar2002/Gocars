/**
 * WebSocket Tests Demo
 * Demonstrates the WebSocket testing capabilities
 */

import { WebSocketTestSuite } from './websocket/WebSocketTestSuite'
import { WebSocketConnectionTester, WebSocketTestConfig } from './websocket/WebSocketConnectionTester'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runWebSocketTestsDemo() {
  console.log('🔌 Starting WebSocket Tests Demo')
  console.log('=' .repeat(60))

  try {
    // Initialize WebSocket Test Suite
    const webSocketTestSuite = new WebSocketTestSuite()
    
    // Check health status first
    console.log('\n🏥 Checking WebSocket Health Status')
    console.log('-'.repeat(40))
    
    const healthStatus = webSocketTestSuite.getHealthStatus()
    console.log(`Health Status: ${healthStatus.status.toUpperCase()}`)
    console.log(`Message: ${healthStatus.message}`)
    
    if (healthStatus.details) {
      console.log('Details:', JSON.stringify(healthStatus.details, null, 2))
    }

    if (healthStatus.status === 'unhealthy') {
      console.log('⚠️  WebSocket services not available. Demo will continue with simulated functionality.')
    }

    // Demo 1: Individual WebSocket Connection Tests
    console.log('\n🔗 Demo 1: Individual WebSocket Connection Tests')
    console.log('-'.repeat(40))

    const connectionTester = new WebSocketConnectionTester()
    const testConfig: WebSocketTestConfig = {
      serverUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000',
      connectionTimeout: 5000,
      reconnectionTimeout: 3000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000,
      messageTimeout: 3000,
      concurrentConnections: 5,
      testDuration: 10000,
      timeout: 30000
    }

    console.log(`Testing with server URL: ${testConfig.serverUrl}`)
    
    const connectionResults = await connectionTester.runConnectionTests(testConfig)
    
    console.log('\nWebSocket Connection Test Results:')
    connectionResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : 
                        result.status === 'skipped' ? '⏭️' : '⚠️'
      
      console.log(`${statusIcon} ${result.name}: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.connectionDetails) {
        console.log(`   Connection Details:`)
        if (result.connectionDetails.socketId) {
          console.log(`     Socket ID: ${result.connectionDetails.socketId}`)
        }
        if (result.connectionDetails.connectionStatus) {
          console.log(`     Status: ${result.connectionDetails.connectionStatus}`)
        }
        if (result.connectionDetails.reconnectAttempts !== undefined) {
          console.log(`     Reconnect Attempts: ${result.connectionDetails.reconnectAttempts}`)
        }
        if (result.connectionDetails.messagesReceived !== undefined) {
          console.log(`     Messages Received: ${result.connectionDetails.messagesReceived}`)
        }
        if (result.connectionDetails.messagesSent !== undefined) {
          console.log(`     Messages Sent: ${result.connectionDetails.messagesSent}`)
        }
        if (result.connectionDetails.roomsJoined !== undefined) {
          console.log(`     Rooms Joined: ${result.connectionDetails.roomsJoined}`)
        }
      }
      
      if (result.status === 'failed' && result.details) {
        console.log(`   Error Details: ${JSON.stringify(result.details, null, 4)}`)
      }
      console.log()
    })

    // Demo 2: Virtual User WebSocket Integration
    console.log('\n👥 Demo 2: Virtual User WebSocket Integration')
    console.log('-'.repeat(40))

    const userTypes = ['new', 'regular', 'power'] as const
    const virtualUserResults = []

    for (const userType of userTypes) {
      console.log(`Testing ${userType} user WebSocket operations...`)
      
      const virtualUser = VirtualUserFactory.createPassengerUser(userType)
      const result = await connectionTester.testVirtualUserWebSocket(virtualUser)
      virtualUserResults.push(result)

      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${userType.toUpperCase()} user: ${result.status}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.details) {
        console.log(`   User Details:`)
        console.log(`     Role: ${result.details.virtualUserRole}`)
        console.log(`     Experience: ${result.details.virtualUserExperience}`)
        console.log(`     Device Type: ${result.details.deviceType}`)
        if (result.details.actions) {
          console.log(`     Actions Performed: ${result.details.actions.actionsPerformed.join(', ')}`)
          console.log(`     Messages Sent: ${result.details.actions.messagesSent}`)
        }
      }
      console.log()
    }

    // Test driver user
    console.log('Testing driver user WebSocket operations...')
    const driverUser = VirtualUserFactory.createDriverUser()
    const driverResult = await connectionTester.testVirtualUserWebSocket(driverUser)
    virtualUserResults.push(driverResult)

    const driverStatusIcon = driverResult.status === 'passed' ? '✅' : '❌'
    console.log(`${driverStatusIcon} DRIVER user: ${driverResult.status}`)
    console.log(`   Duration: ${driverResult.duration}ms`)
    console.log(`   Message: ${driverResult.message}`)

    // Demo 3: Complete WebSocket Test Suite
    console.log('\n🧪 Demo 3: Complete WebSocket Test Suite')
    console.log('-'.repeat(40))

    console.log('Setting up WebSocket Test Suite...')
    await webSocketTestSuite.setup()

    console.log('Running complete WebSocket test suite...')
    const suiteResults = await webSocketTestSuite.runTests()

    console.log('\nWebSocket Test Suite Results:')
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
    const connectionTests = suiteResults.filter(r => r.name.includes('Connection') || r.name.includes('WebSocket'))
    const performanceTests = suiteResults.filter(r => r.name.includes('Performance'))
    const resilienceTests = suiteResults.filter(r => r.name.includes('Resilience') || r.name.includes('Interruption'))
    const integrationTests = suiteResults.filter(r => r.name.includes('Integration') || r.name.includes('Virtual User'))

    console.log('\nTest Categories:')
    console.log(`🔗 Connection Tests: ${connectionTests.length}`)
    console.log(`⚡ Performance Tests: ${performanceTests.length}`)
    console.log(`🛡️  Resilience Tests: ${resilienceTests.length}`)
    console.log(`🔄 Integration Tests: ${integrationTests.length}`)

    // Demo 4: WebSocket-specific Analysis
    console.log('\n📈 Demo 4: WebSocket Operations Analysis')
    console.log('-'.repeat(40))

    const webSocketSpecificTests = suiteResults.filter(r => 
      r.name.includes('WebSocket') || 
      r.name.includes('Connection') || 
      r.name.includes('Message') ||
      r.name.includes('Room') ||
      r.name.includes('Reconnection')
    )

    if (webSocketSpecificTests.length > 0) {
      console.log('WebSocket-specific Test Results:')
      webSocketSpecificTests.forEach(test => {
        console.log(`- ${test.name}: ${test.status} (${test.duration}ms)`)
        if (test.message) {
          console.log(`  Message: ${test.message}`)
        }
      })
    } else {
      console.log('No WebSocket-specific tests found in suite results')
    }

    // Demo 5: Real-time Features Analysis
    console.log('\n⚡ Demo 5: Real-time Features Analysis')
    console.log('-'.repeat(40))

    const realTimeFeatures = [
      'Connection Establishment',
      'Authentication',
      'Room Management',
      'Message Delivery',
      'Connection Health',
      'Reconnection Logic',
      'Concurrent Connections'
    ]

    console.log('WebSocket Feature Coverage:')
    realTimeFeatures.forEach(feature => {
      const relatedTests = [...connectionResults, ...suiteResults].filter(r => 
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

    const allResults = [...connectionResults, ...virtualUserResults, ...suiteResults]
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

    const webSocketPerformanceTests = performanceData.filter(test => 
      test.name.toLowerCase().includes('websocket') || 
      test.name.toLowerCase().includes('connection') ||
      test.name.toLowerCase().includes('message')
    )

    if (webSocketPerformanceTests.length > 0) {
      const avgWebSocketDuration = webSocketPerformanceTests.reduce((sum, test) => sum + test.duration, 0) / webSocketPerformanceTests.length
      console.log(`Average WebSocket Test Duration: ${avgWebSocketDuration.toFixed(0)}ms`)
      
      const slowWebSocketTests = webSocketPerformanceTests.filter(test => test.duration > 5000)
      if (slowWebSocketTests.length > 0) {
        console.log(`⚠️  Slow WebSocket Tests (>5s): ${slowWebSocketTests.length}`)
        slowWebSocketTests.forEach(test => {
          console.log(`   - ${test.name}: ${test.duration}ms`)
        })
      }
    }

    // Demo 7: Cleanup and Final Status
    console.log('\n🧹 Demo 7: Cleanup and Final Status')
    console.log('-'.repeat(40))

    console.log('Performing cleanup...')
    await webSocketTestSuite.teardown()

    const finalHealthStatus = webSocketTestSuite.getHealthStatus()
    console.log(`Final Health Status: ${finalHealthStatus.status}`)
    console.log(`Final Message: ${finalHealthStatus.message}`)

    if (finalHealthStatus.details) {
      console.log('Final Details:')
      console.log(`  Connection: ${finalHealthStatus.details.connection}`)
    }

    console.log('\n✅ WebSocket Tests Demo Completed Successfully!')
    console.log('=' .repeat(60))

    // Summary statistics
    const totalTests = connectionResults.length + virtualUserResults.length + suiteResults.length
    const totalPassed = [...connectionResults, ...virtualUserResults, ...suiteResults]
      .filter(r => r.status === 'passed').length
    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1)

    console.log('\n📊 Demo Summary Statistics:')
    console.log(`- Individual Connection Tests: ${connectionResults.length}`)
    console.log(`- Virtual User Integration Tests: ${virtualUserResults.length}`)
    console.log(`- Full Suite Tests: ${suiteResults.length}`)
    console.log(`- Total Tests Executed: ${totalTests}`)
    console.log(`- Overall Success Rate: ${overallSuccessRate}%`)
    console.log(`- WebSocket-specific Tests: ${webSocketSpecificTests.length}`)

    // WebSocket Feature Summary
    console.log('\n🔌 WebSocket Feature Summary:')
    const webSocketFeatureTests = connectionResults.filter(r => r.status === 'passed').length
    console.log(`- WebSocket Features Tested: ${webSocketFeatureTests}/${connectionResults.length}`)
    console.log(`- WebSocket Success Rate: ${((webSocketFeatureTests / connectionResults.length) * 100).toFixed(1)}%`)
    
    const connectionTestsPassed = connectionResults.filter(r => r.name.toLowerCase().includes('connection') && r.status === 'passed').length
    const connectionTestsTotal = connectionResults.filter(r => r.name.toLowerCase().includes('connection')).length
    console.log(`- Connection Tests: ${connectionTestsPassed}/${connectionTestsTotal} passed`)

    const messageTests = connectionResults.filter(r => r.name.toLowerCase().includes('message'))
    const messageTestsPassed = messageTests.filter(r => r.status === 'passed').length
    console.log(`- Message Tests: ${messageTestsPassed}/${messageTests.length} passed`)

    const roomTests = connectionResults.filter(r => r.name.toLowerCase().includes('room'))
    const roomTestsPassed = roomTests.filter(r => r.status === 'passed').length
    console.log(`- Room Management Tests: ${roomTestsPassed}/${roomTests.length} passed`)

  } catch (error) {
    console.error('❌ WebSocket Tests Demo failed:', error)
    
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
export { runWebSocketTestsDemo }

// Run demo if this file is executed directly
if (require.main === module) {
  const startTime = Date.now()
  runWebSocketTestsDemo()
    .then(() => {
      const duration = Date.now() - startTime
      console.log(`\n🎉 Demo completed in ${duration}ms`)
    })
    .catch(error => {
      console.error('Demo execution failed:', error)
      process.exit(1)
    })
}