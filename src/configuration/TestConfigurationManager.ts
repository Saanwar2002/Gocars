import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface TestConfiguration {
  id: string;
  name: string;
  description?: string;
  environment: 'development' | 'staging' | 'production';
  testSuites: TestSuiteConfig[];
  userProfiles: UserProfile[];
  concurrencyLevel: number;
  timeout: number;
  retryAttempts: number;
  reportingOptions: ReportingOptions;
  autoFixEnabled: boolean;
  notificationSettings: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface TestSuiteConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  parameters: Record<string, any>;
  dependencies: string[];
  timeout?: number;
  retryAttempts?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'passenger' | 'driver' | 'operator' | 'admin';
  demographics: {
    age: number;
    location: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    experience: 'new' | 'regular' | 'power';
  };
  preferences: {
    paymentMethod: string;
    notificationSettings: any;
    language: string;
  };
  behaviorPatterns: {
    bookingFrequency: number;
    averageRideDistance: number;
    preferredTimes: string[];
    cancellationRate: number;
  };
  weight: number; // Percentage of users with this profile (0-100)
}

export interface ReportingOptions {
  includeExecutiveSummary: boolean;
  includeTechnicalDetails: boolean;
  includeTrendAnalysis: boolean;
  includeRecommendations: boolean;
  formats: ('json' | 'html' | 'pdf')[];
  outputPath?: string;
  emailRecipients?: string[];
  slackWebhook?: string;
}

export interface NotificationSettings {
  onTestStart: boolean;
  onTestComplete: boolean;
  onTestFailure: boolean;
  onCriticalError: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  webhookUrl?: string;
  emailRecipients?: string[];
  slackChannel?: string;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'smoke' | 'regression' | 'performance' | 'security' | 'full';
  configuration: Partial<TestConfiguration>;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export class TestConfigurationManager extends EventEmitter {
  private configurations: Map<string, TestConfiguration> = new Map();
  private templates: Map<string, ConfigurationTemplate> = new Map();
  private configDirectory: string;
  private templatesDirectory: string;

  constructor(configDirectory: string = './test-configurations') {
    super();
    this.configDirectory = configDirectory;
    this.templatesDirectory = path.join(configDirectory, 'templates');
    this.ensureDirectories();
    this.loadConfigurations();
    this.loadTemplates();
    this.setupDefaultTemplates();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.configDirectory)) {
      fs.mkdirSync(this.configDirectory, { recursive: true });
    }
    if (!fs.existsSync(this.templatesDirectory)) {
      fs.mkdirSync(this.templatesDirectory, { recursive: true });
    }
  }

  private loadConfigurations(): void {
    try {
      const configFiles = fs.readdirSync(this.configDirectory)
        .filter(file => file.endsWith('.json') && !file.startsWith('template-'));

      for (const file of configFiles) {
        try {
          const filePath = path.join(this.configDirectory, file);
          const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Convert date strings back to Date objects
          configData.createdAt = new Date(configData.createdAt);
          configData.updatedAt = new Date(configData.updatedAt);
          
          this.configurations.set(configData.id, configData);
        } catch (error) {
          console.warn(`Failed to load configuration from ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load configurations:', error);
    }
  }

  private loadTemplates(): void {
    try {
      const templateFiles = fs.readdirSync(this.templatesDirectory)
        .filter(file => file.endsWith('.json'));

      for (const file of templateFiles) {
        try {
          const filePath = path.join(this.templatesDirectory, file);
          const templateData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.templates.set(templateData.id, templateData);
        } catch (error) {
          console.warn(`Failed to load template from ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load templates:', error);
    }
  }

  private setupDefaultTemplates(): void {
    const defaultTemplates: ConfigurationTemplate[] = [
      {
        id: 'smoke-test',
        name: 'Smoke Test',
        description: 'Quick validation of core functionality',
        category: 'smoke',
        configuration: {
          name: 'Smoke Test Configuration',
          environment: 'development',
          concurrencyLevel: 5,
          timeout: 300000, // 5 minutes
          retryAttempts: 1,
          testSuites: [
            {
              id: 'firebase-auth',
              name: 'Firebase Authentication',
              enabled: true,
              priority: 1,
              parameters: { quickMode: true },
              dependencies: []
            },
            {
              id: 'basic-ui',
              name: 'Basic UI Components',
              enabled: true,
              priority: 2,
              parameters: { skipVisualTests: true },
              dependencies: []
            }
          ],
          userProfiles: [
            {
              id: 'basic-passenger',
              name: 'Basic Passenger',
              role: 'passenger',
              demographics: {
                age: 30,
                location: 'urban',
                deviceType: 'mobile',
                experience: 'regular'
              },
              preferences: {
                paymentMethod: 'credit_card',
                notificationSettings: {},
                language: 'en'
              },
              behaviorPatterns: {
                bookingFrequency: 5,
                averageRideDistance: 10,
                preferredTimes: ['09:00', '17:00'],
                cancellationRate: 0.05
              },
              weight: 100
            }
          ],
          autoFixEnabled: false,
          reportingOptions: {
            includeExecutiveSummary: true,
            includeTechnicalDetails: false,
            includeTrendAnalysis: false,
            includeRecommendations: true,
            formats: ['json', 'html']
          },
          notificationSettings: {
            onTestStart: false,
            onTestComplete: true,
            onTestFailure: true,
            onCriticalError: true,
            channels: ['email']
          }
        }
      },
      {
        id: 'regression-test',
        name: 'Regression Test',
        description: 'Comprehensive testing of all features',
        category: 'regression',
        configuration: {
          name: 'Regression Test Configuration',
          environment: 'staging',
          concurrencyLevel: 20,
          timeout: 1800000, // 30 minutes
          retryAttempts: 2,
          testSuites: [
            {
              id: 'firebase-full',
              name: 'Firebase Full Suite',
              enabled: true,
              priority: 1,
              parameters: {},
              dependencies: []
            },
            {
              id: 'websocket-full',
              name: 'WebSocket Full Suite',
              enabled: true,
              priority: 2,
              parameters: {},
              dependencies: ['firebase-full']
            },
            {
              id: 'ui-full',
              name: 'UI Full Suite',
              enabled: true,
              priority: 3,
              parameters: {},
              dependencies: []
            },
            {
              id: 'booking-workflows',
              name: 'Booking Workflows',
              enabled: true,
              priority: 4,
              parameters: {},
              dependencies: ['firebase-full', 'websocket-full']
            }
          ],
          autoFixEnabled: true,
          reportingOptions: {
            includeExecutiveSummary: true,
            includeTechnicalDetails: true,
            includeTrendAnalysis: true,
            includeRecommendations: true,
            formats: ['json', 'html', 'pdf']
          },
          notificationSettings: {
            onTestStart: true,
            onTestComplete: true,
            onTestFailure: true,
            onCriticalError: true,
            channels: ['email', 'slack']
          }
        }
      },
      {
        id: 'performance-test',
        name: 'Performance Test',
        description: 'Load and performance testing',
        category: 'performance',
        configuration: {
          name: 'Performance Test Configuration',
          environment: 'staging',
          concurrencyLevel: 100,
          timeout: 3600000, // 1 hour
          retryAttempts: 1,
          testSuites: [
            {
              id: 'load-testing',
              name: 'Load Testing',
              enabled: true,
              priority: 1,
              parameters: { 
                maxUsers: 1000,
                rampUpTime: 300,
                sustainTime: 1800
              },
              dependencies: []
            },
            {
              id: 'stress-testing',
              name: 'Stress Testing',
              enabled: true,
              priority: 2,
              parameters: {
                maxUsers: 2000,
                rampUpTime: 600
              },
              dependencies: ['load-testing']
            }
          ],
          autoFixEnabled: false,
          reportingOptions: {
            includeExecutiveSummary: true,
            includeTechnicalDetails: true,
            includeTrendAnalysis: true,
            includeRecommendations: true,
            formats: ['json', 'html']
          },
          notificationSettings: {
            onTestStart: true,
            onTestComplete: true,
            onTestFailure: true,
            onCriticalError: true,
            channels: ['email', 'slack']
          }
        }
      }
    ];

    // Save default templates if they don't exist
    for (const template of defaultTemplates) {
      if (!this.templates.has(template.id)) {
        this.templates.set(template.id, template);
        this.saveTemplate(template);
      }
    }
  }

  public createConfiguration(config: Partial<TestConfiguration>): string {
    const id = config.id || this.generateId();
    const now = new Date();
    
    const fullConfig: TestConfiguration = {
      id,
      name: config.name || 'Untitled Configuration',
      description: config.description,
      environment: config.environment || 'development',
      testSuites: config.testSuites || [],
      userProfiles: config.userProfiles || [],
      concurrencyLevel: config.concurrencyLevel || 10,
      timeout: config.timeout || 600000, // 10 minutes
      retryAttempts: config.retryAttempts || 1,
      reportingOptions: config.reportingOptions || {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: true,
        formats: ['json', 'html']
      },
      autoFixEnabled: config.autoFixEnabled || false,
      notificationSettings: config.notificationSettings || {
        onTestStart: false,
        onTestComplete: true,
        onTestFailure: true,
        onCriticalError: true,
        channels: ['email']
      },
      createdAt: now,
      updatedAt: now,
      createdBy: config.createdBy,
      tags: config.tags || []
    };

    // Validate configuration
    const validation = this.validateConfiguration(fullConfig);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configurations.set(id, fullConfig);
    this.saveConfiguration(fullConfig);
    
    this.emit('configurationCreated', fullConfig);
    return id;
  }

  public updateConfiguration(id: string, updates: Partial<TestConfiguration>): void {
    const existing = this.configurations.get(id);
    if (!existing) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    const updated: TestConfiguration = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    // Validate updated configuration
    const validation = this.validateConfiguration(updated);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configurations.set(id, updated);
    this.saveConfiguration(updated);
    
    this.emit('configurationUpdated', updated);
  }

  public deleteConfiguration(id: string): void {
    const config = this.configurations.get(id);
    if (!config) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    this.configurations.delete(id);
    
    // Delete file
    const filePath = path.join(this.configDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    this.emit('configurationDeleted', config);
  }

  public getConfiguration(id: string): TestConfiguration | undefined {
    return this.configurations.get(id);
  }

  public getAllConfigurations(): TestConfiguration[] {
    return Array.from(this.configurations.values());
  }

  public getConfigurationsByTag(tag: string): TestConfiguration[] {
    return Array.from(this.configurations.values())
      .filter(config => config.tags?.includes(tag));
  }

  public getConfigurationsByEnvironment(environment: string): TestConfiguration[] {
    return Array.from(this.configurations.values())
      .filter(config => config.environment === environment);
  }

  public cloneConfiguration(id: string, newName?: string): string {
    const original = this.configurations.get(id);
    if (!original) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    const cloned = {
      ...original,
      id: undefined, // Will be generated
      name: newName || `${original.name} (Copy)`,
      createdAt: undefined, // Will be set to now
      updatedAt: undefined // Will be set to now
    };

    return this.createConfiguration(cloned);
  }

  public createFromTemplate(templateId: string, overrides: Partial<TestConfiguration> = {}): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const config = {
      ...template.configuration,
      ...overrides
    };

    return this.createConfiguration(config);
  }

  public validateConfiguration(config: TestConfiguration): ConfigurationValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic validation
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Configuration name is required',
        severity: 'error'
      });
    }

    if (!config.environment) {
      errors.push({
        field: 'environment',
        message: 'Environment is required',
        severity: 'error'
      });
    }

    if (config.concurrencyLevel <= 0) {
      errors.push({
        field: 'concurrencyLevel',
        message: 'Concurrency level must be greater than 0',
        severity: 'error'
      });
    }

    if (config.timeout <= 0) {
      errors.push({
        field: 'timeout',
        message: 'Timeout must be greater than 0',
        severity: 'error'
      });
    }

    if (config.retryAttempts < 0) {
      errors.push({
        field: 'retryAttempts',
        message: 'Retry attempts cannot be negative',
        severity: 'error'
      });
    }

    // Test suites validation
    if (!config.testSuites || config.testSuites.length === 0) {
      warnings.push({
        field: 'testSuites',
        message: 'No test suites configured',
        suggestion: 'Add at least one test suite to run meaningful tests'
      });
    } else {
      // Check for duplicate test suite IDs
      const suiteIds = config.testSuites.map(s => s.id);
      const duplicates = suiteIds.filter((id, index) => suiteIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push({
          field: 'testSuites',
          message: `Duplicate test suite IDs found: ${duplicates.join(', ')}`,
          severity: 'error'
        });
      }

      // Check for circular dependencies
      const circularDeps = this.detectCircularDependencies(config.testSuites);
      if (circularDeps.length > 0) {
        errors.push({
          field: 'testSuites',
          message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
          severity: 'error'
        });
      }
    }

    // User profiles validation
    if (!config.userProfiles || config.userProfiles.length === 0) {
      warnings.push({
        field: 'userProfiles',
        message: 'No user profiles configured',
        suggestion: 'Add user profiles to simulate realistic user behavior'
      });
    } else {
      // Check total weight
      const totalWeight = config.userProfiles.reduce((sum, profile) => sum + profile.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        warnings.push({
          field: 'userProfiles',
          message: `User profile weights sum to ${totalWeight}%, should sum to 100%`,
          suggestion: 'Adjust profile weights to sum to exactly 100%'
        });
      }

      // Check for duplicate profile IDs
      const profileIds = config.userProfiles.map(p => p.id);
      const duplicates = profileIds.filter((id, index) => profileIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push({
          field: 'userProfiles',
          message: `Duplicate user profile IDs found: ${duplicates.join(', ')}`,
          severity: 'error'
        });
      }
    }

    // Performance warnings
    if (config.concurrencyLevel > 100) {
      warnings.push({
        field: 'concurrencyLevel',
        message: 'High concurrency level may impact system performance',
        suggestion: 'Consider starting with lower concurrency and scaling up'
      });
    }

    if (config.timeout > 3600000) { // 1 hour
      warnings.push({
        field: 'timeout',
        message: 'Very long timeout configured',
        suggestion: 'Consider if such a long timeout is necessary'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private detectCircularDependencies(testSuites: TestSuiteConfig[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const suiteMap = new Map(testSuites.map(suite => [suite.id, suite]));

    const hasCycle = (suiteId: string, path: string[]): string[] | null => {
      if (recursionStack.has(suiteId)) {
        // Found a cycle, return the path
        const cycleStart = path.indexOf(suiteId);
        return path.slice(cycleStart).concat(suiteId);
      }

      if (visited.has(suiteId)) {
        return null;
      }

      visited.add(suiteId);
      recursionStack.add(suiteId);

      const suite = suiteMap.get(suiteId);
      if (suite) {
        for (const depId of suite.dependencies) {
          const cycle = hasCycle(depId, [...path, suiteId]);
          if (cycle) {
            return cycle;
          }
        }
      }

      recursionStack.delete(suiteId);
      return null;
    };

    for (const suite of testSuites) {
      if (!visited.has(suite.id)) {
        const cycle = hasCycle(suite.id, []);
        if (cycle) {
          return cycle;
        }
      }
    }

    return [];
  }

  public getAvailableTestSuites(): TestSuiteConfig[] {
    // In a real implementation, this would query available test suites from the system
    return [
      {
        id: 'firebase-auth',
        name: 'Firebase Authentication',
        enabled: true,
        priority: 1,
        parameters: {},
        dependencies: []
      },
      {
        id: 'firebase-firestore',
        name: 'Firebase Firestore',
        enabled: true,
        priority: 2,
        parameters: {},
        dependencies: ['firebase-auth']
      },
      {
        id: 'firebase-fcm',
        name: 'Firebase Cloud Messaging',
        enabled: true,
        priority: 3,
        parameters: {},
        dependencies: ['firebase-auth']
      },
      {
        id: 'websocket-connection',
        name: 'WebSocket Connection',
        enabled: true,
        priority: 4,
        parameters: {},
        dependencies: ['firebase-auth']
      },
      {
        id: 'websocket-messaging',
        name: 'WebSocket Messaging',
        enabled: true,
        priority: 5,
        parameters: {},
        dependencies: ['websocket-connection']
      },
      {
        id: 'ui-components',
        name: 'UI Components',
        enabled: true,
        priority: 6,
        parameters: {},
        dependencies: []
      },
      {
        id: 'booking-workflows',
        name: 'Booking Workflows',
        enabled: true,
        priority: 7,
        parameters: {},
        dependencies: ['firebase-auth', 'firebase-firestore', 'websocket-messaging']
      },
      {
        id: 'ai-features',
        name: 'AI Features',
        enabled: true,
        priority: 8,
        parameters: {},
        dependencies: ['firebase-auth', 'firebase-firestore']
      }
    ];
  }

  public getTemplates(): ConfigurationTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): ConfigurationTemplate | undefined {
    return this.templates.get(id);
  }

  public createTemplate(template: Omit<ConfigurationTemplate, 'id'>): string {
    const id = this.generateId();
    const fullTemplate: ConfigurationTemplate = {
      ...template,
      id
    };

    this.templates.set(id, fullTemplate);
    this.saveTemplate(fullTemplate);
    
    this.emit('templateCreated', fullTemplate);
    return id;
  }

  public deleteTemplate(id: string): void {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    this.templates.delete(id);
    
    // Delete file
    const filePath = path.join(this.templatesDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    this.emit('templateDeleted', template);
  }

  private saveConfiguration(config: TestConfiguration): void {
    const filePath = path.join(this.configDirectory, `${config.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  }

  private saveTemplate(template: ConfigurationTemplate): void {
    const filePath = path.join(this.templatesDirectory, `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf8');
  }

  private generateId(): string {
    return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public exportConfiguration(id: string, format: 'json' | 'yaml' = 'json'): string {
    const config = this.configurations.get(id);
    if (!config) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    } else if (format === 'yaml') {
      // In a real implementation, you would use a YAML library
      throw new Error('YAML export not implemented');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  public importConfiguration(data: string, format: 'json' | 'yaml' = 'json'): string {
    let config: TestConfiguration;

    try {
      if (format === 'json') {
        config = JSON.parse(data);
      } else if (format === 'yaml') {
        // In a real implementation, you would use a YAML library
        throw new Error('YAML import not implemented');
      } else {
        throw new Error(`Unsupported import format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse configuration data: ${error}`);
    }

    // Generate new ID and update timestamps
    config.id = this.generateId();
    config.createdAt = new Date();
    config.updatedAt = new Date();

    // Validate and create
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      throw new Error(`Imported configuration is invalid: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configurations.set(config.id, config);
    this.saveConfiguration(config);
    
    this.emit('configurationImported', config);
    return config.id;
  }
}