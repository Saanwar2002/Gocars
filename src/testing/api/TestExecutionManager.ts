/**
 * Test Execution Manager
 * Manages test execution sessions and orchestrates test suite execution
 */

import { TestConfiguration, TestStatus, HealthStatus, TestResult } from '../core/TestingAgentController'
import { FirebaseTestSuite } from '../firebase/FirebaseTestSuite'
import { SecurityTestSuite } from '../security/SecurityTestSuite'

export interface ExecutionSession {
  sessionId: string
  configuration: TestConfiguration
  status: TestStatus
  startTime: number
  endTime?: number
  results: TestResult[]
  currentSuite?: string
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export interface ExecutionOptions {
  parallel?: boolean
  timeout?: number
  retryAttempts?: number
}

export class TestExecutionManager {
  private activeSessions: Map<string, ExecutionSession> = new Map()
  private availableTestSuites: Map<string, any> = new Map()

  constructor() {
    this.initializeTestSuites()
  }

  /**
   * Initialize available test suites
   */
  private initializeTestSuites(): void {
    this.availableTestSuites.set('firebase_test_suite', {
      id: 'firebase_test_suite',
      name: 'Firebase Integration Test Suite',
      description: 'Comprehensive testing of Firebase services',
      estimatedDuration: 120000, // 2 minutes
      dependencies: [],
      instance: new FirebaseTestSuite()
    })

    this.availableTestSuites.set('security_test_suite', {
      id: 'security_test_suite',
      name: 'Security Testing Suite',
      description: 'Comprehensive security validation and monitoring',
      estimatedDuration: 180000, // 3 minutes
      dependencies: [],
      instance: new SecurityTestSuite()
    })
  }

  /**
   * Start test execution
   */
  public async startExecution(
    configuration: TestConfiguration,
    options?: ExecutionOptions
  ): Promise<string> {
    const sessionId = this.generateSessionId()
    
    const session: ExecutionSession = {
      sessionId,
      configuration,
      status: 'running',
      startTime: Date.now(),
      results: [],
      progress: {
        completed: 0,
        total: configuration.testSuites.length,
        percentage: 0
      }
    }

    this.activeSessions.set(sessionId, session)

    // Start execution asynchronously
    this.executeTests(session, options).catch(error => {
      console.error(`Test execution failed for session ${sessionId}:`, error)
      session.status = 'failed'
      session.endTime = Date.now()
    })

    return sessionId
  }

  /**
   * Stop test execution
   */
  public async stopExecution(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (session.status === 'running') {
      session.status = 'stopped'
      session.endTime = Date.now()
    }
  }

  /**
   * Get execution status
   */
  public async getExecutionStatus(sessionId: string): Promise<TestStatus | null> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return null
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      progress: session.progress,
      currentSuite: session.currentSuite,
      results: session.results
    }
  }

  /**
   * Execute tests for a session
   */
  private async executeTests(session: ExecutionSession, options?: ExecutionOptions): Promise<void> {
    try {
      const { configuration } = session
      const timeout = options?.timeout || configuration.timeout || 300000 // 5 minutes default

      // Set timeout for entire execution
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test execution timeout')), timeout)
      })

      const executionPromise = this.runTestSuites(session, options)

      await Promise.race([executionPromise, timeoutPromise])

      session.status = 'completed'
      session.endTime = Date.now()
      session.progress.percentage = 100

    } catch (error) {
      session.status = 'failed'
      session.endTime = Date.now()
      
      // Add error result
      session.results.push({
        id: 'execution_error',
        name: 'Test Execution Error',
        status: 'error',
        duration: session.endTime - session.startTime,
        message: `Execution failed: ${error}`,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Run test suites
   */
  private async runTestSuites(session: ExecutionSession, options?: ExecutionOptions): Promise<void> {
    const { configuration } = session
    const parallel = options?.parallel || false

    if (parallel && configuration.testSuites.length > 1) {
      await this.runTestSuitesParallel(session, options)
    } else {
      await this.runTestSuitesSequential(session, options)
    }
  }

  /**
   * Run test suites sequentially
   */
  private async runTestSuitesSequential(session: ExecutionSession, options?: ExecutionOptions): Promise<void> {
    const { configuration } = session

    for (let i = 0; i < configuration.testSuites.length; i++) {
      if (session.status !== 'running') {
        break // Execution was stopped
      }

      const suiteId = configuration.testSuites[i]
      session.currentSuite = suiteId

      const suiteResults = await this.executeTestSuite(suiteId, configuration, options)
      session.results.push(...suiteResults)

      session.progress.completed = i + 1
      session.progress.percentage = Math.round((session.progress.completed / session.progress.total) * 100)
    }
  }

  /**
   * Run test suites in parallel
   */
  private async runTestSuitesParallel(session: ExecutionSession, options?: ExecutionOptions): Promise<void> {
    const { configuration } = session

    const suitePromises = configuration.testSuites.map(async (suiteId) => {
      if (session.status !== 'running') {
        return []
      }

      return await this.executeTestSuite(suiteId, configuration, options)
    })

    const allResults = await Promise.all(suitePromises)
    
    // Flatten results
    for (const suiteResults of allResults) {
      session.results.push(...suiteResults)
    }

    session.progress.completed = configuration.testSuites.length
    session.progress.percentage = 100
  }

  /**
   * Execute a single test suite
   */
  private async executeTestSuite(
    suiteId: string,
    configuration: TestConfiguration,
    options?: ExecutionOptions
  ): Promise<TestResult[]> {
    const suite = this.availableTestSuites.get(suiteId)
    if (!suite) {
      return [{
        id: `suite_not_found_${suiteId}`,
        name: `Test Suite Not Found: ${suiteId}`,
        status: 'error',
        duration: 0,
        message: `Test suite '${suiteId}' not found`,
        timestamp: Date.now()
      }]
    }

    try {
      const retryAttempts = options?.retryAttempts || configuration.retryAttempts || 1
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          // Setup test suite
          await suite.instance.setup()

          // Run tests
          const results = await suite.instance.runTests()

          // Cleanup
          await suite.instance.teardown()

          return results

        } catch (error) {
          lastError = error as Error
          console.warn(`Test suite ${suiteId} attempt ${attempt} failed:`, error)

          if (attempt < retryAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      // All attempts failed
      return [{
        id: `suite_execution_failed_${suiteId}`,
        name: `Test Suite Execution Failed: ${suite.name}`,
        status: 'error',
        duration: 0,
        message: `All ${retryAttempts} attempts failed. Last error: ${lastError?.message}`,
        timestamp: Date.now()
      }]

    } catch (error) {
      return [{
        id: `suite_error_${suiteId}`,
        name: `Test Suite Error: ${suite.name}`,
        status: 'error',
        duration: 0,
        message: `Test suite execution error: ${error}`,
        timestamp: Date.now()
      }]
    }
  }

  /**
   * Get health status
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    try {
      const activeSessionsCount = this.activeSessions.size
      const runningSessions = Array.from(this.activeSessions.values())
        .filter(s => s.status === 'running').length

      // Check if system is overloaded
      const maxConcurrentSessions = 10
      const isOverloaded = runningSessions >= maxConcurrentSessions

      return {
        status: isOverloaded ? 'unhealthy' : 'healthy',
        message: isOverloaded ? 
          'System overloaded with too many concurrent sessions' : 
          'Test execution manager is healthy',
        details: {
          activeSessionsCount,
          runningSessions,
          availableTestSuites: this.availableTestSuites.size,
          systemLoad: runningSessions / maxConcurrentSessions
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error}`,
        details: { error: error.toString() }
      }
    }
  }

  /**
   * Get available test suites
   */
  public async getAvailableTestSuites(): Promise<any[]> {
    return Array.from(this.availableTestSuites.values()).map(suite => ({
      id: suite.id,
      name: suite.name,
      description: suite.description,
      estimatedDuration: suite.estimatedDuration,
      dependencies: suite.dependencies
    }))
  }

  /**
   * Get execution session
   */
  public getExecutionSession(sessionId: string): ExecutionSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): ExecutionSession[] {
    return Array.from(this.activeSessions.values())
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleanup completed sessions
   */
  public async cleanupCompletedSessions(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffTime = Date.now() - maxAge
    let cleanedCount = 0

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.endTime && session.endTime < cutoffTime) {
        this.activeSessions.delete(sessionId)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}