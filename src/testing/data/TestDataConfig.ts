/**
 * Test Data Configuration
 * Default configurations and utilities for test data generation
 */

import { TestDataConfig, DataCleanupPolicy, DataIsolationConfig, DataPrivacyConfig } from './TestDataManager'

/**
 * Default test data configuration for small test runs
 */
export const DEFAULT_SMALL_CONFIG: TestDataConfig = {
  userProfiles: {
    passengers: 50,
    drivers: 20,
    admins: 2,
    support: 3
  },
  vehicles: {
    perDriver: 1,
    types: {
      sedan: 0.4,
      suv: 0.3,
      hatchback: 0.2,
      luxury: 0.08,
      electric: 0.02
    }
  },
  bookings: {
    total: 200,
    statusDistribution: {
      pending: 0.05,
      confirmed: 0.1,
      in_progress: 0.05,
      completed: 0.7,
      cancelled: 0.1
    },
    timeRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      endDate: new Date().toISOString()
    }
  },
  payments: {
    perBooking: 1,
    methodDistribution: {
      cash: 0.3,
      credit_card: 0.4,
      debit_card: 0.2,
      wallet: 0.08,
      upi: 0.02
    }
  },
  locations: {
    cities: ['New York', 'Los Angeles', 'Chicago'],
    radiusKm: 50
  },
  anonymization: {
    enabled: true,
    preserveRelationships: true,
    hashSensitiveData: true
  }
}

/**
 * Default test data configuration for medium test runs
 */
export const DEFAULT_MEDIUM_CONFIG: TestDataConfig = {
  userProfiles: {
    passengers: 500,
    drivers: 200,
    admins: 5,
    support: 10
  },
  vehicles: {
    perDriver: 1,
    types: {
      sedan: 0.4,
      suv: 0.3,
      hatchback: 0.2,
      luxury: 0.08,
      electric: 0.02
    }
  },
  bookings: {
    total: 2000,
    statusDistribution: {
      pending: 0.05,
      confirmed: 0.1,
      in_progress: 0.05,
      completed: 0.7,
      cancelled: 0.1
    },
    timeRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      endDate: new Date().toISOString()
    }
  },
  payments: {
    perBooking: 1,
    methodDistribution: {
      cash: 0.3,
      credit_card: 0.4,
      debit_card: 0.2,
      wallet: 0.08,
      upi: 0.02
    }
  },
  locations: {
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    radiusKm: 100
  },
  anonymization: {
    enabled: true,
    preserveRelationships: true,
    hashSensitiveData: true
  }
}

/**
 * Default test data configuration for large test runs
 */
export const DEFAULT_LARGE_CONFIG: TestDataConfig = {
  userProfiles: {
    passengers: 5000,
    drivers: 2000,
    admins: 10,
    support: 25
  },
  vehicles: {
    perDriver: 1,
    types: {
      sedan: 0.4,
      suv: 0.3,
      hatchback: 0.2,
      luxury: 0.08,
      electric: 0.02
    }
  },
  bookings: {
    total: 20000,
    statusDistribution: {
      pending: 0.05,
      confirmed: 0.1,
      in_progress: 0.05,
      completed: 0.7,
      cancelled: 0.1
    },
    timeRange: {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      endDate: new Date().toISOString()
    }
  },
  payments: {
    perBooking: 1,
    methodDistribution: {
      cash: 0.3,
      credit_card: 0.4,
      debit_card: 0.2,
      wallet: 0.08,
      upi: 0.02
    }
  },
  locations: {
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    radiusKm: 200
  },
  anonymization: {
    enabled: true,
    preserveRelationships: true,
    hashSensitiveData: true
  }
}

/**
 * Default cleanup policy
 */
export const DEFAULT_CLEANUP_POLICY: DataCleanupPolicy = {
  environments: {
    maxAge: 7, // days
    maxCount: 10,
    autoCleanup: true
  },
  testRuns: {
    maxAge: 30, // days
    keepSuccessful: 5,
    keepFailed: 10
  },
  personalData: {
    anonymizeAfter: 1, // days
    deleteAfter: 30, // days
    hashSensitiveFields: true
  },
  storage: {
    maxSizeGB: 10,
    compressionEnabled: true,
    archiveLocation: './test-data-archives'
  }
}

/**
 * Default isolation configuration
 */
export const DEFAULT_ISOLATION_CONFIG: DataIsolationConfig = {
  level: 'basic',
  separateSchemas: true,
  separateConnections: false,
  dataEncryption: false,
  accessControl: {
    enabled: false,
    allowedUsers: [],
    allowedRoles: ['admin', 'tester']
  }
}

/**
 * Default privacy configuration
 */
export const DEFAULT_PRIVACY_CONFIG: DataPrivacyConfig = {
  anonymization: {
    enabled: true,
    preserveRelationships: true,
    hashAlgorithm: 'sha256',
    saltLength: 16
  },
  encryption: {
    enabled: false,
    algorithm: 'aes-256-gcm',
    keyRotation: false,
    keyRotationInterval: 30 // days
  },
  dataMinimization: {
    enabled: true,
    removeUnusedFields: true,
    limitDataAge: 90 // days
  },
  compliance: {
    gdprCompliant: true,
    ccpaCompliant: true,
    hipaaCompliant: false,
    auditLogging: true
  }
}

/**
 * Configuration presets for different testing scenarios
 */
export const CONFIG_PRESETS = {
  development: {
    testData: DEFAULT_SMALL_CONFIG,
    cleanup: DEFAULT_CLEANUP_POLICY,
    isolation: DEFAULT_ISOLATION_CONFIG,
    privacy: DEFAULT_PRIVACY_CONFIG
  },
  staging: {
    testData: DEFAULT_MEDIUM_CONFIG,
    cleanup: {
      ...DEFAULT_CLEANUP_POLICY,
      environments: {
        ...DEFAULT_CLEANUP_POLICY.environments,
        maxAge: 3 // days
      }
    },
    isolation: {
      ...DEFAULT_ISOLATION_CONFIG,
      level: 'strict' as const,
      dataEncryption: true
    },
    privacy: DEFAULT_PRIVACY_CONFIG
  },
  production: {
    testData: DEFAULT_LARGE_CONFIG,
    cleanup: {
      ...DEFAULT_CLEANUP_POLICY,
      environments: {
        ...DEFAULT_CLEANUP_POLICY.environments,
        maxAge: 1 // days
      }
    },
    isolation: {
      ...DEFAULT_ISOLATION_CONFIG,
      level: 'strict' as const,
      separateConnections: true,
      dataEncryption: true,
      accessControl: {
        enabled: true,
        allowedUsers: [],
        allowedRoles: ['admin']
      }
    },
    privacy: {
      ...DEFAULT_PRIVACY_CONFIG,
      encryption: {
        ...DEFAULT_PRIVACY_CONFIG.encryption,
        enabled: true,
        keyRotation: true
      },
      compliance: {
        ...DEFAULT_PRIVACY_CONFIG.compliance,
        hipaaCompliant: true
      }
    }
  }
}

/**
 * Utility function to create custom configuration
 */
export function createTestDataConfig(overrides: Partial<TestDataConfig>): TestDataConfig {
  return {
    ...DEFAULT_SMALL_CONFIG,
    ...overrides,
    userProfiles: {
      ...DEFAULT_SMALL_CONFIG.userProfiles,
      ...overrides.userProfiles
    },
    vehicles: {
      ...DEFAULT_SMALL_CONFIG.vehicles,
      ...overrides.vehicles
    },
    bookings: {
      ...DEFAULT_SMALL_CONFIG.bookings,
      ...overrides.bookings
    },
    payments: {
      ...DEFAULT_SMALL_CONFIG.payments,
      ...overrides.payments
    },
    locations: {
      ...DEFAULT_SMALL_CONFIG.locations,
      ...overrides.locations
    },
    anonymization: {
      ...DEFAULT_SMALL_CONFIG.anonymization,
      ...overrides.anonymization
    }
  }
}

/**
 * Utility function to get configuration preset
 */
export function getConfigPreset(environment: 'development' | 'staging' | 'production') {
  return CONFIG_PRESETS[environment]
}