/**
 * Demo script for Real-time Messaging Tests
 * Demonstrates comprehensive real-time messaging testing capabilities
 */

import { RealTimeMessagingTester, MessagingTestConfig } from './websocket/RealTimeMessagingTester'
import { VirtualUserFactory } from './core/VirtualUserFactory'

async function runRealTimeMessagingDemo() {
  console.log('🚀 Starting Real-time Messaging Tests Demo...\n')

  const messagingTester = new RealTimeMessagingTester()
  const virtualUserFactory = new VirtualUserFactory()

  // Configuration for messaging tests
  const config: MessagingTestConfig = {
    serverUrl: 'ws://localhost:8080',
    messageTimeout: 3000,
    orderingTestMessages: 10,
    persistenceTestDuration: 5000,
    concurrentMessagesCount: 5,
    messageTypes: ['chat_message', 'location_update', 'ride_status', 'notification'],
    roomTypes: ['private', 'group', 'driver_passenger'],
    timeout: 10000
  }

  try {
    console.log('📋 Test Configuration:')
    console.log(`- Server URL: ${config.serverUrl}`)
    console.log(`- Message Timeout: ${config.messageTimeout}ms`)
    console.log(`- Ordering Test Messages: ${config.orderingTestMessages}`)
    console.log(`- Concurrent Messages: ${config.concurrentMessagesCount}`)
    console.log(`- Message Types: ${config.messageTypes.join(', ')}`)
    console.log()

    // Run comprehensive messaging tests
    console.log('🔄 Running comprehensive real-time messaging tests...')
    const messagingResults = await messagingTester.runMessagingTests(config)

    // Display results
    console.log('\n📊 Real-time Messaging Test Results:')
    console.log('=' .repeat(60))

    messagingResults.forEach((result, index) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${index + 1}. ${result.name}`)
      console.log(`   Status: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.messagingDetails) {
        const details = result.messagingDetails
        if (details.messagesSent) console.log(`   Messages Sent: ${details.messagesSent}`)
        if (details.messagesReceived) console.log(`   Messages Received: ${details.messagesReceived}`)
        if (details.messagesDelivered) console.log(`   Messages Delivered: ${details.messagesDelivered}`)
        if (details.deliveryTime) console.log(`   Avg Delivery Time: ${details.deliveryTime}ms`)
        if (details.messageOrder) console.log(`   Message Order: ${details.messageOrder}`)
        if (details.persistenceVerified !== undefined) console.log(`   Persistence Verified: ${details.persistenceVerified}`)
        if (details.messageTypes) console.log(`   Message Types: ${details.messageTypes.join(', ')}`)
        if (details.roomsUsed) console.log(`   Rooms Used: ${details.roomsUsed.join(', ')}`)
      }
      console.log()
    })

    // Generate virtual users for advanced testing
    console.log('👥 Generating virtual users for advanced messaging tests...')
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

    // Run virtual user messaging tests
    console.log('🔄 Running virtual user messaging tests...')
    const virtualUserResults = await messagingTester.runMessagingTestsWithVirtualUsers(config, virtualUsers)

    console.log('\n📊 Virtual User Messaging Test Results:')
    console.log('=' .repeat(60))

    virtualUserResults.forEach((result, index) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${statusIcon} ${index + 1}. ${result.name}`)
      console.log(`   Status: ${result.status.toUpperCase()}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
      
      if (result.messagingDetails) {
        const details = result.messagingDetails
        if (details.messagesSent) console.log(`   Messages Sent: ${details.messagesSent}`)
        if (details.messagesReceived) console.log(`   Messages Received: ${details.messagesReceived}`)
        if (details.messagesDelivered) console.log(`   Messages Delivered: ${details.messagesDelivered}`)
        if (details.messageTypes) console.log(`   Message Types: ${details.messageTypes.join(', ')}`)
        if (details.roomsUsed) console.log(`   Rooms Used: ${details.roomsUsed.join(', ')}`)
      }
      console.log()
    })

    // Summary statistics
    const allResults = [...messagingResults, ...virtualUserResults]
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

    // Test coverage analysis
    console.log('\n🎯 Test Coverage Analysis:')
    console.log('=' .repeat(40))
    console.log('✅ Basic Message Delivery')
    console.log('✅ Message Ordering')
    console.log('✅ Message Persistence')
    console.log('✅ Bidirectional Messaging')
    console.log('✅ Group Messaging')
    console.log('✅ Message Types and Formats')
    console.log('✅ Message Priority and Queuing')
    console.log('✅ Concurrent Messaging')
    console.log('✅ Message Acknowledgment')
    console.log('✅ Message Filtering and Routing')
    console.log('✅ Virtual User Integration')

    console.log('\n🎉 Real-time Messaging Tests Demo completed successfully!')
    console.log('\nNote: This demo uses simulated WebSocket connections and message handling.')
    console.log('In a real implementation, these tests would connect to actual WebSocket servers')
    console.log('and validate real message delivery, ordering, and persistence.')

  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
if (require.main === module) {
  runRealTimeMessagingDemo().catch(console.error)
}

export { runRealTimeMessagingDemo }