/**
 * Mobile Test Runner
 * Orchestrates mobile testing across different devices and platforms
 */

import { MobileTestingFramework, MobileTestConfig, MobileDevice, MobileTestResult } from './MobileTestingFramework'
import { TestResult } from '../core/TestingAgentController'

export interface MobileTestRunnerConfig {
  devices: MobileDevice[]
  testSuites: string[]
  parallelExecution: boolean
  maxConcurrentDevices: number
  timeout: number
  retryAttempts: number
  screenshotOnFailure: boolean
  generateReport: boolean
  reportFormat: 'json' | 'html' | 'pdf'
}

export interface MobileTestSession {
  id: string
  startTime: number
  endTime?: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  deviceResults: Map<string, MobileTestResult[]>
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    errorTests: number
    skippedTests: number
    totalDuration: number
  }
}

export class MobileTestRunner {
  private framework: MobileTestingFramework
  private config: MobileTestRunnerConfig
  private currentSession?: MobileTestSession
  private isRunning: boolean = false

  constructor(config: MobileTestRunnerConfig) {
    this.config = config
    this.framework = new MobileTestingFramework()
  }

  /**
   * Initialize the mobile test runner
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Mobile Test Runner...')
    
    try {
      await this.framework.setup()
      console.log('Mobile Test Runner initialized successfully')
    } catch (error) {
      console.error('Mobile Test Runner initialization failed:', error)
      throw error
    }
  }

  /**
   * Start mobile testing session
   */
  public async startTestSession(): Promise<string> {
    if (this.isRunning) {
      throw new Error('Mobile test session is already running')
    }

    const sessionId = `mobile_session_${Date.now()}`
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      status: 'running',
      deviceResults: new Map(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        skippedTests: 0,
        totalDuration: 0
      }
    }

    this.isRunning = true
    console.log(`Started mobile test session: ${sessionId}`)
    
    return sessionId
  }

  /**
   * Run comprehensive mobile tests
   */
  public async runTests(): Promise<MobileTestSession> {
    if (!this.currentSession) {
      await this.startTestSession()
    }

    console.log('Starting comprehensive mobile testing...')

    try {
      // Get available devices
      const availableDevices = this.framework.getConnectedDevices()
      const targetDevices = this.filterTargetDevices(availableDevices)

      if (targetDevices.length === 0) {
        throw new Error('No target devices available for testing')
      }

      console.log(`Running tests on ${targetDevices.length} devices`)

      // Run tests on each device
      if (this.config.parallelExecution) {
        await this.runTestsInParallel(targetDevices)
      } else {
        await this.runTestsSequentially(targetDevices)
      }

      // Complete session
      this.completeSession()

    } catch (error) {
      console.error('Mobile testing failed:', error)
      this.failSession(error.toString())
    }

    return this.currentSession!
  }

  /**
   * Run tests in parallel across devices
   */
  private async runTestsInParallel(devices: MobileDevice[]): Promise<void> {
    const maxConcurrent = Math.min(this.config.maxConcurrentDevices, devices.length)
    const deviceChunks = this.chunkArray(devices, maxConcurrent)

    for (const chunk of deviceChunks) {
      const promises = chunk.map(device => this.runTestsOnDevice(device))
      await Promise.allSettled(promises)
    }
  }

  /**
   * Run tests sequentially across devices
   */
  private async runTestsSequentially(devices: MobileDevice[]): Promise<void> {
    for (const device of devices) {
      await this.runTestsOnDevice(device)
    }
  }

  /**
   * Run tests on a specific device
   */
  private async runTestsOnDevice(device: MobileDevice): Promise<void> {
    console.log(`Running tests on device: ${device.name} (${device.platform})`)

    try {
      // Configure framework for this device
      const testConfig: MobileTestConfig = {
        targetDevices: [device],
        testScenarios: this.generateTestScenarios(device),
        performanceThresholds: this.getPerformanceThresholds(device),
        networkConditions: ['5G', '4G', 'WiFi'],
        orientations: ['portrait', 'landscape'],
        timeout: this.config.timeout
      }

      // Run framework tests
      const results = await this.framework.runTests()
      
      // Process and store results
      const deviceResults = results as MobileTestResult[]
      this.currentSession!.deviceResults.set(device.id, deviceResults)
      
      // Update session summary
      this.updateSessionSummary(deviceResults)

      console.log(`Completed tests on device: ${device.name} - ${deviceResults.length} tests executed`)

    } catch (error) {
      console.error(`Tests failed on device ${device.name}:`, error)
      
      // Record device failure
      const failureResult: MobileTestResult = {
        id: `device_failure_${device.id}`,
        name: `Device Test Failure - ${device.name}`,
        status: 'error',
        duration: 0,
        message: `Device testing failed: ${error}`,
        deviceInfo: device,
        timestamp: Date.now()
      }
      
      this.currentSession!.deviceResults.set(device.id, [failureResult])
      this.updateSessionSummary([failureResult])
    }
  }

  /**
   * Generate test scenarios for a device
   */
  private generateTestScenarios(device: MobileDevice) {
    return [
      {
        id: 'app_launch_scenario',
        name: 'App Launch and Navigation',
        description: 'Test app launch performance and basic navigation',
        steps: [
          { id: 'launch_app', type: 'navigate' as const, description: 'Launch application' },
          { id: 'verify_home', type: 'verify' as const, description: 'Verify home screen loaded' },
          { id: 'navigate_menu', type: 'tap' as const, target: 'menu_button', description: 'Open navigation menu' }
        ],
        expectedResults: [
          { id: 'app_launched', type: 'screen_loaded' as const, timeout: 5000 },
          { id: 'menu_visible', type: 'element_visible' as const, target: 'navigation_menu' }
        ],
        platforms: [device.platform]
      },
      {
        id: 'user_interaction_scenario',
        name: 'User Interaction Testing',
        description: 'Test various user interactions and gestures',
        steps: [
          { id: 'tap_button', type: 'tap' as const, target: 'primary_button', description: 'Tap primary button' },
          { id: 'scroll_list', type: 'scroll' as const, direction: 'down', description: 'Scroll through list' },
          { id: 'swipe_card', type: 'swipe' as const, direction: 'left', description: 'Swipe card left' }
        ],
        expectedResults: [
          { id: 'button_response', type: 'element_visible' as const, target: 'response_element' },
          { id: 'list_scrolled', type: 'element_visible' as const, target: 'list_item_5' }
        ],
        platforms: [device.platform]
      },
      {
        id: 'performance_scenario',
        name: 'Performance Testing',
        description: 'Test app performance under various conditions',
        steps: [
          { id: 'load_heavy_screen', type: 'navigate' as const, description: 'Navigate to data-heavy screen' },
          { id: 'measure_load_time', type: 'wait' as const, duration: 3000, description: 'Measure load time' },
          { id: 'interact_elements', type: 'tap' as const, target: 'interactive_element', description: 'Test responsiveness' }
        ],
        expectedResults: [
          { id: 'screen_loaded_fast', type: 'performance' as const, expectedValue: 3000, tolerance: 500 },
          { id: 'interaction_responsive', type: 'performance' as const, expectedValue: 200, tolerance: 100 }
        ],
        platforms: [device.platform]
      }
    ]
  }

  /**
   * Get performance thresholds for a device
   */
  private getPerformanceThresholds(device: MobileDevice) {
    // Adjust thresholds based on device capabilities
    const baseThresholds = {
      appLaunchTime: 3000,
      screenTransitionTime: 500,
      apiResponseTime: 2000,
      memoryUsage: 200,
      batteryDrain: 5
    }

    // Adjust for device performance
    const performanceFactor = device.memoryAvailable > 4000 ? 0.8 : 1.2
    
    return {
      appLaunchTime: Math.floor(baseThresholds.appLaunchTime * performanceFactor),
      screenTransitionTime: Math.floor(baseThresholds.screenTransitionTime * performanceFactor),
      apiResponseTime: Math.floor(baseThresholds.apiResponseTime * performanceFactor),
      memoryUsage: Math.floor(baseThresholds.memoryUsage * performanceFactor),
      batteryDrain: baseThresholds.batteryDrain
    }
  }

  /**
   * Filter devices based on configuration
   */
  private filterTargetDevices(availableDevices: MobileDevice[]): MobileDevice[] {
    if (this.config.devices.length === 0) {
      return availableDevices
    }

    return availableDevices.filter(device => 
      this.config.devices.some(targetDevice => 
        targetDevice.id === device.id || 
        (targetDevice.platform === device.platform && targetDevice.name === device.name)
      )
    )
  }

  /**
   * Update session summary with test results
   */
  private updateSessionSummary(results: MobileTestResult[]): void {
    if (!this.currentSession) return

    this.currentSession.summary.totalTests += results.length

    results.forEach(result => {
      switch (result.status) {
        case 'passed':
          this.currentSession!.summary.passedTests++
          break
        case 'failed':
          this.currentSession!.summary.failedTests++
          break
        case 'error':
          this.currentSession!.summary.errorTests++
          break
        case 'skipped':
          this.currentSession!.summary.skippedTests++
          break
      }
      
      this.currentSession!.summary.totalDuration += result.duration
    })
  }

  /**
   * Complete the current session
   */
  private completeSession(): void {
    if (!this.currentSession) return

    this.currentSession.endTime = Date.now()
    this.currentSession.status = 'completed'
    this.isRunning = false

    console.log(`Mobile test session completed: ${this.currentSession.id}`)
    console.log(`Total tests: ${this.currentSession.summary.totalTests}`)
    console.log(`Passed: ${this.currentSession.summary.passedTests}`)
    console.log(`Failed: ${this.currentSession.summary.failedTests}`)
    console.log(`Errors: ${this.currentSession.summary.errorTests}`)
    console.log(`Duration: ${this.currentSession.summary.totalDuration}ms`)
  }

  /**
   * Fail the current session
   */
  private failSession(error: string): void {
    if (!this.currentSession) return

    this.currentSession.endTime = Date.now()
    this.currentSession.status = 'failed'
    this.isRunning = false

    console.log(`Mobile test session failed: ${this.currentSession.id} - ${error}`)
  }

  /**
   * Cancel the current session
   */
  public async cancelSession(): Promise<void> {
    if (!this.currentSession || !this.isRunning) {
      return
    }

    this.currentSession.endTime = Date.now()
    this.currentSession.status = 'cancelled'
    this.isRunning = false

    console.log(`Mobile test session cancelled: ${this.currentSession.id}`)
  }

  /**
   * Get current session status
   */
  public getCurrentSession(): MobileTestSession | undefined {
    return this.currentSession
  }

  /**
   * Get test results for a specific device
   */
  public getDeviceResults(deviceId: string): MobileTestResult[] {
    if (!this.currentSession) return []
    return this.currentSession.deviceResults.get(deviceId) || []
  }

  /**
   * Get all test results
   */
  public getAllResults(): MobileTestResult[] {
    if (!this.currentSession) return []
    
    const allResults: MobileTestResult[] = []
    this.currentSession.deviceResults.forEach(results => {
      allResults.push(...results)
    })
    
    return allResults
  }

  /**
   * Generate test report
   */
  public async generateReport(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No test session available for report generation')
    }

    const report = {
      sessionId: this.currentSession.id,
      startTime: new Date(this.currentSession.startTime).toISOString(),
      endTime: this.currentSession.endTime ? new Date(this.currentSession.endTime).toISOString() : null,
      status: this.currentSession.status,
      summary: this.currentSession.summary,
      deviceResults: {}
    }

    // Add device results to report
    this.currentSession.deviceResults.forEach((results, deviceId) => {
      report.deviceResults[deviceId] = results.map(result => ({
        id: result.id,
        name: result.name,
        status: result.status,
        duration: result.duration,
        message: result.message,
        deviceInfo: result.deviceInfo,
        performanceMetrics: result.performanceMetrics,
        timestamp: new Date(result.timestamp).toISOString()
      }))
    })

    return JSON.stringify(report, null, 2)
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Mobile Test Runner...')
    
    try {
      // Cancel any running session
      if (this.isRunning) {
        await this.cancelSession()
      }

      // Cleanup framework
      await this.framework.teardown()
      
      console.log('Mobile Test Runner shutdown completed')
    } catch (error) {
      console.error('Mobile Test Runner shutdown failed:', error)
      throw error
    }
  }

  /**
   * Utility method to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Get runner configuration
   */
  public getConfig(): MobileTestRunnerConfig {
    return { ...this.config }
  }

  /**
   * Update runner configuration
   */
  public updateConfig(newConfig: Partial<MobileTestRunnerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get connected devices
   */
  public getConnectedDevices(): MobileDevice[] {
    return this.framework.getConnectedDevices()
  }

  /**
   * Get framework health status
   */
  public getHealthStatus() {
    return this.framework.getHealthStatus()
  }
}