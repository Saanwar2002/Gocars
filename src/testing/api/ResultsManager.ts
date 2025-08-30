/**
 * Results Manager
 * Manages test results, analytics, and reporting
 */

import { TestResult } from '../core/TestingAgentController'

export interface TestAnalytics {
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    errorTests: number
    skippedTests: number
    successRate: number
    averageDuration: number
  }
  trends: {
    period: string
    data: Array<{
      date: string
      passed: number
      failed: number
      errors: number
      successRate: number
    }>
  }
  topFailures: Array<{
    testId: string
    testName: string
    failureCount: number
    lastFailure: number
  }>
  performance: {
    slowestTests: Array<{
      testId: string
      testName: string
      averageDuration: number
      maxDuration: number
    }>
    fastestTests: Array<{
      testId: string
      testName: string
      averageDuration: number
      minDuration: number
    }>
  }
}

export interface ExecutionLog {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  sessionId: string
  testId?: string
  details?: any
}

export class ResultsManager {
  private sessionResults: Map<string, TestResult[]> = new Map()
  private executionLogs: Map<string, ExecutionLog[]> = new Map()
  private analyticsCache: Map<string, any> = new Map()

  constructor() {}

  /**
   * Store test results for a session
   */
  public async storeResults(sessionId: string, results: TestResult[]): Promise<void> {
    this.sessionResults.set(sessionId, results)
    
    // Log results storage
    this.addExecutionLog(sessionId, 'info', `Stored ${results.length} test results`, { resultCount: results.length })
    
    // Clear analytics cache to force recalculation
    this.analyticsCache.clear()
  }

  /**
   * Get test results for a session
   */
  public async getResults(sessionId: string): Promise<TestResult[] | null> {
    return this.sessionResults.get(sessionId) || null
  }

  /**
   * Get all session results
   */
  public async getAllResults(): Promise<Map<string, TestResult[]>> {
    return new Map(this.sessionResults)
  }

  /**
   * Generate test report
   */
  public async generateReport(sessionId: string, format: 'json' | 'html' | 'pdf'): Promise<string | null> {
    const results = await this.getResults(sessionId)
    if (!results) {
      return null
    }

    switch (format) {
      case 'json':
        return this.generateJSONReport(sessionId, results)
      case 'html':
        return this.generateHTMLReport(sessionId, results)
      case 'pdf':
        return this.generatePDFReport(sessionId, results)
      default:
        throw new Error(`Unsupported report format: ${format}`)
    }
  }

  /**
   * Generate JSON report
   */
  private generateJSONReport(sessionId: string, results: TestResult[]): string {
    const summary = this.calculateSummary(results)
    const report = {
      sessionId,
      generatedAt: Date.now(),
      summary,
      results: results.map(result => ({
        ...result,
        // Remove potentially large details for summary
        details: result.details ? 'Details available in full report' : undefined
      })),
      fullResults: results
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(sessionId: string, results: TestResult[]): string {
    const summary = this.calculateSummary(results)
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Report - ${sessionId}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
            .metric h3 { margin: 0 0 10px 0; color: #333; }
            .metric .value { font-size: 24px; font-weight: bold; }
            .passed { color: #28a745; }
            .failed { color: #dc3545; }
            .error { color: #ffc107; }
            .skipped { color: #6c757d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-passed { background-color: #d4edda; }
            .status-failed { background-color: #f8d7da; }
            .status-error { background-color: #fff3cd; }
            .status-skipped { background-color: #e2e3e5; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Test Execution Report</h1>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${summary.passedTests}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${summary.failedTests}</div>
            </div>
            <div class="metric">
                <h3>Errors</h3>
                <div class="value error">${summary.errorTests}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${summary.successRate.toFixed(1)}%</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Message</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr class="status-${result.status}">
                        <td>${result.name}</td>
                        <td>${result.status.toUpperCase()}</td>
                        <td>${result.duration}ms</td>
                        <td>${result.message || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
    `
  }

  /**
   * Generate PDF report (placeholder)
   */
  private generatePDFReport(sessionId: string, results: TestResult[]): string {
    // In a real implementation, this would generate actual PDF content
    const summary = this.calculateSummary(results)
    return `PDF Report for Session ${sessionId} - ${summary.totalTests} tests, ${summary.successRate.toFixed(1)}% success rate`
  }

  /**
   * Get analytics data
   */
  public async getAnalytics(timeRange?: { start: number; end: number }): Promise<TestAnalytics> {
    const cacheKey = timeRange ? `${timeRange.start}-${timeRange.end}` : 'all'
    
    if (this.analyticsCache.has(cacheKey)) {
      return this.analyticsCache.get(cacheKey)
    }

    const analytics = await this.calculateAnalytics(timeRange)
    this.analyticsCache.set(cacheKey, analytics)
    
    return analytics
  }

  /**
   * Calculate analytics
   */
  private async calculateAnalytics(timeRange?: { start: number; end: number }): Promise<TestAnalytics> {
    const allResults = Array.from(this.sessionResults.values()).flat()
    
    // Filter by time range if provided
    const filteredResults = timeRange ? 
      allResults.filter(result => result.timestamp >= timeRange.start && result.timestamp <= timeRange.end) :
      allResults

    const summary = this.calculateSummary(filteredResults)
    
    // Calculate trends (simplified - would use actual time-based grouping in production)
    const trends = this.calculateTrends(filteredResults)
    
    // Calculate top failures
    const topFailures = this.calculateTopFailures(filteredResults)
    
    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(filteredResults)

    return {
      summary,
      trends,
      topFailures,
      performance
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: TestResult[]): TestAnalytics['summary'] {
    const totalTests = results.length
    const passedTests = results.filter(r => r.status === 'passed').length
    const failedTests = results.filter(r => r.status === 'failed').length
    const errorTests = results.filter(r => r.status === 'error').length
    const skippedTests = results.filter(r => r.status === 'skipped').length
    
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    const averageDuration = totalTests > 0 ? 
      results.reduce((sum, r) => sum + r.duration, 0) / totalTests : 0

    return {
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      skippedTests,
      successRate,
      averageDuration
    }
  }

  /**
   * Calculate trends
   */
  private calculateTrends(results: TestResult[]): TestAnalytics['trends'] {
    // Simplified trend calculation - group by day
    const dailyStats = new Map<string, { passed: number; failed: number; errors: number; total: number }>()
    
    results.forEach(result => {
      const date = new Date(result.timestamp).toISOString().split('T')[0]
      const stats = dailyStats.get(date) || { passed: 0, failed: 0, errors: 0, total: 0 }
      
      stats.total++
      switch (result.status) {
        case 'passed': stats.passed++; break
        case 'failed': stats.failed++; break
        case 'error': stats.errors++; break
      }
      
      dailyStats.set(date, stats)
    })

    const data = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      passed: stats.passed,
      failed: stats.failed,
      errors: stats.errors,
      successRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    return {
      period: 'daily',
      data
    }
  }

  /**
   * Calculate top failures
   */
  private calculateTopFailures(results: TestResult[]): TestAnalytics['topFailures'] {
    const failureCounts = new Map<string, { count: number; lastFailure: number; name: string }>()
    
    results.filter(r => r.status === 'failed' || r.status === 'error').forEach(result => {
      const existing = failureCounts.get(result.id) || { count: 0, lastFailure: 0, name: result.name }
      existing.count++
      existing.lastFailure = Math.max(existing.lastFailure, result.timestamp)
      existing.name = result.name
      failureCounts.set(result.id, existing)
    })

    return Array.from(failureCounts.entries())
      .map(([testId, data]) => ({
        testId,
        testName: data.name,
        failureCount: data.count,
        lastFailure: data.lastFailure
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 10)
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(results: TestResult[]): TestAnalytics['performance'] {
    const testPerformance = new Map<string, { durations: number[]; name: string }>()
    
    results.forEach(result => {
      const existing = testPerformance.get(result.id) || { durations: [], name: result.name }
      existing.durations.push(result.duration)
      existing.name = result.name
      testPerformance.set(result.id, existing)
    })

    const performanceData = Array.from(testPerformance.entries()).map(([testId, data]) => {
      const durations = data.durations
      const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)
      
      return {
        testId,
        testName: data.name,
        averageDuration,
        maxDuration,
        minDuration
      }
    })

    const slowestTests = performanceData
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10)

    const fastestTests = performanceData
      .sort((a, b) => a.averageDuration - b.averageDuration)
      .slice(0, 10)

    return {
      slowestTests,
      fastestTests
    }
  }

  /**
   * Get execution logs
   */
  public async getExecutionLogs(sessionId: string, level?: string): Promise<ExecutionLog[]> {
    const logs = this.executionLogs.get(sessionId) || []
    
    if (level) {
      return logs.filter(log => log.level === level)
    }
    
    return logs
  }

  /**
   * Add execution log
   */
  public addExecutionLog(sessionId: string, level: ExecutionLog['level'], message: string, details?: any): void {
    const logs = this.executionLogs.get(sessionId) || []
    
    logs.push({
      timestamp: Date.now(),
      level,
      message,
      sessionId,
      details
    })
    
    this.executionLogs.set(sessionId, logs)
    
    // Keep only last 1000 logs per session
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000)
    }
  }

  /**
   * Clear old results and logs
   */
  public async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<{ results: number; logs: number }> {
    const cutoffTime = Date.now() - maxAge
    let clearedResults = 0
    let clearedLogs = 0

    // Clear old results (based on newest result timestamp in session)
    for (const [sessionId, results] of this.sessionResults.entries()) {
      const newestResult = Math.max(...results.map(r => r.timestamp))
      if (newestResult < cutoffTime) {
        this.sessionResults.delete(sessionId)
        clearedResults++
      }
    }

    // Clear old logs
    for (const [sessionId, logs] of this.executionLogs.entries()) {
      const filteredLogs = logs.filter(log => log.timestamp >= cutoffTime)
      if (filteredLogs.length !== logs.length) {
        if (filteredLogs.length === 0) {
          this.executionLogs.delete(sessionId)
          clearedLogs++
        } else {
          this.executionLogs.set(sessionId, filteredLogs)
        }
      }
    }

    // Clear analytics cache
    this.analyticsCache.clear()

    return { results: clearedResults, logs: clearedLogs }
  }

  /**
   * Export results
   */
  public async exportResults(sessionIds?: string[]): Promise<string> {
    const sessionsToExport = sessionIds || Array.from(this.sessionResults.keys())
    const exportData = {
      exportedAt: Date.now(),
      sessions: {} as Record<string, { results: TestResult[]; logs: ExecutionLog[] }>
    }

    for (const sessionId of sessionsToExport) {
      const results = this.sessionResults.get(sessionId) || []
      const logs = this.executionLogs.get(sessionId) || []
      
      exportData.sessions[sessionId] = { results, logs }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import results
   */
  public async importResults(exportData: string): Promise<number> {
    try {
      const data = JSON.parse(exportData)
      let importedSessions = 0

      for (const [sessionId, sessionData] of Object.entries(data.sessions as any)) {
        if (sessionData.results) {
          this.sessionResults.set(sessionId, sessionData.results)
        }
        if (sessionData.logs) {
          this.executionLogs.set(sessionId, sessionData.logs)
        }
        importedSessions++
      }

      // Clear analytics cache
      this.analyticsCache.clear()

      return importedSessions
    } catch (error) {
      throw new Error(`Failed to import results: ${error}`)
    }
  }
}