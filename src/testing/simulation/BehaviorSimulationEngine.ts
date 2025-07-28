/**
 * Behavior Simulation Engine
 * Simulates realistic user journeys and behavior patterns for comprehensive testing
 */

import { VirtualUser, VirtualUserFactory, UserAction, UserState } from '../core/VirtualUserFactory'

export interface BookingScenario {
  id: string
  name: string
  description: string
  steps: ScenarioStep[]
  expectedDuration: number
  successCriteria: string[]
  failureConditions: string[]
}

export interface ScenarioStep {
  id: string
  name: string
  action: 'navigate' | 'click' | 'input' | 'wait' | 'verify' | 'api_call'
  target: string
  data?: any
  expectedDelay: number
  maxRetries: number
  optional: boolean
  conditions?: StepCondition[]
}

export interface StepCondition {
  type: 'state' | 'element' | 'api' | 'time'
  condition: string
  value: any
}

export interface SimulationResult {
  scenarioId: string
  userId: string
  startTime: Date
  endTime: Date
  status: 'completed' | 'failed' | 'timeout' | 'cancelled'
  completedSteps: number
  totalSteps: number
  errors: SimulationError[]
  performanceMetrics: PerformanceMetrics
  userActions: UserAction[]
}

export interface SimulationError {
  stepId: string
  timestamp: Date
  error: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: any
}

export interface PerformanceMetrics {
  totalDuration: number
  averageStepDuration: number
  apiCallCount: number
  averageApiResponseTime: number
  pageLoadTimes: number[]
  interactionDelays: number[]
}

export interface ConcurrentSimulationConfig {
  maxConcurrentUsers: number
  userSpawnRate: number // users per second
  rampUpDuration: number // seconds
  sustainDuration: number // seconds
  rampDownDuration: number // seconds
  scenarios: BookingScenario[]
  userDistribution: {
    new: number
    regular: number
    power: number
  }
}

export class BehaviorSimulationEngine {
  private activeSimulations: Map<string, SimulationResult> = new Map()
  private concurrentUsers: Map<string, VirtualUser> = new Map()
  private scenarios: Map<string, BookingScenario> = new Map()
  private isRunning: boolean = false

  constructor() {
    this.initializeDefaultScenarios()
  }

  /**
   * Initialize default booking scenarios
   */
  private initializeDefaultScenarios(): void {
    // Simple booking scenario
    const simpleBooking: BookingScenario = {
      id: 'simple_booking',
      name: 'Simple Ride Booking',
      description: 'Basic ride booking flow from pickup to destination',
      expectedDuration: 120000, // 2 minutes
      successCriteria: [
        'User successfully logs in',
        'Pickup location is set',
        'Destination is set',
        'Ride is booked',
        'Driver is matched',
        'Payment is processed'
      ],
      failureConditions: [
        'Login fails after 3 attempts',
        'No drivers available',
        'Payment processing fails',
        'Timeout exceeded'
      ],
      steps: [
        {
          id: 'navigate_home',
          name: 'Navigate to Home Page',
          action: 'navigate',
          target: '/',
          expectedDelay: 2000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'click_login',
          name: 'Click Login Button',
          action: 'click',
          target: '[data-testid="login-button"]',
          expectedDelay: 500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'input_email',
          name: 'Enter Email',
          action: 'input',
          target: '[data-testid="email-input"]',
          data: { value: 'test@example.com' },
          expectedDelay: 1500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'input_password',
          name: 'Enter Password',
          action: 'input',
          target: '[data-testid="password-input"]',
          data: { value: 'password123' },
          expectedDelay: 1000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'submit_login',
          name: 'Submit Login Form',
          action: 'click',
          target: '[data-testid="login-submit"]',
          expectedDelay: 3000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'verify_login',
          name: 'Verify Login Success',
          action: 'verify',
          target: '[data-testid="user-dashboard"]',
          expectedDelay: 1000,
          maxRetries: 1,
          optional: false,
          conditions: [
            {
              type: 'state',
              condition: 'isLoggedIn',
              value: true
            }
          ]
        },
        {
          id: 'click_book_ride',
          name: 'Click Book Ride',
          action: 'click',
          target: '[data-testid="book-ride-button"]',
          expectedDelay: 500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_pickup',
          name: 'Set Pickup Location',
          action: 'input',
          target: '[data-testid="pickup-input"]',
          data: { value: 'Current Location' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_destination',
          name: 'Set Destination',
          action: 'input',
          target: '[data-testid="destination-input"]',
          data: { value: 'Airport Terminal 1' },
          expectedDelay: 2500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'select_vehicle',
          name: 'Select Vehicle Type',
          action: 'click',
          target: '[data-testid="vehicle-standard"]',
          expectedDelay: 1000,
          maxRetries: 2,
          optional: true
        },
        {
          id: 'confirm_booking',
          name: 'Confirm Booking',
          action: 'click',
          target: '[data-testid="confirm-booking"]',
          expectedDelay: 5000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'verify_booking',
          name: 'Verify Booking Created',
          action: 'verify',
          target: '[data-testid="booking-confirmation"]',
          expectedDelay: 2000,
          maxRetries: 3,
          optional: false,
          conditions: [
            {
              type: 'state',
              condition: 'hasActiveBooking',
              value: true
            }
          ]
        }
      ]
    }

    // Multi-stop booking scenario
    const multiStopBooking: BookingScenario = {
      id: 'multi_stop_booking',
      name: 'Multi-Stop Ride Booking',
      description: 'Complex booking with multiple stops and route optimization',
      expectedDuration: 180000, // 3 minutes
      successCriteria: [
        'User successfully logs in',
        'Multiple stops are added',
        'Route is optimized',
        'Booking is confirmed',
        'Driver accepts multi-stop ride'
      ],
      failureConditions: [
        'Route optimization fails',
        'Too many stops added',
        'Driver rejects multi-stop ride'
      ],
      steps: [
        {
          id: 'navigate_home',
          name: 'Navigate to Home Page',
          action: 'navigate',
          target: '/',
          expectedDelay: 2000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'login_flow',
          name: 'Complete Login Flow',
          action: 'api_call',
          target: '/api/auth/login',
          data: { email: 'test@example.com', password: 'password123' },
          expectedDelay: 3000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'click_multi_stop',
          name: 'Click Multi-Stop Booking',
          action: 'click',
          target: '[data-testid="multi-stop-booking"]',
          expectedDelay: 500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'add_stop_1',
          name: 'Add First Stop',
          action: 'input',
          target: '[data-testid="stop-input-0"]',
          data: { value: 'Shopping Mall' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'add_stop_2',
          name: 'Add Second Stop',
          action: 'click',
          target: '[data-testid="add-stop-button"]',
          expectedDelay: 1000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_stop_2',
          name: 'Set Second Stop Location',
          action: 'input',
          target: '[data-testid="stop-input-1"]',
          data: { value: 'Office Building' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'add_final_destination',
          name: 'Set Final Destination',
          action: 'input',
          target: '[data-testid="destination-input"]',
          data: { value: 'Home Address' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'optimize_route',
          name: 'Optimize Route',
          action: 'click',
          target: '[data-testid="optimize-route"]',
          expectedDelay: 3000,
          maxRetries: 2,
          optional: true
        },
        {
          id: 'confirm_multi_stop',
          name: 'Confirm Multi-Stop Booking',
          action: 'click',
          target: '[data-testid="confirm-multi-stop"]',
          expectedDelay: 5000,
          maxRetries: 3,
          optional: false
        }
      ]
    }

    // Group booking scenario
    const groupBooking: BookingScenario = {
      id: 'group_booking',
      name: 'Group Ride Booking',
      description: 'Booking a ride for multiple passengers with cost splitting',
      expectedDuration: 240000, // 4 minutes
      successCriteria: [
        'Group is created',
        'Members are invited',
        'Cost splitting is configured',
        'All members confirm',
        'Group booking is successful'
      ],
      failureConditions: [
        'Member invitation fails',
        'Cost splitting disagreement',
        'Group booking timeout'
      ],
      steps: [
        {
          id: 'navigate_home',
          name: 'Navigate to Home Page',
          action: 'navigate',
          target: '/',
          expectedDelay: 2000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'login_flow',
          name: 'Complete Login Flow',
          action: 'api_call',
          target: '/api/auth/login',
          data: { email: 'test@example.com', password: 'password123' },
          expectedDelay: 3000,
          maxRetries: 3,
          optional: false
        },
        {
          id: 'click_group_booking',
          name: 'Click Group Booking',
          action: 'click',
          target: '[data-testid="group-booking-button"]',
          expectedDelay: 500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'create_group',
          name: 'Create New Group',
          action: 'click',
          target: '[data-testid="create-group"]',
          expectedDelay: 1000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_group_name',
          name: 'Set Group Name',
          action: 'input',
          target: '[data-testid="group-name-input"]',
          data: { value: 'Weekend Trip Group' },
          expectedDelay: 1500,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'invite_members',
          name: 'Invite Group Members',
          action: 'input',
          target: '[data-testid="invite-email-input"]',
          data: { value: 'friend1@example.com,friend2@example.com' },
          expectedDelay: 3000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_cost_splitting',
          name: 'Configure Cost Splitting',
          action: 'click',
          target: '[data-testid="equal-split-option"]',
          expectedDelay: 1000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_pickup_location',
          name: 'Set Group Pickup Location',
          action: 'input',
          target: '[data-testid="group-pickup-input"]',
          data: { value: 'Central Meeting Point' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'set_destination',
          name: 'Set Group Destination',
          action: 'input',
          target: '[data-testid="group-destination-input"]',
          data: { value: 'Event Venue' },
          expectedDelay: 2000,
          maxRetries: 2,
          optional: false
        },
        {
          id: 'confirm_group_booking',
          name: 'Confirm Group Booking',
          action: 'click',
          target: '[data-testid="confirm-group-booking"]',
          expectedDelay: 5000,
          maxRetries: 3,
          optional: false
        }
      ]
    }

    this.scenarios.set(simpleBooking.id, simpleBooking)
    this.scenarios.set(multiStopBooking.id, multiStopBooking)
    this.scenarios.set(groupBooking.id, groupBooking)
  }

  /**
   * Run a single user scenario simulation
   */
  public async runScenarioSimulation(
    scenarioId: string,
    user: VirtualUser
  ): Promise<SimulationResult> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    const simulationResult: SimulationResult = {
      scenarioId,
      userId: user.id,
      startTime: new Date(),
      endTime: new Date(),
      status: 'failed',
      completedSteps: 0,
      totalSteps: scenario.steps.length,
      errors: [],
      performanceMetrics: {
        totalDuration: 0,
        averageStepDuration: 0,
        apiCallCount: 0,
        averageApiResponseTime: 0,
        pageLoadTimes: [],
        interactionDelays: []
      },
      userActions: []
    }

    this.activeSimulations.set(user.id, simulationResult)

    try {
      console.log(`Starting scenario simulation: ${scenario.name} for user ${user.id}`)

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i]
        const stepStartTime = Date.now()

        try {
          // Check step conditions
          if (step.conditions && !this.checkStepConditions(step.conditions, user)) {
            if (!step.optional) {
              throw new Error(`Step condition not met: ${step.name}`)
            }
            console.log(`Skipping optional step: ${step.name}`)
            continue
          }

          // Execute step with retries
          let success = false
          let lastError: string = ''

          for (let retry = 0; retry <= step.maxRetries && !success; retry++) {
            try {
              await this.executeStep(step, user)
              success = true
              simulationResult.completedSteps++
            } catch (error) {
              lastError = error instanceof Error ? error.message : String(error)
              if (retry < step.maxRetries) {
                console.log(`Step ${step.name} failed, retrying... (${retry + 1}/${step.maxRetries})`)
                await this.delay(1000) // Wait before retry
              }
            }
          }

          if (!success) {
            const simulationError: SimulationError = {
              stepId: step.id,
              timestamp: new Date(),
              error: lastError,
              severity: step.optional ? 'medium' : 'high',
              context: { step, user: user.currentState }
            }
            simulationResult.errors.push(simulationError)

            if (!step.optional) {
              throw new Error(`Critical step failed: ${step.name} - ${lastError}`)
            }
          }

          // Record performance metrics
          const stepDuration = Date.now() - stepStartTime
          simulationResult.performanceMetrics.interactionDelays.push(stepDuration)

          if (step.action === 'api_call') {
            simulationResult.performanceMetrics.apiCallCount++
          }

          if (step.action === 'navigate') {
            simulationResult.performanceMetrics.pageLoadTimes.push(stepDuration)
          }

        } catch (error) {
          const simulationError: SimulationError = {
            stepId: step.id,
            timestamp: new Date(),
            error: error instanceof Error ? error.message : String(error),
            severity: 'critical',
            context: { step, user: user.currentState }
          }
          simulationResult.errors.push(simulationError)
          break
        }
      }

      // Calculate final metrics
      simulationResult.endTime = new Date()
      simulationResult.performanceMetrics.totalDuration = 
        simulationResult.endTime.getTime() - simulationResult.startTime.getTime()
      
      if (simulationResult.performanceMetrics.interactionDelays.length > 0) {
        simulationResult.performanceMetrics.averageStepDuration = 
          simulationResult.performanceMetrics.interactionDelays.reduce((a, b) => a + b, 0) / 
          simulationResult.performanceMetrics.interactionDelays.length
      }

      // Determine final status
      if (simulationResult.completedSteps === scenario.steps.length) {
        simulationResult.status = 'completed'
      } else if (simulationResult.errors.some(e => e.severity === 'critical')) {
        simulationResult.status = 'failed'
      } else {
        simulationResult.status = 'completed' // Partial completion
      }

      simulationResult.userActions = [...user.actionHistory]

      console.log(`Scenario simulation completed: ${scenario.name} - Status: ${simulationResult.status}`)

    } catch (error) {
      simulationResult.status = 'failed'
      simulationResult.endTime = new Date()
      console.error(`Scenario simulation failed: ${error}`)
    } finally {
      this.activeSimulations.delete(user.id)
    }

    return simulationResult
  }

  /**
   * Execute a single scenario step
   */
  private async executeStep(step: ScenarioStep, user: VirtualUser): Promise<void> {
    const delay = VirtualUserFactory.getRealisticDelay(user, step.action)
    
    switch (step.action) {
      case 'navigate':
        await this.simulateNavigation(step, user)
        break
      case 'click':
        await this.simulateClick(step, user)
        break
      case 'input':
        await this.simulateInput(step, user)
        break
      case 'wait':
        await this.simulateWait(step, user)
        break
      case 'verify':
        await this.simulateVerification(step, user)
        break
      case 'api_call':
        await this.simulateApiCall(step, user)
        break
      default:
        throw new Error(`Unknown step action: ${step.action}`)
    }

    await this.delay(delay)
  }

  /**
   * Simulate navigation action
   */
  private async simulateNavigation(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} navigating to: ${step.target}`)
    
    VirtualUserFactory.recordAction(user, {
      type: 'navigation',
      target: step.target,
      duration: 2000,
      success: true
    })

    VirtualUserFactory.updateState(user, {
      currentPage: step.target
    })
  }

  /**
   * Simulate click action
   */
  private async simulateClick(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} clicking: ${step.target}`)
    
    // Simulate potential click failures based on user experience
    const failureRate = user.profile.demographics.experience === 'new' ? 0.1 : 0.02
    if (Math.random() < failureRate) {
      throw new Error(`Click failed on element: ${step.target}`)
    }

    VirtualUserFactory.recordAction(user, {
      type: 'click',
      target: step.target,
      data: step.data,
      duration: 500,
      success: true
    })
  }

  /**
   * Simulate input action
   */
  private async simulateInput(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} inputting data to: ${step.target}`)
    
    const inputValue = step.data?.value || ''
    const typingDelay = inputValue.length * 100 // Simulate typing speed
    
    VirtualUserFactory.recordAction(user, {
      type: 'input',
      target: step.target,
      data: step.data,
      duration: typingDelay,
      success: true
    })

    await this.delay(typingDelay)
  }

  /**
   * Simulate wait action
   */
  private async simulateWait(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} waiting: ${step.expectedDelay}ms`)
    
    VirtualUserFactory.recordAction(user, {
      type: 'wait',
      target: 'system',
      duration: step.expectedDelay,
      success: true
    })

    await this.delay(step.expectedDelay)
  }

  /**
   * Simulate verification action
   */
  private async simulateVerification(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} verifying: ${step.target}`)
    
    // Simulate verification logic
    const verificationSuccess = Math.random() > 0.05 // 95% success rate
    
    if (!verificationSuccess) {
      throw new Error(`Verification failed for: ${step.target}`)
    }

    VirtualUserFactory.recordAction(user, {
      type: 'click', // Verification is like checking an element
      target: step.target,
      duration: 1000,
      success: true
    })
  }

  /**
   * Simulate API call action
   */
  private async simulateApiCall(step: ScenarioStep, user: VirtualUser): Promise<void> {
    console.log(`User ${user.id} making API call to: ${step.target}`)
    
    // Simulate API response time
    const responseTime = 500 + Math.random() * 2000 // 500ms to 2.5s
    
    // Simulate API failure rate
    const failureRate = 0.05 // 5% failure rate
    if (Math.random() < failureRate) {
      throw new Error(`API call failed: ${step.target}`)
    }

    VirtualUserFactory.recordAction(user, {
      type: 'api_call',
      target: step.target,
      data: step.data,
      duration: responseTime,
      success: true
    })

    // Update user state based on API call
    if (step.target.includes('/auth/login')) {
      VirtualUserFactory.updateState(user, {
        isLoggedIn: true
      })
    } else if (step.target.includes('/booking')) {
      VirtualUserFactory.updateState(user, {
        hasActiveBooking: true,
        currentBookingId: `booking_${Date.now()}`
      })
    }

    await this.delay(responseTime)
  }

  /**
   * Check step conditions
   */
  private checkStepConditions(conditions: StepCondition[], user: VirtualUser): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'state':
          return (user.currentState as any)[condition.condition] === condition.value
        case 'element':
          // Simulate element existence check
          return Math.random() > 0.1 // 90% chance element exists
        case 'api':
          // Simulate API availability check
          return Math.random() > 0.05 // 95% chance API is available
        case 'time':
          // Check time-based conditions
          const currentHour = new Date().getHours()
          return currentHour >= condition.value.start && currentHour <= condition.value.end
        default:
          return true
      }
    })
  }

  /**
   * Run concurrent user simulations
   */
  public async runConcurrentSimulation(config: ConcurrentSimulationConfig): Promise<SimulationResult[]> {
    console.log('Starting concurrent simulation with config:', config)
    
    this.isRunning = true
    const results: SimulationResult[] = []
    const userPromises: Promise<SimulationResult>[] = []

    try {
      // Ramp up phase
      console.log('Ramp up phase starting...')
      await this.rampUpUsers(config, userPromises)

      // Sustain phase
      console.log('Sustain phase starting...')
      await this.delay(config.sustainDuration * 1000)

      // Ramp down phase
      console.log('Ramp down phase starting...')
      this.isRunning = false

      // Wait for all simulations to complete
      const allResults = await Promise.allSettled(userPromises)
      
      allResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Simulation failed:', result.reason)
        }
      })

      console.log(`Concurrent simulation completed. Total results: ${results.length}`)

    } catch (error) {
      console.error('Concurrent simulation error:', error)
      this.isRunning = false
    }

    return results
  }

  /**
   * Ramp up users gradually
   */
  private async rampUpUsers(
    config: ConcurrentSimulationConfig,
    userPromises: Promise<SimulationResult>[]
  ): Promise<void> {
    const totalUsers = config.maxConcurrentUsers
    const spawnInterval = 1000 / config.userSpawnRate // milliseconds between spawns
    const rampUpSteps = Math.ceil(config.rampUpDuration * config.userSpawnRate)
    const usersPerStep = Math.ceil(totalUsers / rampUpSteps)

    for (let step = 0; step < rampUpSteps && this.isRunning; step++) {
      const usersToSpawn = Math.min(usersPerStep, totalUsers - (step * usersPerStep))
      
      for (let i = 0; i < usersToSpawn; i++) {
        const userType = this.selectUserType(config.userDistribution)
        const user = VirtualUserFactory.createPassengerUser(userType)
        const scenario = this.selectRandomScenario(config.scenarios)
        
        this.concurrentUsers.set(user.id, user)
        
        const simulationPromise = this.runScenarioSimulation(scenario.id, user)
        userPromises.push(simulationPromise)
        
        // Small delay between user spawns
        if (i < usersToSpawn - 1) {
          await this.delay(spawnInterval / usersToSpawn)
        }
      }
      
      await this.delay(spawnInterval)
    }
  }

  /**
   * Select user type based on distribution
   */
  private selectUserType(distribution: { new: number; regular: number; power: number }): 'new' | 'regular' | 'power' {
    const rand = Math.random()
    const total = distribution.new + distribution.regular + distribution.power
    
    const newThreshold = distribution.new / total
    const regularThreshold = (distribution.new + distribution.regular) / total
    
    if (rand < newThreshold) return 'new'
    if (rand < regularThreshold) return 'regular'
    return 'power'
  }

  /**
   * Select random scenario from available scenarios
   */
  private selectRandomScenario(scenarios: BookingScenario[]): BookingScenario {
    return scenarios[Math.floor(Math.random() * scenarios.length)]
  }

  /**
   * Get simulation statistics
   */
  public getSimulationStatistics(results: SimulationResult[]): any {
    if (results.length === 0) {
      return {
        totalSimulations: 0,
        successRate: 0,
        averageDuration: 0,
        errorRate: 0
      }
    }

    const successful = results.filter(r => r.status === 'completed').length
    const totalDuration = results.reduce((sum, r) => sum + r.performanceMetrics.totalDuration, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

    return {
      totalSimulations: results.length,
      successRate: (successful / results.length) * 100,
      averageDuration: totalDuration / results.length,
      errorRate: (totalErrors / results.length) * 100,
      completionStats: {
        completed: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'failed').length,
        timeout: results.filter(r => r.status === 'timeout').length,
        cancelled: results.filter(r => r.status === 'cancelled').length
      },
      performanceMetrics: {
        averageApiCalls: results.reduce((sum, r) => sum + r.performanceMetrics.apiCallCount, 0) / results.length,
        averageApiResponseTime: this.calculateAverageApiResponseTime(results),
        averagePageLoadTime: this.calculateAveragePageLoadTime(results)
      }
    }
  }

  /**
   * Calculate average API response time across all simulations
   */
  private calculateAverageApiResponseTime(results: SimulationResult[]): number {
    const apiTimes = results.flatMap(r => 
      r.userActions
        .filter(action => action.type === 'api_call')
        .map(action => action.duration)
    )
    
    return apiTimes.length > 0 ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length : 0
  }

  /**
   * Calculate average page load time across all simulations
   */
  private calculateAveragePageLoadTime(results: SimulationResult[]): number {
    const loadTimes = results.flatMap(r => r.performanceMetrics.pageLoadTimes)
    return loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0
  }

  /**
   * Add custom scenario
   */
  public addScenario(scenario: BookingScenario): void {
    this.scenarios.set(scenario.id, scenario)
  }

  /**
   * Get all available scenarios
   */
  public getScenarios(): BookingScenario[] {
    return Array.from(this.scenarios.values())
  }

  /**
   * Stop all running simulations
   */
  public stopAllSimulations(): void {
    this.isRunning = false
    this.concurrentUsers.clear()
    this.activeSimulations.clear()
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}