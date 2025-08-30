/**
 * Test Data Service
 * High-level service for managing test data generation and cleanup
 */

import { TestDataManager, TestDataEnvironment } from './TestDataManager'
import { TestDataGenerator, UserProfile, VehicleData, BookingData, PaymentData } from './TestDataGenerator'
import { getConfigPreset, createTestDataConfig } from './TestDataConfig'
import * as path from 'path'

export interface TestDataServiceConfig {
  dataPath?: string
  environment?: 'development' | 'staging' | 'production'
  autoCleanup?: boolean
  enablePrivacy?: boolean
}

export class TestDataService {
  private manager: TestDataManager
  private isInitialized: boolean = false

  constructor(config: TestDataServiceConfig = {}) {
    const {
      dataPath = './test-data',
      environment = 'development',
      autoCleanup = true,
      enablePrivacy = true
    } = config

    const preset = getConfigPreset(environment)
    
    // Override cleanup and privacy settings if specified
    if (!autoCleanup) {
      preset.cleanup.environments.autoCleanup = false
    }
    
    if (!enablePrivacy) {
      preset.privacy.anonymization.enabled = false
      preset.privacy.encryption.enabled = false
    }

    this.manager = new TestDataManager(
      dataPath,
      preset.cleanup,
      preset.isolation,
      preset.privacy
    )
  }

  /**
   * Initialize the test data service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    await this.manager.initialize()
    this.isInitialized = true
    console.log('Test Data Service initialized')
  }

  /**
   * Create a quick test environment with default settings
   */
  public async createQuickEnvironment(
    name: string,
    size: 'small' | 'medium' | 'large' = 'small'
  ): Promise<string> {
    await this.ensureInitialized()

    const sizeConfigs = {
      small: { passengers: 50, drivers: 20, bookings: 200 },
      medium: { passengers: 500, drivers: 200, bookings: 2000 },
      large: { passengers: 5000, drivers: 2000, bookings: 20000 }
    }

    const config = createTestDataConfig({
      userProfiles: {
        passengers: sizeConfigs[size].passengers,
        drivers: sizeConfigs[size].drivers,
        admins: 2,
        support: 3
      },
      bookings: {
        total: sizeConfigs[size].bookings,
        statusDistribution: {
          pending: 0.05,
          confirmed: 0.1,
          in_progress: 0.05,
          completed: 0.7,
          cancelled: 0.1
        },
        timeRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      }
    })

    return await this.manager.createEnvironment(
      name,
      `Quick ${size} test environment`,
      config
    )
  }

  /**
   * Create a custom test environment
   */
  public async createCustomEnvironment(
    name: string,
    description: string,
    customConfig: any
  ): Promise<string> {
    await this.ensureInitialized()

    const config = createTestDataConfig(customConfig)
    return await this.manager.createEnvironment(name, description, config)
  }

  /**
   * Get test data for a specific environment
   */
  public async getTestData(environmentId: string): Promise<{
    users: UserProfile[]
    vehicles: VehicleData[]
    bookings: BookingData[]
    payments: PaymentData[]
  } | null> {
    await this.ensureInitialized()
    return await this.manager.loadEnvironmentData(environmentId)
  }

  /**
   * Get users by type from an environment
   */
  public async getUsersByType(
    environmentId: string,
    userType: 'passenger' | 'driver' | 'admin' | 'support'
  ): Promise<UserProfile[]> {
    const data = await this.getTestData(environmentId)
    if (!data) {
      return []
    }

    return data.users.filter(user => user.type === userType)
  }

  /**
   * Get random user from environment
   */
  public async getRandomUser(
    environmentId: string,
    userType?: 'passenger' | 'driver' | 'admin' | 'support'
  ): Promise<UserProfile | null> {
    const users = userType 
      ? await this.getUsersByType(environmentId, userType)
      : (await this.getTestData(environmentId))?.users || []

    if (users.length === 0) {
      return null
    }

    return users[Math.floor(Math.random() * users.length)]
  }

  /**
   * Get bookings for a specific user
   */
  public async getUserBookings(
    environmentId: string,
    userId: string
  ): Promise<BookingData[]> {
    const data = await this.getTestData(environmentId)
    if (!data) {
      return []
    }

    return data.bookings.filter(booking => 
      booking.passengerId === userId || booking.driverId === userId
    )
  }

  /**
   * Get vehicles for a specific driver
   */
  public async getDriverVehicles(
    environmentId: string,
    driverId: string
  ): Promise<VehicleData[]> {
    const data = await this.getTestData(environmentId)
    if (!data) {
      return []
    }

    return data.vehicles.filter(vehicle => vehicle.driverId === driverId)
  }

  /**
   * Get payments for a specific user
   */
  public async getUserPayments(
    environmentId: string,
    userId: string
  ): Promise<PaymentData[]> {
    const data = await this.getTestData(environmentId)
    if (!data) {
      return []
    }

    return data.payments.filter(payment => payment.userId === userId)
  }

  /**
   * List all available environments
   */
  public async listEnvironments(): Promise<TestDataEnvironment[]> {
    await this.ensureInitialized()
    return this.manager.listEnvironments()
  }

  /**
   * Get environment details
   */
  public async getEnvironment(environmentId: string): Promise<TestDataEnvironment | undefined> {
    await this.ensureInitialized()
    return this.manager.getEnvironment(environmentId)
  }

  /**
   * Clean up a specific environment
   */
  public async cleanupEnvironment(environmentId: string): Promise<void> {
    await this.ensureInitialized()
    await this.manager.cleanupEnvironment(environmentId)
  }

  /**
   * Run cleanup for all old environments
   */
  public async runCleanup(): Promise<void> {
    await this.ensureInitialized()
    await this.manager.runCleanup()
  }

  /**
   * Get service metrics
   */
  public async getMetrics() {
    await this.ensureInitialized()
    return await this.manager.getMetrics()
  }

  /**
   * Validate privacy compliance
   */
  public async validateCompliance() {
    await this.ensureInitialized()
    return await this.manager.validateCompliance()
  }

  /**
   * Generate test data on-the-fly without creating an environment
   */
  public async generateTestDataOnTheFly(config?: any): Promise<{
    users: UserProfile[]
    vehicles: VehicleData[]
    bookings: BookingData[]
    payments: PaymentData[]
  }> {
    const testConfig = config ? createTestDataConfig(config) : createTestDataConfig({})
    const generator = new TestDataGenerator(testConfig)
    
    await generator.generateTestData()
    return generator.getGeneratedData()
  }

  /**
   * Export environment data to JSON
   */
  public async exportEnvironment(environmentId: string): Promise<string | null> {
    const data = await this.getTestData(environmentId)
    const environment = await this.getEnvironment(environmentId)
    
    if (!data || !environment) {
      return null
    }

    return JSON.stringify({
      environment,
      data
    }, null, 2)
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    if (this.isInitialized) {
      await this.manager.shutdown()
      this.isInitialized = false
      console.log('Test Data Service shutdown')
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

// Singleton instance for easy access
let testDataServiceInstance: TestDataService | null = null

/**
 * Get singleton instance of TestDataService
 */
export function getTestDataService(config?: TestDataServiceConfig): TestDataService {
  if (!testDataServiceInstance) {
    testDataServiceInstance = new TestDataService(config)
  }
  return testDataServiceInstance
}

/**
 * Initialize the global test data service
 */
export async function initializeTestDataService(config?: TestDataServiceConfig): Promise<TestDataService> {
  const service = getTestDataService(config)
  await service.initialize()
  return service
}

/**
 * Quick helper to create test data for testing
 */
export async function createTestData(
  name: string,
  size: 'small' | 'medium' | 'large' = 'small'
): Promise<{
  environmentId: string
  data: {
    users: UserProfile[]
    vehicles: VehicleData[]
    bookings: BookingData[]
    payments: PaymentData[]
  }
}> {
  const service = getTestDataService()
  await service.initialize()
  
  const environmentId = await service.createQuickEnvironment(name, size)
  const data = await service.getTestData(environmentId)
  
  if (!data) {
    throw new Error('Failed to create test data')
  }

  return { environmentId, data }
}