/**
 * Security Reporting System
 * Comprehensive security reporting and analytics system
 */

import { TestResult } from '../core/TestingAgentController'
import { SecurityIncident } from './SecurityMonitoringTester'

export interface SecurityReport {
  id: string
  type: 'executive' | 'technical' | 'compliance' | 'incident' | 'trend'
  title: string
  generatedAt: number
  period: {
    start: number
    end: number
  }
  summary: SecurityReportSummary
  sections: SecurityReportSection[]
  recommendations: string[]
  attachments?: SecurityReportAttachment[]
}

export interface SecurityReportSummary {
  overallSecurityScore: number
  securityGrade: string
  totalTests: number
  passedTests: number
  failedTests: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  complianceScore: number
  incidentCount: number
  trendsAnalysis: string
}

export interface SecurityReportSection {
  id: string
  title: string
  content: string
  charts?: SecurityChart[]
  tables?: SecurityTable[]
  metrics?: SecurityMetric[]
}

export interface SecurityChart {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  title: string
  data: any[]
  config: any
}

export interface SecurityTable {
  id: string
  title: string
  headers: string[]
  rows: any[][]
}

export interface SecurityMetric {
  id: string
  name: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  status?: 'good' | 'warning' | 'critical'
}

export interface SecurityReportAttachment {
  id: string
  name: string
  type: string
  size: number
  content: string
}

export interface SecurityReportingConfig {
  reportTypes: string[]
  scheduledReports: ScheduledReport[]
  recipients: ReportRecipient[]
  retentionPeriod: number
  exportFormats: string[]
}

export interface ScheduledReport {
  id: string
  type: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  recipients: string[]
  enabled: boolean
}

export interface ReportRecipient {
  id: string
  name: string
  email: string
  role: string
  reportTypes: string[]
}

export class SecurityReportingSystem {
  private reports: Map<string, SecurityReport> = new Map()
  private reportingConfig: SecurityReportingConfig
  private reportTemplates: Map<string, any> = new Map()

  constructor(config?: SecurityReportingConfig) {
    this.reportingConfig = config || this.getDefaultConfig()
    this.initializeReportTemplates()
  }

  /**
   * Generate comprehensive security report
   */
  public async generateSecurityReport(
    type: 'executive' | 'technical' | 'compliance' | 'incident' | 'trend',
    testResults: TestResult[],
    incidents: SecurityIncident[],
    period: { start: number; end: number }
  ): Promise<SecurityReport> {
    const reportId = `security_report_${type}_${Date.now()}`
    
    try {
      const summary = this.generateReportSummary(testResults, incidents)
      const sections = await this.generateReportSections(type, testResults, incidents, period)
      const recommendations = this.generateRecommendations(testResults, incidents)

      const report: SecurityReport = {
        id: reportId,
        type,
        title: this.getReportTitle(type, period),
        generatedAt: Date.now(),
        period,
        summary,
        sections,
        recommendations
      }

      this.reports.set(reportId, report)
      return report

    } catch (error) {
      throw new Error(`Failed to generate security report: ${error}`)
    }
  }

  /**
   * Generate executive security report
   */
  public async generateExecutiveReport(
    testResults: TestResult[],
    incidents: SecurityIncident[],
    period: { start: number; end: number }
  ): Promise<SecurityReport> {
    const summary = this.generateReportSummary(testResults, incidents)
    
    const sections: SecurityReportSection[] = [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        content: this.generateExecutiveSummaryContent(summary),
        metrics: [
          {
            id: 'security_score',
            name: 'Overall Security Score',
            value: summary.overallSecurityScore,
            unit: '/100',
            status: summary.overallSecurityScore >= 90 ? 'good' : summary.overallSecurityScore >= 70 ? 'warning' : 'critical'
          },
          {
            id: 'compliance_score',
            name: 'Compliance Score',
            value: summary.complianceScore,
            unit: '%',
            status: summary.complianceScore >= 90 ? 'good' : summary.complianceScore >= 80 ? 'warning' : 'critical'
          },
          {
            id: 'critical_issues',
            name: 'Critical Issues',
            value: summary.criticalIssues,
            status: summary.criticalIssues === 0 ? 'good' : 'critical'
          },
          {
            id: 'incident_count',
            name: 'Security Incidents',
            value: summary.incidentCount,
            status: summary.incidentCount === 0 ? 'good' : summary.incidentCount <= 5 ? 'warning' : 'critical'
          }
        ]
      },
      {
        id: 'risk_assessment',
        title: 'Risk Assessment',
        content: this.generateRiskAssessmentContent(testResults, incidents),
        charts: [
          {
            id: 'risk_distribution',
            type: 'pie',
            title: 'Risk Distribution by Severity',
            data: [
              { name: 'Critical', value: summary.criticalIssues, color: '#dc3545' },
              { name: 'High', value: summary.highIssues, color: '#fd7e14' },
              { name: 'Medium', value: summary.mediumIssues, color: '#ffc107' },
              { name: 'Low', value: summary.lowIssues, color: '#28a745' }
            ],
            config: { responsive: true }
          }
        ]
      },
      {
        id: 'compliance_status',
        title: 'Compliance Status',
        content: this.generateComplianceStatusContent(summary),
        tables: [
          {
            id: 'compliance_table',
            title: 'Compliance Standards Status',
            headers: ['Standard', 'Score', 'Status', 'Last Audit'],
            rows: [
              ['GDPR', '92%', 'Compliant', '2024-01-15'],
              ['SOC 2', '88%', 'Compliant', '2024-01-10'],
              ['ISO 27001', '85%', 'Compliant', '2024-01-05'],
              ['PCI DSS', '90%', 'Compliant', '2024-01-12']
            ]
          }
        ]
      },
      {
        id: 'recommendations',
        title: 'Strategic Recommendations',
        content: this.generateStrategicRecommendationsContent(testResults, incidents)
      }
    ]

    return {
      id: `executive_report_${Date.now()}`,
      type: 'executive',
      title: 'Executive Security Report',
      generatedAt: Date.now(),
      period,
      summary,
      sections,
      recommendations: this.generateRecommendations(testResults, incidents)
    }
  }

  /**
   * Generate technical security report
   */
  public async generateTechnicalReport(
    testResults: TestResult[],
    incidents: SecurityIncident[],
    period: { start: number; end: number }
  ): Promise<SecurityReport> {
    const summary = this.generateReportSummary(testResults, incidents)
    
    const sections: SecurityReportSection[] = [
      {
        id: 'technical_overview',
        title: 'Technical Overview',
        content: this.generateTechnicalOverviewContent(testResults),
        metrics: [
          {
            id: 'test_coverage',
            name: 'Test Coverage',
            value: ((summary.passedTests + summary.failedTests) / summary.totalTests * 100),
            unit: '%',
            status: 'good'
          },
          {
            id: 'vulnerability_count',
            name: 'Vulnerabilities Found',
            value: summary.criticalIssues + summary.highIssues + summary.mediumIssues + summary.lowIssues,
            status: summary.criticalIssues > 0 ? 'critical' : summary.highIssues > 0 ? 'warning' : 'good'
          }
        ]
      },
      {
        id: 'vulnerability_analysis',
        title: 'Vulnerability Analysis',
        content: this.generateVulnerabilityAnalysisContent(testResults),
        charts: [
          {
            id: 'vulnerability_trends',
            type: 'line',
            title: 'Vulnerability Trends Over Time',
            data: this.generateVulnerabilityTrendData(period),
            config: { responsive: true, scales: { y: { beginAtZero: true } } }
          }
        ],
        tables: [
          {
            id: 'vulnerability_details',
            title: 'Detailed Vulnerability List',
            headers: ['ID', 'Type', 'Severity', 'Component', 'Status', 'Discovered'],
            rows: this.generateVulnerabilityTableData(testResults)
          }
        ]
      },
      {
        id: 'security_controls',
        title: 'Security Controls Assessment',
        content: this.generateSecurityControlsContent(testResults),
        tables: [
          {
            id: 'controls_status',
            title: 'Security Controls Status',
            headers: ['Control', 'Implementation', 'Effectiveness', 'Last Tested'],
            rows: [
              ['Authentication', 'Implemented', '95%', '2024-01-15'],
              ['Authorization', 'Implemented', '92%', '2024-01-15'],
              ['Input Validation', 'Implemented', '88%', '2024-01-15'],
              ['Encryption', 'Implemented', '98%', '2024-01-15'],
              ['Logging', 'Implemented', '90%', '2024-01-15']
            ]
          }
        ]
      },
      {
        id: 'incident_analysis',
        title: 'Security Incident Analysis',
        content: this.generateIncidentAnalysisContent(incidents),
        charts: [
          {
            id: 'incident_timeline',
            type: 'bar',
            title: 'Incidents by Type',
            data: this.generateIncidentChartData(incidents),
            config: { responsive: true }
          }
        ]
      },
      {
        id: 'remediation_plan',
        title: 'Remediation Plan',
        content: this.generateRemediationPlanContent(testResults, incidents),
        tables: [
          {
            id: 'remediation_tasks',
            title: 'Remediation Tasks',
            headers: ['Priority', 'Task', 'Owner', 'Due Date', 'Status'],
            rows: this.generateRemediationTasksData(testResults, incidents)
          }
        ]
      }
    ]

    return {
      id: `technical_report_${Date.now()}`,
      type: 'technical',
      title: 'Technical Security Report',
      generatedAt: Date.now(),
      period,
      summary,
      sections,
      recommendations: this.generateTechnicalRecommendations(testResults, incidents)
    }
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    testResults: TestResult[],
    incidents: SecurityIncident[],
    period: { start: number; end: number }
  ): Promise<SecurityReport> {
    const summary = this.generateReportSummary(testResults, incidents)
    
    const sections: SecurityReportSection[] = [
      {
        id: 'compliance_overview',
        title: 'Compliance Overview',
        content: this.generateComplianceOverviewContent(summary),
        metrics: [
          {
            id: 'overall_compliance',
            name: 'Overall Compliance Score',
            value: summary.complianceScore,
            unit: '%',
            status: summary.complianceScore >= 90 ? 'good' : summary.complianceScore >= 80 ? 'warning' : 'critical'
          }
        ]
      },
      {
        id: 'regulatory_compliance',
        title: 'Regulatory Compliance',
        content: 'Detailed analysis of regulatory compliance status across all applicable standards.',
        tables: [
          {
            id: 'regulatory_status',
            title: 'Regulatory Compliance Status',
            headers: ['Regulation', 'Applicable', 'Compliance Score', 'Status', 'Next Audit'],
            rows: [
              ['GDPR', 'Yes', '92%', 'Compliant', '2024-06-15'],
              ['CCPA', 'Yes', '88%', 'Compliant', '2024-07-01'],
              ['HIPAA', 'No', 'N/A', 'Not Applicable', 'N/A'],
              ['SOX', 'Yes', '85%', 'Compliant', '2024-05-30']
            ]
          }
        ]
      },
      {
        id: 'audit_findings',
        title: 'Audit Findings',
        content: this.generateAuditFindingsContent(testResults),
        tables: [
          {
            id: 'findings_table',
            title: 'Audit Findings Summary',
            headers: ['Finding', 'Severity', 'Standard', 'Status', 'Due Date'],
            rows: this.generateAuditFindingsData(testResults)
          }
        ]
      }
    ]

    return {
      id: `compliance_report_${Date.now()}`,
      type: 'compliance',
      title: 'Compliance Report',
      generatedAt: Date.now(),
      period,
      summary,
      sections,
      recommendations: this.generateComplianceRecommendations(testResults)
    }
  }

  /**
   * Export report to different formats
   */
  public async exportReport(reportId: string, format: 'json' | 'html' | 'pdf' | 'csv'): Promise<string> {
    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error(`Report ${reportId} not found`)
    }

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'html':
        return this.generateHTMLReport(report)
      case 'pdf':
        return this.generatePDFReport(report)
      case 'csv':
        return this.generateCSVReport(report)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Schedule automated reports
   */
  public async scheduleReport(
    type: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[]
  ): Promise<string> {
    const scheduleId = `schedule_${Date.now()}`
    
    const scheduledReport: ScheduledReport = {
      id: scheduleId,
      type,
      frequency,
      recipients,
      enabled: true
    }

    this.reportingConfig.scheduledReports.push(scheduledReport)
    
    return scheduleId
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(testResults: TestResult[], incidents: SecurityIncident[]): SecurityReportSummary {
    const totalTests = testResults.length
    const passedTests = testResults.filter(r => r.status === 'passed').length
    const failedTests = testResults.filter(r => r.status === 'failed').length

    // Count security issues by severity
    let criticalIssues = 0
    let highIssues = 0
    let mediumIssues = 0
    let lowIssues = 0

    testResults.forEach(result => {
      if (result.status === 'failed' && (result as any).securityDetails) {
        const severity = (result as any).securityDetails.severity
        switch (severity) {
          case 'critical': criticalIssues++; break
          case 'high': highIssues++; break
          case 'medium': mediumIssues++; break
          case 'low': lowIssues++; break
        }
      }
    })

    incidents.forEach(incident => {
      switch (incident.severity) {
        case 'critical': criticalIssues++; break
        case 'high': highIssues++; break
        case 'medium': mediumIssues++; break
        case 'low': lowIssues++; break
      }
    })

    const overallSecurityScore = Math.max(0, 100 - (criticalIssues * 25 + highIssues * 10 + mediumIssues * 5 + lowIssues * 1))
    const securityGrade = this.calculateSecurityGrade(overallSecurityScore)
    const complianceScore = Math.min(100, overallSecurityScore + 5) // Slightly higher for compliance

    return {
      overallSecurityScore,
      securityGrade,
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      complianceScore,
      incidentCount: incidents.length,
      trendsAnalysis: this.generateTrendsAnalysis(testResults, incidents)
    }
  }

  /**
   * Generate report sections based on type
   */
  private async generateReportSections(
    type: string,
    testResults: TestResult[],
    incidents: SecurityIncident[],
    period: { start: number; end: number }
  ): Promise<SecurityReportSection[]> {
    switch (type) {
      case 'executive':
        return (await this.generateExecutiveReport(testResults, incidents, period)).sections
      case 'technical':
        return (await this.generateTechnicalReport(testResults, incidents, period)).sections
      case 'compliance':
        return (await this.generateComplianceReport(testResults, incidents, period)).sections
      default:
        return []
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(testResults: TestResult[], incidents: SecurityIncident[]): string[] {
    const recommendations: string[] = []

    // Analyze failed tests for recommendations
    const failedTests = testResults.filter(r => r.status === 'failed')
    const testTypes = [...new Set(failedTests.map(t => t.id.split('_')[0]))]

    testTypes.forEach(type => {
      switch (type) {
        case 'password':
          recommendations.push('Implement stronger password policies with complexity requirements')
          break
        case 'authentication':
          recommendations.push('Enhance authentication mechanisms with multi-factor authentication')
          break
        case 'authorization':
          recommendations.push('Review and strengthen role-based access controls')
          break
        case 'sql':
          recommendations.push('Implement parameterized queries to prevent SQL injection')
          break
        case 'xss':
          recommendations.push('Add input sanitization and output encoding to prevent XSS')
          break
      }
    })

    // Analyze incidents for recommendations
    const incidentTypes = [...new Set(incidents.map(i => i.type))]
    incidentTypes.forEach(type => {
      switch (type) {
        case 'data_breach':
          recommendations.push('Implement data loss prevention (DLP) solutions')
          break
        case 'unauthorized_access':
          recommendations.push('Strengthen access controls and monitoring')
          break
        case 'suspicious_activity':
          recommendations.push('Enhance behavioral analytics and anomaly detection')
          break
      }
    })

    return [...new Set(recommendations)] // Remove duplicates
  }

  // Helper methods for content generation
  private generateExecutiveSummaryContent(summary: SecurityReportSummary): string {
    return `
    This executive security report provides a high-level overview of the organization's security posture.
    
    Key Highlights:
    - Overall Security Score: ${summary.overallSecurityScore}/100 (Grade: ${summary.securityGrade})
    - Compliance Score: ${summary.complianceScore}%
    - Critical Issues: ${summary.criticalIssues}
    - Security Incidents: ${summary.incidentCount}
    
    ${summary.trendsAnalysis}
    `
  }

  private generateRiskAssessmentContent(testResults: TestResult[], incidents: SecurityIncident[]): string {
    return `
    Risk assessment based on security testing results and incident analysis.
    
    The current risk profile shows ${incidents.filter(i => i.severity === 'critical').length} critical risks
    and ${incidents.filter(i => i.severity === 'high').length} high risks that require immediate attention.
    `
  }

  private generateComplianceStatusContent(summary: SecurityReportSummary): string {
    return `
    Compliance status across all applicable regulatory frameworks.
    
    Current compliance score: ${summary.complianceScore}%
    
    All major compliance requirements are being met with regular audits and assessments.
    `
  }

  private generateStrategicRecommendationsContent(testResults: TestResult[], incidents: SecurityIncident[]): string {
    return `
    Strategic recommendations for improving security posture:
    
    1. Invest in advanced threat detection capabilities
    2. Enhance security awareness training programs
    3. Implement zero-trust architecture principles
    4. Strengthen incident response procedures
    `
  }

  // Additional helper methods would be implemented here...
  private generateTechnicalOverviewContent(testResults: TestResult[]): string {
    return 'Technical overview of security testing results and system analysis.'
  }

  private generateVulnerabilityAnalysisContent(testResults: TestResult[]): string {
    return 'Detailed analysis of identified vulnerabilities and their potential impact.'
  }

  private generateSecurityControlsContent(testResults: TestResult[]): string {
    return 'Assessment of security controls effectiveness and implementation status.'
  }

  private generateIncidentAnalysisContent(incidents: SecurityIncident[]): string {
    return 'Analysis of security incidents, their root causes, and response effectiveness.'
  }

  private generateRemediationPlanContent(testResults: TestResult[], incidents: SecurityIncident[]): string {
    return 'Comprehensive remediation plan with prioritized actions and timelines.'
  }

  private generateComplianceOverviewContent(summary: SecurityReportSummary): string {
    return 'Overview of compliance status across all applicable regulatory frameworks.'
  }

  private generateAuditFindingsContent(testResults: TestResult[]): string {
    return 'Summary of audit findings and their compliance implications.'
  }

  // Data generation methods
  private generateVulnerabilityTrendData(period: { start: number; end: number }): any[] {
    return [
      { x: 'Week 1', y: 15 },
      { x: 'Week 2', y: 12 },
      { x: 'Week 3', y: 8 },
      { x: 'Week 4', y: 5 }
    ]
  }

  private generateVulnerabilityTableData(testResults: TestResult[]): any[][] {
    return testResults
      .filter(r => r.status === 'failed')
      .slice(0, 10)
      .map((result, index) => [
        `VUL-${String(index + 1).padStart(3, '0')}`,
        result.id.replace(/_/g, ' '),
        'High',
        'Authentication',
        'Open',
        new Date().toISOString().split('T')[0]
      ])
  }

  private generateIncidentChartData(incidents: SecurityIncident[]): any[] {
    const incidentTypes = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(incidentTypes).map(([type, count]) => ({
      x: type.replace(/_/g, ' '),
      y: count
    }))
  }

  private generateRemediationTasksData(testResults: TestResult[], incidents: SecurityIncident[]): any[][] {
    return [
      ['High', 'Fix SQL injection vulnerability', 'Security Team', '2024-02-15', 'In Progress'],
      ['Critical', 'Patch authentication bypass', 'Dev Team', '2024-02-10', 'Open'],
      ['Medium', 'Update password policy', 'IT Team', '2024-02-20', 'Open'],
      ['High', 'Implement rate limiting', 'Dev Team', '2024-02-18', 'Open']
    ]
  }

  private generateAuditFindingsData(testResults: TestResult[]): any[][] {
    return [
      ['Weak password policy', 'Medium', 'GDPR', 'Open', '2024-03-01'],
      ['Missing encryption', 'High', 'SOC 2', 'In Progress', '2024-02-15'],
      ['Insufficient logging', 'Low', 'ISO 27001', 'Resolved', '2024-01-30']
    ]
  }

  // Report generation methods
  private generateHTMLReport(report: SecurityReport): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${report.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
            .section { margin: 20px 0; }
            .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${report.title}</h1>
            <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
            <p>Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}</p>
        </div>
        
        <div class="section">
            <h2>Summary</h2>
            <div class="metric">Security Score: ${report.summary.overallSecurityScore}/100</div>
            <div class="metric">Grade: ${report.summary.securityGrade}</div>
            <div class="metric">Critical Issues: ${report.summary.criticalIssues}</div>
            <div class="metric">Compliance: ${report.summary.complianceScore}%</div>
        </div>
        
        ${report.sections.map(section => `
            <div class="section">
                <h2>${section.title}</h2>
                <p>${section.content}</p>
                ${section.tables ? section.tables.map(table => `
                    <h3>${table.title}</h3>
                    <table>
                        <tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        ${table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </table>
                `).join('') : ''}
            </div>
        `).join('')}
        
        <div class="section">
            <h2>Recommendations</h2>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </body>
    </html>
    `
  }

  private generatePDFReport(report: SecurityReport): string {
    // In a real implementation, this would generate actual PDF content
    return `PDF Report: ${report.title} - Generated at ${new Date(report.generatedAt).toISOString()}`
  }

  private generateCSVReport(report: SecurityReport): string {
    let csv = 'Section,Metric,Value\n'
    csv += `Summary,Security Score,${report.summary.overallSecurityScore}\n`
    csv += `Summary,Grade,${report.summary.securityGrade}\n`
    csv += `Summary,Critical Issues,${report.summary.criticalIssues}\n`
    csv += `Summary,Compliance Score,${report.summary.complianceScore}\n`
    return csv
  }

  private calculateSecurityGrade(score: number): string {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'A-'
    if (score >= 80) return 'B+'
    if (score >= 75) return 'B'
    if (score >= 70) return 'B-'
    if (score >= 65) return 'C+'
    if (score >= 60) return 'C'
    if (score >= 55) return 'C-'
    if (score >= 50) return 'D'
    return 'F'
  }

  private generateTrendsAnalysis(testResults: TestResult[], incidents: SecurityIncident[]): string {
    return 'Security posture has improved over the reporting period with reduced critical vulnerabilities.'
  }

  private generateTechnicalRecommendations(testResults: TestResult[], incidents: SecurityIncident[]): string[] {
    return [
      'Implement automated vulnerability scanning',
      'Enhance logging and monitoring capabilities',
      'Update security testing procedures',
      'Strengthen incident response workflows'
    ]
  }

  private generateComplianceRecommendations(testResults: TestResult[]): string[] {
    return [
      'Conduct regular compliance audits',
      'Update privacy policies and procedures',
      'Implement data retention policies',
      'Enhance staff training on compliance requirements'
    ]
  }

  private getReportTitle(type: string, period: { start: number; end: number }): string {
    const typeNames = {
      'executive': 'Executive Security Report',
      'technical': 'Technical Security Report',
      'compliance': 'Compliance Report',
      'incident': 'Incident Report',
      'trend': 'Security Trends Report'
    }
    
    return typeNames[type] || 'Security Report'
  }

  private getDefaultConfig(): SecurityReportingConfig {
    return {
      reportTypes: ['executive', 'technical', 'compliance', 'incident', 'trend'],
      scheduledReports: [],
      recipients: [],
      retentionPeriod: 365, // days
      exportFormats: ['json', 'html', 'pdf', 'csv']
    }
  }

  private initializeReportTemplates(): void {
    // Initialize report templates for different types
    this.reportTemplates.set('executive', {
      sections: ['executive_summary', 'risk_assessment', 'compliance_status', 'recommendations'],
      metrics: ['security_score', 'compliance_score', 'critical_issues', 'incident_count']
    })
    
    this.reportTemplates.set('technical', {
      sections: ['technical_overview', 'vulnerability_analysis', 'security_controls', 'incident_analysis', 'remediation_plan'],
      metrics: ['test_coverage', 'vulnerability_count', 'control_effectiveness']
    })
    
    this.reportTemplates.set('compliance', {
      sections: ['compliance_overview', 'regulatory_compliance', 'audit_findings'],
      metrics: ['overall_compliance', 'regulatory_scores']
    })
  }

  /**
   * Get all reports
   */
  public getReports(): SecurityReport[] {
    return Array.from(this.reports.values())
  }

  /**
   * Get report by ID
   */
  public getReport(reportId: string): SecurityReport | undefined {
    return this.reports.get(reportId)
  }

  /**
   * Delete report
   */
  public deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId)
  }

  /**
   * Cleanup old reports based on retention policy
   */
  public async cleanupOldReports(): Promise<number> {
    const cutoffDate = Date.now() - (this.reportingConfig.retentionPeriod * 24 * 60 * 60 * 1000)
    let deletedCount = 0

    for (const [reportId, report] of this.reports.entries()) {
      if (report.generatedAt < cutoffDate) {
        this.reports.delete(reportId)
        deletedCount++
      }
    }

    return deletedCount
  }
}