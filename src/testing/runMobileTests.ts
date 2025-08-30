/**
 * Mobile Testing Execution Script
 * Runs comprehensive mobile testing across different devices and platforms
 */

import { MobileTestRunner, MobileTestRunnerConfig } from './mobile/MobileTestRunner'
import * as fs from 'fs'
import * as path from 'path'

async function runMobileTests(): Promise<void> {
  let runner: MobileTestRunner | null = null
  
  try {
    console.log('=== Mobile Testing Suite ===')
    
    console.log('Initializing mobile test runner...')
    
    // Configure mobile test runner
    const config: MobileTestRunnerConfig = {
      devices: [], // Empty array means test all available devices
      testSuites: ['compatibility', 'performance', 'ui', 'network', 'gestures'],
      parallelExecution: true,
      maxConcurrentDevices: 3,
      timeout: 30000,
      retryAttempts: 2,
      screenshotOnFailure: true,
      generateReport: true,
      reportFormat: 'json'
    }
    
    runner = new MobileTestRunner(config)
    
    // Initialize runner
    await runner.initialize()
    
    // Check device availability
    const connectedDevices = runner.getConnectedDevices()
    console.log(`Found ${connectedDevices.length} connected devices:`)
    connectedDevices.forEach(device => {
      console.log(`  - ${device.name} (${device.platform} ${device.version})`)
      console.log(`    Screen: ${device.screenSize.width}x${device.screenSize.height}`)
      console.log(`    Memory: ${device.memoryAvailable}MB`)
      console.log(`    Network: ${device.networkConditions.type} (${device.networkConditions.speed}Mbps)`)
    })
    
    if (connectedDevices.length === 0) {
      console.warn('No mobile devices connected. Mobile testing will use simulated devices.')
    }
    
    // Check health status
    const healthStatus = runner.getHealthStatus()
    console.log(`\nMobile Testing Framework Health: ${healthStatus.status}`)
    console.log(`Health Message: ${healthStatus.message}`)
    
    // Run comprehensive mobile tests
    console.log('\nStarting mobile test execution...')
    const startTime = Date.now()
    const session = await runner.runTests()
    const executionTime = Date.now() - startTime
    
    // Display results
    console.log('\n=== Mobile Test Results ===')
    console.log(`Session ID: ${session.id}`)
    console.log(`Status: ${session.status}`)
    console.log(`Execution Time: ${executionTime}ms`)
    console.log(`Total Tests: ${session.summary.totalTests}`)
    console.log(`Passed: ${session.summary.passedTests} (${((session.summary.passedTests / session.summary.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${session.summary.failedTests} (${((session.summary.failedTests / session.summary.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Errors: ${session.summary.errorTests} (${((session.summary.errorTests / session.summary.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Skipped: ${session.summary.skippedTests} (${((session.summary.skippedTests / session.summary.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Total Test Duration: ${session.summary.totalDuration}ms`)
    
    // Display device-specific results
    console.log('\n=== Device-Specific Results ===')
    session.deviceResults.forEach((results, deviceId) => {
      const device = connectedDevices.find(d => d.id === deviceId)
      const deviceName = device ? `${device.name} (${device.platform})` : deviceId
      
      const passed = results.filter(r => r.status === 'passed').length
      const failed = results.filter(r => r.status === 'failed').length
      const errors = results.filter(r => r.status === 'error').length
      
      console.log(`${deviceName}: ${results.length} tests - ${passed} passed, ${failed} failed, ${errors} errors`)
      
      // Show failed tests
      const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error')
      if (failedTests.length > 0) {
        console.log(`  Failed tests:`)
        failedTests.forEach(test => {
          console.log(`    - ${test.name}: ${test.message}`)
        })
      }
    })
    
    // Generate and save report
    if (config.generateReport) {
      console.log('\nGenerating test report...')
      const report = await runner.generateReport()
      
      // Save report to file
      const reportsDir = path.join(process.cwd(), 'test-reports')
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      const reportFileName = `mobile-test-report-${session.id}.json`
      const reportPath = path.join(reportsDir, reportFileName)
      
      fs.writeFileSync(reportPath, report)
      console.log(`Test report saved to: ${reportPath}`)
      
      // Generate summary report
      const summaryReport = {
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        executionTime: executionTime,
        summary: session.summary,
        deviceCount: connectedDevices.length,
        devices: connectedDevices.map(d => ({
          id: d.id,
          name: d.name,
          platform: d.platform,
          version: d.version
        })),
        status: session.status
      }
      
      const summaryFileName = `mobile-test-summary-${session.id}.json`
      const summaryPath = path.join(reportsDir, summaryFileName)
      fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2))
      console.log(`Test summary saved to: ${summaryPath}`)
    }
    
    // Performance insights
    console.log('\n=== Performance Insights ===')
    const allResults = runner.getAllResults()
    const performanceResults = allResults.filter(r => r.performanceMetrics)
    
    if (performanceResults.length > 0) {
      const avgLaunchTime = performanceResults
        .filter(r => r.performanceMetrics?.appLaunchTime)
        .reduce((sum, r) => sum + (r.performanceMetrics?.appLaunchTime || 0), 0) / performanceResults.length
      
      const avgMemoryUsage = performanceResults
        .filter(r => r.performanceMetrics?.memoryUsage)
        .reduce((sum, r) => sum + (r.performanceMetrics?.memoryUsage || 0), 0) / performanceResults.length
      
      console.log(`Average App Launch Time: ${avgLaunchTime.toFixed(0)}ms`)
      console.log(`Average Memory Usage: ${avgMemoryUsage.toFixed(0)}MB`)
    }
    
    // Cleanup
    await runner.shutdown()
    
    console.log('\n=== Mobile Testing Complete ===')
    
    // Exit with appropriate code
    const hasFailures = session.summary.failedTests > 0 || session.summary.errorTests > 0
    if (hasFailures) {
      console.log('⚠️  Some tests failed. Check the results above for details.')
      process.exit(1)
    } else {
      console.log('✅ All mobile tests passed successfully!')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ Mobile testing execution failed:', error)
    
    try {
      if (runner) {
        await runner.shutdown()
      }
    } catch (shutdownError) {
      console.error('Failed to shutdown mobile test runner:', shutdownError)
    }
    
    process.exit(1)
  }
}

// Export for use in other modules
export { runMobileTests }

// Run if called directly
if (require.main === module) {
  runMobileTests().catch(error => {
    console.error('Unhandled error in mobile testing:', error)
    process.exit(1)
  })
}