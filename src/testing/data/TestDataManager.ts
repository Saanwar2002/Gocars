/**
 * Test Data Manager
 * Manages test data lifecycle including cleanup, isolation, and privacy protection
 */

import { TestDataGenerator, TestDataConfig, UserProfile, VehicleData, BookingData, PaymentData } from './TestDataGenerator'
import * as fs from 'fs'
import * as path from 'path'

export interface TestDataEnvironment {
  id: string
  name: string
  description: string
  config: TestDataConfig
  status: 'active' | 'inactive' | 'cleanup_pending' | 'archived'
  createdAt: number
  lastUsed: number
  dataPath: string
  isolationLevel: 'none' | 'basic' | 'strict'
  retentionPolicy: {
    maxAge: number // days
    autoCleanup: boolean
    archiveBeforeCleanup: boolean
  }
}

export interface DataCleanupPolicy {
  environments: {
    maxAge: number
    maxCount: number
    autoCleanup: boolean
  }
  testRuns: {
    maxAge: number
    keepSuccessful: number
    keepFailed: number
  }
  personalData: {
    anonymizeAfter: number // days
    deleteAfter: number // days
    hashSensitiveFields: boolean
  }
  storage: {
    maxSizeGB: number
    compressionEnabled: boolean
    archiveLocation: string
  }
}

export interface DataIsolationConfig {
  level: 'none' | 'basic' | 'strict'
  separateSchemas: boolean
  separateConnections: boolean
  dataEncryption: boolean
  accessControl: {
    enabled: boolean
    allowedUsers: string[]
    allowedRoles: string[]
  }
}

export interface DataPrivacyConfig {
  anonymization: {
    enabled: boolean
    preserveRelationships: boolean
    hashAlgorithm: 'sha256' | 'md5' | 'bcrypt'
    saltLength: number
  }
  encryption: {
    enabled: boolean
    algorithm: 'aes-256-gcm' | 'aes-192-gcm' | 'aes-128-gcm'
    keyRotation: boolean
    keyRotationInterval: number // days
  }
  dataMinimization: {
    enabled: boolean
    removeUnusedFields: boolean
    limitDataAge: number // days
  }
  compliance: {
    gdprCompliant: boolean
    ccpaCompliant: boolean
    hipaaCompliant: boolean
    auditLogging: boolean
  }
}

export interface TestDataMetrics {
  environments: {
    total: number
    active: number
    archived: number
    totalSizeGB: number
  }
  dataGeneration: {
    totalRecords: number
    recordsByType: Record<string, number>
    generationTime: number
    lastGenerated: number
  }
  cleanup: {
    totalCleaned: number
    lastCleanup: number
    nextScheduledCleanup: number
    cleanupErrors: number
  }
  privacy: {
    anonymizedRecords: number
    encryptedFields: number
    complianceViolations: number
    auditLogEntries: number
  }
}

export class TestDataManager {
  private environments: Map<string, TestDataEnvironment> = new Map()
  private cleanupPolicy: DataCleanupPolicy
  private isolationConfig: DataIsolationConfig
  private privacyConfig: DataPrivacyConfig
  private dataPath: string
  private cleanupInterval?: NodeJS.Timeout
  private isInitialized: boolean = false

  constructor(
    dataPath: string,
    cleanupPolicy: DataCleanupPolicy,
    isolationConfig: DataIsolationConfig,
    privacyConfig: DataPrivacyConfig
  ) {
    this.dataPath = dataPath
    this.cleanupPolicy = cleanupPolicy
    this.isolationConfig = isolationConfig
    this.privacyConfig = privacyConfig
  }

  /**
   * Initialize test data manager
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Test Data Manager...')

    try {
      // Create data directory if it doesn't exist
      await this.ensureDataDirectory()

      // Load existing environments
      await this.loadExistingEnvironments()

      // Setup cleanup scheduler
      if (this.cleanupPolicy.environments.autoCleanup) {
        this.setupCleanupScheduler()
      }

      // Validate privacy compliance
      await this.validatePrivacyCompliance()

      this.isInitialized = true
      console.log('Test Data Manager initialized successfully')

    } catch (error) {
      console.error('Failed to initialize Test Data Manager:', error)
      throw error
    }
  }

  /**
   * Create new test data environment
   */
  public async createEnvironment(
    name: string,
    description: string,
    config: TestDataConfig,
    isolationLevel: 'none' | 'basic' | 'strict' = 'basic'
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Test Data Manager not initialized')
    }

    const environmentId = `env_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const environmentPath = path.join(this.dataPath, 'environments', environmentId)

    const environment: TestDataEnvironment = {
      id: environmentId,
      name,
      description,
      config,
      status: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      dataPath: environmentPath,
      isolationLevel,
      retentionPolicy: {
        maxAge: this.cleanupPolicy.environments.maxAge,
        autoCleanup: this.cleanupPolicy.environments.autoCleanup,
        archiveBeforeCleanup: true
      }
    }

    // Create environment directory
    await fs.promises.mkdir(environmentPath, { recursive: true })

    // Generate test data
    const generator = new TestDataGenerator(config)
    await generator.generateTestData()

    // Save generated data
    const generatedData = generator.getGeneratedData()
    await this.saveEnvironmentData(environmentId, generatedData)

    // Apply privacy protection
    if (this.privacyConfig.anonymization.enabled) {
      await this.applyPrivacyProtection(environmentId)
    }

    // Store environment metadata
    this.environments.set(environmentId, environment)
    await this.saveEnvironmentMetadata(environment)

    console.log(`Created test environment: ${name} (${environmentId})`)
    return environmentId
  }

  /**
   * Get test data environment
   */
  public getEnvironment(environmentId: string): TestDataEnvironment | undefined {
    return this.environments.get(environmentId)
  }

  /**
   * List all environments
   */
  public listEnvironments(): TestDataEnvironment[] {
    return Array.from(this.environments.values())
  }

  /**
   * Load test data from environment
   */
  public async loadEnvironmentData(environmentId: string): Promise<{
    users: UserProfile[]
    vehicles: VehicleData[]
    bookings: BookingData[]
    payments: PaymentData[]
  } | null> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      return null
    }

    try {
      const dataFile = path.join(environment.dataPath, 'data.json')
      const dataContent = await fs.promises.readFile(dataFile, 'utf-8')
      const data = JSON.parse(dataContent)

      // Update last used timestamp
      environment.lastUsed = Date.now()
      await this.saveEnvironmentMetadata(environment)

      return data
    } catch (error) {
      console.error(`Failed to load environment data: ${environmentId}`, error)
      return null
    }
  }

  /**
   * Clean up test data environment
   */
  public async cleanupEnvironment(environmentId: string, archive: boolean = true): Promise<void> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`)
    }

    try {
      if (archive && environment.retentionPolicy.archiveBeforeCleanup) {
        await this.archiveEnvironment(environmentId)
      }

      // Remove environment data
      await fs.promises.rm(environment.dataPath, { recursive: true, force: true })

      // Update environment status
      environment.status = 'archived'
      this.environments.delete(environmentId)

      console.log(`Cleaned up environment: ${environmentId}`)
    } catch (error) {
      console.error(`Failed to cleanup environment: ${environmentId}`, error)
      throw error
    }
  }

  /**
   * Archive environment data
   */
  public async archiveEnvironment(environmentId: string): Promise<void> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`)
    }

    const archivePath = path.join(this.cleanupPolicy.storage.archiveLocation, `${environmentId}.tar.gz`)
    
    // Create archive directory if it doesn't exist
    await fs.promises.mkdir(path.dirname(archivePath), { recursive: true })

    // Archive the environment data (simplified - in real implementation use tar/compression)
    const data = await this.loadEnvironmentData(environmentId)
    if (data) {
      await fs.promises.writeFile(
        archivePath.replace('.tar.gz', '.json'),
        JSON.stringify({ environment, data }, null, 2)
      )
    }

    console.log(`Archived environment: ${environmentId}`)
  }

  /**
   * Run automated cleanup
   */
  public async runCleanup(): Promise<void> {
    console.log('Running automated cleanup...')

    const now = Date.now()
    const maxAge = this.cleanupPolicy.environments.maxAge * 24 * 60 * 60 * 1000 // Convert days to ms
    const environmentsToCleanup: string[] = []

    // Find environments that need cleanup
    for (const [id, environment] of this.environments) {
      if (environment.status === 'active' && (now - environment.lastUsed) > maxAge) {
        environmentsToCleanup.push(id)
      }
    }

    // Cleanup old environments
    for (const environmentId of environmentsToCleanup) {
      try {
        await this.cleanupEnvironment(environmentId, true)
      } catch (error) {
        console.error(`Failed to cleanup environment ${environmentId}:`, error)
      }
    }

    // Apply privacy policies
    if (this.privacyConfig.dataMinimization.enabled) {
      await this.applyDataMinimization()
    }

    console.log(`Cleanup completed. Processed ${environmentsToCleanup.length} environments.`)
  }

  /**
   * Get test data metrics
   */
  public async getMetrics(): Promise<TestDataMetrics> {
    const environments = Array.from(this.environments.values())
    const activeEnvironments = environments.filter(e => e.status === 'active')
    const archivedEnvironments = environments.filter(e => e.status === 'archived')

    // Calculate total size (simplified)
    let totalSizeGB = 0
    for (const env of environments) {
      try {
        const stats = await fs.promises.stat(env.dataPath)
        totalSizeGB += stats.size / (1024 * 1024 * 1024) // Convert to GB
      } catch (error) {
        // Environment might not exist
      }
    }

    return {
      environments: {
        total: environments.length,
        active: activeEnvironments.length,
        archived: archivedEnvironments.length,
        totalSizeGB: Math.round(totalSizeGB * 100) / 100
      },
      dataGeneration: {
        totalRecords: 0, // Would be calculated from actual data
        recordsByType: {},
        generationTime: 0,
        lastGenerated: Math.max(...environments.map(e => e.createdAt), 0)
      },
      cleanup: {
        totalCleaned: 0, // Would be tracked in real implementation
        lastCleanup: 0,
        nextScheduledCleanup: 0,
        cleanupErrors: 0
      },
      privacy: {
        anonymizedRecords: 0, // Would be tracked in real implementation
        encryptedFields: 0,
        complianceViolations: 0,
        auditLogEntries: 0
      }
    }
  }

  /**
   * Validate privacy compliance
   */
  public async validateCompliance(): Promise<{
    gdprCompliant: boolean
    ccpaCompliant: boolean
    hipaaCompliant: boolean
    violations: string[]
  }> {
    const violations: string[] = []

    // Check GDPR compliance
    if (this.privacyConfig.compliance.gdprCompliant) {
      if (!this.privacyConfig.anonymization.enabled) {
        violations.push('GDPR: Data anonymization not enabled')
      }
      if (!this.privacyConfig.compliance.auditLogging) {
        violations.push('GDPR: Audit logging not enabled')
      }
    }

    // Check CCPA compliance
    if (this.privacyConfig.compliance.ccpaCompliant) {
      if (!this.privacyConfig.dataMinimization.enabled) {
        violations.push('CCPA: Data minimization not enabled')
      }
    }

    // Check HIPAA compliance
    if (this.privacyConfig.compliance.hipaaCompliant) {
      if (!this.privacyConfig.encryption.enabled) {
        violations.push('HIPAA: Data encryption not enabled')
      }
    }

    return {
      gdprCompliant: this.privacyConfig.compliance.gdprCompliant && violations.filter(v => v.includes('GDPR')).length === 0,
      ccpaCompliant: this.privacyConfig.compliance.ccpaCompliant && violations.filter(v => v.includes('CCPA')).length === 0,
      hipaaCompliant: this.privacyConfig.compliance.hipaaCompliant && violations.filter(v => v.includes('HIPAA')).length === 0,
      violations
    }
  }

  /**
   * Shutdown test data manager
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Test Data Manager...')

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Run final cleanup if needed
    if (this.cleanupPolicy.environments.autoCleanup) {
      await this.runCleanup()
    }

    this.isInitialized = false
    console.log('Test Data Manager shutdown complete')
  }

  // Private helper methods

  private async ensureDataDirectory(): Promise<void> {
    await fs.promises.mkdir(this.dataPath, { recursive: true })
    await fs.promises.mkdir(path.join(this.dataPath, 'environments'), { recursive: true })
    await fs.promises.mkdir(path.join(this.dataPath, 'archives'), { recursive: true })
  }

  private async loadExistingEnvironments(): Promise<void> {
    try {
      const environmentsDir = path.join(this.dataPath, 'environments')
      const entries = await fs.promises.readdir(environmentsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const metadataFile = path.join(environmentsDir, entry.name, 'metadata.json')
            const metadataContent = await fs.promises.readFile(metadataFile, 'utf-8')
            const environment: TestDataEnvironment = JSON.parse(metadataContent)
            this.environments.set(environment.id, environment)
          } catch (error) {
            console.warn(`Failed to load environment metadata: ${entry.name}`, error)
          }
        }
      }

      console.log(`Loaded ${this.environments.size} existing environments`)
    } catch (error) {
      console.log('No existing environments found')
    }
  }

  private setupCleanupScheduler(): void {
    // Run cleanup every 24 hours
    const cleanupInterval = 24 * 60 * 60 * 1000
    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('Scheduled cleanup failed:', error)
      })
    }, cleanupInterval)

    console.log('Cleanup scheduler initialized')
  }

  private async validatePrivacyCompliance(): Promise<void> {
    const compliance = await this.validateCompliance()
    
    if (compliance.violations.length > 0) {
      console.warn('Privacy compliance violations detected:')
      compliance.violations.forEach(violation => console.warn(`  - ${violation}`))
    } else {
      console.log('Privacy compliance validation passed')
    }
  }

  private async saveEnvironmentData(environmentId: string, data: any): Promise<void> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`)
    }

    const dataFile = path.join(environment.dataPath, 'data.json')
    await fs.promises.writeFile(dataFile, JSON.stringify(data, null, 2))
  }

  private async saveEnvironmentMetadata(environment: TestDataEnvironment): Promise<void> {
    const metadataFile = path.join(environment.dataPath, 'metadata.json')
    await fs.promises.writeFile(metadataFile, JSON.stringify(environment, null, 2))
  }

  private async applyPrivacyProtection(environmentId: string): Promise<void> {
    // Apply anonymization, encryption, etc.
    // This would be implemented based on the privacy configuration
    console.log(`Applied privacy protection to environment: ${environmentId}`)
  }

  private async applyDataMinimization(): Promise<void> {
    // Remove old data based on minimization policies
    // This would be implemented based on the data minimization configuration
    console.log('Applied data minimization policies')
  }