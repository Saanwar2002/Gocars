/**
 * Test Data Service Tests
 * Tests for the test data generation and management system
 */

import { TestDataService, createTestData } from '../TestDataService'
import { createTestDataConfig } from '../TestDataConfig'
import * as fs from 'fs'
import * as path from 'path'

describe('TestDataService', () => {
  let service: TestDataService
  const testDataPath = './test-data-temp'

  beforeAll(async () => {
    // Clean up any existing test data
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true })
    }

    service = new TestDataService({
      dataPath: testDataPath,
      environment: 'development',
      autoCleanup: false, // Disable for testing
      enablePrivacy: true
    })

    await service.initialize()
  })

  afterAll(async () => {
    await service.shutdown()
    
    // Clean up test data
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true })
    }
  })

  describe('Environment Management', () => {
    test('should create a quick small environment', async () => {
      const environmentId = await service.createQuickEnvironment('test-small', 'small')
      
      expect(environmentId).toBeDefined()
      expect(environmentId).toMatch(/^env_/)

      const environment = await service.getEnvironment(environmentId)
      expect(environment).toBeDefined()
      expect(environment?.name).toBe('test-small')
      expect(environment?.status).toBe('active')
    })

    test('should create a custom environment', async () => {
      const customConfig = {
        userProfiles: {
          passengers: 10,
          drivers: 5,
          admins: 1,
          support: 1
        },
        bookings: {
          total: 20
        }
      }

      const environmentId = await service.createCustomEnvironment(
        'test-custom',
        'Custom test environment',
        customConfig
      )

      expect(environmentId).toBeDefined()
      
      const data = await service.getTestData(environmentId)
      expect(data).toBeDefined()
      expect(data?.users).toHaveLength(17) // 10 + 5 + 1 + 1
      expect(data?.bookings).toHaveLength(20)
    })

    test('should list environments', async () => {
      const environments = await service.listEnvironments()
      expect(environments.length).toBeGreaterThanOrEqual(2)
      
      const environmentNames = environments.map(env => env.name)
      expect(environmentNames).toContain('test-small')
      expect(environmentNames).toContain('test-custom')
    })
  })

  describe('Data Retrieval', () => {
    let environmentId: string

    beforeAll(async () => {
      environmentId = await service.createQuickEnvironment('test-data-retrieval', 'small')
    })

    test('should get test data from environment', async () => {
      const data = await service.getTestData(environmentId)
      
      expect(data).toBeDefined()
      expect(data?.users.length).toBeGreaterThan(0)
      expect(data?.vehicles.length).toBeGreaterThan(0)
      expect(data?.bookings.length).toBeGreaterThan(0)
      expect(data?.payments.length).toBeGreaterThan(0)
    })

    test('should get users by type', async () => {
      const passengers = await service.getUsersByType(environmentId, 'passenger')
      const drivers = await service.getUsersByType(environmentId, 'driver')
      
      expect(passengers.length).toBe(50)
      expect(drivers.length).toBe(20)
      
      passengers.forEach(user => {
        expect(user.type).toBe('passenger')
      })
      
      drivers.forEach(user => {
        expect(user.type).toBe('driver')
      })
    })

    test('should get random user', async () => {
      const randomUser = await service.getRandomUser(environmentId)
      const randomPassenger = await service.getRandomUser(environmentId, 'passenger')
      
      expect(randomUser).toBeDefined()
      expect(randomPassenger).toBeDefined()
      expect(randomPassenger?.type).toBe('passenger')
    })

    test('should get user bookings', async () => {
      const passengers = await service.getUsersByType(environmentId, 'passenger')
      const passenger = passengers[0]
      
      const bookings = await service.getUserBookings(environmentId, passenger.id)
      
      bookings.forEach(booking => {
        expect(booking.passengerId).toBe(passenger.id)
      })
    })

    test('should get driver vehicles', async () => {
      const drivers = await service.getUsersByType(environmentId, 'driver')
      const driver = drivers[0]
      
      const vehicles = await service.getDriverVehicles(environmentId, driver.id)
      
      expect(vehicles.length).toBeGreaterThan(0)
      vehicles.forEach(vehicle => {
        expect(vehicle.driverId).toBe(driver.id)
      })
    })

    test('should get user payments', async () => {
      const passengers = await service.getUsersByType(environmentId, 'passenger')
      const passenger = passengers[0]
      
      const payments = await service.getUserPayments(environmentId, passenger.id)
      
      payments.forEach(payment => {
        expect(payment.userId).toBe(passenger.id)
      })
    })
  })

  describe('Data Generation', () => {
    test('should generate test data on the fly', async () => {
      const data = await service.generateTestDataOnTheFly({
        userProfiles: {
          passengers: 5,
          drivers: 2,
          admins: 1,
          support: 1
        },
        bookings: {
          total: 10
        }
      })

      expect(data.users).toHaveLength(9) // 5 + 2 + 1 + 1
      expect(data.bookings).toHaveLength(10)
      expect(data.vehicles.length).toBeGreaterThan(0)
      expect(data.payments.length).toBeGreaterThan(0)
    })

    test('should export environment data', async () => {
      const environmentId = await service.createQuickEnvironment('test-export', 'small')
      const exportData = await service.exportEnvironment(environmentId)
      
      expect(exportData).toBeDefined()
      
      const parsed = JSON.parse(exportData!)
      expect(parsed.environment).toBeDefined()
      expect(parsed.data).toBeDefined()
      expect(parsed.data.users).toBeDefined()
      expect(parsed.data.vehicles).toBeDefined()
      expect(parsed.data.bookings).toBeDefined()
      expect(parsed.data.payments).toBeDefined()
    })
  })

  describe('Service Metrics', () => {
    test('should get service metrics', async () => {
      const metrics = await service.getMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics.environments.total).toBeGreaterThan(0)
      expect(metrics.environments.active).toBeGreaterThan(0)
      expect(typeof metrics.environments.totalSizeGB).toBe('number')
    })

    test('should validate compliance', async () => {
      const compliance = await service.validateCompliance()
      
      expect(compliance).toBeDefined()
      expect(typeof compliance.gdprCompliant).toBe('boolean')
      expect(typeof compliance.ccpaCompliant).toBe('boolean')
      expect(typeof compliance.hipaaCompliant).toBe('boolean')
      expect(Array.isArray(compliance.violations)).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    test('should create test data using helper function', async () => {
      const result = await createTestData('helper-test', 'small')
      
      expect(result.environmentId).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.data.users.length).toBeGreaterThan(0)
      expect(result.data.bookings.length).toBeGreaterThan(0)
    })
  })

  describe('Data Validation', () => {
    let environmentId: string

    beforeAll(async () => {
      environmentId = await service.createQuickEnvironment('test-validation', 'small')
    })

    test('should generate valid user data', async () => {
      const data = await service.getTestData(environmentId)
      const users = data?.users || []
      
      expect(users.length).toBeGreaterThan(0)
      
      users.forEach(user => {
        expect(user.id).toBeDefined()
        expect(user.type).toMatch(/^(passenger|driver|admin|support)$/)
        expect(user.personalInfo.firstName).toBeDefined()
        expect(user.personalInfo.lastName).toBeDefined()
        expect(user.personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        expect(user.personalInfo.phone).toMatch(/^\+1\d{10}$/)
        expect(user.location.coordinates.latitude).toBeGreaterThan(-90)
        expect(user.location.coordinates.latitude).toBeLessThan(90)
        expect(user.location.coordinates.longitude).toBeGreaterThan(-180)
        expect(user.location.coordinates.longitude).toBeLessThan(180)
      })
    })

    test('should generate valid booking data', async () => {
      const data = await service.getTestData(environmentId)
      const bookings = data?.bookings || []
      
      expect(bookings.length).toBeGreaterThan(0)
      
      bookings.forEach(booking => {
        expect(booking.id).toBeDefined()
        expect(booking.passengerId).toBeDefined()
        expect(booking.status).toMatch(/^(pending|confirmed|in_progress|completed|cancelled)$/)
        expect(booking.pricing.totalFare).toBeGreaterThan(0)
        expect(booking.pickup.coordinates.latitude).toBeGreaterThan(-90)
        expect(booking.pickup.coordinates.latitude).toBeLessThan(90)
        expect(booking.destination.coordinates.latitude).toBeGreaterThan(-90)
        expect(booking.destination.coordinates.latitude).toBeLessThan(90)
      })
    })

    test('should generate valid vehicle data', async () => {
      const data = await service.getTestData(environmentId)
      const vehicles = data?.vehicles || []
      
      expect(vehicles.length).toBeGreaterThan(0)
      
      vehicles.forEach(vehicle => {
        expect(vehicle.id).toBeDefined()
        expect(vehicle.driverId).toBeDefined()
        expect(vehicle.make).toBeDefined()
        expect(vehicle.model).toBeDefined()
        expect(vehicle.year).toBeGreaterThan(2000)
        expect(vehicle.year).toBeLessThan(2030)
        expect(vehicle.licensePlate).toMatch(/^[A-Z]{3}-\d{3}$/)
        expect(vehicle.capacity).toBeGreaterThan(0)
      })
    })

    test('should generate valid payment data', async () => {
      const data = await service.getTestData(environmentId)
      const payments = data?.payments || []
      
      expect(payments.length).toBeGreaterThan(0)
      
      payments.forEach(payment => {
        expect(payment.id).toBeDefined()
        expect(payment.userId).toBeDefined()
        expect(payment.amount).toBeGreaterThan(0)
        expect(payment.currency).toBe('USD')
        expect(payment.status).toMatch(/^(pending|processing|completed|failed|cancelled|refunded)$/)
        expect(payment.gateway.provider).toBeDefined()
        expect(payment.gateway.transactionId).toBeDefined()
      })
    })
  })
})