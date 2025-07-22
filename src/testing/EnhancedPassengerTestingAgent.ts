/**
 * Enhanced Passenger Testing Agent with Auto-Fix Capabilities
 * Runs comprehensive tests and automatically fixes detected issues
 */

import { passengerTestingAgent } from './PassengerTestingAgent'
import { autoFixEngine, FixResult } from './AutoFixEngine'
import { TestResult } from './core/TestingAgentController'

export class EnhancedPassengerTestingAgent {
  private fixResults: FixResult[] = []

  /**
   * Run comprehensive testing with automatic error fixing
   */
  public async runTestingWithAutoFix(): Promise<{
    sessionId: string
    results: TestResult[]
    errors: any[]
    fixes: FixResult[]
    report: any
    retestResults?: TestResult[]
  }> {
    console.log('🚀 Starting Enhanced Passenger Testing with Auto-Fix...')
    
    // Run initial comprehensive test
    console.log('📋 Phase 1: Initial Comprehensive Testing')
    const initialResults = await passengerTestingAgent.runComprehensiveTest()
    
    // Analyze and apply fixes
    console.log('🔧 Phase 2: Analyzing Issues and Applying Fixes')
    const fixes = await autoFixEngine.analyzeAndFix(initialResults.results)
    this.fixResults = fixes
    
    // Display fix summary
    this.displayFixSummary(fixes)
    
    // If fixes were applied, run tests again to validate
    let retestResults: TestResult[] | undefined
    const appliedFixes = fixes.filter(f => f.fixApplied)
    
    if (appliedFixes.length > 0) {
      console.log('🔄 Phase 3: Re-testing After Fixes Applied')
      console.log(`Re-running tests to validate ${appliedFixes.length} applied fixes...`)
      
      try {
        const retestResult = await passengerTestingAgent.runComprehensiveTest()
        retestResults = retestResult.results
        
        // Compare results
        this.compareTestResults(initialResults.results, retestResults)
      } catch (error) {
        console.error('❌ Re-testing failed:', error)
      }
    }
    
    // Generate enhanced report
    const enhancedReport = this.generateEnhancedReport(
      initialResults,
      fixes,
      retestResults
    )
    
    console.log('✅ Enhanced testing completed with auto-fix capabilities')
    
    return {
      sessionId: initialResults.sessionId,
      results: retestResults || initialResults.results,
      errors: initialResults.errors,
      fixes,
      report: enhancedReport,
      retestResults
    }
  }

  /**
   * Display fix summary
   */
  private displayFixSummary(fixes: FixResult[]): void {
    console.log('\n🔧 AUTO-FIX SUMMARY')
    console.log('===================')
    
    const appliedFixes = fixes.filter(f => f.fixApplied)
    const failedFixes = fixes.filter(f => !f.fixApplied)
    
    console.log(`Total Fix Attempts: ${fixes.length}`)
    console.log(`Successfully Applied: ${appliedFixes.length}`)
    console.log(`Failed to Apply: ${failedFixes.length}`)
    
    if (appliedFixes.length > 0) {
      console.log('\n✅ SUCCESSFULLY APPLIED FIXES:')
      appliedFixes.forEach((fix, index) => {
        console.log(`${index + 1}. [${fix.fixType.toUpperCase()}] ${fix.fixDescription}`)
      })
    }
    
    if (failedFixes.length > 0) {
      console.log('\n❌ FAILED TO APPLY FIXES:')
      failedFixes.forEach((fix, index) => {
        console.log(`${index + 1}. [${fix.fixType.toUpperCase()}] ${fix.fixDescription}`)
      })
    }
    
    console.log('===================\n')
  }

  /**
   * Compare test results before and after fixes
   */
  private compareTestResults(beforeResults: TestResult[], afterResults: TestResult[]): void {
    console.log('\n📊 TEST RESULTS COMPARISON')
    console.log('==========================')
    
    const beforeStats = this.calculateTestStats(beforeResults)
    const afterStats = this.calculateTestStats(afterResults)
    
    console.log('BEFORE FIXES:')
    console.log(`  Total: ${beforeStats.total} | Passed: ${beforeStats.passed} | Failed: ${beforeStats.failed} | Errors: ${beforeStats.errors}`)
    console.log(`  Success Rate: ${beforeStats.successRate.toFixed(2)}%`)
    
    console.log('AFTER FIXES:')
    console.log(`  Total: ${afterStats.total} | Passed: ${afterStats.passed} | Failed: ${afterStats.failed} | Errors: ${afterStats.errors}`)
    console.log(`  Success Rate: ${afterStats.successRate.toFixed(2)}%`)
    
    const improvement = afterStats.successRate - beforeStats.successRate
    if (improvement > 0) {
      console.log(`🎉 IMPROVEMENT: +${improvement.toFixed(2)}% success rate`)
    } else if (improvement < 0) {
      console.log(`⚠️  REGRESSION: ${improvement.toFixed(2)}% success rate`)
    } else {
      console.log(`➡️  NO CHANGE in success rate`)
    }
    
    console.log('==========================\n')
  }

  /**
   * Calculate test statistics
   */
  private calculateTestStats(results: TestResult[]): {
    total: number
    passed: number
    failed: number
    errors: number
    successRate: number
  } {
    const total = results.length
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const errors = results.filter(r => r.status === 'error').length
    const successRate = total > 0 ? (passed / total) * 100 : 0
    
    return { total, passed, failed, errors, successRate }
  }

  /**
   * Generate enhanced report with fix information
   */
  private generateEnhancedReport(
    initialResults: any,
    fixes: FixResult[],
    retestResults?: TestResult[]
  ): any {
    const appliedFixes = fixes.filter(f => f.fixApplied)
    const failedFixes = fixes.filter(f => !f.fixApplied)
    
    const enhancedReport = {
      ...initialResults.report,
      autoFixSummary: {
        totalFixAttempts: fixes.length,
        successfulFixes: appliedFixes.length,
        failedFixes: failedFixes.length,
        fixSuccessRate: fixes.length > 0 ? (appliedFixes.length / fixes.length) * 100 : 0,
        fixesByType: this.groupFixesByType(fixes),
        fixesByCategory: this.groupFixesByCategory(fixes)
      },
      appliedFixes: appliedFixes.map(fix => ({
        id: fix.errorId,
        type: fix.fixType,
        description: fix.fixDescription,
        validated: fix.validationResult,
        rollbackAvailable: fix.rollbackAvailable
      })),
      failedFixes: failedFixes.map(fix => ({
        id: fix.errorId,
        type: fix.fixType,
        description: fix.fixDescription,
        reason: 'Fix could not be applied automatically'
      }))
    }
    
    // Add retest comparison if available
    if (retestResults) {
      const beforeStats = this.calculateTestStats(initialResults.results)
      const afterStats = this.calculateTestStats(retestResults)
      
      enhancedReport.retestComparison = {
        before: beforeStats,
        after: afterStats,
        improvement: {
          successRateChange: afterStats.successRate - beforeStats.successRate,
          testsFixed: afterStats.passed - beforeStats.passed,
          errorsReduced: beforeStats.errors - afterStats.errors
        }
      }
    }
    
    // Enhanced recommendations
    enhancedReport.enhancedRecommendations = this.generateEnhancedRecommendations(
      initialResults,
      fixes,
      retestResults
    )
    
    return enhancedReport
  }

  /**
   * Group fixes by type
   */
  private groupFixesByType(fixes: FixResult[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    
    fixes.forEach(fix => {
      grouped[fix.fixType] = (grouped[fix.fixType] || 0) + 1
    })
    
    return grouped
  }

  /**
   * Group fixes by category (extracted from fix description)
   */
  private groupFixesByCategory(fixes: FixResult[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    
    fixes.forEach(fix => {
      let category = 'other'
      
      if (fix.fixDescription.toLowerCase().includes('navigation')) category = 'navigation'
      else if (fix.fixDescription.toLowerCase().includes('element')) category = 'ui_elements'
      else if (fix.fixDescription.toLowerCase().includes('validation')) category = 'validation'
      else if (fix.fixDescription.toLowerCase().includes('firebase')) category = 'firebase'
      else if (fix.fixDescription.toLowerCase().includes('websocket')) category = 'websocket'
      else if (fix.fixDescription.toLowerCase().includes('notification')) category = 'notifications'
      
      grouped[category] = (grouped[category] || 0) + 1
    })
    
    return grouped
  }

  /**
   * Generate enhanced recommendations
   */
  private generateEnhancedRecommendations(
    initialResults: any,
    fixes: FixResult[],
    retestResults?: TestResult[]
  ): string[] {
    const recommendations: string[] = []
    
    const appliedFixes = fixes.filter(f => f.fixApplied)
    const failedFixes = fixes.filter(f => !f.fixApplied)
    
    // Fix-based recommendations
    if (appliedFixes.length > 0) {
      recommendations.push(`Successfully applied ${appliedFixes.length} automated fixes - system stability improved`)
    }
    
    if (failedFixes.length > 0) {
      recommendations.push(`${failedFixes.length} issues require manual intervention - review failed fixes`)
    }
    
    // Category-specific recommendations
    const fixesByCategory = this.groupFixesByCategory(fixes)
    
    if (fixesByCategory.navigation > 0) {
      recommendations.push('Multiple navigation issues detected - review routing configuration and page structure')
    }
    
    if (fixesByCategory.ui_elements > 0) {
      recommendations.push('UI element issues found - consider comprehensive UI/UX review and testing')
    }
    
    if (fixesByCategory.validation > 0) {
      recommendations.push('Input validation issues detected - implement comprehensive form validation')
    }
    
    if (fixesByCategory.firebase > 0) {
      recommendations.push('Firebase connectivity issues - review configuration and network stability')
    }
    
    if (fixesByCategory.websocket > 0) {
      recommendations.push('WebSocket communication issues - check server configuration and network policies')
    }
    
    if (fixesByCategory.notifications > 0) {
      recommendations.push('Notification system issues - review permission handling and service worker setup')
    }
    
    // Performance recommendations
    if (retestResults) {
      const beforeStats = this.calculateTestStats(initialResults.results)
      const afterStats = this.calculateTestStats(retestResults)
      
      if (afterStats.successRate > beforeStats.successRate) {
        recommendations.push('Auto-fix system successfully improved test success rate - consider enabling in production')
      } else if (afterStats.successRate < beforeStats.successRate) {
        recommendations.push('Some fixes may have introduced regressions - review applied changes carefully')
      }
    }
    
    // Overall system health
    const totalIssues = fixes.length
    if (totalIssues === 0) {
      recommendations.push('No fixable issues detected - system is performing well')
    } else if (totalIssues < 5) {
      recommendations.push('Minor issues detected and addressed - system is generally stable')
    } else if (totalIssues < 10) {
      recommendations.push('Moderate number of issues detected - consider regular testing and maintenance')
    } else {
      recommendations.push('High number of issues detected - comprehensive system review recommended')
    }
    
    return recommendations
  }

  /**
   * Get detailed fix report
   */
  public getFixReport(): {
    totalFixes: number
    appliedFixes: number
    failedFixes: number
    fixesByType: Record<string, number>
    fixesByCategory: Record<string, number>
    fixes: FixResult[]
  } {
    const appliedFixes = this.fixResults.filter(f => f.fixApplied)
    const failedFixes = this.fixResults.filter(f => !f.fixApplied)
    
    return {
      totalFixes: this.fixResults.length,
      appliedFixes: appliedFixes.length,
      failedFixes: failedFixes.length,
      fixesByType: this.groupFixesByType(this.fixResults),
      fixesByCategory: this.groupFixesByCategory(this.fixResults),
      fixes: this.fixResults
    }
  }

  /**
   * Rollback specific fixes
   */
  public async rollbackFixes(fixIds: string[]): Promise<boolean[]> {
    const results: boolean[] = []
    
    for (const fixId of fixIds) {
      try {
        const success = await autoFixEngine.rollbackFix(fixId)
        results.push(success)
        
        if (success) {
          console.log(`✅ Successfully rolled back fix: ${fixId}`)
        } else {
          console.log(`❌ Failed to rollback fix: ${fixId}`)
        }
      } catch (error) {
        console.error(`Error rolling back fix ${fixId}:`, error)
        results.push(false)
      }
    }
    
    return results
  }
}

// Export singleton instance
export const enhancedPassengerTestingAgent = new EnhancedPassengerTestingAgent()