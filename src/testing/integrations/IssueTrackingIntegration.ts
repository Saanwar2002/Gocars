/**
 * Issue Tracking System Integration
 * Provides integration with issue tracking systems like Jira, GitHub Issues, etc.
 */

import { TestResult } from '../core/TestingAgentController'

export interface IssueTrackingConfig {
  provider: 'jira' | 'github' | 'gitlab' | 'azure-devops' | 'linear' | 'asana'
  apiUrl: string
  apiToken: string
  projectKey?: string
  repositoryUrl?: string
  defaultAssignee?: string
  labels: string[]
  autoCreateIssues: boolean
  autoCloseIssues: boolean
  issueTemplate: {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    issueType: string
  }
  filters: {
    minFailureCount: number
    excludePatterns: string[]
    includeOnlyPatterns: string[]
  }
}

export interface Issue {
  id: string
  key: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  reporter: string
  labels: string[]
  createdAt: number
  updatedAt: number
  resolvedAt?: number
  testFailures: TestFailure[]
  comments: IssueComment[]
  externalUrl?: string
}

export interface TestFailure {
  testId: string
  testName: string
  failureMessage: string
  stackTrace?: string
  timestamp: number
  buildNumber?: number
  environment?: string
  frequency: number
}

export interface IssueComment {
  id: string
  author: string
  content: string
  timestamp: number
  isSystemGenerated: boolean
}

export interface IssueMetrics {
  totalIssues: number
  openIssues: number
  resolvedIssues: number
  averageResolutionTime: number
  issuesByPriority: Record<string, number>
  issuesByStatus: Record<string, number>
  topFailingTests: Array<{
    testName: string
    failureCount: number
    lastFailure: number
  }>
}

export class IssueTrackingIntegration {
  private config: IssueTrackingConfig
  private issues: Map<string, Issue> = new Map()
  private testFailureHistory: Map<string, TestFailure[]> = new Map()
  private isInitialized: boolean = false

  constructor(config: IssueTrackingConfig) {
    this.config = config
  }

  /**
   * Initialize issue tracking integration
   */
  public async initialize(): Promise<void> {
    console.log(`Initializing Issue Tracking Integration for ${this.config.provider}...`)
    
    try {
      // Validate configuration
      await this.validateConfiguration()
      
      // Initialize provider-specific settings
      await this.initializeProvider()
      
      // Load existing issues
      await this.loadExistingIssues()
      
      this.isInitialized = true
      console.log('Issue Tracking Integration initialized successfully')
    } catch (error) {
      console.error('Issue Tracking Integration initialization failed:', error)
      throw error
    }
  }

  /**
   * Process test results and create/update issues
   */
  public async processTestResults(testResults: TestResult[]): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('Issue Tracking Integration not initialized')
    }

    console.log(`Processing ${testResults.length} test results for issue tracking...`)

    const createdIssues: string[] = []
    const failedTests = testResults.filter(r => r.status === 'failed' || r.status === 'error')

    try {
      for (const testResult of failedTests) {
        // Record test failure
        await this.recordTestFailure(testResult)
        
        // Check if we should create an issue
        if (await this.shouldCreateIssue(testResult)) {
          const issueId = await this.createIssueForTest(testResult)
          if (issueId) {
            createdIssues.push(issueId)
          }
        } else {
          // Update existing issue if it exists
          await this.updateExistingIssue(testResult)
        }
      }

      // Check for resolved issues (tests that are now passing)
      await this.checkForResolvedIssues(testResults)

      console.log(`Issue processing completed. Created ${createdIssues.length} new issues.`)
      return createdIssues

    } catch (error) {
      console.error('Failed to process test results for issue tracking:', error)
      throw error
    }
  }

  /**
   * Create a new issue for a test failure
   */
  public async createIssue(testResult: TestResult, customTitle?: string, customDescription?: string): Promise<string> {
    console.log(`Creating issue for test: ${testResult.name}`)

    try {
      const issue = await this.buildIssueFromTest(testResult, customTitle, customDescription)
      
      // Create issue in external system
      const externalIssue = await this.createExternalIssue(issue)
      issue.externalUrl = externalIssue.url
      issue.key = externalIssue.key
      
      // Store issue locally
      this.issues.set(issue.id, issue)
      
      console.log(`Issue created successfully: ${issue.key} (${issue.id})`)
      return issue.id

    } catch (error) {
      console.error(`Failed to create issue for test ${testResult.name}:`, error)
      throw error
    }
  }

  /**
   * Update an existing issue
   */
  public async updateIssue(issueId: string, updates: Partial<Issue>): Promise<void> {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    console.log(`Updating issue: ${issue.key}`)

    try {
      // Update local issue
      const updatedIssue = { ...issue, ...updates, updatedAt: Date.now() }
      this.issues.set(issueId, updatedIssue)
      
      // Update external issue
      await this.updateExternalIssue(updatedIssue)
      
      console.log(`Issue updated successfully: ${issue.key}`)

    } catch (error) {
      console.error(`Failed to update issue ${issue.key}:`, error)
      throw error
    }
  }

  /**
   * Close an issue
   */
  public async closeIssue(issueId: string, resolution?: string): Promise<void> {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    console.log(`Closing issue: ${issue.key}`)

    try {
      // Add resolution comment if provided
      if (resolution) {
        await this.addComment(issueId, resolution, true)
      }

      // Update issue status
      issue.status = 'resolved'
      issue.resolvedAt = Date.now()
      issue.updatedAt = Date.now()
      this.issues.set(issueId, issue)
      
      // Close external issue
      await this.closeExternalIssue(issue)
      
      console.log(`Issue closed successfully: ${issue.key}`)

    } catch (error) {
      console.error(`Failed to close issue ${issue.key}:`, error)
      throw error
    }
  }

  /**
   * Add comment to an issue
   */
  public async addComment(issueId: string, content: string, isSystemGenerated: boolean = false): Promise<string> {
    const issue = this.issues.get(issueId)
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`)
    }

    const comment: IssueComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: isSystemGenerated ? 'Testing Agent' : this.config.defaultAssignee || 'Unknown',
      content,
      timestamp: Date.now(),
      isSystemGenerated
    }

    try {
      // Add comment locally
      issue.comments.push(comment)
      issue.updatedAt = Date.now()
      this.issues.set(issueId, issue)
      
      // Add comment to external issue
      await this.addExternalComment(issue, comment)
      
      console.log(`Comment added to issue ${issue.key}: ${comment.id}`)
      return comment.id

    } catch (error) {
      console.error(`Failed to add comment to issue ${issue.key}:`, error)
      throw error
    }
  }

  /**
   * Get issue by ID
   */
  public getIssue(issueId: string): Issue | undefined {
    return this.issues.get(issueId)
  }

  /**
   * Get issues by status
   */
  public getIssuesByStatus(status: Issue['status']): Issue[] {
    return Array.from(this.issues.values()).filter(issue => issue.status === status)
  }

  /**
   * Get issues by test name
   */
  public getIssuesForTest(testName: string): Issue[] {
    return Array.from(this.issues.values()).filter(issue =>
      issue.testFailures.some(failure => failure.testName === testName)
    )
  }

  /**
   * Get issue metrics
   */
  public getIssueMetrics(): IssueMetrics {
    const allIssues = Array.from(this.issues.values())
    
    const metrics: IssueMetrics = {
      totalIssues: allIssues.length,
      openIssues: allIssues.filter(i => i.status === 'open' || i.status === 'in_progress').length,
      resolvedIssues: allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
      averageResolutionTime: 0,
      issuesByPriority: {},
      issuesByStatus: {},
      topFailingTests: []
    }

    // Calculate average resolution time
    const resolvedIssues = allIssues.filter(i => i.resolvedAt)
    if (resolvedIssues.length > 0) {
      const totalResolutionTime = resolvedIssues.reduce((sum, issue) => 
        sum + (issue.resolvedAt! - issue.createdAt), 0)
      metrics.averageResolutionTime = totalResolutionTime / resolvedIssues.length
    }

    // Group by priority
    allIssues.forEach(issue => {
      metrics.issuesByPriority[issue.priority] = (metrics.issuesByPriority[issue.priority] || 0) + 1
    })

    // Group by status
    allIssues.forEach(issue => {
      metrics.issuesByStatus[issue.status] = (metrics.issuesByStatus[issue.status] || 0) + 1
    })

    // Calculate top failing tests
    const testFailureCounts = new Map<string, { count: number; lastFailure: number }>()
    
    Array.from(this.testFailureHistory.values()).forEach(failures => {
      failures.forEach(failure => {
        const existing = testFailureCounts.get(failure.testName) || { count: 0, lastFailure: 0 }
        testFailureCounts.set(failure.testName, {
          count: existing.count + 1,
          lastFailure: Math.max(existing.lastFailure, failure.timestamp)
        })
      })
    })

    metrics.topFailingTests = Array.from(testFailureCounts.entries())
      .map(([testName, data]) => ({
        testName,
        failureCount: data.count,
        lastFailure: data.lastFailure
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 10)

    return metrics
  }

  // Private helper methods

  private async validateConfiguration(): Promise<void> {
    if (!this.config.apiUrl) {
      throw new Error('API URL is required')
    }
    
    if (!this.config.apiToken) {
      throw new Error('API token is required')
    }
    
    // Provider-specific validation
    switch (this.config.provider) {
      case 'jira':
        if (!this.config.projectKey) {
          throw new Error('Project key is required for Jira')
        }
        break
      case 'github':
        if (!this.config.repositoryUrl) {
          throw new Error('Repository URL is required for GitHub')
        }
        break
      // Add other provider validations as needed
    }
  }

  private async initializeProvider(): Promise<void> {
    console.log(`Initializing ${this.config.provider} specific settings...`)
    
    // Provider-specific initialization
    switch (this.config.provider) {
      case 'jira':
        await this.initializeJira()
        break
      case 'github':
        await this.initializeGitHub()
        break
      case 'gitlab':
        await this.initializeGitLab()
        break
      // Add other providers as needed
      default:
        console.log(`Provider ${this.config.provider} initialized with default settings`)
    }
  }

  private async initializeJira(): Promise<void> {
    console.log('Initializing Jira integration...')
    // Jira-specific initialization
  }

  private async initializeGitHub(): Promise<void> {
    console.log('Initializing GitHub Issues integration...')
    // GitHub-specific initialization
  }

  private async initializeGitLab(): Promise<void> {
    console.log('Initializing GitLab Issues integration...')
    // GitLab-specific initialization
  }

  private async loadExistingIssues(): Promise<void> {
    console.log('Loading existing issues...')
    
    // In a real implementation, this would fetch existing issues from the external system
    // For now, we'll just initialize empty collections
    this.issues.clear()
    this.testFailureHistory.clear()
  }

  private async recordTestFailure(testResult: TestResult): Promise<void> {
    const failure: TestFailure = {
      testId: testResult.id,
      testName: testResult.name,
      failureMessage: testResult.message || 'Test failed',
      stackTrace: testResult.error?.stack,
      timestamp: testResult.timestamp,
      environment: 'test', // This could be extracted from test context
      frequency: 1
    }

    // Add to failure history
    const existingFailures = this.testFailureHistory.get(testResult.name) || []
    existingFailures.push(failure)
    this.testFailureHistory.set(testResult.name, existingFailures)
  }

  private async shouldCreateIssue(testResult: TestResult): Promise<boolean> {
    // Check if auto-create is enabled
    if (!this.config.autoCreateIssues) {
      return false
    }

    // Check if issue already exists for this test
    const existingIssues = this.getIssuesForTest(testResult.name)
    const openIssues = existingIssues.filter(i => i.status === 'open' || i.status === 'in_progress')
    if (openIssues.length > 0) {
      return false
    }

    // Check failure frequency
    const failures = this.testFailureHistory.get(testResult.name) || []
    if (failures.length < this.config.filters.minFailureCount) {
      return false
    }

    // Check exclude patterns
    if (this.config.filters.excludePatterns.some(pattern => 
      new RegExp(pattern).test(testResult.name))) {
      return false
    }

    // Check include patterns (if specified)
    if (this.config.filters.includeOnlyPatterns.length > 0) {
      if (!this.config.filters.includeOnlyPatterns.some(pattern => 
        new RegExp(pattern).test(testResult.name))) {
        return false
      }
    }

    return true
  }

  private async createIssueForTest(testResult: TestResult): Promise<string | null> {
    try {
      return await this.createIssue(testResult)
    } catch (error) {
      console.error(`Failed to create issue for test ${testResult.name}:`, error)
      return null
    }
  }

  private async updateExistingIssue(testResult: TestResult): Promise<void> {
    const existingIssues = this.getIssuesForTest(testResult.name)
    const openIssues = existingIssues.filter(i => i.status === 'open' || i.status === 'in_progress')

    for (const issue of openIssues) {
      try {
        // Add new failure to issue
        const failure: TestFailure = {
          testId: testResult.id,
          testName: testResult.name,
          failureMessage: testResult.message || 'Test failed',
          stackTrace: testResult.error?.stack,
          timestamp: testResult.timestamp,
          environment: 'test',
          frequency: 1
        }

        issue.testFailures.push(failure)
        issue.updatedAt = Date.now()
        this.issues.set(issue.id, issue)

        // Add comment about new failure
        await this.addComment(issue.id, 
          `Test failed again: ${testResult.message || 'No message'}`, true)

      } catch (error) {
        console.error(`Failed to update existing issue ${issue.key}:`, error)
      }
    }
  }

  private async checkForResolvedIssues(testResults: TestResult[]): Promise<void> {
    if (!this.config.autoCloseIssues) {
      return
    }

    const passedTests = testResults.filter(r => r.status === 'passed')
    
    for (const testResult of passedTests) {
      const existingIssues = this.getIssuesForTest(testResult.name)
      const openIssues = existingIssues.filter(i => i.status === 'open' || i.status === 'in_progress')

      for (const issue of openIssues) {
        try {
          await this.closeIssue(issue.id, `Test is now passing: ${testResult.name}`)
        } catch (error) {
          console.error(`Failed to close resolved issue ${issue.key}:`, error)
        }
      }
    }
  }

  private async buildIssueFromTest(testResult: TestResult, customTitle?: string, customDescription?: string): Promise<Issue> {
    const failures = this.testFailureHistory.get(testResult.name) || []
    
    const issue: Issue = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: '', // Will be set when created in external system
      title: customTitle || this.config.issueTemplate.title.replace('{testName}', testResult.name),
      description: customDescription || this.buildIssueDescription(testResult, failures),
      status: 'open',
      priority: this.determinePriority(testResult, failures),
      assignee: this.config.defaultAssignee,
      reporter: 'Testing Agent',
      labels: [...this.config.labels, 'automated-test', 'test-failure'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      testFailures: failures,
      comments: []
    }

    return issue
  }

  private buildIssueDescription(testResult: TestResult, failures: TestFailure[]): string {
    let description = this.config.issueTemplate.description
    
    description = description.replace('{testName}', testResult.name)
    description = description.replace('{failureMessage}', testResult.message || 'No message')
    description = description.replace('{failureCount}', failures.length.toString())
    description = description.replace('{timestamp}', new Date(testResult.timestamp).toISOString())
    
    if (testResult.error?.stack) {
      description += `\n\n**Stack Trace:**\n\`\`\`\n${testResult.error.stack}\n\`\`\``
    }
    
    if (failures.length > 1) {
      description += `\n\n**Failure History:**\n`
      failures.slice(-5).forEach((failure, index) => {
        description += `${index + 1}. ${new Date(failure.timestamp).toISOString()}: ${failure.failureMessage}\n`
      })
    }
    
    return description
  }

  private determinePriority(testResult: TestResult, failures: TestFailure[]): Issue['priority'] {
    // Determine priority based on failure frequency and test importance
    if (failures.length >= 10) {
      return 'critical'
    } else if (failures.length >= 5) {
      return 'high'
    } else if (failures.length >= 2) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // External system integration methods (would be implemented for each provider)

  private async createExternalIssue(issue: Issue): Promise<{ key: string; url: string }> {
    // Mock implementation - in reality, this would call the external API
    const key = `TEST-${Math.floor(Math.random() * 10000)}`
    const url = `${this.config.apiUrl}/issues/${key}`
    
    console.log(`Created external issue: ${key}`)
    return { key, url }
  }

  private async updateExternalIssue(issue: Issue): Promise<void> {
    // Mock implementation - in reality, this would call the external API
    console.log(`Updated external issue: ${issue.key}`)
  }

  private async closeExternalIssue(issue: Issue): Promise<void> {
    // Mock implementation - in reality, this would call the external API
    console.log(`Closed external issue: ${issue.key}`)
  }

  private async addExternalComment(issue: Issue, comment: IssueComment): Promise<void> {
    // Mock implementation - in reality, this would call the external API
    console.log(`Added comment to external issue ${issue.key}: ${comment.content}`)
  }

  /**
   * Get integration configuration
   */
  public getConfig(): IssueTrackingConfig {
    return { ...this.config }
  }

  /**
   * Update integration configuration
   */
  public updateConfig(newConfig: Partial<IssueTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get integration health status
   */
  public getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string; details?: any } {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          message: 'Issue Tracking Integration not initialized'
        }
      }

      const metrics = this.getIssueMetrics()
      const openIssueRatio = metrics.totalIssues > 0 ? (metrics.openIssues / metrics.totalIssues) * 100 : 0

      return {
        status: openIssueRatio < 50 ? 'healthy' : 'unhealthy',
        message: `Issue Tracking Integration is ${openIssueRatio < 50 ? 'healthy' : 'unhealthy'}`,
        details: {
          provider: this.config.provider,
          totalIssues: metrics.totalIssues,
          openIssues: metrics.openIssues,
          openIssueRatio: `${openIssueRatio.toFixed(1)}%`,
          averageResolutionTime: `${(metrics.averageResolutionTime / (1000 * 60 * 60)).toFixed(1)} hours`
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Issue Tracking Integration health check failed: ${error}`,
        details: { error: error.toString() }
      }
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Issue Tracking Integration...')
    
    try {
      // Clear data
      this.issues.clear()
      this.testFailureHistory.clear()
      
      this.isInitialized = false
      console.log('Issue Tracking Integration shutdown completed')
      
    } catch (error) {
      console.error('Issue Tracking Integration shutdown failed:', error)
      throw error
    }
  }
}