import { TestConfigurationManager, TestConfiguration, UserProfile, TestSuiteConfig } from '../configuration/TestConfigurationManager';
import fs from 'fs';
import path from 'path';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

class ConfigurationSystemTester {
  private results: TestResult[] = [];
  private testConfigDir: string;
  private manager: TestConfigurationManager;

  constructor() {
    this.testConfigDir = path.join(process.cwd(), 'test-configurations-temp');
    this.manager = new TestConfigurationManager(this.testConfigDir);
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Configuration System Tests...\n');

    await this.testConfigurationManager();
    await this.testConfigurationValidation();
    await this.testTemplateManagement();
    await this.testImportExport();
    await this.testUserProfileManagement();
    await this.testTestSuiteConfiguration();

    this.cleanup();
    this.printSummary();
    return this.results;
  }

  private async testConfigurationManager(): Promise<void> {
    console.log('⚙️ Testing Configuration Manager...');

    // Test manager initialization
    await this.runTest('Manager Initialization', async () => {
      const manager = new TestConfigurationManager(this.testConfigDir);
      
      if (!manager) {
        throw new Error('Configuration manager not created');
      }

      const configs = manager.getAllConfigurations();
      if (!Array.isArray(configs)) {
        throw new Error('getAllConfigurations should return an array');
      }

      return 'Configuration manager initialized successfully';
    });

    // Test configuration creation
    await this.runTest('Configuration Creation', async () => {
      const configData = this.createMockConfiguration();
      const configId = this.manager.createConfiguration(configData);
      
      if (!configId || typeof configId !== 'string') {
        throw new Error('Configuration ID not returned');
      }

      const savedConfig = this.manager.getConfiguration(configId);
      if (!savedConfig) {
        throw new Error('Configuration not saved properly');
      }

      if (savedConfig.name !== configData.name) {
        throw new Error('Configuration data not saved correctly');
      }

      return `Configuration created with ID: ${configId}`;
    });

    // Test configuration update
    await this.runTest('Configuration Update', async () => {
      const configData = this.createMockConfiguration();
      const configId = this.manager.createConfiguration(configData);
      
      const updates = {
        name: 'Updated Configuration Name',
        description: 'Updated description',
        concurrencyLevel: 25
      };

      this.manager.updateConfiguration(configId, updates);
      
      const updatedConfig = this.manager.getConfiguration(configId);
      if (!updatedConfig) {
        throw new Error('Updated configuration not found');
      }

      if (updatedConfig.name !== updates.name ||
          updatedConfig.description !== updates.description ||
          updatedConfig.concurrencyLevel !== updates.concurrencyLevel) {
        throw new Error('Configuration updates not applied correctly');
      }

      if (updatedConfig.updatedAt <= updatedConfig.createdAt) {
        throw new Error('Updated timestamp not set correctly');
      }

      return 'Configuration updated successfully';
    });

    // Test configuration deletion
    await this.runTest('Configuration Deletion', async () => {
      const configData = this.createMockConfiguration();
      const configId = this.manager.createConfiguration(configData);
      
      // Verify it exists
      let config = this.manager.getConfiguration(configId);
      if (!config) {
        throw new Error('Configuration not created for deletion test');
      }

      this.manager.deleteConfiguration(configId);
      
      // Verify it's deleted
      config = this.manager.getConfiguration(configId);
      if (config) {
        throw new Error('Configuration not deleted');
      }

      // Verify file is deleted
      const filePath = path.join(this.testConfigDir, `${configId}.json`);
      if (fs.existsSync(filePath)) {
        throw new Error('Configuration file not deleted');
      }

      return 'Configuration deleted successfully';
    });

    // Test configuration cloning
    await this.runTest('Configuration Cloning', async () => {
      const configData = this.createMockConfiguration();
      const originalId = this.manager.createConfiguration(configData);
      
      const clonedId = this.manager.cloneConfiguration(originalId, 'Cloned Configuration');
      
      if (clonedId === originalId) {
        throw new Error('Cloned configuration has same ID as original');
      }

      const originalConfig = this.manager.getConfiguration(originalId);
      const clonedConfig = this.manager.getConfiguration(clonedId);
      
      if (!originalConfig || !clonedConfig) {
        throw new Error('Original or cloned configuration not found');
      }

      if (clonedConfig.name !== 'Cloned Configuration') {
        throw new Error('Cloned configuration name not set correctly');
      }

      if (clonedConfig.environment !== originalConfig.environment ||
          clonedConfig.concurrencyLevel !== originalConfig.concurrencyLevel) {
        throw new Error('Cloned configuration data not copied correctly');
      }

      return 'Configuration cloned successfully';
    });

    // Test configuration filtering
    await this.runTest('Configuration Filtering', async () => {
      // Create configurations with different environments and tags
      const devConfig = this.createMockConfiguration();
      devConfig.environment = 'development';
      devConfig.tags = ['smoke', 'quick'];
      const devId = this.manager.createConfiguration(devConfig);

      const stagingConfig = this.createMockConfiguration();
      stagingConfig.environment = 'staging';
      stagingConfig.tags = ['regression', 'full'];
      const stagingId = this.manager.createConfiguration(stagingConfig);

      // Test environment filtering
      const devConfigs = this.manager.getConfigurationsByEnvironment('development');
      const stagingConfigs = this.manager.getConfigurationsByEnvironment('staging');
      
      if (!devConfigs.some(c => c.id === devId)) {
        throw new Error('Development configuration not found in environment filter');
      }

      if (!stagingConfigs.some(c => c.id === stagingId)) {
        throw new Error('Staging configuration not found in environment filter');
      }

      // Test tag filtering
      const smokeConfigs = this.manager.getConfigurationsByTag('smoke');
      const regressionConfigs = this.manager.getConfigurationsByTag('regression');
      
      if (!smokeConfigs.some(c => c.id === devId)) {
        throw new Error('Configuration not found in tag filter');
      }

      if (!regressionConfigs.some(c => c.id === stagingId)) {
        throw new Error('Configuration not found in tag filter');
      }

      return 'Configuration filtering works correctly';
    });
  }

  private async testConfigurationValidation(): Promise<void> {
    console.log('✅ Testing Configuration Validation...');

    // Test valid configuration
    await this.runTest('Valid Configuration Validation', async () => {
      const validConfig = this.createMockConfiguration();
      const validation = this.manager.validateConfiguration(validConfig);
      
      if (!validation.isValid) {
        throw new Error(`Valid configuration failed validation: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      return 'Valid configuration passed validation';
    });

    // Test missing required fields
    await this.runTest('Missing Required Fields Validation', async () => {
      const invalidConfig = this.createMockConfiguration();
      invalidConfig.name = ''; // Empty name should fail
      
      const validation = this.manager.validateConfiguration(invalidConfig);
      
      if (validation.isValid) {
        throw new Error('Configuration with empty name should not be valid');
      }

      const nameError = validation.errors.find(e => e.field === 'name');
      if (!nameError) {
        throw new Error('Name validation error not found');
      }

      return 'Missing required fields validation works correctly';
    });

    // Test invalid values
    await this.runTest('Invalid Values Validation', async () => {
      const invalidConfig = this.createMockConfiguration();
      invalidConfig.concurrencyLevel = -5; // Negative concurrency should fail
      invalidConfig.timeout = 0; // Zero timeout should fail
      
      const validation = this.manager.validateConfiguration(invalidConfig);
      
      if (validation.isValid) {
        throw new Error('Configuration with invalid values should not be valid');
      }

      const concurrencyError = validation.errors.find(e => e.field === 'concurrencyLevel');
      const timeoutError = validation.errors.find(e => e.field === 'timeout');
      
      if (!concurrencyError || !timeoutError) {
        throw new Error('Invalid value validation errors not found');
      }

      return 'Invalid values validation works correctly';
    });

    // Test circular dependencies
    await this.runTest('Circular Dependencies Validation', async () => {
      const invalidConfig = this.createMockConfiguration();
      invalidConfig.testSuites = [
        {
          id: 'suite-a',
          name: 'Suite A',
          enabled: true,
          priority: 1,
          parameters: {},
          dependencies: ['suite-b']
        },
        {
          id: 'suite-b',
          name: 'Suite B',
          enabled: true,
          priority: 2,
          parameters: {},
          dependencies: ['suite-a'] // Circular dependency
        }
      ];
      
      const validation = this.manager.validateConfiguration(invalidConfig);
      
      if (validation.isValid) {
        throw new Error('Configuration with circular dependencies should not be valid');
      }

      const circularError = validation.errors.find(e => e.message.includes('Circular dependencies'));
      if (!circularError) {
        throw new Error('Circular dependency validation error not found');
      }

      return 'Circular dependencies validation works correctly';
    });

    // Test user profile weight validation
    await this.runTest('User Profile Weight Validation', async () => {
      const invalidConfig = this.createMockConfiguration();
      invalidConfig.userProfiles = [
        {
          id: 'profile-1',
          name: 'Profile 1',
          role: 'passenger',
          weight: 60, // Total will be 110% (60 + 50)
          demographics: {
            age: 30,
            location: 'urban',
            deviceType: 'mobile',
            experience: 'regular'
          },
          preferences: {
            paymentMethod: 'credit_card',
            language: 'en',
            notificationSettings: {}
          },
          behaviorPatterns: {
            bookingFrequency: 5,
            averageRideDistance: 10,
            cancellationRate: 0.05,
            preferredTimes: ['09:00']
          }
        },
        {
          id: 'profile-2',
          name: 'Profile 2',
          role: 'driver',
          weight: 50,
          demographics: {
            age: 35,
            location: 'urban',
            deviceType: 'mobile',
            experience: 'power'
          },
          preferences: {
            paymentMethod: 'bank_transfer',
            language: 'en',
            notificationSettings: {}
          },
          behaviorPatterns: {
            bookingFrequency: 10,
            averageRideDistance: 15,
            cancellationRate: 0.02,
            preferredTimes: ['08:00', '17:00']
          }
        }
      ];
      
      const validation = this.manager.validateConfiguration(invalidConfig);
      
      // Should have warnings about weight sum
      const weightWarning = validation.warnings.find(w => w.message.includes('weights sum'));
      if (!weightWarning) {
        throw new Error('User profile weight validation warning not found');
      }

      return 'User profile weight validation works correctly';
    });
  }

  private async testTemplateManagement(): Promise<void> {
    console.log('📋 Testing Template Management...');

    // Test default templates loading
    await this.runTest('Default Templates Loading', async () => {
      const templates = this.manager.getTemplates();
      
      if (!Array.isArray(templates) || templates.length === 0) {
        throw new Error('Default templates not loaded');
      }

      const smokeTemplate = templates.find(t => t.id === 'smoke-test');
      const regressionTemplate = templates.find(t => t.id === 'regression-test');
      
      if (!smokeTemplate || !regressionTemplate) {
        throw new Error('Expected default templates not found');
      }

      return `Loaded ${templates.length} default templates`;
    });

    // Test creating configuration from template
    await this.runTest('Create Configuration from Template', async () => {
      const configId = this.manager.createFromTemplate('smoke-test', {
        name: 'My Smoke Test Configuration'
      });
      
      const config = this.manager.getConfiguration(configId);
      if (!config) {
        throw new Error('Configuration not created from template');
      }

      if (config.name !== 'My Smoke Test Configuration') {
        throw new Error('Template override not applied');
      }

      if (config.environment !== 'development') {
        throw new Error('Template default values not applied');
      }

      return 'Configuration created from template successfully';
    });

    // Test custom template creation
    await this.runTest('Custom Template Creation', async () => {
      const templateData = {
        name: 'Custom Test Template',
        description: 'A custom template for testing',
        category: 'smoke' as const,
        configuration: {
          name: 'Custom Template Configuration',
          environment: 'development' as const,
          concurrencyLevel: 5,
          testSuites: [],
          userProfiles: []
        }
      };

      const templateId = this.manager.createTemplate(templateData);
      
      if (!templateId) {
        throw new Error('Template ID not returned');
      }

      const template = this.manager.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not saved');
      }

      if (template.name !== templateData.name) {
        throw new Error('Template data not saved correctly');
      }

      return `Custom template created with ID: ${templateId}`;
    });

    // Test template deletion
    await this.runTest('Template Deletion', async () => {
      const templateData = {
        name: 'Template to Delete',
        description: 'This template will be deleted',
        category: 'smoke' as const,
        configuration: {
          name: 'Delete Me',
          environment: 'development' as const
        }
      };

      const templateId = this.manager.createTemplate(templateData);
      
      // Verify it exists
      let template = this.manager.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not created for deletion test');
      }

      this.manager.deleteTemplate(templateId);
      
      // Verify it's deleted
      template = this.manager.getTemplate(templateId);
      if (template) {
        throw new Error('Template not deleted');
      }

      return 'Template deleted successfully';
    });
  }

  private async testImportExport(): Promise<void> {
    console.log('📤 Testing Import/Export...');

    // Test configuration export
    await this.runTest('Configuration Export', async () => {
      const configData = this.createMockConfiguration();
      const configId = this.manager.createConfiguration(configData);
      
      const exportedData = this.manager.exportConfiguration(configId, 'json');
      
      if (!exportedData || typeof exportedData !== 'string') {
        throw new Error('Export data not returned as string');
      }

      const parsedData = JSON.parse(exportedData);
      if (parsedData.id !== configId || parsedData.name !== configData.name) {
        throw new Error('Exported data does not match original configuration');
      }

      return 'Configuration exported successfully';
    });

    // Test configuration import
    await this.runTest('Configuration Import', async () => {
      const configData = this.createMockConfiguration();
      configData.name = 'Imported Configuration';
      const exportData = JSON.stringify(configData);
      
      const importedId = this.manager.importConfiguration(exportData, 'json');
      
      if (!importedId) {
        throw new Error('Import did not return configuration ID');
      }

      const importedConfig = this.manager.getConfiguration(importedId);
      if (!importedConfig) {
        throw new Error('Imported configuration not found');
      }

      if (importedConfig.name !== 'Imported Configuration') {
        throw new Error('Imported configuration data incorrect');
      }

      // ID should be different from original
      if (importedConfig.id === configData.id) {
        throw new Error('Imported configuration should have new ID');
      }

      return 'Configuration imported successfully';
    });

    // Test invalid import data
    await this.runTest('Invalid Import Data Handling', async () => {
      const invalidData = '{ invalid json data }';
      
      try {
        this.manager.importConfiguration(invalidData, 'json');
        throw new Error('Import should have failed with invalid JSON');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Failed to parse')) {
          return 'Invalid import data handled correctly';
        }
        throw error;
      }
    });
  }

  private async testUserProfileManagement(): Promise<void> {
    console.log('👥 Testing User Profile Management...');

    // Test user profile creation and validation
    await this.runTest('User Profile Creation', async () => {
      const profile: UserProfile = {
        id: 'test-profile',
        name: 'Test User Profile',
        role: 'passenger',
        weight: 100,
        demographics: {
          age: 28,
          location: 'suburban',
          deviceType: 'mobile',
          experience: 'new'
        },
        preferences: {
          paymentMethod: 'paypal',
          language: 'es',
          notificationSettings: { push: true }
        },
        behaviorPatterns: {
          bookingFrequency: 3,
          averageRideDistance: 8,
          cancellationRate: 0.1,
          preferredTimes: ['10:00', '14:00', '19:00']
        }
      };

      const configData = this.createMockConfiguration();
      configData.userProfiles = [profile];
      
      const configId = this.manager.createConfiguration(configData);
      const savedConfig = this.manager.getConfiguration(configId);
      
      if (!savedConfig || savedConfig.userProfiles.length !== 1) {
        throw new Error('User profile not saved correctly');
      }

      const savedProfile = savedConfig.userProfiles[0];
      if (savedProfile.name !== profile.name ||
          savedProfile.role !== profile.role ||
          savedProfile.demographics.age !== profile.demographics.age) {
        throw new Error('User profile data not saved correctly');
      }

      return 'User profile created and saved successfully';
    });

    // Test multiple user profiles with weight validation
    await this.runTest('Multiple User Profiles Weight Validation', async () => {
      const profiles: UserProfile[] = [
        {
          id: 'profile-1',
          name: 'Regular Passenger',
          role: 'passenger',
          weight: 70,
          demographics: { age: 30, location: 'urban', deviceType: 'mobile', experience: 'regular' },
          preferences: { paymentMethod: 'credit_card', language: 'en', notificationSettings: {} },
          behaviorPatterns: { bookingFrequency: 5, averageRideDistance: 10, cancellationRate: 0.05, preferredTimes: ['09:00'] }
        },
        {
          id: 'profile-2',
          name: 'Power User',
          role: 'passenger',
          weight: 30,
          demographics: { age: 35, location: 'urban', deviceType: 'desktop', experience: 'power' },
          preferences: { paymentMethod: 'paypal', language: 'en', notificationSettings: {} },
          behaviorPatterns: { bookingFrequency: 15, averageRideDistance: 20, cancellationRate: 0.02, preferredTimes: ['08:00', '18:00'] }
        }
      ];

      const configData = this.createMockConfiguration();
      configData.userProfiles = profiles;
      
      const validation = this.manager.validateConfiguration(configData);
      
      // Should be valid since weights sum to 100%
      if (!validation.isValid) {
        throw new Error('Valid user profiles configuration failed validation');
      }

      // Should not have weight warnings
      const weightWarning = validation.warnings.find(w => w.message.includes('weights sum'));
      if (weightWarning) {
        throw new Error('Unexpected weight warning for valid profile weights');
      }

      return 'Multiple user profiles with correct weights validated successfully';
    });
  }

  private async testTestSuiteConfiguration(): Promise<void> {
    console.log('🧪 Testing Test Suite Configuration...');

    // Test available test suites
    await this.runTest('Available Test Suites', async () => {
      const availableSuites = this.manager.getAvailableTestSuites();
      
      if (!Array.isArray(availableSuites) || availableSuites.length === 0) {
        throw new Error('No available test suites found');
      }

      const firebaseAuth = availableSuites.find(s => s.id === 'firebase-auth');
      const bookingWorkflows = availableSuites.find(s => s.id === 'booking-workflows');
      
      if (!firebaseAuth || !bookingWorkflows) {
        throw new Error('Expected test suites not found');
      }

      // Check dependencies
      if (!bookingWorkflows.dependencies.includes('firebase-auth')) {
        throw new Error('Test suite dependencies not configured correctly');
      }

      return `Found ${availableSuites.length} available test suites`;
    });

    // Test test suite selection and configuration
    await this.runTest('Test Suite Selection and Configuration', async () => {
      const testSuites: TestSuiteConfig[] = [
        {
          id: 'firebase-auth',
          name: 'Firebase Authentication',
          enabled: true,
          priority: 1,
          parameters: { quickMode: true, skipPasswordReset: false },
          dependencies: []
        },
        {
          id: 'ui-components',
          name: 'UI Components',
          enabled: true,
          priority: 2,
          parameters: { browsers: ['chrome', 'firefox'], skipVisualTests: true },
          dependencies: []
        }
      ];

      const configData = this.createMockConfiguration();
      configData.testSuites = testSuites;
      
      const configId = this.manager.createConfiguration(configData);
      const savedConfig = this.manager.getConfiguration(configId);
      
      if (!savedConfig || savedConfig.testSuites.length !== 2) {
        throw new Error('Test suites not saved correctly');
      }

      const authSuite = savedConfig.testSuites.find(s => s.id === 'firebase-auth');
      if (!authSuite || !authSuite.parameters.quickMode) {
        throw new Error('Test suite parameters not saved correctly');
      }

      return 'Test suite selection and configuration saved successfully';
    });

    // Test test suite dependency validation
    await this.runTest('Test Suite Dependency Validation', async () => {
      const testSuites: TestSuiteConfig[] = [
        {
          id: 'booking-workflows',
          name: 'Booking Workflows',
          enabled: true,
          priority: 1,
          parameters: {},
          dependencies: ['firebase-auth', 'websocket-messaging'] // Dependencies not included
        }
      ];

      const configData = this.createMockConfiguration();
      configData.testSuites = testSuites;
      
      // This should still be valid as validation doesn't check if dependencies are included
      // (that would be a runtime check)
      const validation = this.manager.validateConfiguration(configData);
      
      if (!validation.isValid) {
        throw new Error('Configuration with missing dependencies should still be valid for storage');
      }

      return 'Test suite dependency validation works correctly';
    });
  }

  private createMockConfiguration(): TestConfiguration {
    return {
      id: `test-config-${Date.now()}`,
      name: 'Test Configuration',
      description: 'A test configuration for unit testing',
      environment: 'development',
      testSuites: [
        {
          id: 'firebase-auth',
          name: 'Firebase Authentication',
          enabled: true,
          priority: 1,
          parameters: {},
          dependencies: []
        }
      ],
      userProfiles: [
        {
          id: 'test-user',
          name: 'Test User',
          role: 'passenger',
          weight: 100,
          demographics: {
            age: 30,
            location: 'urban',
            deviceType: 'mobile',
            experience: 'regular'
          },
          preferences: {
            paymentMethod: 'credit_card',
            language: 'en',
            notificationSettings: {}
          },
          behaviorPatterns: {
            bookingFrequency: 5,
            averageRideDistance: 10,
            cancellationRate: 0.05,
            preferredTimes: ['09:00', '17:00']
          }
        }
      ],
      concurrencyLevel: 10,
      timeout: 600000,
      retryAttempts: 1,
      reportingOptions: {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: true,
        formats: ['json', 'html']
      },
      autoFixEnabled: false,
      notificationSettings: {
        onTestStart: false,
        onTestComplete: true,
        onTestFailure: true,
        onCriticalError: true,
        channels: ['email']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['test', 'unit-test']
    };
  }

  private async runTest(testName: string, testFunction: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        message,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        testName,
        passed: false,
        message,
        duration,
        details: error
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  private cleanup(): void {
    // Clean up test configuration directory
    if (fs.existsSync(this.testConfigDir)) {
      const files = fs.readdirSync(this.testConfigDir);
      for (const file of files) {
        const filePath = path.join(this.testConfigDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          // Remove subdirectory
          const subFiles = fs.readdirSync(filePath);
          for (const subFile of subFiles) {
            fs.unlinkSync(path.join(filePath, subFile));
          }
          fs.rmdirSync(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      fs.rmdirSync(this.testConfigDir);
    }
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }

    console.log('\n🎉 Configuration System testing completed!');
  }
}

// Export for use in other test files
export { ConfigurationSystemTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ConfigurationSystemTester();
  tester.runAllTests().catch(console.error);
}