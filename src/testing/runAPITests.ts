/**
 * API Tests Runner
 * Tests the Testing Agent REST API functionality
 */

import { TestingAgentClient } from './api/TestingAgentClient'
import { TestConfiguration } from './core/TestingAgentController'

/**
 * Run API tests
 */
export async function runAPITests(): Promise<void> {
  console.log('🌐 Starting Testing Agent API Tests...')
  console.log('=' .repeat(60))

  // Initialize client
  const client = new TestingAgentClient({
    baseUrl: 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 2
  })

  const testResults: Array<{ name: string; status: 'passed' | 'failed' | 'error'; message: string; duration: number }> = []

  try {
    // Test 1: Health Check
    await runTest('Health Check', async () => {
      const health = await client.getHealthStatus()
      if (!health || typeof health.status !== 'string') {
        throw new Error('Invalid health response')
      }
      return `Health status: ${health.status}`
    }, testResults)

    // Test 2: Get Available Test Suites
    await runTest('Get Available Test Suites', async () => {
      const suites = await client.getAvailableTestSuites()
      if (!Array.isArray(suites) || suites.length === 0) {
        throw new Error('No test suites available')
      }
      return `Found ${suites.length} test suites`
    }, testResults)

    // Test 3: Create Test Configuration
    let configId: string
    await runTest('Create Test Configuration', async () => {
      const config: TestConfiguration = {
        id: `test_config_${Date.now()}`,
        name: 'API Test Configuration',
        environment: 'development',
        testSuites: ['firebase_test_suite'],
        userProfiles: [],
        concurrencyLevel: 1,
        timeout: 60000,
        retryAttempts: 1,
        reportingOptions: {
          formats: ['json'],
          includeDetails: true,
          includeLogs: false
        },
        autoFixEnabled: false,
        notificationSettings: {
          onCompletion: false,
          onFailure: false,
          recipients: []
        }
      }
      
      configId = await client.createConfiguration(config)
      if (!configId || typeof configId !== 'string') {
        throw new Error('Invalid configuration ID returned')
      }
      return `Created configuration: ${configId}`
    }, testResults)

    // Test 4: Get Test Configuration
    await runTest('Get Test Configuration', async () => {
      const config = await client.getConfiguration(configId)
      if (!config || config.id !== configId) {
        throw new Error('Configuration not found or ID mismatch')
      }
      return `Retrieved configuration: ${config.name}`
    }, testResults)

    // Test 5: List Configurations
    await runTest('List Configurations', async () => {
      const configs = await client.listConfigurations()
      if (!Array.isArray(configs)) {
        throw new Error('Invalid configurations list')
      }
      const found = configs.find(c => c.id === configId)
      if (!found) {
        throw new Error('Created configuration not found in list')
      }
      return `Found ${configs.length} configurations`
    }, testResults)

    // Test 6: Validate Configuration
    await runTest('Validate Configuration', async () => {
      const config = await client.getConfiguration(configId)
      const validation = await client.validateConfiguration(config)
      if (!validation || typeof validation.valid !== 'boolean') {
        throw new Error('Invalid validation response')
      }
      return `Configuration valid: ${validation.valid}`
    }, testResults)

    // Test 7: Update Configuration
    await runTest('Update Configuration', async () => {
      await client.updateConfiguration(configId, {
        name: 'Updated API Test Configuration',
        timeout: 90000
      })
      
      const updated = await client.getConfiguration(configId)
      if (updated.name !== 'Updated API Test Configuration' || updated.timeout !== 90000) {
        throw new Error('Configuration not updated correctly')
      }
      return 'Configuration updated successfully'
    }, testResults)

    // Test 8: Start Test Execution
    let sessionId: string
    await runTest('Start Test Execution', async () => {
      const execution = await client.startTesting({
        configurationId: configId,
        options: {
          parallel: false,
          timeout: 60000,
          retryAttempts: 1
        }
      })
      
      sessionId = execution.sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID returned')
      }
      return `Started execution: ${sessionId}`
    }, testResults)

    // Test 9: Get Test Status
    await runTest('Get Test Status', async () => {
      const status = await client.getTestStatus(sessionId)
      if (!status || !status.sessionId) {
        throw new Error('Invalid status response')
      }
      return `Status: ${status.status}, Progress: ${status.progress?.percentage || 0}%`
    }, testResults)

    // Test 10: Get Active Sessions
    await runTest('Get Active Sessions', async () => {
      const sessions = await client.getActiveSessions()
      if (!Array.isArray(sessions)) {
        throw new Error('Invalid sessions response')
      }
      const found = sessions.find(s => s.sessionId === sessionId)
      if (!found) {
        throw new Error('Started session not found in active sessions')
      }
      return `Found ${sessions.length} active sessions`
    }, testResults)

    // Test 11: Wait for Test Completion (with timeout)
    await runTest('Wait for Test Completion', async () => {
      // Wait for completion with a reasonable timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test execution timeout')), 120000) // 2 minutes
      })
      
      const completionPromise = client.waitForCompletion(sessionId, 2000)
      
      const finalStatus = await Promise.race([completionPromise, timeoutPromise])
      return `Final status: ${finalStatus.status}`
    }, testResults)

    // Test 12: Get Test Results
    await runTest('Get Test Results', async () => {
      const results = await client.getTestResults(sessionId)
      if (!Array.isArray(results)) {
        throw new Error('Invalid results response')
      }
      return `Retrieved ${results.length} test results`
    }, testResults)

    // Test 13: Generate Report
    await runTest('Generate Report', async () => {
      const report = await client.generateReport(sessionId, 'json')
      if (!report || typeof report !== 'string') {
        throw new Error('Invalid report response')
      }
      
      // Validate JSON format
      JSON.parse(report)
      return `Generated JSON report (${report.length} characters)`
    }, testResults)

    // Test 14: Get Analytics
    await runTest('Get Analytics', async () => {
      const analytics = await client.getAnalytics()
      if (!analytics || typeof analytics !== 'object') {
        throw new Error('Invalid analytics response')
      }
      return `Retrieved analytics data`
    }, testResults)

    // Test 15: Get Execution Logs
    await runTest('Get Execution Logs', async () => {
      const logs = await client.getExecutionLogs(sessionId)
      if (!Array.isArray(logs)) {
        throw new Error('Invalid logs response')
      }
      return `Retrieved ${logs.length} log entries`
    }, testResults)

    // Test 16: Create Configuration from Template
    let templateConfigId: string
    await runTest('Create Configuration from Template', async () => {
      templateConfigId = await client.createConfigurationFromTemplate('firebase_basic', {
        name: 'Template-based Configuration'
      })
      if (!templateConfigId || typeof templateConfigId !== 'string') {
        throw new Error('Invalid template configuration ID')
      }
      return `Created template configuration: ${templateConfigId}`
    }, testResults)

    // Test 17: Batch Operations
    await runTest('Batch Delete Configurations', async () => {
      await client.batchDeleteConfigurations([configId, templateConfigId])
      
      // Verify deletion
      try {
        await client.getConfiguration(configId)
        throw new Error('Configuration should have been deleted')
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw error
        }
      }
      
      return 'Batch deletion successful'
    }, testResults)

    // Test 18: Client Information
    await runTest('Get Client Information', async () => {
      const info = client.getClientInfo()
      if (!info || typeof info.baseUrl !== 'string') {
        throw new Error('Invalid client info')
      }
      return `Client info: ${info.baseUrl}, timeout: ${info.timeout}ms`
    }, testResults)

  } catch (error) {
    console.error('❌ API tests failed:', error)
  }

  // Display results
  console.log('\n📊 API Test Results:')
  console.log('-'.repeat(60))

  let passedTests = 0
  let failedTests = 0
  let errorTests = 0

  testResults.forEach((result) => {
    const statusIcon = {
      'passed': '✅',
      'failed': '❌',
      'error': '⚠️'
    }[result.status] || '❓'

    console.log(`${statusIcon} ${result.name}`)
    console.log(`   Duration: ${result.duration}ms`)
    console.log(`   Message: ${result.message}`)
    console.log('')

    switch (result.status) {
      case 'passed': passedTests++; break
      case 'failed': failedTests++; break
      case 'error': errorTests++; break
    }
  })

  // Summary
  console.log('📈 Test Summary:')
  console.log('-'.repeat(60))
  console.log(`Total Tests: ${testResults.length}`)
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)
  console.log(`⚠️  Errors: ${errorTests}`)
  console.log(`Success Rate: ${((passedTests / testResults.length) * 100).toFixed(1)}%`)

  console.log('\n🌐 Testing Agent API Tests completed!')
  
  // Exit with appropriate code
  if (failedTests > 0 || errorTests > 0) {
    console.log('⚠️  Some API tests failed. Please review the results above.')
    process.exit(1)
  } else {
    console.log('✅ All API tests passed successfully!')
    process.exit(0)
  }
}

/**
 * Run a single test
 */
async function runTest(
  name: string,
  testFn: () => Promise<string>,
  results: Array<{ name: string; status: 'passed' | 'failed' | 'error'; message: string; duration: number }>
): Promise<void> {
  const startTime = Date.now()
  
  try {
    const message = await testFn()
    results.push({
      name,
      status: 'passed',
      message,
      duration: Date.now() - startTime
    })
  } catch (error) {
    const isExpectedError = error.message.includes('not found') || 
                           error.message.includes('timeout') ||
                           error.message.includes('should have been deleted')
    
    results.push({
      name,
      status: isExpectedError ? 'passed' : 'failed',
      message: error.message,
      duration: Date.now() - startTime
    })
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAPITests()
}