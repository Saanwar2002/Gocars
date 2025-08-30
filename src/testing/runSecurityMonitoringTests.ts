/**
 * Security Monitoring Tests Runner
 * Executes comprehensive security monitoring and reporting tests
 */

import { SecurityMonitoringTester, SecurityMonitoringConfig } from './security/SecurityMonitoringTester'
import { SecurityReportingSystem } from './security/SecurityReportingSystem'
import { TestResult } from './core/TestingAgentController'

/**
 * Run security monitoring tests
 */
export async function runSecurityMonitoringTests(): Promise<void> {
  console.log('📊 Starting Security Monitoring Tests...')
  console.log('=' .repeat(60))

  const monitoringTester = new SecurityMonitoringTester()
  const reportingSystem = new SecurityReportingSystem()

  const config: SecurityMonitoringConfig = {
    monitoringDuration: 30000, // 30 seconds for testing
    alertThresholds: {
      failedLoginAttempts: 5,
      suspiciousRequests: 10,
      dataAccessViolations: 3,
      privilegeEscalationAttempts: 1
    },
    complianceChecks: ['GDPR', 'SOC2', 'ISO27001'],
    incidentResponseEnabled: true,
    timeout: 30000
  }

  try {
    // Run monitoring tests
    console.log('🔍 Running Security Monitoring Tests...')
    const monitoringResults = await monitoringTester.runSecurityMonitoringTests(config)

    // Display monitoring results
    console.log('\n📊 Security Monitoring Test Results:')
    console.log('-'.repeat(60))

    let passedTests = 0
    let failedTests = 0
    let errorTests = 0
    let skippedTests = 0

    monitoringResults.forEach((result, index) => {
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'error': '⚠️',
        'skipped': '⏭️'
      }[result.status] || '❓'

      console.log(`${statusIcon} ${result.name}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)

      if (result.monitoringDetails) {
        console.log(`   Monitoring Details:`)
        if (result.monitoringDetails.alertsGenerated !== undefined) {
          console.log(`     Alerts Generated: ${result.monitoringDetails.alertsGenerated}`)
        }
        if (result.monitoringDetails.incidentsDetected !== undefined) {
          console.log(`     Incidents Detected: ${result.monitoringDetails.incidentsDetected}`)
        }
        if (result.monitoringDetails.responseTime !== undefined) {
          console.log(`     Response Time: ${result.monitoringDetails.responseTime}ms`)
        }
        if (result.monitoringDetails.complianceScore !== undefined) {
          console.log(`     Compliance Score: ${result.monitoringDetails.complianceScore}%`)
        }
        if (result.monitoringDetails.monitoringEfficiency !== undefined) {
          console.log(`     Monitoring Efficiency: ${(result.monitoringDetails.monitoringEfficiency * 100).toFixed(1)}%`)
        }
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

    // Test reporting system
    console.log('📋 Testing Security Reporting System...')
    const reportingResults = await testReportingSystem(reportingSystem, monitoringResults)

    // Display reporting results
    console.log('\n📋 Security Reporting Test Results:')
    console.log('-'.repeat(60))

    reportingResults.forEach((result) => {
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'error': '⚠️',
        'skipped': '⏭️'
      }[result.status] || '❓'

      console.log(`${statusIcon} ${result.name}`)
      console.log(`   Duration: ${result.duration}ms`)
      console.log(`   Message: ${result.message}`)
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

    const totalTests = monitoringResults.length + reportingResults.length

    // Summary
    console.log('📈 Test Summary:')
    console.log('-'.repeat(60))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`⚠️  Errors: ${errorTests}`)
    console.log(`⏭️  Skipped: ${skippedTests}`)
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

    // Security monitoring specific summary
    const incidents = monitoringTester.getSecurityIncidents()
    const metrics = monitoringTester.getMonitoringMetrics()

    console.log('\n🛡️  Security Monitoring Summary:')
    console.log('-'.repeat(60))
    console.log(`Security Incidents Detected: ${incidents.length}`)
    console.log(`Critical Incidents: ${incidents.filter(i => i.severity === 'critical').length}`)
    console.log(`High Severity Incidents: ${incidents.filter(i => i.severity === 'high').length}`)
    console.log(`Medium Severity Incidents: ${incidents.filter(i => i.severity === 'medium').length}`)
    console.log(`Low Severity Incidents: ${incidents.filter(i => i.severity === 'low').length}`)

    if (incidents.length > 0) {
      const avgResponseTime = incidents
        .filter(i => i.responseTime)
        .reduce((sum, i) => sum + (i.responseTime || 0), 0) / incidents.filter(i => i.responseTime).length

      console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`)
    }

    // Display generated reports
    const reports = reportingSystem.getReports()
    if (reports.length > 0) {
      console.log('\n📊 Generated Reports:')
      console.log('-'.repeat(60))
      reports.forEach(report => {
        console.log(`📄 ${report.title} (${report.type})`)
        console.log(`   Generated: ${new Date(report.generatedAt).toLocaleString()}`)
        console.log(`   Security Score: ${report.summary.overallSecurityScore}/100`)
        console.log(`   Grade: ${report.summary.securityGrade}`)
        console.log(`   Recommendations: ${report.recommendations.length}`)
        console.log('')
      })
    }

    // Cleanup
    await monitoringTester.cleanup()

    console.log('📊 Security Monitoring Tests completed!')
    
    // Exit with appropriate code
    if (failedTests > 0 || errorTests > 0) {
      console.log('⚠️  Some security monitoring tests failed. Please review the results above.')
      process.exit(1)
    } else {
      console.log('✅ All security monitoring tests passed successfully!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Security monitoring tests failed:', error)
    
    try {
      await monitoringTester.cleanup()
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError)
    }
    
    process.exit(1)
  }
}

/**
 * Test the reporting system
 */
async function testReportingSystem(
  reportingSystem: SecurityReportingSystem,
  testResults: TestResult[]
): Promise<TestResult[]> {
  const results: TestResult[] = []
  const period = { start: Date.now() - 86400000, end: Date.now() } // Last 24 hours

  // Create mock incidents for testing
  const mockIncidents = [
    {
      id: 'incident_1',
      type: 'unauthorized_access',
      severity: 'high' as const,
      timestamp: Date.now() - 3600000,
      description: 'Unauthorized access attempt detected',
      source: 'security_monitoring',
      status: 'investigating' as const,
      responseTime: 300
    },
    {
      id: 'incident_2',
      type: 'suspicious_activity',
      severity: 'medium' as const,
      timestamp: Date.now() - 7200000,
      description: 'Suspicious user activity pattern',
      source: 'behavior_analysis',
      status: 'resolved' as const,
      responseTime: 600
    }
  ]

  // Test 1: Executive Report Generation
  try {
    const startTime = Date.now()
    const executiveReport = await reportingSystem.generateExecutiveReport(testResults, mockIncidents, period)
    
    results.push({
      id: 'executive_report_generation',
      name: 'Executive Report Generation',
      status: executiveReport ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      message: executiveReport ? 
        `Executive report generated successfully (Score: ${executiveReport.summary.overallSecurityScore}/100)` :
        'Failed to generate executive report',
      timestamp: Date.now()
    })
  } catch (error) {
    results.push({
      id: 'executive_report_generation',
      name: 'Executive Report Generation',
      status: 'error',
      duration: 0,
      message: `Executive report generation failed: ${error}`,
      timestamp: Date.now()
    })
  }

  // Test 2: Technical Report Generation
  try {
    const startTime = Date.now()
    const technicalReport = await reportingSystem.generateTechnicalReport(testResults, mockIncidents, period)
    
    results.push({
      id: 'technical_report_generation',
      name: 'Technical Report Generation',
      status: technicalReport ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      message: technicalReport ? 
        `Technical report generated successfully (${technicalReport.sections.length} sections)` :
        'Failed to generate technical report',
      timestamp: Date.now()
    })
  } catch (error) {
    results.push({
      id: 'technical_report_generation',
      name: 'Technical Report Generation',
      status: 'error',
      duration: 0,
      message: `Technical report generation failed: ${error}`,
      timestamp: Date.now()
    })
  }

  // Test 3: Compliance Report Generation
  try {
    const startTime = Date.now()
    const complianceReport = await reportingSystem.generateComplianceReport(testResults, mockIncidents, period)
    
    results.push({
      id: 'compliance_report_generation',
      name: 'Compliance Report Generation',
      status: complianceReport ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      message: complianceReport ? 
        `Compliance report generated successfully (Compliance: ${complianceReport.summary.complianceScore}%)` :
        'Failed to generate compliance report',
      timestamp: Date.now()
    })
  } catch (error) {
    results.push({
      id: 'compliance_report_generation',
      name: 'Compliance Report Generation',
      status: 'error',
      duration: 0,
      message: `Compliance report generation failed: ${error}`,
      timestamp: Date.now()
    })
  }

  // Test 4: Report Export Functionality
  const reports = reportingSystem.getReports()
  if (reports.length > 0) {
    const testReport = reports[0]
    const exportFormats = ['json', 'html', 'csv']

    for (const format of exportFormats) {
      try {
        const startTime = Date.now()
        const exportedContent = await reportingSystem.exportReport(testReport.id, format as any)
        
        results.push({
          id: `report_export_${format}`,
          name: `Report Export (${format.toUpperCase()})`,
          status: exportedContent && exportedContent.length > 0 ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          message: exportedContent ? 
            `Report exported to ${format.toUpperCase()} successfully (${exportedContent.length} characters)` :
            `Failed to export report to ${format.toUpperCase()}`,
          timestamp: Date.now()
        })
      } catch (error) {
        results.push({
          id: `report_export_${format}`,
          name: `Report Export (${format.toUpperCase()})`,
          status: 'error',
          duration: 0,
          message: `Report export to ${format.toUpperCase()} failed: ${error}`,
          timestamp: Date.now()
        })
      }
    }
  }

  // Test 5: Report Scheduling
  try {
    const startTime = Date.now()
    const scheduleId = await reportingSystem.scheduleReport('executive', 'weekly', ['admin@example.com'])
    
    results.push({
      id: 'report_scheduling',
      name: 'Report Scheduling',
      status: scheduleId ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      message: scheduleId ? 
        `Report scheduled successfully (ID: ${scheduleId})` :
        'Failed to schedule report',
      timestamp: Date.now()
    })
  } catch (error) {
    results.push({
      id: 'report_scheduling',
      name: 'Report Scheduling',
      status: 'error',
      duration: 0,
      message: `Report scheduling failed: ${error}`,
      timestamp: Date.now()
    })
  }

  // Test 6: Report Cleanup
  try {
    const startTime = Date.now()
    const deletedCount = await reportingSystem.cleanupOldReports()
    
    results.push({
      id: 'report_cleanup',
      name: 'Report Cleanup',
      status: 'passed',
      duration: Date.now() - startTime,
      message: `Report cleanup completed (${deletedCount} reports cleaned up)`,
      timestamp: Date.now()
    })
  } catch (error) {
    results.push({
      id: 'report_cleanup',
      name: 'Report Cleanup',
      status: 'error',
      duration: 0,
      message: `Report cleanup failed: ${error}`,
      timestamp: Date.now()
    })
  }

  return results
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityMonitoringTests()
}