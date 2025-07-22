#!/usr/bin/env node

/**
 * Run Enhanced Passenger Testing Agent with Auto-Fix
 * CLI script to execute comprehensive testing with automatic error fixing
 */

import { enhancedPassengerTestingAgent } from './EnhancedPassengerTestingAgent'

async function main() {
  console.log('🚀 GoCars Enhanced Passenger Testing Agent with Auto-Fix')
  console.log('======================================================')
  console.log('Starting comprehensive passenger testing with automatic error fixing...\n')

  try {
    const startTime = Date.now()
    
    // Run enhanced testing with auto-fix
    const result = await enhancedPassengerTestingAgent.runTestingWithAutoFix()
    
    const totalTime = Date.now() - startTime
    
    console.log('\n✅ Enhanced testing completed successfully!')
    console.log(`Total execution time: ${Math.round(totalTime / 1000)}s`)
    console.log(`Session ID: ${result.sessionId}`)
    
    // Display comprehensive summary
    console.log('\n📊 COMPREHENSIVE SUMMARY')
    console.log('========================')
    console.log(`Total Tests: ${result.results.length}`)
    console.log(`Passed: ${result.results.filter(r => r.status === 'passed').length}`)
    console.log(`Failed: ${result.results.filter(r => r.status === 'failed').length}`)
    console.log(`Errors: ${result.results.filter(r => r.status === 'error').length}`)
    
    const successRate = result.results.length > 0 
      ? (result.results.filter(r => r.status === 'passed').length / result.results.length) * 100
      : 0
    console.log(`Success Rate: ${successRate.toFixed(2)}%`)
    
    // Display auto-fix summary
    console.log('\n🔧 AUTO-FIX SUMMARY')
    console.log('===================')
    console.log(`Total Fix Attempts: ${result.fixes.length}`)
    console.log(`Successfully Applied: ${result.fixes.filter(f => f.fixApplied).length}`)
    console.log(`Failed to Apply: ${result.fixes.filter(f => !f.fixApplied).length}`)
    
    if (result.fixes.length > 0) {
      const fixSuccessRate = (result.fixes.filter(f => f.fixApplied).length / result.fixes.length) * 100
      console.log(`Fix Success Rate: ${fixSuccessRate.toFixed(2)}%`)
    }
    
    // Display applied fixes
    const appliedFixes = result.fixes.filter(f => f.fixApplied)
    if (appliedFixes.length > 0) {
      console.log('\n✅ APPLIED FIXES:')
      appliedFixes.forEach((fix, index) => {
        console.log(`${index + 1}. [${fix.fixType.toUpperCase()}] ${fix.fixDescription}`)
      })
    }
    
    // Display failed fixes
    const failedFixes = result.fixes.filter(f => !f.fixApplied)
    if (failedFixes.length > 0) {
      console.log('\n❌ FIXES THAT REQUIRE MANUAL INTERVENTION:')
      failedFixes.forEach((fix, index) => {
        console.log(`${index + 1}. [${fix.fixType.toUpperCase()}] ${fix.fixDescription}`)
      })
    }
    
    // Display improvement metrics if retest was performed
    if (result.retestResults && result.report.retestComparison) {
      const improvement = result.report.retestComparison.improvement
      console.log('\n📈 IMPROVEMENT METRICS')
      console.log('=====================')
      console.log(`Success Rate Change: ${improvement.successRateChange > 0 ? '+' : ''}${improvement.successRateChange.toFixed(2)}%`)
      console.log(`Tests Fixed: ${improvement.testsFixed}`)
      console.log(`Errors Reduced: ${improvement.errorsReduced}`)
    }
    
    // Display errors if any remain
    if (result.errors.length > 0) {
      console.log('\n❌ REMAINING ERRORS')
      console.log('==================')
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`)
        if (error.test) console.log(`   Test: ${error.test}`)
        console.log(`   Time: ${error.timestamp}`)
        console.log('')
      })
    }
    
    // Display enhanced recommendations
    if (result.report.enhancedRecommendations?.length > 0) {
      console.log('\n💡 ENHANCED RECOMMENDATIONS')
      console.log('===========================')
      result.report.enhancedRecommendations.forEach((rec: string, index: number) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    // Display created files
    console.log('\n📁 AUTO-GENERATED FILES')
    console.log('=======================')
    console.log('The following files were automatically created to fix issues:')
    console.log('• src/components/auto-generated/ - Missing UI components')
    console.log('• src/lib/auto-fixes/ - Utility fixes and configurations')
    console.log('• src/styles/auto-fixes/ - CSS fixes for UI issues')
    console.log('• src/app/(app)/ - Missing page components')
    
    // Save detailed report
    const fs = require('fs')
    const path = require('path')
    
    const reportDir = path.join(process.cwd(), 'test-reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    const reportFile = path.join(reportDir, `enhanced-test-report-${Date.now()}.json`)
    fs.writeFileSync(reportFile, JSON.stringify(result.report, null, 2))
    
    console.log(`\n📄 Detailed report saved to: ${reportFile}`)
    
    // Create fix summary file
    const fixReport = enhancedPassengerTestingAgent.getFixReport()
    const fixReportFile = path.join(reportDir, `fix-report-${Date.now()}.json`)
    fs.writeFileSync(fixReportFile, JSON.stringify(fixReport, null, 2))
    
    console.log(`📄 Fix report saved to: ${fixReportFile}`)
    
    // Display final status
    console.log('\n🎯 FINAL STATUS')
    console.log('===============')
    
    if (successRate >= 90) {
      console.log('🟢 EXCELLENT: System is performing exceptionally well')
    } else if (successRate >= 80) {
      console.log('🟡 GOOD: System is performing well with minor issues addressed')
    } else if (successRate >= 70) {
      console.log('🟠 FAIR: System has some issues but many were automatically fixed')
    } else {
      console.log('🔴 NEEDS ATTENTION: System requires manual intervention for optimal performance')
    }
    
    const hasRemainingIssues = result.errors.length > 0 || 
                              result.results.some(r => r.status === 'failed' || r.status === 'error') ||
                              failedFixes.length > 0
    
    if (hasRemainingIssues) {
      console.log('\n⚠️  Some issues require manual attention. Please review the failed fixes and remaining errors.')
    } else {
      console.log('\n🎉 All detected issues have been automatically resolved!')
    }
    
    // Exit with appropriate code
    process.exit(hasRemainingIssues ? 1 : 0)
    
  } catch (error) {
    console.error('\n❌ Enhanced testing failed with critical error:')
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

export { main as runEnhancedTests }