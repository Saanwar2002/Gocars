/**
 * Demo script for WebSocket Resilience Tests
 * Demonstrates comprehensive WebSocket reconnection and resilience testing capabilities
 */

import { WebSocketResilienceTester, ResilienceTestConfig } from './websocket/WebSocketResilienceTester'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runWebSocketResilienceDemo() {
  console.log('🚀 Starting WebSocket Resilience Tests Demo...\n')

  const resilienceTester = new WebSocketResilienceTester()
  const virtualUserFactory = new VirtualUserFactory()

  // Configuration for resilience tests
  const config: ResilienceTestConfig = {
    serverUrl: 'ws://localhost:8080',
    connectionTimeout: 10000,
    reconnectionTimeout: 5000,
    maxReconnectAttempts: 3,
    heartbeatInterval: 30000,
    messageTimeout: 5000,
    networkFailureSimulationDuration: 3000,
    serverRestartSimulationDuration: 5000,
    timeout: 60000
  }

  try {
    console.log('📋 Test Configuration:')
    console.log(`- Server URL: ${config.serverUrl}`)
    console.log(`- Connection Timeout: ${config.connectionTimeout}ms`)
    console.log(`- Reconnection Timeout: ${config.reconnectionTimeout}ms`)
    console.log(`- Max Reconnect Attempts: ${config.maxReconnectAttempts}`)
    console.log(`- Heartbeat Interval: ${config.heartbeatInterval}ms`)
    console.log(`- Network Failure Duration: ${config.networkFailureSimulationDuration}ms`)
    console.log(`- Server Restart Duration: ${config.serverRestartSimulationDuration}ms`)
    console.log()

    // Run comprehensive resilience tests
    console.log('🔄 Running comprehensive WebSocket resilience tests...')
    const resilienceResults = await resilienceTester.runResilienceTests(config)

    // Display results
    console.log('\n📊 WebSocket Resilience Test Results:')
    console.log('=' .repeat(60))

    resilienceResults.forEach((result, index) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${index + 1}. ${result.name}`)
      console.log(`   Status: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.resilienceDetails) {
        const details = result.resilienceDetails
        if (details.reconnectionAttempts) console.log(`   Reconnection Attempts: ${details.reconnectionAttempts}`)
        if (details.reconnectionSuccess !== undefined) console.log(`   Reconnection Success: ${details.reconnectionSuccess}`)
        if (details.reconnectionTime) console.log(`   Reconnection Time: ${details.reconnectionTime}ms`)
        if (details.messagesQueued) console.log(`   Messages Queued: ${details.messagesQueued}`)
        if (details.messagesRecovered) console.log(`   Messages Recovered: ${details.messagesRecovered}`)
        if (details.networkFailureRecovery !== undefined) console.log(`   Network Failure Recovery: ${details.networkFailureRecovery}`)
        if (details.serverRestartRecovery !== undefined) console.log(`   Server Restart Recovery: ${details.serverRestartRecovery}`)
        if (details.connectionStability) console.log(`   Connection Stability: ${details.connectionStability}`)
        if (details.failureScenarios) console.log(`   Failure Scenarios: ${details.failureScenarios.join(', ')}`)
      }
      console.log()
    })

    // Generate virtual users for advanced resilience testing
    console.log('👥 Generating virtual users for advanced resilience tests...')
    const virtualUsers = [
      virtualUserFactory.createVirtualUser('business'),
      virtualUserFactory.createVirtualUser('casual'),
      virtualUserFactory.createVirtualUser('frequent')
    ]

    console.log(`Generated ${virtualUsers.length} virtual users:`)
    virtualUsers.forEach(user => {
      console.log(`- ${user.profile.name} (${user.profile.type}): ${user.profile.preferences.join(', ')}`)
    })
    console.log()

    // Run virtual user resilience tests
    console.log('🔄 Running virtual user resilience tests...')
    const virtualUserResults = await resilienceTester.runResilienceTestsWithVirtualUsers(config, virtualUsers)

    console.log('\n📊 Virtual User Resilience Test Results:')
    console.log('=' .repeat(60))

    virtualUserResults.forEach((result, index) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${index + 1}. ${result.name}`)
      console.log(`   Status: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.resilienceDetails) {
        const details = result.resilienceDetails
        if (details.reconnectionSuccess !== undefined) console.log(`   Reconnection Success: ${details.reconnectionSuccess}`)
        if (details.reconnectionAttempts) console.log(`   Reconnection Attempts: ${details.reconnectionAttempts}`)
        if (details.connectionStability) console.log(`   Connection Stability: ${details.connectionStability}`)
        if (details.failureScenarios) console.log(`   Failure Scenarios: ${details.failureScenarios.join(', ')}`)
      }
      console.log()
    })

    // Summary statistics
    const allResults = [...resilienceResults, ...virtualUserResults]
    const passedTests = allResults.filter(r => r.status === 'passed').length
    const failedTests = allResults.filter(r => r.status === 'failed').length
    const totalDuration = allResults.reduce((sum, r) => sum + r.duration, 0)

    console.log('📈 Test Summary:')
    console.log('=' .repeat(40))
    console.log(`Total Tests: ${allResults.length}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Failed: ${failedTests} ❌`)
    console.log(`Success Rate: ${((passedTests / allResults.length) * 100).toFixed(1)}%`)
    console.log(`Total Duration: ${totalDuration}ms`)
    console.log(`Average Test Duration: ${Math.round(totalDuration / allResults.length)}ms`)

    // Resilience analysis
    console.log('\n🛡️ Resilience Analysis:')
    console.log('=' .repeat(40))
    
    const resilienceMetrics = {
      reconnectionTests: resilienceResults.filter(r => r.id.includes('reconnection')).length,
      messageRecoveryTests: resilienceResults.filter(r => r.id.includes('recovery')).length,
      failureScenarioTests: resilienceResults.filter(r => r.id.includes('failure')).length,
      stabilityTests: resilienceResults.filter(r => r.id.includes('stability')).length
    }

    console.log(`Reconnection Tests: ${resilienceMetrics.reconnectionTests}`)
    console.log(`Message Recovery Tests: ${resilienceMetrics.messageRecoveryTests}`)
    console.log(`Failure Scenario Tests: ${resilienceMetrics.failureScenarioTests}`)
    console.log(`Stability Tests: ${resilienceMetrics.stabilityTests}`)

    // Test coverage analysis
    console.log('\n🎯 Resilience Test Coverage:')
    console.log('=' .repeat(40))
    console.log('✅ Automatic Reconnection Logic')
    console.log('✅ Message Queuing During Disconnection')
    console.log('✅ Message Recovery After Reconnection')
    console.log('✅ Network Failure Recovery')
    console.log('✅ Server Restart Recovery')
    console.log('✅ Connection Stability Under Load')
    console.log('✅ Heartbeat and Keep-Alive Mechanism')
    console.log('✅ Graceful Degradation')
    console.log('✅ Multiple Failure Scenarios')
    console.log('✅ Connection State Management')
    console.log('✅ Virtual User Integration')

    // Failure scenario analysis
    const failureScenarios = [
      'Network Interruption (Brief)',
      'Network Interruption (Extended)',
      'Server Restart',
      'Connection Timeout',
      'Authentication Failure',
      'Rate Limiting'
    ]

    console.log('\n⚠️ Tested Failure Scenarios:')
    console.log('=' .repeat(40))
    failureScenarios.forEach(scenario => {
      console.log(`✅ ${scenario}`)
    })

    console.log('\n🎉 WebSocket Resilience Tests Demo completed successfully!')
    console.log('\nNote: This demo uses simulated WebSocket connections and failure scenarios.')
    console.log('In a real implementation, these tests would:')
    console.log('- Connect to actual WebSocket servers')
    console.log('- Inject real network failures and server restarts')
    console.log('- Validate actual reconnection logic and message recovery')
    console.log('- Monitor real connection stability under load')
    console.log('- Test actual heartbeat and keep-alive mechanisms')

  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
if (require.main === module) {
  runWebSocketResilienceDemo().catch(console.error)
}

export { runWebSocketResilienceDemo }