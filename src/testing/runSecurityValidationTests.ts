/**
 * Security Validation Tests Runner
 * Executes comprehensive security validation tests
 */

import { SecurityTestSuite } from './security/SecurityTestSuite'

/**
 * Run security validation tests
 */
export async function runSecurityValidationTests(): Promise<void> {
  console.log('🔒 Starting Security Validation Tests...')
  console.log('=' .repeat(60))

  const securityTestSuite = new SecurityTestSuite()

  try {
    // Setup test environment
    await securityTestSuite.setup()

    // Run all security tests
    const results = await securityTestSuite.runTests()

    // Display results
    console.log('\n📊 Security Test Results:')
    console.log('-'.repeat(60))

    let passedTests = 0
    let failedTests = 0
    let errorTests = 0
    let skippedTests = 0

    results.forEach((result, index) => {
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'error': '⚠️',
        'skipped': '⏭️'
      }[result.status] || '❓'

      console.log(`${statusIcon} ${result.name}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)

      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`)
      }

      console.log('')

      // Count results
      switch (result.status) {
        case 'passed':
          passedTests++
          break
        case 'failed':
          failedTests++
          break
        case 'error':
          errorTests++
          break
        case 'skipped':
          skippedTests++
          break
      }
    })

    // Summary
    console.log('📈 Test Summary:')
    console.log('-'.repeat(60))
    console.log(`Total Tests: ${results.length}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`⚠️  Errors: ${errorTests}`)
    console.log(`⏭️  Skipped: ${skippedTests}`)
    console.log(`Success Rate: ${((passedTests / results.length) * 100).toFixed(1)}%`)

    // Security-specific summary
    const summaryResult = results.find(r => r.id === 'security_summary_report')
    if (summaryResult && summaryResult.details) {
      console.log('\n🛡️  Security Summary:')
      console.log('-'.repeat(60))
      console.log(`Security Score: ${summaryResult.details.overallSecurityScore}/100`)
      console.log(`Security Grade: ${summaryResult.details.securityGrade}`)
      
      if (summaryResult.details.securityViolations) {
        const violations = summaryResult.details.securityViolations
        console.log(`Critical Violations: ${violations.critical}`)
        console.log(`High Violations: ${violations.high}`)
        console.log(`Medium Violations: ${violations.medium}`)
        console.log(`Low Violations: ${violations.low}`)
      }

      if (summaryResult.details.recommendations && summaryResult.details.recommendations.length > 0) {
        console.log('\n💡 Security Recommendations:')
        summaryResult.details.recommendations.forEach((rec: string, index: number) => {
          console.log(`${index + 1}. ${rec}`)
        })
      }
    }

    // Cleanup
    await securityTestSuite.teardown()

    console.log('\n🔒 Security Validation Tests completed!')
    
    // Exit with appropriate code
    if (failedTests > 0 || errorTests > 0) {
      console.log('⚠️  Some security tests failed. Please review the results above.')
      process.exit(1)
    } else {
      console.log('✅ All security tests passed successfully!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Security validation tests failed:', error)
    
    try {
      await securityTestSuite.teardown()
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError)
    }
    
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityValidationTests()
}