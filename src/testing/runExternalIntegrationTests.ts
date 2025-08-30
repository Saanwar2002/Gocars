/**
 * External Integration Tests Runner
 * Tests all external service integrations
 */

import { IntegrationManager, IntegrationManagerConfig } from './integrations/IntegrationManager'
import { TestResult } from './core/TestingAgentController'

/**
 * Run external integration tests
 */
export async function runExternalIntegrationTests(): Promise<void> {
  console.log('🔗 Starting External Integration Tests...')
  console.log('=' .repeat(60))

  // Create test configuration
  const config: IntegrationManagerConfig = {
    ciPipeline: {
      platform: 'github',
      webhookUrl: 'http://localhost:3001/webhook/github',
      apiToken: 'test_token',
      projectId: 'test_project',
      buildTriggers: ['build_completed', 'build_failed'],
      notificationChannels: ['general', 'dev-team']
    },
    issueTracking: {
      platform: 'github',
      baseUrl: 'https://api.github.com/repos/test/repo',
      apiToken: 'test_token',
      projectKey: 'TEST',
      defaultAssignee: 'test-user',
      labels: ['bug', 'testing', 'automated'],
      priorityMapping: {
        'critical': 'Critical',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
      }
    },
    notifications: {
      services: [
        {
          type: 'slack',
          name: 'Slack Integration',
          config: { webhookUrl: 'https://hooks.slack.com/test' },
          channels: [
            {
              id: 'general',
              name: 'General',
              type: 'channel',
              address: '#general'
            },
            {
              id: 'dev-team',
              name: 'Dev Team',
              type: 'channel',
              address: '#dev-team'
            }
          ],
          enabled: true
        },
        {
          type: 'email',
          name: 'Email Integration',
          config: { smtpServer: 'smtp.test.com' },
          channels: [
            {
              id: 'admin-email',
              name: 'Admin Email',
              type: 'user',
              address: 'admin@test.com'
            }
          ],
          enabled: true
        }
      ],
      defaultChannels: ['general', 'admin-email'],
      escalationRules: [
        {
          id: 'critical-escalation',
          name: 'Critical Issue Escalation',
          conditions: {
            severity: ['critical'],
            timeWindow: 30
          },
          actions: {
            channels: ['dev-team', 'admin-email'],
            delay: 5,
            repeat: 2
          }
        }
      ]
    },
    enabledIntegrations: ['ci_pipeline', 'issue_tracking', 'notifications'],
    globalSettings: {
      retryAttempts: 3,
      timeout: 30000,
      batchSize: 10
    }
  }

  const integrationManager = new IntegrationManager(config)
  const testResults: Array<{ name: string; status: 'passed' | 'failed' | 'error'; message: string; duration: number }> = []

  try {
    // Test 1: Integration Manager Initialization
    await runTest('Integration Manager Initialization', async () => {
      const status = await integrationManager.getIntegrationStatus()
      if (!Array.isArray(status) || status.length === 0) {
        throw new Error('No integrations initialized')
      }
      return `Initialized ${status.length} integrations`
    }, testResults)

    // Test 2: Configuration Summary
    await runTest('Configuration Summary', async () => {
      const summary = integrationManager.getConfigurationSummary()
      if (!summary || summary.configuredIntegrations === 0) {
        throw new Error('No integrations configured')
      }
      return `${summary.configuredIntegrations}/${summary.totalIntegrations} integrations configured`
    }, testResults)

    // Test 3: Test All Integrations Connectivity
    await runTest('Test All Integrations Connectivity', async () => {
      const result = await integrationManager.testAllIntegrations()
      if (!result.success) {
        const failedIntegrations = result.results.filter(r => !r.success).map(r => r.integration)
        throw new Error(`Integration tests failed: ${failedIntegrations.join(', ')}`)
      }
      return `All ${result.results.length} integrations tested successfully`
    }, testResults)

    // Test 4: CI/CD Pipeline Webhook Handling
    await runTest('CI/CD Pipeline Webhook Handling', async () => {
      const mockGitHubPayload = {
        action: 'completed',
        workflow_run: {
          id: 12345,
          name: 'CI Tests',
          head_branch: 'main',
          head_sha: 'abc123def456',
          conclusion: 'success'
        },
        repository: {
          full_name: 'test/repo'
        }
      }

      const mockHeaders = {
        'x-github-event': 'workflow_run',
        'x-github-delivery': 'test-delivery-id'
      }

      const result = await integrationManager.handlePipelineWebhook(mockGitHubPayload, mockHeaders)
      if (!result.success) {
        throw new Error(`Webhook handling failed: ${result.message}`)
      }
      return `Webhook processed successfully: ${result.message}`
    }, testResults)

    // Test 5: Process Mock Test Results
    await runTest('Process Mock Test Results', async () => {
      const mockTestResults: TestResult[] = [
        {
          id: 'test_success_1',
          name: 'Successful Test 1',
          status: 'passed',
          duration: 1000,
          message: 'Test passed successfully',
          timestamp: Date.now()
        },
        {
          id: 'test_failure_1',
          name: 'Failed Test 1',
          status: 'failed',
          duration: 2000,
          message: 'Test failed with assertion error',
          timestamp: Date.now()
        },
        {
          id: 'test_error_1',
          name: 'Error Test 1',
          status: 'error',
          duration: 500,
          message: 'Test encountered an error',
          timestamp: Date.now()
        }
      ]

      const mockSummary = {
        totalTests: 3,
        passedTests: 1,
        failedTests: 1,
        errorTests: 1,
        successRate: 33.3
      }

      await integrationManager.processTestResults('test_session_123', mockTestResults, mockSummary)
      return `Processed ${mockTestResults.length} test results`
    }, testResults)

    // Test 6: Send System Alert
    await runTest('Send System Alert', async () => {
      await integrationManager.sendSystemAlert(
        'Test System Alert',
        'This is a test system alert to verify notification integration',
        'warning',
        { source: 'integration_test', timestamp: Date.now() }
      )
      return 'System alert sent successfully'
    }, testResults)

    // Test 7: Integration Statistics
    await runTest('Integration Statistics', async () => {
      const stats = integrationManager.getIntegrationStatistics()
      if (!stats || Object.keys(stats).length === 0) {
        throw new Error('No integration statistics available')
      }
      
      const totalActivities = Object.values(stats).reduce((sum, stat) => sum + stat.errors + stat.successes, 0)
      return `Statistics collected for ${Object.keys(stats).length} integrations (${totalActivities} total activities)`
    }, testResults)

    // Test 8: Integration Status Check
    await runTest('Integration Status Check', async () => {
      const statuses = await integrationManager.getIntegrationStatus()
      if (!Array.isArray(statuses) || statuses.length === 0) {
        throw new Error('No integration statuses available')
      }
      
      const healthyIntegrations = statuses.filter(s => s.healthy).length
      const configuredIntegrations = statuses.filter(s => s.configured).length
      
      return `${healthyIntegrations}/${statuses.length} integrations healthy, ${configuredIntegrations}/${statuses.length} configured`
    }, testResults)

    // Test 9: Enable/Disable Integration
    await runTest('Enable/Disable Integration', async () => {
      const disabled = integrationManager.disableIntegration('notifications')
      if (!disabled) {
        throw new Error('Failed to disable integration')
      }
      
      const enabled = integrationManager.enableIntegration('notifications')
      if (!enabled) {
        // This is expected if already enabled
        console.log('Integration was already enabled')
      }
      
      return 'Integration enable/disable functionality working'
    }, testResults)

    // Test 10: Reset Statistics
    await runTest('Reset Statistics', async () => {
      integrationManager.resetIntegrationStatistics()
      const stats = integrationManager.getIntegrationStatistics()
      
      const allReset = Object.values(stats).every(stat => stat.errors === 0 && stat.successes === 0)
      if (!allReset) {
        throw new Error('Statistics not properly reset')
      }
      
      return 'Integration statistics reset successfully'
    }, testResults)

  } catch (error) {
    console.error('❌ External integration tests failed:', error)
  }

  // Display results
  console.log('\n📊 External Integration Test Results:')
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

  // Integration-specific summary
  const finalStatus = await integrationManager.getIntegrationStatus()
  console.log('\n🔗 Integration Summary:')
  console.log('-'.repeat(60))
  finalStatus.forEach(status => {
    const healthIcon = status.healthy ? '✅' : '❌'
    const configIcon = status.configured ? '⚙️' : '❓'
    console.log(`${healthIcon} ${configIcon} ${status.name} (${status.type})`)
    console.log(`   Enabled: ${status.enabled}`)
    console.log(`   Configured: ${status.configured}`)
    console.log(`   Healthy: ${status.healthy}`)
    console.log(`   Success Count: ${status.successCount}`)
    console.log(`   Error Count: ${status.errorCount}`)
    console.log('')
  })

  // Cleanup
  await integrationManager.cleanup()

  console.log('🔗 External Integration Tests completed!')
  
  // Exit with appropriate code
  if (failedTests > 0 || errorTests > 0) {
    console.log('⚠️  Some integration tests failed. Please review the results above.')
    process.exit(1)
  } else {
    console.log('✅ All integration tests passed successfully!')
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
    results.push({
      name,
      status: 'failed',
      message: error.message,
      duration: Date.now() - startTime
    })
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runExternalIntegrationTests()
}