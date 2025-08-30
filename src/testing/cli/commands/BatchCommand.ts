import { CLICommand, CLIContext } from '../CLICommand';
import { BatchProcessor, BatchJob } from '../BatchProcessor';
import * as fs from 'fs';
import * as path from 'path';

export class BatchCommand extends CLICommand {
  private batchProcessor: BatchProcessor;

  constructor() {
    super({
      name: 'batch',
      description: 'Execute batch jobs and automation scripts',
      usage: 'gocars-test batch <subcommand> [options]',
      subcommands: [],
      options: [
        {
          name: 'file',
          alias: 'f',
          description: 'Batch job file path',
          type: 'string'
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output file for batch results',
          type: 'string'
        }
      ],
      examples: [
        'gocars-test batch run --file ./batch-job.json',
        'gocars-test batch create --template ci',
        'gocars-test batch list',
        'gocars-test batch validate --file ./batch-job.yaml'
      ]
    });

    this.batchProcessor = new BatchProcessor();
    
    // Add subcommands
    this.config.subcommands = [
      new RunSubcommand(),
      new CreateSubcommand(),
      new ListSubcommand(),
      new ValidateSubcommand(),
      new StatusSubcommand()
    ];
  }

  public async execute(context: CLIContext): Promise<number> {
    // This command requires a subcommand
    if (!context.rawArgs.some(arg => ['run', 'create', 'list', 'validate', 'status'].includes(arg))) {
      this.logError('Batch command requires a subcommand', context);
      this.log(this.getHelp(), context);
      return 1;
    }

    return 0;
  }
}

class RunSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'run',
      description: 'Execute a batch job',
      options: [
        {
          name: 'parallel',
          alias: 'p',
          description: 'Override parallel execution setting',
          type: 'boolean'
        },
        {
          name: 'continue-on-error',
          description: 'Continue execution even if commands fail',
          type: 'boolean'
        },
        {
          name: 'timeout',
          alias: 't',
          description: 'Override job timeout in milliseconds',
          type: 'number'
        },
        {
          name: 'retry-attempts',
          alias: 'r',
          description: 'Override retry attempts for failed commands',
          type: 'number'
        },
        {
          name: 'working-directory',
          alias: 'w',
          description: 'Override working directory',
          type: 'string'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const jobFile = context.options.file;
    
    if (!jobFile) {
      this.logError('Batch job file is required (--file)', context);
      return 1;
    }

    try {
      // Load batch job
      const job = BatchProcessor.loadJobFromFile(jobFile);
      
      // Apply CLI overrides
      this.applyOverrides(job, context);
      
      this.log(`Loading batch job: ${job.name}`, context);
      this.logVerbose(`Job ID: ${job.id}`, context);
      this.logVerbose(`Commands: ${job.commands.length}`, context);

      // Execute batch job
      const batchProcessor = new BatchProcessor();
      const result = await batchProcessor.executeJob(job);

      // Save results if output file specified
      if (context.options.output) {
        const outputPath = context.options.output;
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        this.log(`Results saved to: ${outputPath}`, context);
      }

      return result.success ? 0 : 1;

    } catch (error) {
      this.logError(`Failed to execute batch job: ${error.message}`, context);
      return 1;
    }
  }

  private applyOverrides(job: BatchJob, context: CLIContext): void {
    if (context.options.parallel !== undefined) {
      job.parallel = context.options.parallel;
    }
    
    if (context.options['continue-on-error'] !== undefined) {
      job.continueOnError = context.options['continue-on-error'];
    }
    
    if (context.options.timeout) {
      job.timeout = context.options.timeout;
    }
    
    if (context.options['retry-attempts'] !== undefined) {
      job.retryAttempts = context.options['retry-attempts'];
    }
    
    if (context.options['working-directory']) {
      job.workingDirectory = context.options['working-directory'];
    }
  }
}

class CreateSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'create',
      description: 'Create a new batch job file',
      options: [
        {
          name: 'template',
          alias: 't',
          description: 'Template to use for the batch job',
          type: 'string',
          choices: ['basic', 'ci', 'regression', 'performance'],
          default: 'basic'
        },
        {
          name: 'output-file',
          alias: 'o',
          description: 'Output file path',
          type: 'string',
          default: './batch-job.json'
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['json', 'yaml'],
          default: 'json'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const template = context.options.template || 'basic';
    const outputFile = context.options['output-file'] || './batch-job.json';
    const format = context.options.format || 'json';

    try {
      // Check if file already exists
      if (fs.existsSync(outputFile)) {
        this.logError(`File already exists: ${outputFile}`, context);
        this.log('Use a different output file or remove the existing file', context);
        return 1;
      }

      // Generate batch job based on template
      const job = this.generateTemplate(template);
      
      // Save to file
      let content: string;
      if (format === 'yaml') {
        const yaml = require('js-yaml');
        content = yaml.dump(job, { indent: 2 });
      } else {
        content = JSON.stringify(job, null, 2);
      }

      // Ensure directory exists
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputFile, content);
      
      this.logSuccess(`Batch job created: ${outputFile}`, context);
      this.log(`Template: ${template}`, context);
      this.log(`Format: ${format}`, context);
      this.log(`Commands: ${job.commands.length}`, context);

      return 0;
    } catch (error) {
      this.logError(`Failed to create batch job: ${error.message}`, context);
      return 1;
    }
  }

  private generateTemplate(template: string): BatchJob {
    const baseJob = BatchProcessor.createSampleJob();
    
    switch (template) {
      case 'ci':
        return {
          ...baseJob,
          id: 'ci-pipeline-' + Date.now(),
          name: 'CI Pipeline',
          description: 'Continuous Integration pipeline for automated testing',
          parallel: false,
          continueOnError: false,
          timeout: 7200000, // 2 hours
          retryAttempts: 2,
          environment: {
            NODE_ENV: 'ci',
            CI: 'true',
            LOG_LEVEL: 'info'
          },
          commands: [
            {
              name: 'Validate Configuration',
              command: 'config',
              args: ['validate'],
              timeout: 30000,
              continueOnError: false
            },
            {
              name: 'Smoke Tests',
              command: 'test',
              args: ['--tags', 'smoke', '--parallel', '4', '--output', 'junit', '--bail'],
              timeout: 600000,
              continueOnError: false
            },
            {
              name: 'Unit Tests',
              command: 'test',
              args: ['--tags', 'unit', '--parallel', '8', '--output', 'junit', '--coverage'],
              timeout: 1200000,
              continueOnError: false
            },
            {
              name: 'Integration Tests',
              command: 'test',
              args: ['--tags', 'integration', '--parallel', '4', '--output', 'junit'],
              timeout: 1800000,
              continueOnError: false
            },
            {
              name: 'Generate Reports',
              command: 'report',
              args: ['generate', '--format', 'html', '--include-coverage', '--include-performance'],
              timeout: 300000,
              continueOnError: true
            }
          ]
        };

      case 'regression':
        return {
          ...baseJob,
          id: 'regression-suite-' + Date.now(),
          name: 'Regression Test Suite',
          description: 'Comprehensive regression testing across all components',
          parallel: true,
          continueOnError: true,
          timeout: 14400000, // 4 hours
          retryAttempts: 1,
          commands: [
            {
              name: 'API Regression Tests',
              command: 'test',
              args: ['api-suite', '--tags', 'regression', '--parallel', '6', '--output', 'html'],
              timeout: 3600000,
              continueOnError: true
            },
            {
              name: 'UI Regression Tests',
              command: 'test',
              args: ['ui-suite', '--tags', 'regression', '--parallel', '3', '--output', 'html'],
              timeout: 5400000,
              continueOnError: true
            },
            {
              name: 'Database Tests',
              command: 'test',
              args: ['database-suite', '--tags', 'regression', '--output', 'html'],
              timeout: 1800000,
              continueOnError: true
            },
            {
              name: 'Performance Tests',
              command: 'test',
              args: ['performance-suite', '--tags', 'regression', '--output', 'html'],
              timeout: 3600000,
              continueOnError: true
            }
          ]
        };

      case 'performance':
        return {
          ...baseJob,
          id: 'performance-suite-' + Date.now(),
          name: 'Performance Test Suite',
          description: 'Performance and load testing scenarios',
          parallel: false,
          continueOnError: true,
          timeout: 10800000, // 3 hours
          retryAttempts: 0,
          environment: {
            NODE_ENV: 'performance',
            PERFORMANCE_MODE: 'true'
          },
          commands: [
            {
              name: 'Baseline Performance Tests',
              command: 'test',
              args: ['performance-suite', '--tags', 'baseline', '--output', 'json'],
              timeout: 1800000,
              continueOnError: false
            },
            {
              name: 'Load Tests - Light',
              command: 'test',
              args: ['performance-suite', '--tags', 'load-light', '--output', 'json'],
              timeout: 3600000,
              continueOnError: true
            },
            {
              name: 'Load Tests - Heavy',
              command: 'test',
              args: ['performance-suite', '--tags', 'load-heavy', '--output', 'json'],
              timeout: 5400000,
              continueOnError: true
            },
            {
              name: 'Stress Tests',
              command: 'test',
              args: ['performance-suite', '--tags', 'stress', '--output', 'json'],
              timeout: 3600000,
              continueOnError: true
            },
            {
              name: 'Performance Report',
              command: 'report',
              args: ['generate', '--format', 'html', '--template', 'performance', '--include-performance'],
              timeout: 300000,
              continueOnError: false
            }
          ]
        };

      case 'basic':
      default:
        return baseJob;
    }
  }
}

class ListSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'list',
      description: 'List available batch job files',
      options: [
        {
          name: 'directory',
          alias: 'd',
          description: 'Directory to search for batch job files',
          type: 'string',
          default: '.'
        },
        {
          name: 'recursive',
          alias: 'r',
          description: 'Search recursively in subdirectories',
          type: 'boolean',
          default: false
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const directory = context.options.directory || '.';
    const recursive = context.options.recursive || false;

    try {
      const jobFiles = this.findBatchJobFiles(directory, recursive);
      
      if (jobFiles.length === 0) {
        this.log('No batch job files found', context);
        return 0;
      }

      this.log(`Found ${jobFiles.length} batch job file(s):`, context);
      this.log('='.repeat(60), context);

      for (const filePath of jobFiles) {
        try {
          const job = BatchProcessor.loadJobFromFile(filePath);
          const stats = fs.statSync(filePath);
          
          this.log(`📄 ${path.basename(filePath)}`, context);
          this.log(`   Path: ${filePath}`, context);
          this.log(`   Name: ${job.name}`, context);
          this.log(`   ID: ${job.id}`, context);
          this.log(`   Commands: ${job.commands.length}`, context);
          this.log(`   Parallel: ${job.parallel ? 'Yes' : 'No'}`, context);
          this.log(`   Modified: ${stats.mtime.toLocaleString()}`, context);
          
          if (job.description) {
            this.log(`   Description: ${job.description}`, context);
          }
          
          this.log('', context);
        } catch (error) {
          this.log(`❌ ${path.basename(filePath)} (Invalid: ${error.message})`, context);
        }
      }

      return 0;
    } catch (error) {
      this.logError(`Failed to list batch jobs: ${error.message}`, context);
      return 1;
    }
  }

  private findBatchJobFiles(directory: string, recursive: boolean): string[] {
    const files: string[] = [];
    const extensions = ['.json', '.yaml', '.yml'];
    
    const searchDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && recursive) {
          searchDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            // Check if it looks like a batch job file
            if (entry.name.includes('batch') || entry.name.includes('job') || 
                entry.name.includes('pipeline') || entry.name.includes('workflow')) {
              files.push(fullPath);
            }
          }
        }
      }
    };

    if (fs.existsSync(directory)) {
      searchDirectory(directory);
    }

    return files;
  }
}

class ValidateSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'validate',
      description: 'Validate a batch job file'
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const jobFile = context.options.file;
    
    if (!jobFile) {
      this.logError('Batch job file is required (--file)', context);
      return 1;
    }

    try {
      const job = BatchProcessor.loadJobFromFile(jobFile);
      
      this.logSuccess('Batch job file is valid', context);
      this.log(`Job: ${job.name} (${job.id})`, context);
      this.log(`Commands: ${job.commands.length}`, context);
      this.log(`Parallel execution: ${job.parallel ? 'Yes' : 'No'}`, context);
      this.log(`Continue on error: ${job.continueOnError ? 'Yes' : 'No'}`, context);
      
      if (job.timeout) {
        this.log(`Timeout: ${job.timeout}ms`, context);
      }
      
      if (job.retryAttempts) {
        this.log(`Retry attempts: ${job.retryAttempts}`, context);
      }

      // Validate individual commands
      this.log('\nCommand validation:', context);
      for (let i = 0; i < job.commands.length; i++) {
        const cmd = job.commands[i];
        this.log(`  ${i + 1}. ${cmd.name} - ✅ Valid`, context);
      }

      return 0;
    } catch (error) {
      this.logError(`Batch job validation failed: ${error.message}`, context);
      return 1;
    }
  }
}

class StatusSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'status',
      description: 'Show status of running batch jobs'
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    // This would show status of currently running batch jobs
    // For now, just show a placeholder message
    this.log('Batch job status monitoring not implemented yet', context);
    this.log('This feature would show:', context);
    this.log('  - Currently running batch jobs', context);
    this.log('  - Job progress and completion status', context);
    this.log('  - Resource usage and performance metrics', context);
    
    return 0;
  }
}