/**
 * Testing Agent REST API
 * Provides REST endpoints for controlling and monitoring the testing agent
 */

import { TestResult, TestConfiguration, TestStatus, HealthStatus } from '../core/TestingAgentController'
import { TestExecutionManager } from './TestExecutionManager'
import { ConfigurationManager } from './ConfigurationManager'
import { ResultsManager } from './ResultsManager'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
  requestId: string
}

export interface TestExecutionRequest {
  configurationId?: string
  configuration?: TestConfiguration
  testSuites?: string[]
  options?: {
    parallel?: boolean
    timeout?: number
    retryAttempts?: number
  }
}

export interface TestExecutionResponse {
  sessionId: string
  status: TestStatus
  startTime: number
  estimatedDuration?: number
}

export class TestingAgentAPI {
  private executionManager: TestExecutionManager
  private configurationManager: ConfigurationManager
  private resultsManager: ResultsManager
  private activeSessions: Map<string, any> = new Map()

  constructor() {
    this.executionManager = new TestExecutionManager()
    this.configurationManager = new ConfigurationManager()
    this.resultsManager = new ResultsManager()
  }

  /**
   * Start test execution
   * POST /api/testing/execute
   */
  public async startTesting(request: TestExecutionRequest): Promise<APIResponse<TestExecutionResponse>> {
    const requestId = this.generateRequestId()
    
    try {
      let configuration: TestConfiguration

      if (request.configurationId) {
        const configResult = await this.configurationManager.getConfiguration(request.configurationId)
        if (!configResult) {
          return this.errorResponse('Configuration not found', requestId)
        }
        configuration = configResult
      } else if (request.configuration) {
        configuration = request.configuration
      } else {
        return this.errorResponse('Configuration or configurationId required', requestId)
      }

      const sessionId = await this.executionManager.startExecution(configuration, request.options)
      
      const response: TestExecutionResponse = {
        sessionId,
        status: 'running',
        startTime: Date.now(),
        estimatedDuration: this.estimateExecutionDuration(configuration)
      }

      this.activeSessions.set(sessionId, {
        startTime: Date.now(),
        configuration,
        status: 'running'
      })

      return this.successResponse(response, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to start testing: ${error}`, requestId)
    }
  }  /**

   * Stop test execution
   * POST /api/testing/stop/{sessionId}
   */
  public async stopTesting(sessionId: string): Promise<APIResponse<void>> {
    const requestId = this.generateRequestId()
    
    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) {
        return this.errorResponse('Session not found', requestId)
      }

      await this.executionManager.stopExecution(sessionId)
      
      session.status = 'stopped'
      session.endTime = Date.now()

      return this.successResponse(undefined, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to stop testing: ${error}`, requestId)
    }
  }

  /**
   * Get test execution status
   * GET /api/testing/status/{sessionId}
   */
  public async getTestStatus(sessionId: string): Promise<APIResponse<TestStatus>> {
    const requestId = this.generateRequestId()
    
    try {
      const status = await this.executionManager.getExecutionStatus(sessionId)
      if (!status) {
        return this.errorResponse('Session not found', requestId)
      }

      return this.successResponse(status, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get test status: ${error}`, requestId)
    }
  }

  /**
   * Get all active sessions
   * GET /api/testing/sessions
   */
  public async getActiveSessions(): Promise<APIResponse<any[]>> {
    const requestId = this.generateRequestId()
    
    try {
      const sessions = Array.from(this.activeSessions.entries()).map(([sessionId, session]) => ({
        sessionId,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime,
        configuration: {
          id: session.configuration.id,
          name: session.configuration.name,
          testSuites: session.configuration.testSuites
        }
      }))

      return this.successResponse(sessions, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get active sessions: ${error}`, requestId)
    }
  }

  /**
   * Create test configuration
   * POST /api/testing/configurations
   */
  public async createConfiguration(configuration: TestConfiguration): Promise<APIResponse<string>> {
    const requestId = this.generateRequestId()
    
    try {
      const configId = await this.configurationManager.createConfiguration(configuration)
      return this.successResponse(configId, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to create configuration: ${error}`, requestId)
    }
  }

  /**
   * Update test configuration
   * PUT /api/testing/configurations/{id}
   */
  public async updateConfiguration(id: string, updates: Partial<TestConfiguration>): Promise<APIResponse<void>> {
    const requestId = this.generateRequestId()
    
    try {
      await this.configurationManager.updateConfiguration(id, updates)
      return this.successResponse(undefined, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to update configuration: ${error}`, requestId)
    }
  }

  /**
   * Get test configuration
   * GET /api/testing/configurations/{id}
   */
  public async getConfiguration(id: string): Promise<APIResponse<TestConfiguration>> {
    const requestId = this.generateRequestId()
    
    try {
      const configuration = await this.configurationManager.getConfiguration(id)
      if (!configuration) {
        return this.errorResponse('Configuration not found', requestId)
      }
      return this.successResponse(configuration, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get configuration: ${error}`, requestId)
    }
  }

  /**
   * List all configurations
   * GET /api/testing/configurations
   */
  public async listConfigurations(): Promise<APIResponse<TestConfiguration[]>> {
    const requestId = this.generateRequestId()
    
    try {
      const configurations = await this.configurationManager.listConfigurations()
      return this.successResponse(configurations, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to list configurations: ${error}`, requestId)
    }
  }

  /**
   * Delete test configuration
   * DELETE /api/testing/configurations/{id}
   */
  public async deleteConfiguration(id: string): Promise<APIResponse<void>> {
    const requestId = this.generateRequestId()
    
    try {
      await this.configurationManager.deleteConfiguration(id)
      return this.successResponse(undefined, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to delete configuration: ${error}`, requestId)
    }
  } 
 /**
   * Get test results
   * GET /api/testing/results/{sessionId}
   */
  public async getTestResults(sessionId: string): Promise<APIResponse<TestResult[]>> {
    const requestId = this.generateRequestId()
    
    try {
      const results = await this.resultsManager.getResults(sessionId)
      if (!results) {
        return this.errorResponse('Results not found', requestId)
      }
      return this.successResponse(results, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get test results: ${error}`, requestId)
    }
  }

  /**
   * Generate test report
   * POST /api/testing/reports/{sessionId}
   */
  public async generateReport(sessionId: string, format: 'json' | 'html' | 'pdf'): Promise<APIResponse<string>> {
    const requestId = this.generateRequestId()
    
    try {
      const report = await this.resultsManager.generateReport(sessionId, format)
      if (!report) {
        return this.errorResponse('Failed to generate report', requestId)
      }
      return this.successResponse(report, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to generate report: ${error}`, requestId)
    }
  }

  /**
   * Get analytics data
   * GET /api/testing/analytics
   */
  public async getAnalytics(timeRange?: { start: number; end: number }): Promise<APIResponse<any>> {
    const requestId = this.generateRequestId()
    
    try {
      const analytics = await this.resultsManager.getAnalytics(timeRange)
      return this.successResponse(analytics, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get analytics: ${error}`, requestId)
    }
  }

  /**
   * Get system health status
   * GET /api/testing/health
   */
  public async getHealthStatus(): Promise<APIResponse<HealthStatus>> {
    const requestId = this.generateRequestId()
    
    try {
      const health = await this.executionManager.getHealthStatus()
      return this.successResponse(health, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get health status: ${error}`, requestId)
    }
  }

  /**
   * Get available test suites
   * GET /api/testing/suites
   */
  public async getAvailableTestSuites(): Promise<APIResponse<any[]>> {
    const requestId = this.generateRequestId()
    
    try {
      const suites = await this.executionManager.getAvailableTestSuites()
      return this.successResponse(suites, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get test suites: ${error}`, requestId)
    }
  }

  /**
   * Validate test configuration
   * POST /api/testing/configurations/validate
   */
  public async validateConfiguration(configuration: TestConfiguration): Promise<APIResponse<any>> {
    const requestId = this.generateRequestId()
    
    try {
      const validation = await this.configurationManager.validateConfiguration(configuration)
      return this.successResponse(validation, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to validate configuration: ${error}`, requestId)
    }
  }

  /**
   * Get test execution logs
   * GET /api/testing/logs/{sessionId}
   */
  public async getExecutionLogs(sessionId: string, level?: string): Promise<APIResponse<any[]>> {
    const requestId = this.generateRequestId()
    
    try {
      const logs = await this.resultsManager.getExecutionLogs(sessionId, level)
      return this.successResponse(logs, requestId)
    } catch (error) {
      return this.errorResponse(`Failed to get execution logs: ${error}`, requestId)
    }
  }

  /**
   * Helper methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private successResponse<T>(data: T, requestId: string): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
      requestId
    }
  }

  private errorResponse(error: string, requestId: string): APIResponse {
    return {
      success: false,
      error,
      timestamp: Date.now(),
      requestId
    }
  }

  private estimateExecutionDuration(configuration: TestConfiguration): number {
    // Estimate based on test suites and configuration
    const baseTime = 30000 // 30 seconds base
    const suiteTime = configuration.testSuites.length * 10000 // 10 seconds per suite
    const concurrencyFactor = configuration.concurrencyLevel > 1 ? 0.7 : 1
    
    return Math.round((baseTime + suiteTime) * concurrencyFactor)
  }

  /**
   * Cleanup inactive sessions
   */
  public async cleanupInactiveSessions(): Promise<void> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.endTime && session.endTime < cutoffTime) {
        this.activeSessions.delete(sessionId)
      }
    }
  }
}