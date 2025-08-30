import { CLI } from './CLI';
import { ConfigFileManager, CLIConfig } from './ConfigFileManager';
import * as fs from 'fs';
import * as path from 'path';

export interface BatchJob {
  id: string;
  name: string;
  description?: string;
  commands: BatchCommand[];
  parallel?: boolean;
  continueOnError?: boolean;
  timeout?: number;
  retryAttempts?: number;
  environment?: { [key: string]: string };
  workingDirectory?: string;
}

export interface BatchCommand {
  name: string;
  command: string;
  args: string[];
  timeout?: number;
  retryAttempts?: number;
  continueOnError?: boolean;
  condition?: string; // JavaScript expression
  environment?: { [key: string]: string };
}

export interface BatchResult {
  jobId: string;
  jobName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  commands: BatchCommandResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

export interface BatchCommandResult {
  name: string;
  command: string;
  args: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
  exitCode: number;
  success: boolean;
  output: string;
  error?: string;
  skipped: boolean;
  retryCount: number;
}

export class BatchProcessor {
  private cli: CLI;
  private config: CLIConfig | null = null;

  constructor() {
    this.cli = new CLI();
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      this.config = ConfigFileManager.loadConfig();
    } catch (error) {
      console.warn(`Warning: Failed to load CLI config: ${error.message}`);
    }
  }

  public async executeJob(job: BatchJob): Promise<BatchResult> {
    const startTime = new Date();
    
    console.log(`Starting batch job: ${job.name}`);
    console.log(`Job ID: ${job.id}`);
    console.log(`Commands: ${job.commands.length}`);
    console.log(`Parallel execution: ${job.parallel ? 'Yes' : 'No'}`);
    console.log('='.repeat(60));

    const result: BatchResult = {
      jobId: job.id,
      jobName: job.name,
      startTime,
      endTime: new Date(),
      duration: 0,
      success: true,
      commands: [],
      summary: {
        total: job.commands.length,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };

    try {
      // Set working directory if specified
      const originalCwd = process.cwd();
      if (job.workingDirectory) {
        process.chdir(job.workingDirectory);
      }

      // Set environment variables
      const originalEnv = { ...process.env };
      if (job.environment) {
        Object.assign(process.env, job.environment);
      }

      try {
        if (job.parallel) {
          result.commands = await this.executeCommandsParallel(job.commands, job);
        } else {
          result.commands = await this.executeCommandsSequential(job.commands, job);
        }
      } finally {
        // Restore original environment and working directory
        process.env = originalEnv;
        process.chdir(originalCwd);
      }

      // Calculate summary
      result.summary.passed = result.commands.filter(cmd => cmd.success && !cmd.skipped).length;
      result.summary.failed = result.commands.filter(cmd => !cmd.success && !cmd.skipped).length;
      result.summary.skipped = result.commands.filter(cmd => cmd.skipped).length;
      result.success = result.summary.failed === 0;

    } catch (error) {
      console.error(`Batch job failed: ${error.message}`);
      result.success = false;
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    this.printJobSummary(result);
    return result;
  }

  private async executeCommandsSequential(commands: BatchCommand[], job: BatchJob): Promise<BatchCommandResult[]> {
    const results: BatchCommandResult[] = [];

    for (const command of commands) {
      const result = await this.executeCommand(command, job);
      results.push(result);

      if (!result.success && !result.skipped && !job.continueOnError && !command.continueOnError) {
        console.log(`Stopping execution due to command failure: ${command.name}`);
        
        // Mark remaining commands as skipped
        const remainingCommands = commands.slice(commands.indexOf(command) + 1);
        for (const remainingCommand of remainingCommands) {
          results.push({
            name: remainingCommand.name,
            command: remainingCommand.command,
            args: remainingCommand.args,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            exitCode: -1,
            success: false,
            output: '',
            skipped: true,
            retryCount: 0
          });
        }
        break;
      }
    }

    return results;
  }

  private async executeCommandsParallel(commands: BatchCommand[], job: BatchJob): Promise<BatchCommandResult[]> {
    const promises = commands.map(command => this.executeCommand(command, job));
    return await Promise.all(promises);
  }

  private async executeCommand(command: BatchCommand, job: BatchJob): Promise<BatchCommandResult> {
    const startTime = new Date();
    
    console.log(`Executing: ${command.name}`);
    console.log(`Command: ${command.command} ${command.args.join(' ')}`);

    // Check condition if specified
    if (command.condition && !this.evaluateCondition(command.condition)) {
      console.log(`Skipping command due to condition: ${command.condition}`);
      return {
        name: command.name,
        command: command.command,
        args: command.args,
        startTime,
        endTime: new Date(),
        duration: 0,
        exitCode: 0,
        success: true,
        output: 'Skipped due to condition',
        skipped: true,
        retryCount: 0
      };
    }

    const maxRetries = command.retryAttempts ?? job.retryAttempts ?? 0;
    let lastResult: BatchCommandResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for: ${command.name}`);
      }

      try {
        const result = await this.executeSingleCommand(command, job, attempt);
        
        if (result.success) {
          return result;
        }
        
        lastResult = result;
        
        if (attempt < maxRetries) {
          console.log(`Command failed, retrying in 2 seconds...`);
          await this.delay(2000);
        }
      } catch (error) {
        lastResult = {
          name: command.name,
          command: command.command,
          args: command.args,
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime(),
          exitCode: 1,
          success: false,
          output: '',
          error: error.message,
          skipped: false,
          retryCount: attempt
        };
      }
    }

    return lastResult!;
  }

  private async executeSingleCommand(command: BatchCommand, job: BatchJob, retryCount: number): Promise<BatchCommandResult> {
    const startTime = new Date();
    
    // Set command-specific environment variables
    const originalEnv = { ...process.env };
    if (command.environment) {
      Object.assign(process.env, command.environment);
    }

    try {
      // Build full command arguments
      const fullArgs = [command.command, ...command.args];
      
      // Execute command through CLI
      const exitCode = await this.cli.run(['node', 'gocars-test', ...fullArgs]);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const result: BatchCommandResult = {
        name: command.name,
        command: command.command,
        args: command.args,
        startTime,
        endTime,
        duration,
        exitCode,
        success: exitCode === 0,
        output: `Command executed with exit code: ${exitCode}`,
        skipped: false,
        retryCount
      };

      if (result.success) {
        console.log(`✅ ${command.name} completed successfully (${duration}ms)`);
      } else {
        console.log(`❌ ${command.name} failed with exit code ${exitCode} (${duration}ms)`);
      }

      return result;
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  }

  private evaluateCondition(condition: string): boolean {
    try {
      // Simple condition evaluation - in production, you might want to use a safer evaluator
      // This is a basic implementation for common conditions
      
      // Replace environment variable references
      const expandedCondition = condition.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || '';
      });

      // Evaluate simple expressions
      return new Function('return ' + expandedCondition)();
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}": ${error.message}`);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printJobSummary(result: BatchResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('BATCH JOB SUMMARY');
    console.log('='.repeat(60));
    console.log(`Job: ${result.jobName} (${result.jobId})`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`Total Commands: ${result.summary.total}`);
    console.log(`Passed: ${result.summary.passed}`);
    console.log(`Failed: ${result.summary.failed}`);
    console.log(`Skipped: ${result.summary.skipped}`);
    console.log(`Success Rate: ${((result.summary.passed / result.summary.total) * 100).toFixed(1)}%`);
    
    if (result.success) {
      console.log('✅ Batch job completed successfully');
    } else {
      console.log('❌ Batch job failed');
    }
    
    console.log('='.repeat(60));

    // Show failed commands
    const failedCommands = result.commands.filter(cmd => !cmd.success && !cmd.skipped);
    if (failedCommands.length > 0) {
      console.log('\nFailed Commands:');
      failedCommands.forEach(cmd => {
        console.log(`  ❌ ${cmd.name}: ${cmd.error || `Exit code ${cmd.exitCode}`}`);
      });
    }
  }

  public static loadJobFromFile(filePath: string): BatchJob {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Batch job file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let job: BatchJob;
    
    if (ext === '.json') {
      job = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      const yaml = require('js-yaml');
      job = yaml.load(content) as BatchJob;
    } else {
      throw new Error(`Unsupported batch job file format: ${ext}`);
    }

    return this.validateJob(job);
  }

  public static validateJob(job: any): BatchJob {
    const errors: string[] = [];

    if (!job.id || typeof job.id !== 'string') {
      errors.push('Job ID is required and must be a string');
    }

    if (!job.name || typeof job.name !== 'string') {
      errors.push('Job name is required and must be a string');
    }

    if (!job.commands || !Array.isArray(job.commands)) {
      errors.push('Commands array is required');
    } else {
      job.commands.forEach((cmd: any, index: number) => {
        if (!cmd.name || typeof cmd.name !== 'string') {
          errors.push(`Command ${index}: name is required and must be a string`);
        }
        if (!cmd.command || typeof cmd.command !== 'string') {
          errors.push(`Command ${index}: command is required and must be a string`);
        }
        if (!cmd.args || !Array.isArray(cmd.args)) {
          errors.push(`Command ${index}: args must be an array`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Batch job validation failed:\n${errors.join('\n')}`);
    }

    return job as BatchJob;
  }

  public static createSampleJob(): BatchJob {
    return {
      id: 'sample-job-' + Date.now(),
      name: 'Sample Test Job',
      description: 'A sample batch job demonstrating various testing scenarios',
      parallel: false,
      continueOnError: false,
      timeout: 3600000, // 1 hour
      retryAttempts: 1,
      environment: {
        NODE_ENV: 'test',
        LOG_LEVEL: 'info'
      },
      commands: [
        {
          name: 'Smoke Tests',
          command: 'test',
          args: ['--tags', 'smoke', '--output', 'console'],
          timeout: 300000,
          continueOnError: false
        },
        {
          name: 'API Tests',
          command: 'test',
          args: ['api-suite', '--parallel', '2', '--output', 'json'],
          timeout: 600000,
          continueOnError: true
        },
        {
          name: 'UI Tests',
          command: 'test',
          args: ['ui-suite', '--output', 'html'],
          timeout: 900000,
          condition: '${RUN_UI_TESTS} === "true"',
          continueOnError: true
        },
        {
          name: 'Generate Report',
          command: 'report',
          args: ['generate', '--format', 'html', '--include-coverage'],
          timeout: 120000,
          continueOnError: false
        }
      ]
    };
  }
}