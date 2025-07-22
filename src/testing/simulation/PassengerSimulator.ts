/**
 * Passenger Behavior Simulator
 * Simulates realistic passenger interactions and booking workflows
 */

import { VirtualUser, VirtualUserFactory, UserAction } from '../core/VirtualUserFactory'
import { TestResult } from '../core/TestingAgentController'

export interface BookingScenario {
  id: string
  name: string
  description: string
  steps: BookingStep[]
  expectedDuration: number
  successCriteria: string[]
}

export interface BookingStep {
  id: string
  action: 'navigate' | 'click' | 'input' | 'wait' | 'verify'
  target: string
  data?: any
  timeout: number
  required: boolean
}

export class PassengerSimulator {
  private user: VirtualUser
  private testResults: TestResult[] = []
  private currentScenario: BookingScenario | null = null

  constructor(experience: 'new' | 'regular' | 'power' = 'regular') {
    this.user = VirtualUserFactory.createPassengerUser(experience)
    console.log(`Created passenger simulator for user: ${this.user.id} (${experience})`)
  }

  /**
   * Run complete passenger testing suite
   */
  public async runCompleteTest(): Promise<TestResult[]> {
    console.log(`Starting complete passenger test for user: ${this.user.id}`)
    
    const scenarios = this.getTestScenarios()
    
    for (const scenario of scenarios) {
      try {
        console.log(`Running scenario: ${scenario.name}`)
        const result = await this.runScenario(scenario)
        this.testResults.push(result)
      } catch (error) {
        console.error(`Scenario failed: ${scenario.name}`, error)
        this.testResults.push({
          id: scenario.id,
          name: scenario.name,
          status: 'error',
          duration: 0,
          message: `Scenario execution failed: ${error}`,
          timestamp: Date.now()
        })
      }
    }

    return this.testResults
  }

  /**
   * Get all test scenarios for passengers
   */
  private getTestScenarios(): BookingScenario[] {
    return [
      {
        id: 'passenger_registration',
        name: 'Passenger Registration',
        description: 'Test passenger account creation and verification',
        expectedDuration: 60000, // 1 minute
        successCriteria: ['Account created', 'Email verified', 'Profile completed'],
        steps: [
          { id: 'nav_register', action: 'navigate', target: '/register', timeout: 5000, required: true },
          { id: 'input_email', action: 'input', target: '#email', data: this.generateEmail(), timeout: 2000, required: true },
          { id: 'input_password', action: 'input', target: '#password', data: 'TestPass123!', timeout: 2000, required: true },
          { id: 'input_name', action: 'input', target: '#fullName', data: this.generateName(), timeout: 2000, required: true },
          { id: 'input_phone', action: 'input', target: '#phone', data: this.generatePhone(), timeout: 2000, required: true },
          { id: 'click_register', action: 'click', target: '#registerButton', timeout: 5000, required: true },
          { id: 'verify_success', action: 'verify', target: '.success-message', timeout: 10000, required: true }
        ]
      },
      {
        id: 'passenger_login',
        name: 'Passenger Login',
        description: 'Test passenger authentication flow',
        expectedDuration: 30000, // 30 seconds
        successCriteria: ['Login successful', 'Dashboard accessible', 'User profile loaded'],
        steps: [
          { id: 'nav_login', action: 'navigate', target: '/login', timeout: 5000, required: true },
          { id: 'input_email', action: 'input', target: '#email', data: this.user.profile.id + '@test.com', timeout: 2000, required: true },
          { id: 'input_password', action: 'input', target: '#password', data: 'TestPass123!', timeout: 2000, required: true },
          { id: 'click_login', action: 'click', target: '#loginButton', timeout: 5000, required: true },
          { id: 'verify_dashboard', action: 'verify', target: '.dashboard', timeout: 10000, required: true }
        ]
      },
      {
        id: 'ride_booking_basic',
        name: 'Basic Ride Booking',
        description: 'Test standard ride booking workflow',
        expectedDuration: 120000, // 2 minutes
        successCriteria: ['Pickup location set', 'Destination set', 'Driver matched', 'Booking confirmed'],
        steps: [
          { id: 'nav_booking', action: 'navigate', target: '/book', timeout: 5000, required: true },
          { id: 'set_pickup', action: 'click', target: '#pickupLocation', timeout: 3000, required: true },
          { id: 'input_pickup', action: 'input', target: '#pickupInput', data: this.generateAddress(), timeout: 3000, required: true },
          { id: 'set_destination', action: 'click', target: '#destinationLocation', timeout: 3000, required: true },
          { id: 'input_destination', action: 'input', target: '#destinationInput', data: this.generateAddress(), timeout: 3000, required: true },
          { id: 'select_vehicle', action: 'click', target: '.vehicle-option:first-child', timeout: 2000, required: true },
          { id: 'confirm_booking', action: 'click', target: '#confirmBooking', timeout: 5000, required: true },
          { id: 'wait_driver', action: 'wait', target: '', timeout: 30000, required: true },
          { id: 'verify_booking', action: 'verify', target: '.booking-confirmed', timeout: 10000, required: true }
        ]
      },
      {
        id: 'ride_tracking',
        name: 'Real-time Ride Tracking',
        description: 'Test live tracking of ongoing ride',
        expectedDuration: 180000, // 3 minutes
        successCriteria: ['Driver location visible', 'ETA updated', 'Route displayed', 'Status updates received'],
        steps: [
          { id: 'nav_tracking', action: 'navigate', target: '/ride/current', timeout: 5000, required: true },
          { id: 'verify_map', action: 'verify', target: '.ride-map', timeout: 5000, required: true },
          { id: 'verify_driver_info', action: 'verify', target: '.driver-info', timeout: 3000, required: true },
          { id: 'verify_eta', action: 'verify', target: '.eta-display', timeout: 3000, required: true },
          { id: 'wait_updates', action: 'wait', target: '', timeout: 60000, required: false },
          { id: 'verify_status', action: 'verify', target: '.ride-status', timeout: 5000, required: true }
        ]
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing',
        description: 'Test payment method selection and processing',
        expectedDuration: 90000, // 1.5 minutes
        successCriteria: ['Payment method selected', 'Payment processed', 'Receipt generated'],
        steps: [
          { id: 'nav_payment', action: 'navigate', target: '/payment', timeout: 5000, required: true },
          { id: 'select_method', action: 'click', target: '.payment-method', timeout: 3000, required: true },
          { id: 'input_card', action: 'input', target: '#cardNumber', data: '4111111111111111', timeout: 3000, required: true },
          { id: 'input_expiry', action: 'input', target: '#expiryDate', data: '12/25', timeout: 2000, required: true },
          { id: 'input_cvv', action: 'input', target: '#cvv', data: '123', timeout: 2000, required: true },
          { id: 'process_payment', action: 'click', target: '#processPayment', timeout: 10000, required: true },
          { id: 'verify_success', action: 'verify', target: '.payment-success', timeout: 15000, required: true }
        ]
      },
      {
        id: 'notification_preferences',
        name: 'Notification Preferences',
        description: 'Test notification settings and preferences',
        expectedDuration: 60000, // 1 minute
        successCriteria: ['Settings accessible', 'Preferences updated', 'Changes saved'],
        steps: [
          { id: 'nav_settings', action: 'navigate', target: '/settings/notifications', timeout: 5000, required: true },
          { id: 'toggle_push', action: 'click', target: '#pushNotifications', timeout: 2000, required: true },
          { id: 'toggle_email', action: 'click', target: '#emailNotifications', timeout: 2000, required: true },
          { id: 'set_quiet_hours', action: 'click', target: '#quietHours', timeout: 2000, required: true },
          { id: 'save_settings', action: 'click', target: '#saveSettings', timeout: 5000, required: true },
          { id: 'verify_saved', action: 'verify', target: '.settings-saved', timeout: 5000, required: true }
        ]
      },
      {
        id: 'ride_history',
        name: 'Ride History Access',
        description: 'Test access to past rides and receipts',
        expectedDuration: 45000, // 45 seconds
        successCriteria: ['History loaded', 'Ride details accessible', 'Receipts downloadable'],
        steps: [
          { id: 'nav_history', action: 'navigate', target: '/rides/history', timeout: 5000, required: true },
          { id: 'verify_list', action: 'verify', target: '.ride-history-list', timeout: 5000, required: true },
          { id: 'click_ride', action: 'click', target: '.ride-item:first-child', timeout: 3000, required: true },
          { id: 'verify_details', action: 'verify', target: '.ride-details', timeout: 3000, required: true },
          { id: 'download_receipt', action: 'click', target: '#downloadReceipt', timeout: 5000, required: false }
        ]
      },
      {
        id: 'emergency_features',
        name: 'Emergency Features',
        description: 'Test emergency button and safety features',
        expectedDuration: 30000, // 30 seconds
        successCriteria: ['Emergency button accessible', 'Alert sent', 'Emergency contacts notified'],
        steps: [
          { id: 'nav_safety', action: 'navigate', target: '/safety', timeout: 5000, required: true },
          { id: 'verify_emergency', action: 'verify', target: '#emergencyButton', timeout: 3000, required: true },
          { id: 'test_emergency', action: 'click', target: '#testEmergency', timeout: 5000, required: true },
          { id: 'verify_alert', action: 'verify', target: '.emergency-alert', timeout: 10000, required: true }
        ]
      }
    ]
  }

  /**
   * Run a specific scenario
   */
  private async runScenario(scenario: BookingScenario): Promise<TestResult> {
    this.currentScenario = scenario
    const startTime = Date.now()
    const errors: string[] = []
    let completedSteps = 0

    console.log(`Starting scenario: ${scenario.name}`)

    try {
      for (const step of scenario.steps) {
        try {
          console.log(`Executing step: ${step.id}`)
          await this.executeStep(step)
          completedSteps++
          
          // Add realistic delay between steps
          const delay = VirtualUserFactory.getRealisticDelay(this.user, step.action)
          await this.wait(delay)
          
        } catch (error) {
          const errorMsg = `Step ${step.id} failed: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
          
          if (step.required) {
            throw new Error(`Required step failed: ${step.id}`)
          }
        }
      }

      const duration = Date.now() - startTime
      const success = errors.length === 0 || errors.length < scenario.steps.filter(s => s.required).length

      return {
        id: scenario.id,
        name: scenario.name,
        status: success ? 'passed' : 'failed',
        duration,
        message: success ? 'Scenario completed successfully' : `Scenario failed with ${errors.length} errors`,
        details: {
          completedSteps,
          totalSteps: scenario.steps.length,
          errors,
          successCriteria: scenario.successCriteria
        },
        timestamp: Date.now()
      }

    } catch (error) {
      const duration = Date.now() - startTime
      return {
        id: scenario.id,
        name: scenario.name,
        status: 'error',
        duration,
        message: `Scenario execution failed: ${error}`,
        details: {
          completedSteps,
          totalSteps: scenario.steps.length,
          errors: [...errors, String(error)]
        },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: BookingStep): Promise<void> {
    const startTime = Date.now()

    try {
      switch (step.action) {
        case 'navigate':
          await this.simulateNavigation(step.target)
          break
        case 'click':
          await this.simulateClick(step.target)
          break
        case 'input':
          await this.simulateInput(step.target, step.data)
          break
        case 'wait':
          await this.wait(step.timeout)
          break
        case 'verify':
          await this.simulateVerification(step.target)
          break
        default:
          throw new Error(`Unknown action: ${step.action}`)
      }

      const duration = Date.now() - startTime
      VirtualUserFactory.recordAction(this.user, {
        type: step.action,
        target: step.target,
        data: step.data,
        duration,
        success: true
      })

    } catch (error) {
      const duration = Date.now() - startTime
      VirtualUserFactory.recordAction(this.user, {
        type: step.action,
        target: step.target,
        data: step.data,
        duration,
        success: false,
        error: String(error)
      })
      throw error
    }
  }

  /**
   * Simulate navigation to a page
   */
  private async simulateNavigation(url: string): Promise<void> {
    console.log(`Navigating to: ${url}`)
    
    // Simulate network delay
    await this.wait(500 + Math.random() * 1000)
    
    // Update user state
    VirtualUserFactory.updateState(this.user, {
      currentPage: url
    })

    // Simulate page load verification
    if (Math.random() < 0.05) { // 5% chance of navigation failure
      throw new Error(`Navigation failed: ${url}`)
    }
  }

  /**
   * Simulate clicking an element
   */
  private async simulateClick(selector: string): Promise<void> {
    console.log(`Clicking: ${selector}`)
    
    // Simulate element finding and click delay
    await this.wait(200 + Math.random() * 300)
    
    // Simulate click failures (2% chance)
    if (Math.random() < 0.02) {
      throw new Error(`Element not clickable: ${selector}`)
    }
  }

  /**
   * Simulate input into a field
   */
  private async simulateInput(selector: string, value: any): Promise<void> {
    console.log(`Inputting into ${selector}: ${value}`)
    
    // Simulate typing delay based on value length
    const typingDelay = String(value).length * (50 + Math.random() * 100)
    await this.wait(typingDelay)
    
    // Simulate input validation failures (3% chance)
    if (Math.random() < 0.03) {
      throw new Error(`Input validation failed: ${selector}`)
    }
  }

  /**
   * Simulate verification of an element
   */
  private async simulateVerification(selector: string): Promise<void> {
    console.log(`Verifying: ${selector}`)
    
    // Simulate element search delay
    await this.wait(300 + Math.random() * 500)
    
    // Simulate verification failures (8% chance)
    if (Math.random() < 0.08) {
      throw new Error(`Element not found or verification failed: ${selector}`)
    }
  }

  /**
   * Wait for specified duration
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate test email
   */
  private generateEmail(): string {
    return `${this.user.id}@testuser.com`
  }

  /**
   * Generate test name
   */
  private generateName(): string {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa']
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson']
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    
    return `${firstName} ${lastName}`
  }

  /**
   * Generate test phone number
   */
  private generatePhone(): string {
    return `+44${Math.floor(Math.random() * 9000000000 + 1000000000)}`
  }

  /**
   * Generate test address
   */
  private generateAddress(): string {
    const streets = ['High Street', 'Main Road', 'Church Lane', 'Victoria Street', 'King Street']
    const numbers = Math.floor(Math.random() * 200) + 1
    const street = streets[Math.floor(Math.random() * streets.length)]
    
    return `${numbers} ${street}, ${this.user.profile.demographics.location}`
  }

  /**
   * Get user information
   */
  public getUser(): VirtualUser {
    return this.user
  }

  /**
   * Get test results
   */
  public getTestResults(): TestResult[] {
    return this.testResults
  }

  /**
   * Get current scenario
   */
  public getCurrentScenario(): BookingScenario | null {
    return this.currentScenario
  }
}