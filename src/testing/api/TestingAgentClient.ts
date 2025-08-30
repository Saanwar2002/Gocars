/**
 * Testing Agent Client SDK
 * TypeScript client for interacting with the Testing Agent REST API
 */

import { TestConfiguration, TestResult, TestStatus, HealthStatus } from '../core/TestingAgentController'
import { APIResponse, TestExecutionRequest, TestExecutionResponse } from './TestingAgentAPI'

export interface ClientConfig {
  baseUrl: string
  timeout?: number
  apiKey?: string
  retryAttempts?: number
}

export class TestingAgentClient {
  private baseUrl: string
  private timeout: number
  private apiKey?: string
  private retryAttempts: number

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = config.timeout || 30000
    this.apiKey = config.apiKey
    this.retryAttempts = config.retryAttempts || 3
  }

  /**
   * Start test execution
   */
  public async startTesting(request: TestExecutionRequest): Promise<TestExecutionResponse> {
    const response = await this.makeRequest<TestExecutionResponse>('POST', '/api/testing/execute', request)
    return response.data!
  }

  /**
   * Stop test execution
   */
  public async stopTesting(sessionId: string): Promise<void> {
    await this.makeRequest('POST', `/api/testing/stop/${sessionId}`)
  }

  /**
   * Get test execution status
   */
  public async getTestStatus(sessionId: string): Promise<TestStatus> {
    const response = await this.makeRequest<TestStatus>('GET', `/api/testing/status/${sessionId}`)
    return response.data!
  }

  /**
   * Get all active sessions
   */
  public async getActiveSessions(): Promise<any[]> {
    const response = await this.makeRequest<any[]>('GET', '/api/testing/sessions')
    return response.data!
  }

  /**
   * Create test configuration
   */
  public async createConfiguration(configuration: TestConfiguration): Promise<string> {
    const response = await this.makeRequest<string>('POST', '/api/testing/configurations', configuration)
    return response.data!
  }

  /**
   * Update test configuration
   */
  public async updateConfiguration(id: string, updates: Partial<TestConfiguration>): Promise<void> {
    await this.makeRequest('PUT', `/api/testing/configurations/${id}`, updates)
  }

  /**
   * Get test configuration
   */
  public async getConfiguration(id: string): Promise<TestConfiguration> {
    const response = await this.makeRequest<TestConfiguration>('GET', `/api/testing/configurations/${id}`)
    return response.data!
  }

  /**
   * List all configurations
   */
  public async listConfigurations(): Promise<TestConfiguration[]> {
    const response = await this.makeRequest<TestConfiguration[]>('GET', '/api/testing/configurations')
    return response.data!
  }

  /**
   * Delete test configuration
   */
  public async deleteConfiguration(id: string): Promise<void> {
    await this.makeRequest('DELETE', `/api/testing/configurations/${id}`)
  }

  /**
   * Validate test configuration
   */
  public async validateConfiguration(configuration: TestConfiguration): Promise<any> {
    const response = await this.makeRequest<any>('POST', '/api/testing/configurations/validate', configuration)
    return response.data!
  }

  /**
   * Get test results
   */
  public async getTestResults(sessionId: string): Promise<TestResult[]> {
    const response = await this.makeRequest<TestResult[]>('GET', `/api/testing/results/${sessionId}`)
    return response.data!
  }

  /**
   * Generate test report
   */
  public async generateReport(sessionId: string, format: 'json' | 'html' | 'pdf'): Promise<string> {
    const response = await this.makeRequest<string>('POST', `/api/testing/reports/${sessionId}`, { format })
    return response.data!
  }

  /**
   * Get analytics data
   */
  public async getAnalytics(timeRange?: { start: number; end: number }): Promise<any> {
    const queryParams = timeRange ? `?start=${timeRange.start}&end=${timeRange.end}` : ''
    const response = await this.makeRequest<any>('GET', `/api/testing/analytics${queryParams}`)
    return response.data!
  }

  /**
   * Get system health status
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const response = await this.makeRequest<HealthStatus>('GET', '/health')
    return response.data!
  }

  /**
   * Get available test suites
   */
  public async getAvailableTestSuites(): Promise<any[]> {
    const response = await this.makeRequest<any[]>('GET', '/api/testing/suites')
    return response.data!
  }

  /**
   * Get execution logs
   */
  public async getExecutionLogs(sessionId: string, level?: string): Promise<any[]> {
    const queryParams = level ? `?level=${level}` : ''
    const response = await this.makeRequest<any[]>('GET', `/api/testing/logs/${sessionId}${queryParams}`)
    return response.data!
  }

  /**
   * Wait for test completion
   */
  public async waitForCompletion(sessionId: string, pollInterval: number = 5000): Promise<TestStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getTestStatus(sessionId)
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
            resolve(status)
          } else {
            setTimeout(poll, pollInterval)
          }
        } catch (error) {
          reject(error)
        }
      }
      
      poll()
    })
  }

  /**
   * Run tests and wait for completion
   */
  public async runTestsAndWait(
    request: TestExecutionRequest,
    pollInterval: number = 5000
  ): Promise<{ status: TestStatus; results: TestResult[] }> {
    const execution = await this.startTesting(request)
    const status = await this.waitForCompletion(execution.sessionId, pollInterval)
    const results = await this.getTestResults(execution.sessionId)
    
    return { status, results }
  }

  /**
   * Create configuration from template
   */
  public async createConfigurationFromTemplate(
    templateName: string,
    overrides?: Partial<TestConfiguration>
  ): Promise<string> {
    const templates = {
      firebase_basic: {
        name: 'Firebase Basic Testing',
        environment: 'development' as const,
        testSuites: ['firebase_test_suite'],
        concurrencyLevel: 1,
        timeout: 120000,
        retryAttempts: 2,
        autoFixEnabled: false
      },
      security_comprehensive: {
        name: 'Comprehensive Security Testing',
        environment: 'staging' as const,
        testSuites: ['security_test_suite'],
        concurrencyLevel: 1,
        timeout: 300000,
        retryAttempts: 1,
        autoFixEnabled: false
      },
      full_integration: {
        name: 'Full Integration Testing',
        environment: 'staging' as const,
        testSuites: ['firebase_test_suite', 'security_test_suite'],
        concurrencyLevel: 2,
        timeout: 600000,
        retryAttempts: 2,
        autoFixEnabled: true
      }
    }

    const template = templates[templateName as keyof typeof templates]
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }

    const configuration: TestConfiguration = {
      id: `config_${Date.now()}`,
      ...template,
      userProfiles: [],
      reportingOptions: {
        formats: ['json'],
        includeDetails: true,
        includeLogs: false
      },
      notificationSettings: {
        onCompletion: false,
        onFailure: true,
        recipients: []
      },
      ...overrides
    }

    return await this.createConfiguration(configuration)
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const url = `${this.baseUrl}${path}`
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`
        }

        const options: RequestInit = {
          method,
          headers,
          signal: AbortSignal.timeout(this.timeout)
        }

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.body = JSON.stringify(body)
        }

        const response = await fetch(url, options)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`)
        }

        if (!data.success) {
          throw new Error(data.error || 'Request failed')
        }

        return data
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.retryAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts')
  }

  /**
   * Stream test execution progress
   */
  public async *streamTestProgress(sessionId: string, pollInterval: number = 2000): AsyncGenerator<TestStatus> {
    while (true) {
      try {
        const status = await this.getTestStatus(sessionId)
        yield status
        
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } catch (error) {
        console.error('Error streaming test progress:', error)
        break
      }
    }
  }

  /**
   * Batch operations
   */
  public async batchCreateConfigurations(configurations: TestConfiguration[]): Promise<string[]> {
    const promises = configurations.map(config => this.createConfiguration(config))
    return await Promise.all(promises)
  }

  public async batchDeleteConfigurations(configIds: string[]): Promise<void> {
    const promises = configIds.map(id => this.deleteConfiguration(id))
    await Promise.all(promises)
  }

  /**
   * Get client information
   */
  public getClientInfo(): { baseUrl: string; timeout: number; hasApiKey: boolean } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      hasApiKey: !!this.apiKey
    }
  }
}