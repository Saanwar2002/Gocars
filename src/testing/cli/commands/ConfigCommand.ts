import { CLICommand, CLIContext } from '../CLICommand';
import { TestConfigurationManager } from '../../../configuration/TestConfigurationManager';
import * as fs from 'fs';
import * as path from 'path';

export class ConfigCommand extends CLICommand {
  private configManager: TestConfigurationManager;

  constructor() {
    super({
      name: 'config',
      description: 'Manage test configuration files',
      usage: 'gocars-test config <subcommand> [options]',
      subcommands: [],
      options: [
        {
          name: 'file',
          alias: 'f',
          description: 'Configuration file path',
          type: 'string',
          default: './test-config.json'
        },
        {
          name: 'format',
          description: 'Output format for display commands',
          type: 'string',
          choices: ['json', 'yaml', 'table'],
          default: 'json'
        }
      ],
      examples: [
        'gocars-test config init',
        'gocars-test config validate',
        'gocars-test config show',
        'gocars-test config set execution.parallel 4',
        'gocars-test config get execution.timeout'
      ]
    });

    this.configManager = new TestConfigurationManager();
    
    // Add subcommands
    this.config.subcommands = [
      new InitSubcommand(),
      new ValidateSubcommand(),
      new ShowSubcommand(),
      new SetSubcommand(),
      new GetSubcommand(),
      new ResetSubcommand()
    ];
  }

  public async execute(context: CLIContext): Promise<number> {
    // This command requires a subcommand
    if (!context.rawArgs.includes('init') && 
        !context.rawArgs.includes('validate') && 
        !context.rawArgs.includes('show') && 
        !context.rawArgs.includes('set') && 
        !context.rawArgs.includes('get') && 
        !context.rawArgs.includes('reset')) {
      this.logError('Config command requires a subcommand', context);
      this.log(this.getHelp(), context);
      return 1;
    }

    // Subcommands are handled by the CLI parser
    return 0;
  }
}

class InitSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'init',
      description: 'Initialize a new test configuration file',
      options: [
        {
          name: 'template',
          alias: 't',
          description: 'Configuration template to use',
          type: 'string',
          choices: ['basic', 'advanced', 'ci', 'performance'],
          default: 'basic'
        },
        {
          name: 'force',
          description: 'Overwrite existing configuration file',
          type: 'boolean',
          default: false
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';
    const template = context.options.template || 'basic';
    const force = context.options.force || false;

    try {
      // Check if file already exists
      if (fs.existsSync(configPath) && !force) {
        this.logError(`Configuration file already exists: ${configPath}`, context);
        this.log('Use --force to overwrite the existing file', context);
        return 1;
      }

      // Generate configuration based on template
      const config = this.generateTemplate(template);
      
      // Ensure directory exists
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write configuration file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      this.logSuccess(`Configuration file created: ${configPath}`, context);
      this.log(`Template used: ${template}`, context);
      
      return 0;
    } catch (error) {
      this.logError(`Failed to create configuration file: ${error.message}`, context);
      return 1;
    }
  }

  private generateTemplate(template: string): any {
    const baseConfig = {
      version: '1.0',
      environment: 'development',
      execution: {
        parallel: 1,
        timeout: 300000,
        retryAttempts: 0,
        bail: false
      },
      reporting: {
        format: 'console',
        outputDir: './test-reports',
        coverage: false
      },
      suites: {},
      filters: {}
    };

    switch (template) {
      case 'advanced':
        return {
          ...baseConfig,
          execution: {
            ...baseConfig.execution,
            parallel: 4,
            retryAttempts: 2
          },
          reporting: {
            ...baseConfig.reporting,
            format: 'html',
            coverage: true
          },
          suites: {
            auth: {
              enabled: true,
              timeout: 60000,
              tags: ['smoke', 'auth']
            },
            api: {
              enabled: true,
              timeout: 120000,
              tags: ['api', 'integration']
            },
            ui: {
              enabled: true,
              timeout: 180000,
              tags: ['ui', 'e2e']
            }
          },
          filters: {
            includeTags: ['smoke'],
            excludeTags: ['slow']
          },
          notifications: {
            enabled: true,
            channels: ['email', 'slack']
          }
        };

      case 'ci':
        return {
          ...baseConfig,
          environment: 'ci',
          execution: {
            ...baseConfig.execution,
            parallel: 8,
            timeout: 600000,
            retryAttempts: 3,
            bail: true
          },
          reporting: {
            format: 'junit',
            outputDir: './test-results',
            coverage: true
          },
          filters: {
            excludeTags: ['manual', 'slow']
          }
        };

      case 'performance':
        return {
          ...baseConfig,
          execution: {
            ...baseConfig.execution,
            parallel: 1,
            timeout: 1800000 // 30 minutes
          },
          suites: {
            load: {
              enabled: true,
              timeout: 900000,
              tags: ['performance', 'load']
            },
            stress: {
              enabled: false,
              timeout: 1800000,
              tags: ['performance', 'stress']
            }
          },
          performance: {
            virtualUsers: 100,
            rampUpTime: 60000,
            duration: 300000,
            thresholds: {
              responseTime: 2000,
              errorRate: 0.05
            }
          }
        };

      case 'basic':
      default:
        return baseConfig;
    }
  }
}

class ValidateSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'validate',
      description: 'Validate test configuration file'
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';

    try {
      if (!fs.existsSync(configPath)) {
        this.logError(`Configuration file not found: ${configPath}`, context);
        return 1;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      const configManager = new TestConfigurationManager();
      const validation = configManager.validateConfiguration(config);

      if (validation.isValid) {
        this.logSuccess('Configuration is valid', context);
        return 0;
      } else {
        this.logError('Configuration validation failed:', context);
        validation.errors.forEach(error => this.logError(`  - ${error}`, context));
        return 1;
      }
    } catch (error) {
      this.logError(`Failed to validate configuration: ${error.message}`, context);
      return 1;
    }
  }
}

class ShowSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'show',
      description: 'Display current configuration'
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';
    const format = context.options.format || 'json';

    try {
      if (!fs.existsSync(configPath)) {
        this.logError(`Configuration file not found: ${configPath}`, context);
        return 1;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      switch (format) {
        case 'json':
          this.log(JSON.stringify(config, null, 2), context);
          break;
        case 'yaml':
          // Simple YAML-like output
          this.displayAsYaml(config, context);
          break;
        case 'table':
          this.displayAsTable(config, context);
          break;
        default:
          this.log(JSON.stringify(config, null, 2), context);
      }

      return 0;
    } catch (error) {
      this.logError(`Failed to display configuration: ${error.message}`, context);
      return 1;
    }
  }

  private displayAsYaml(obj: any, context: CLIContext, indent: number = 0): void {
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.log(`${spaces}${key}:`, context);
        this.displayAsYaml(value, context, indent + 1);
      } else if (Array.isArray(value)) {
        this.log(`${spaces}${key}:`, context);
        value.forEach(item => {
          this.log(`${spaces}  - ${item}`, context);
        });
      } else {
        this.log(`${spaces}${key}: ${value}`, context);
      }
    }
  }

  private displayAsTable(config: any, context: CLIContext): void {
    this.log('Configuration Summary:', context);
    this.log('='.repeat(50), context);
    
    const flatConfig = this.flattenObject(config);
    
    for (const [key, value] of Object.entries(flatConfig)) {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      this.log(`${key.padEnd(30)} ${displayValue}`, context);
    }
  }

  private flattenObject(obj: any, prefix: string = ''): { [key: string]: any } {
    const flattened: { [key: string]: any } = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }
}

class SetSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'set',
      description: 'Set a configuration value',
      arguments: [
        {
          name: 'key',
          description: 'Configuration key (dot notation supported)',
          required: true,
          type: 'string'
        },
        {
          name: 'value',
          description: 'Configuration value',
          required: true,
          type: 'string'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';
    const key = context.args.key;
    const value = context.args.value;

    try {
      let config = {};
      
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
      }

      // Set the value using dot notation
      this.setNestedValue(config, key, this.parseValue(value));

      // Write back to file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      this.logSuccess(`Set ${key} = ${value}`, context);
      return 0;
    } catch (error) {
      this.logError(`Failed to set configuration value: ${error.message}`, context);
      return 1;
    }
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private parseValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if JSON parsing fails
      return value;
    }
  }
}

class GetSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'get',
      description: 'Get a configuration value',
      arguments: [
        {
          name: 'key',
          description: 'Configuration key (dot notation supported)',
          required: true,
          type: 'string'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';
    const key = context.args.key;

    try {
      if (!fs.existsSync(configPath)) {
        this.logError(`Configuration file not found: ${configPath}`, context);
        return 1;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      const value = this.getNestedValue(config, key);
      
      if (value !== undefined) {
        const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        this.log(displayValue, context);
        return 0;
      } else {
        this.logError(`Configuration key not found: ${key}`, context);
        return 1;
      }
    } catch (error) {
      this.logError(`Failed to get configuration value: ${error.message}`, context);
      return 1;
    }
  }

  private getNestedValue(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

class ResetSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'reset',
      description: 'Reset configuration to defaults',
      options: [
        {
          name: 'confirm',
          description: 'Confirm the reset operation',
          type: 'boolean',
          default: false
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const configPath = context.options.file || './test-config.json';
    const confirm = context.options.confirm;

    if (!confirm) {
      this.logWarning('This will reset the configuration to defaults. Use --confirm to proceed.', context);
      return 1;
    }

    try {
      const configManager = new TestConfigurationManager();
      const defaultConfig = configManager.getDefaultConfiguration();

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      
      this.logSuccess(`Configuration reset to defaults: ${configPath}`, context);
      return 0;
    } catch (error) {
      this.logError(`Failed to reset configuration: ${error.message}`, context);
      return 1;
    }
  }
}