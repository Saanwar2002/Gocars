# Test Data Generation and Management System

This module provides comprehensive test data generation and management capabilities for the GoCars testing framework. It generates realistic test data for all user types, vehicles, bookings, and payments while ensuring data privacy and compliance.

## Features

- **Realistic Data Generation**: Creates authentic user profiles, vehicle data, bookings, and payment records
- **Data Privacy & Compliance**: Built-in anonymization, encryption, and GDPR/CCPA compliance
- **Environment Management**: Isolated test environments with automatic cleanup
- **Flexible Configuration**: Customizable data generation parameters
- **Performance Optimized**: Efficient generation and storage of large datasets

## Quick Start

### Basic Usage

```typescript
import { TestDataService, createTestData } from './src/testing/data'

// Create test data quickly
const { environmentId, data } = await createTestData('my-test', 'small')

console.log(`Created ${data.users.length} users`)
console.log(`Created ${data.bookings.length} bookings`)
```

### Service-Based Usage

```typescript
import { TestDataService } from './src/testing/data'

const service = new TestDataService({
  dataPath: './test-data',
  environment: 'development',
  autoCleanup: true,
  enablePrivacy: true
})

await service.initialize()

// Create a quick environment
const envId = await service.createQuickEnvironment('test-env', 'medium')

// Get specific user types
const passengers = await service.getUsersByType(envId, 'passenger')
const drivers = await service.getUsersByType(envId, 'driver')

// Get random users for testing
const randomPassenger = await service.getRandomUser(envId, 'passenger')
const randomDriver = await service.getRandomUser(envId, 'driver')
```

## Configuration

### Environment Sizes

- **Small**: 50 passengers, 20 drivers, 200 bookings
- **Medium**: 500 passengers, 200 drivers, 2000 bookings  
- **Large**: 5000 passengers, 2000 drivers, 20000 bookings

### Custom Configuration

```typescript
import { createTestDataConfig } from './src/testing/data'

const customConfig = createTestDataConfig({
  userProfiles: {
    passengers: 100,
    drivers: 50,
    admins: 2,
    support: 5
  },
  bookings: {
    total: 500,
    statusDistribution: {
      pending: 0.1,
      confirmed: 0.2,
      in_progress: 0.1,
      completed: 0.5,
      cancelled: 0.1
    }
  },
  anonymization: {
    enabled: true,
    preserveRelationships: true,
    hashSensitiveData: true
  }
})

const envId = await service.createCustomEnvironment(
  'custom-test',
  'Custom test environment',
  customConfig
)
```

## Data Types

### User Profiles

Generated users include:
- **Personal Information**: Name, email, phone, date of birth
- **Location Data**: Address, city, coordinates
- **Preferences**: Language, notifications, accessibility needs
- **Metadata**: Registration date, activity status, ratings

### Vehicle Data

Generated vehicles include:
- **Vehicle Details**: Make, model, year, color, license plate
- **Documentation**: Insurance, inspection records
- **Features**: Capacity, amenities, vehicle type
- **Status**: Availability, location, maintenance records

### Booking Data

Generated bookings include:
- **Trip Details**: Pickup/destination, route, timing
- **Pricing**: Base fare, distance/time charges, surge pricing
- **Status Tracking**: Booking lifecycle states
- **Payment Information**: Method, transaction status

### Payment Data

Generated payments include:
- **Transaction Details**: Amount, currency, method
- **Gateway Information**: Provider, transaction IDs
- **Status Tracking**: Processing states, timestamps
- **Metadata**: Creation, processing, failure reasons

## Privacy & Compliance

### Data Anonymization

```typescript
const privacyConfig = {
  anonymization: {
    enabled: true,
    preserveRelationships: true, // Keep user-booking relationships
    hashSensitiveData: true      // Hash emails, phones, etc.
  }
}
```

### Compliance Features

- **GDPR Compliance**: Data anonymization, audit logging
- **CCPA Compliance**: Data minimization, user rights
- **HIPAA Compliance**: Encryption, access controls (optional)

### Data Cleanup

```typescript
const cleanupPolicy = {
  environments: {
    maxAge: 7,        // Days before cleanup
    autoCleanup: true // Automatic cleanup
  },
  personalData: {
    anonymizeAfter: 1,  // Anonymize after 1 day
    deleteAfter: 30     // Delete after 30 days
  }
}
```

## Environment Management

### Creating Environments

```typescript
// Quick environments
const smallEnv = await service.createQuickEnvironment('test-small', 'small')
const mediumEnv = await service.createQuickEnvironment('test-medium', 'medium')

// Custom environments
const customEnv = await service.createCustomEnvironment(
  'custom-test',
  'Custom test environment',
  customConfig
)
```

### Managing Environments

```typescript
// List all environments
const environments = await service.listEnvironments()

// Get environment details
const env = await service.getEnvironment(environmentId)

// Clean up environment
await service.cleanupEnvironment(environmentId)

// Run cleanup for all old environments
await service.runCleanup()
```

## Data Retrieval

### Getting Test Data

```typescript
// Get all data from environment
const data = await service.getTestData(environmentId)

// Get users by type
const passengers = await service.getUsersByType(environmentId, 'passenger')
const drivers = await service.getUsersByType(environmentId, 'driver')

// Get random users
const randomUser = await service.getRandomUser(environmentId)
const randomPassenger = await service.getRandomUser(environmentId, 'passenger')
```

### Relationship Queries

```typescript
// Get user's bookings
const userBookings = await service.getUserBookings(environmentId, userId)

// Get driver's vehicles
const driverVehicles = await service.getDriverVehicles(environmentId, driverId)

// Get user's payments
const userPayments = await service.getUserPayments(environmentId, userId)
```

## Monitoring & Metrics

### Service Metrics

```typescript
const metrics = await service.getMetrics()

console.log(`Total environments: ${metrics.environments.total}`)
console.log(`Active environments: ${metrics.environments.active}`)
console.log(`Storage used: ${metrics.environments.totalSizeGB} GB`)
```

### Compliance Validation

```typescript
const compliance = await service.validateCompliance()

if (compliance.violations.length > 0) {
  console.warn('Compliance violations:', compliance.violations)
}
```

## Testing Integration

### Unit Tests

```typescript
import { TestDataService } from './src/testing/data'

describe('My Feature Tests', () => {
  let testDataService: TestDataService
  let environmentId: string

  beforeAll(async () => {
    testDataService = new TestDataService({ environment: 'development' })
    await testDataService.initialize()
    environmentId = await testDataService.createQuickEnvironment('test', 'small')
  })

  afterAll(async () => {
    await testDataService.cleanupEnvironment(environmentId)
    await testDataService.shutdown()
  })

  test('should process booking correctly', async () => {
    const passenger = await testDataService.getRandomUser(environmentId, 'passenger')
    const driver = await testDataService.getRandomUser(environmentId, 'driver')
    
    // Test your booking logic with realistic data
    expect(passenger).toBeDefined()
    expect(driver).toBeDefined()
  })
})
```

### Integration Tests

```typescript
import { createTestData } from './src/testing/data'

describe('End-to-End Tests', () => {
  test('complete booking flow', async () => {
    const { environmentId, data } = await createTestData('e2e-test', 'medium')
    
    // Use generated data for comprehensive testing
    const passenger = data.users.find(u => u.type === 'passenger')
    const driver = data.users.find(u => u.type === 'driver')
    const vehicle = data.vehicles.find(v => v.driverId === driver?.id)
    
    // Test complete booking workflow
  })
})
```

## Best Practices

### 1. Environment Isolation

- Use separate environments for different test suites
- Clean up environments after tests complete
- Use appropriate environment sizes for test needs

### 2. Data Privacy

- Enable anonymization for sensitive data
- Use appropriate retention policies
- Validate compliance requirements

### 3. Performance

- Use smaller datasets for unit tests
- Use larger datasets for load testing
- Enable compression for storage efficiency

### 4. Maintenance

- Monitor storage usage regularly
- Run cleanup operations periodically
- Archive important test data before cleanup

## Configuration Presets

### Development Environment

```typescript
const service = new TestDataService({
  environment: 'development',
  autoCleanup: true,
  enablePrivacy: true
})
```

### Staging Environment

```typescript
const service = new TestDataService({
  environment: 'staging',
  autoCleanup: true,
  enablePrivacy: true
})
```

### Production Testing

```typescript
const service = new TestDataService({
  environment: 'production',
  autoCleanup: true,
  enablePrivacy: true
})
```

## Troubleshooting

### Common Issues

1. **Out of Storage**: Increase cleanup frequency or storage limits
2. **Slow Generation**: Reduce dataset size or enable compression
3. **Privacy Violations**: Enable anonymization and encryption
4. **Memory Issues**: Use streaming for large datasets

### Debug Mode

```typescript
const service = new TestDataService({
  dataPath: './debug-test-data',
  environment: 'development',
  autoCleanup: false // Keep data for debugging
})
```

## API Reference

See the TypeScript interfaces and classes for complete API documentation:

- `TestDataService` - Main service class
- `TestDataGenerator` - Core data generation
- `TestDataManager` - Environment management
- `TestDataConfig` - Configuration types
- Configuration presets and utilities