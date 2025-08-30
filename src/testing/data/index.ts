/**
 * Test Data Module
 * Exports all test data generation and management functionality
 */

// Core classes
export { TestDataGenerator } from './TestDataGenerator'
export { TestDataManager } from './TestDataManager'
export { TestDataService, getTestDataService, initializeTestDataService, createTestData } from './TestDataService'

// Configuration and presets
export {
  DEFAULT_SMALL_CONFIG,
  DEFAULT_MEDIUM_CONFIG,
  DEFAULT_LARGE_CONFIG,
  DEFAULT_CLEANUP_POLICY,
  DEFAULT_ISOLATION_CONFIG,
  DEFAULT_PRIVACY_CONFIG,
  CONFIG_PRESETS,
  createTestDataConfig,
  getConfigPreset
} from './TestDataConfig'

// Type definitions
export type {
  UserProfile,
  VehicleData,
  BookingData,
  PaymentData,
  TestDataConfig
} from './TestDataGenerator'

export type {
  TestDataEnvironment,
  DataCleanupPolicy,
  DataIsolationConfig,
  DataPrivacyConfig,
  TestDataMetrics
} from './TestDataManager'

export type {
  TestDataServiceConfig
} from './TestDataService'