/**
 * Configuration Manager
 * Manages test configurations for the testing agent
 */

import { TestConfiguration } from '../core/TestingAgentController'

export interface ConfigurationValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class ConfigurationManager {
  private configurations: Map<string, TestConfiguration> = new Map()
  private configurationTemplates: Map<string, Partial<TestConfiguration>> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
  }

  /**
   * Initialize default configuration templates
   */
  private initializeDefaultTemplates(): void {
    // Firebase testing template
    this.configurationTemplates.set('firebase_basic', {
      name: 'Firebase Basic Testing',
      environment: 'development',
      testSuites: ['firebase_test_suite'],
      concurrencyLevel: 1,
      timeout: 120000,
      retryAttempts: 2,
      autoFixEnabled: false
    })

    // Security testing template
    this.configurationTemplates.set('security_comprehensive', {
      name: 'Comprehensive Security Testing',
      environment: 'staging',
      testSuites: ['security_test_suite'],
      concurrencyLevel: 1,
      timeout: 300000,
      retryAttempts: 1,
      autoFixEnabled: false
    })

    // Full integration testing template
    this.configurationTemplates.set('full_integration', {
      name: 'Full Integration Testing',
      environment: 'staging',
      testSuites: ['firebase_test_suite', 'security_test_suite'],
      concurrencyLevel: 2,
      timeout: 600000,
      retryAttempts: 2,
      autoFixEnabled: true
    })
  }

  /**
   * Create test configuration
   */
  public async createConfiguration(configuration: TestConfiguration): Promise<string> {
    // Validate configuration
    const validation = await this.validateConfiguration(configuration)
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }

    // Generate ID if not provided
    const configId = configuration.id || this.generateConfigurationId()
    
    const configWithId: TestConfiguration = {
      ...configuration,
      id: configId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.configurations.set(configId, configWithId)
    return configId
  }

  /**
   * Update test configuration
   */
  public async updateConfiguration(id: string, updates: Partial<TestConfiguration>): Promise<void> {
    const existing = this.configurations.get(id)
    if (!existing) {
      throw new Error('Configuration not found')
    }

    const updated: TestConfiguration = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now()
    }

    // Validate updated configuration
    const validation = await this.validateConfiguration(updated)
    if (!validation.valid) {
      throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`)
    }

    this.configurations.set(id, updated)
  }

  /**
   * Get test configuration
   */
  public async getConfiguration(id: string): Promise<TestConfiguration | null> {
    return this.configurations.get(id) || null
  }

  /**
   * List all configurations
   */
  public async listConfigurations(): Promise<TestConfiguration[]> {
    return Array.from(this.configurations.values())
  }

  /**
   * Delete test configuration
   */
  public async deleteConfiguration(id: string): Promise<void> {
    if (!this.configurations.has(id)) {
      throw new Error('Configuration not found')
    }
    this.configurations.delete(id)
  }

  /**
   * Validate test configuration
   */
  public async validateConfiguration(configuration: TestConfiguration): Promise<ConfigurationValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!configuration.name || configuration.name.trim().length === 0) {
      errors.push('Configuration name is required')
    }

    if (!configuration.environment) {
      errors.push('Environment is required')
    } else if (!['development', 'staging', 'production'].includes(configuration.environment)) {
      errors.push('Environment must be development, staging, or production')
    }

    if (!configuration.testSuites || configuration.testSuites.length === 0) {
      errors.push('At least one test suite must be specified')
    }

    // Validate test suites exist
    const availableTestSuites = ['firebase_test_suite', 'security_test_suite']
    const invalidSuites = configuration.testSuites?.filter(suite => !availableTestSuites.includes(suite)) || []
    if (invalidSuites.length > 0) {
      errors.push(`Invalid test suites: ${invalidSuites.join(', ')}`)
    }

    // Validate numeric values
    if (configuration.concurrencyLevel !== undefined) {
      if (configuration.concurrencyLevel < 1 || configuration.concurrencyLevel > 10) {
        errors.push('Concurrency level must be between 1 and 10')
      }
    }

    if (configuration.timeout !== undefined) {
      if (configuration.timeout < 10000 || configuration.timeout > 3600000) {
        errors.push('Timeout must be between 10 seconds and 1 hour')
      }
    }

    if (configuration.retryAttempts !== undefined) {
      if (configuration.retryAttempts < 0 || configuration.retryAttempts > 5) {
        errors.push('Retry attempts must be between 0 and 5')
      }
    }

    // Warnings for potentially problematic configurations
    if (configuration.concurrencyLevel && configuration.concurrencyLevel > 5) {
      warnings.push('High concurrency level may impact system performance')
    }

    if (configuration.timeout && configuration.timeout > 1800000) { // 30 minutes
      warnings.push('Very long timeout may cause resource issues')
    }

    if (configuration.environment === 'production' && configuration.autoFixEnabled) {
      warnings.push('Auto-fix is enabled for production environment - use with caution')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Create configuration from template
   */
  public async createFromTemplate(templateId: string, overrides?: Partial<TestConfiguration>): Promise<string> {
    const template = this.configurationTemplates.get(templateId)
    if (!template) {
      throw new Error(`Template '${templateId}' not found`)
    }

    const configuration: TestConfiguration = {
      id: this.generateConfigurationId(),
      name: template.name || 'Untitled Configuration',
      environment: template.environment || 'development',
      testSuites: template.testSuites || [],
      userProfiles: template.userProfiles || [],
      concurrencyLevel: template.concurrencyLevel || 1,
      timeout: template.timeout || 300000,
      retryAttempts: template.retryAttempts || 1,
      reportingOptions: template.reportingOptions || {
        formats: ['json'],
        includeDetails: true,
        includeLogs: false
      },
      autoFixEnabled: template.autoFixEnabled || false,
      notificationSettings: template.notificationSettings || {
        onCompletion: false,
        onFailure: true,
        recipients: []
      },
      ...overrides
    }

    return await this.createConfiguration(configuration)
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'firebase_basic',
        name: 'Firebase Basic Testing',
        description: 'Basic Firebase integration testing configuration'
      },
      {
        id: 'security_comprehensive',
        name: 'Comprehensive Security Testing',
        description: 'Full security validation and monitoring tests'
      },
      {
        id: 'full_integration',
        name: 'Full Integration Testing',
        description: 'Complete testing suite including all available test suites'
      }
    ]
  }

  /**
   * Clone configuration
   */
  public async cloneConfiguration(sourceId: string, newName?: string): Promise<string> {
    const source = await this.getConfiguration(sourceId)
    if (!source) {
      throw new Error('Source configuration not found')
    }

    const cloned: TestConfiguration = {
      ...source,
      id: this.generateConfigurationId(),
      name: newName || `${source.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return await this.createConfiguration(cloned)
  }

  /**
   * Export configuration
   */
  public async exportConfiguration(id: string): Promise<string> {
    const configuration = await this.getConfiguration(id)
    if (!configuration) {
      throw new Error('Configuration not found')
    }

    return JSON.stringify(configuration, null, 2)
  }

  /**
   * Import configuration
   */
  public async importConfiguration(configurationJson: string): Promise<string> {
    try {
      const configuration = JSON.parse(configurationJson) as TestConfiguration
      
      // Remove ID to generate a new one
      delete configuration.id
      delete configuration.createdAt
      delete configuration.updatedAt

      return await this.createConfiguration(configuration)
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`)
    }
  }

  /**
   * Search configurations
   */
  public async searchConfigurations(query: string): Promise<TestConfiguration[]> {
    const allConfigurations = await this.listConfigurations()
    const lowerQuery = query.toLowerCase()

    return allConfigurations.filter(config => 
      config.name.toLowerCase().includes(lowerQuery) ||
      config.environment.toLowerCase().includes(lowerQuery) ||
      config.testSuites.some(suite => suite.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Get configuration statistics
   */
  public async getConfigurationStatistics(): Promise<any> {
    const configurations = await this.listConfigurations()
    
    const stats = {
      total: configurations.length,
      byEnvironment: {} as Record<string, number>,
      byTestSuiteCount: {} as Record<string, number>,
      averageConcurrency: 0,
      averageTimeout: 0,
      autoFixEnabled: 0
    }

    configurations.forEach(config => {
      // Environment stats
      stats.byEnvironment[config.environment] = (stats.byEnvironment[config.environment] || 0) + 1
      
      // Test suite count stats
      const suiteCount = config.testSuites.length.toString()
      stats.byTestSuiteCount[suiteCount] = (stats.byTestSuiteCount[suiteCount] || 0) + 1
      
      // Auto-fix enabled count
      if (config.autoFixEnabled) {
        stats.autoFixEnabled++
      }
    })

    // Calculate averages
    if (configurations.length > 0) {
      stats.averageConcurrency = configurations.reduce((sum, c) => sum + c.concurrencyLevel, 0) / configurations.length
      stats.averageTimeout = configurations.reduce((sum, c) => sum + c.timeout, 0) / configurations.length
    }

    return stats
  }

  /**
   * Generate configuration ID
   */
  private generateConfigurationId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleanup old configurations
   */
  public async cleanupOldConfigurations(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffTime = Date.now() - maxAge
    let cleanedCount = 0

    for (const [configId, config] of this.configurations.entries()) {
      if (config.createdAt && config.createdAt < cutoffTime) {
        this.configurations.delete(configId)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}