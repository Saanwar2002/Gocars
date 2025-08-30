import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface CLIConfig {
  version: string;
  defaults: {
    environment: string;
    parallel: number;
    timeout: number;
    retryAttempts: number;
    outputFormat: string;
    reportDir: string;
  };
  profiles: {
    [profileName: string]: {
      description?: string;
      environment?: string;
      parallel?: number;
      timeout?: number;
      retryAttempts?: number;
      outputFormat?: string;
      reportDir?: string;
      tags?: string[];
      excludeTags?: string[];
      suites?: string[];
      filters?: {
        pattern?: string;
        includeTags?: string[];
        excludeTags?: string[];
      };
      notifications?: {
        enabled: boolean;
        channels: string[];
      };
    };
  };
  aliases: {
    [aliasName: string]: {
      command: string;
      args: string[];
    };
  };
  hooks: {
    preTest?: string[];
    postTest?: string[];
    onFailure?: string[];
    onSuccess?: string[];
  };
}

export class ConfigFileManager {
  private static readonly CONFIG_FILENAMES = [
    '.gocars-test.json',
    '.gocars-test.yaml',
    '.gocars-test.yml',
    'gocars-test.config.json',
    'gocars-test.config.yaml',
    'gocars-test.config.yml'
  ];

  public static findConfigFile(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;
    
    while (currentDir !== path.dirname(currentDir)) {
      for (const filename of this.CONFIG_FILENAMES) {
        const configPath = path.join(currentDir, filename);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  public static loadConfig(configPath?: string): CLIConfig | null {
    const actualPath = configPath || this.findConfigFile();
    
    if (!actualPath || !fs.existsSync(actualPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(actualPath, 'utf8');
      const ext = path.extname(actualPath).toLowerCase();
      
      let config: CLIConfig;
      
      if (ext === '.json') {
        config = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        config = yaml.load(content) as CLIConfig;
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }
      
      return this.validateAndNormalizeConfig(config);
    } catch (error) {
      throw new Error(`Failed to load config file ${actualPath}: ${error.message}`);
    }
  }

  public static saveConfig(config: CLIConfig, configPath: string): void {
    const ext = path.extname(configPath).toLowerCase();
    let content: string;
    
    if (ext === '.json') {
      content = JSON.stringify(config, null, 2);
    } else if (ext === '.yaml' || ext === '.yml') {
      content = yaml.dump(config, { indent: 2 });
    } else {
      throw new Error(`Unsupported config file format: ${ext}`);
    }
    
    // Ensure directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, content, 'utf8');
  }

  public static createDefaultConfig(): CLIConfig {
    return {
      version: '1.0',
      defaults: {
        environment: 'development',
        parallel: 1,
        timeout: 300000,
        retryAttempts: 0,
        outputFormat: 'console',
        reportDir: './test-reports'
      },
      profiles: {
        development: {
          description: 'Development environment settings',
          environment: 'development',
          parallel: 1,
          timeout: 300000,
          outputFormat: 'console'
        },
        staging: {
          description: 'Staging environment settings',
          environment: 'staging',
          parallel: 2,
          timeout: 600000,
          outputFormat: 'html',
          tags: ['smoke', 'regression']
        },
        production: {
          description: 'Production environment settings',
          environment: 'production',
          parallel: 4,
          timeout: 900000,
          outputFormat: 'junit',
          excludeTags: ['experimental', 'slow']
        },
        ci: {
          description: 'Continuous Integration settings',
          environment: 'ci',
          parallel: 8,
          timeout: 1800000,
          retryAttempts: 3,
          outputFormat: 'junit',
          excludeTags: ['manual', 'interactive']
        },
        smoke: {
          description: 'Smoke test profile',
          parallel: 2,
          timeout: 120000,
          tags: ['smoke'],
          outputFormat: 'console'
        },
        regression: {
          description: 'Full regression test profile',
          parallel: 4,
          timeout: 3600000,
          tags: ['regression'],
          outputFormat: 'html'
        }
      },
      aliases: {
        'quick': {
          command: 'test',
          args: ['--tags', 'smoke', '--parallel', '2']
        },
        'full': {
          command: 'test',
          args: ['--tags', 'regression', '--parallel', '4', '--output', 'html']
        },
        'ci-test': {
          command: 'test',
          args: ['--profile', 'ci', '--bail']
        }
      },
      hooks: {
        preTest: [
          'echo "Starting test execution..."'
        ],
        postTest: [
          'echo "Test execution completed"'
        ],
        onFailure: [
          'echo "Tests failed - check logs for details"'
        ],
        onSuccess: [
          'echo "All tests passed successfully!"'
        ]
      }
    };
  }

  public static validateAndNormalizeConfig(config: any): CLIConfig {
    const errors: string[] = [];
    
    // Validate version
    if (!config.version) {
      config.version = '1.0';
    }
    
    // Validate defaults
    if (!config.defaults) {
      config.defaults = {};
    }
    
    const defaultDefaults = {
      environment: 'development',
      parallel: 1,
      timeout: 300000,
      retryAttempts: 0,
      outputFormat: 'console',
      reportDir: './test-reports'
    };
    
    config.defaults = { ...defaultDefaults, ...config.defaults };
    
    // Validate profiles
    if (!config.profiles) {
      config.profiles = {};
    }
    
    // Validate aliases
    if (!config.aliases) {
      config.aliases = {};
    }
    
    // Validate hooks
    if (!config.hooks) {
      config.hooks = {};
    }
    
    // Validate profile configurations
    for (const [profileName, profile] of Object.entries(config.profiles)) {
      const p = profile as any;
      
      if (p.parallel && (typeof p.parallel !== 'number' || p.parallel < 1)) {
        errors.push(`Profile '${profileName}': parallel must be a positive number`);
      }
      
      if (p.timeout && (typeof p.timeout !== 'number' || p.timeout < 1000)) {
        errors.push(`Profile '${profileName}': timeout must be at least 1000ms`);
      }
      
      if (p.retryAttempts && (typeof p.retryAttempts !== 'number' || p.retryAttempts < 0)) {
        errors.push(`Profile '${profileName}': retryAttempts must be a non-negative number`);
      }
      
      if (p.outputFormat && !['console', 'json', 'junit', 'html'].includes(p.outputFormat)) {
        errors.push(`Profile '${profileName}': invalid outputFormat '${p.outputFormat}'`);
      }
    }
    
    // Validate aliases
    for (const [aliasName, alias] of Object.entries(config.aliases)) {
      const a = alias as any;
      
      if (!a.command || typeof a.command !== 'string') {
        errors.push(`Alias '${aliasName}': command is required and must be a string`);
      }
      
      if (!a.args || !Array.isArray(a.args)) {
        errors.push(`Alias '${aliasName}': args must be an array`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Config validation failed:\n${errors.join('\n')}`);
    }
    
    return config as CLIConfig;
  }

  public static getProfile(config: CLIConfig, profileName: string): any {
    const profile = config.profiles[profileName];
    if (!profile) {
      throw new Error(`Profile '${profileName}' not found`);
    }
    
    // Merge with defaults
    return {
      ...config.defaults,
      ...profile
    };
  }

  public static listProfiles(config: CLIConfig): Array<{ name: string; description?: string }> {
    return Object.entries(config.profiles).map(([name, profile]) => ({
      name,
      description: profile.description
    }));
  }

  public static getAlias(config: CLIConfig, aliasName: string): { command: string; args: string[] } | null {
    return config.aliases[aliasName] || null;
  }

  public static listAliases(config: CLIConfig): Array<{ name: string; command: string; args: string[] }> {
    return Object.entries(config.aliases).map(([name, alias]) => ({
      name,
      command: alias.command,
      args: alias.args
    }));
  }

  public static executeHooks(config: CLIConfig, hookType: keyof CLIConfig['hooks']): void {
    const hooks = config.hooks[hookType];
    if (!hooks || hooks.length === 0) {
      return;
    }
    
    for (const hook of hooks) {
      try {
        require('child_process').execSync(hook, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`Hook execution failed: ${hook}`);
        console.warn(`Error: ${error.message}`);
      }
    }
  }

  public static mergeWithProfile(config: CLIConfig, profileName: string, cliOptions: any): any {
    const profile = this.getProfile(config, profileName);
    
    // CLI options take precedence over profile settings
    return {
      ...profile,
      ...cliOptions
    };
  }

  public static expandAlias(config: CLIConfig, args: string[]): string[] {
    if (args.length === 0) {
      return args;
    }
    
    const firstArg = args[0];
    const alias = this.getAlias(config, firstArg);
    
    if (alias) {
      // Replace alias with its command and args
      return [alias.command, ...alias.args, ...args.slice(1)];
    }
    
    return args;
  }
}

// Export YAML dependency check
export function checkYamlSupport(): boolean {
  try {
    require('js-yaml');
    return true;
  } catch (error) {
    return false;
  }
}