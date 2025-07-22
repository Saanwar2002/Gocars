#!/usr/bin/env node

/**
 * Run Passenger Testing Agent
 * CLI script to execute comprehensive passenger testing
 */

import { passengerTestingAgent } from './PassengerTestingAgent'

async function main() {
  console.log('🚀 GoCars Passenger Testing Agent')
  console.log('==================================')
  console.log('Starting comprehensive passenger testing...\n')

  try {
    const startTime = Date.now()
    
    // Run comprehensive testing
    const result = await passengerTestingAgent.runComprehensiveTest()
    
    const totalTime = Date.now() - startTime
    
    console.log('\n✅ Testing completed successfully!')
    console.log(`Total execution time: ${Math.round(totalTime / 1000)}s`)
    console.log(`Session ID: ${result.sessionId}`)
    
    // Display summary
    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`Total Tests: ${result.results.length}`)
    console.log(`Passed: ${result.results.filter(r => r.status === 'passed').length}`)
    console.log(`Failed: ${result.results.filter(r => r.status === 'failed').length}`)
    console.log(`Errors: ${result.results.filter(r => r.status === 'error').length}`)
    console.log(`Total Errors: ${result.errors.length}`)
    
    // Display errors if any
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND')
      console.log('================')
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`)
        if (error.test) console.log(`   Test: ${error.test}`)
        console.log(`   Time: ${error.timestamp}`)
        console.log('')
      })
    }
    
    // Display recommendations
    if (result.report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS')
      console.log('==================')
      result.report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    // Save detailed report
    const fs = require('fs')
    const path = require('path')
    
    const reportDir = path.join(process.cwd(), 'test-reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    const reportFile = path.join(reportDir, `passenger-test-report-${Date.now()}.json`)
    fs.writeFileSync(reportFile, JSON.stringify(result.report, null, 2))
    
    console.log(`\n📄 Detailed report saved to: ${reportFile}`)
    
    // Exit with appropriate code
    const hasErrors = result.errors.length > 0 || result.results.some(r => r.status === 'failed' || r.status === 'error')
    process.exit(hasErrors ? 1 : 0)
    
  } catch (error) {
    console.error('\n❌ Testing failed with critical error:')
    console.error(error)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Testing interrupted by user')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Testing terminated')
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { main as runPassengerTests }