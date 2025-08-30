import { CLICommand, CLIContext } from '../CLICommand';
import { TestConfigurationManager } from '../../../configuration/TestConfigurationManager';
import { TestExecutionOrchestrator } from '../../../orchestration/TestExecutionOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

export class TestCommand extends CLICommand {
  private configManager: TestConfigurationManager;
  private orchestrator: TestExecutionOrchestrator;

  constructor() {
    super({
      name: 'test',
      description: 'Execute test suites with various options',
      usage: 'gocars-test test [suite] [options]',
      arguments: [
        {
          name: 'suite',
          description: 'Test suite to execute (optional, runs all if not specified)',
          required: false,
          type: 'string'
        }
      ],
      options: [
        {
          name: 'config',
          alias: 'c',
          description: 'Configuration file path',
          type: 'string',
          default: './test-config.json'
        },
        {
          name: 'environment',
          alias: 'e',
          description: 'Test environment',
          type: 'string',
          choices: ['development', 'staging', 'production'],
          default: 'development'
        },
        {
          name: 'parallel',
          alias: 'p',
          description: 'Number of parallel test executions',
          type: 'number',
          default: 1
        },
        {
          name: 'timeout',
          alias: 't',
          description: 'Test timeout in milliseconds',
          type: 'number',
          default: 300000
        },
        {
          name: 'retry',
          alias: 'r',
          description: 'Number of retry attempts for failed tests',
          type: 'number',
          default: 0
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output format',
          type: 'string',
          choices: ['console', 'json', 'junit', 'html'],
          default: 'console'
        },
        {
          name: 'report-dir',
          description: 'Directory to save test reports',
          type: 'string',
          default: './test-reports'
        },
        {
          name: 'bail',
          alias: 'b',
          description: 'Stop execution on first failure',
          type: 'boolean',
          default: false
        },
        {
          name: 'dry-run',
          description: 'Show what tests would be executed without running them',
          type: 'boolean',
          default: false
        },
        {
          name: 'filter',
          alias: 'f',
          description: 'Filter tests by pattern (regex)',
          type: 'string'
        },
        {
          name: 'tags',
          description: 'Run tests with specific tags (comma-separated)',
          type: 'string'
        },
        {
          name: 'exclude-tags',
          description: 'Exclude tests with specific tags (comma-separated)',
          type: 'string'
        },
        {
          name: 'coverage',
          description: 'Generate code coverage report',
          type: 'boolean',
          default: false
        },
        {
          name: 'watch',
          alias: 'w',
          description: 'Watch for file changes and re-run tests',
          type: 'boolean',
          default: false
        }
      ],
      examples: [
        'gocars-test test',
        'gocars-test test auth-suite',
        'gocars-test test --environment staging --parallel 4',
        'gocars-test test --filter "login.*" --output json',
        'gocars-test test --tags "smoke,regression" --bail',
        'gocars-test test --dry-run --verbose'
      ]
    });

    this.configManager = new TestConfigurationManager();
    this.orchestrator = new TestExecutionOrchestrator();
  }

  public async execute(context: CLIContext): Promise<number> {
    try {
      this.logVerbose('Starting test execution', context);

      // Load configuration
      const config = await this.loadConfiguration(context);
      if (!config) {
        return 1;
      }

      // Apply CLI options to configuration
      this.applyCliOptions(config, context);

      // Validate configuration
      const validation = this.configManager.validateConfiguration(config);
      if (!validation.isValid) {
        this.logError('Configuration validation failed:', context);
        validation.errors.forEach(error => this.logError(`  - ${error}`, context));
        return 1;
      }

      // Handle dry run
      if (context.options['dry-run']) {
        return await this.handleDryRun(config, context);
      }

      // Handle watch mode
      if (context.options.watch) {
        return await this.handleWatchMode(config, context);
      }

      // Execute tests
      return await this.executeTests(config, context);

    } catch (error) {
      this.logError(`Test execution failed: ${error.message}`, context);
      this.logVerbose(`Stack trace: ${error.stack}`, context);
      return 1;
    }
  }

  private async loadConfiguration(context: CLIContext): Promise<any | null> {
    const configPath = context.options.config;
    
    try {
      if (fs.existsSync(configPath)) {
        this.logVerbose(`Loading configuration from ${configPath}`, context);
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      } else {
        this.logVerbose('No configuration file found, using defaults', context);
        return this.configManager.getDefaultConfiguration();
      }
    } catch (error) {
      this.logError(`Failed to load configuration: ${error.message}`, context);
      return null;
    }
  }

  private applyCliOptions(config: any, context: CLIContext): void {
    // Apply environment
    if (context.options.environment) {
      config.environment = context.options.environment;
    }

    // Apply parallel execution
    if (context.options.parallel) {
      config.execution = config.execution || {};
      config.execution.parallel = context.options.parallel;
    }

    // Apply timeout
    if (context.options.timeout) {
      config.execution = config.execution || {};
      config.execution.timeout = context.options.timeout;
    }

    // Apply retry settings
    if (context.options.retry) {
      config.execution = config.execution || {};
      config.execution.retryAttempts = context.options.retry;
    }

    // Apply output settings
    config.reporting = config.reporting || {};
    config.reporting.format = context.options.output;
    config.reporting.outputDir = context.options['report-dir'];

    // Apply execution options
    config.execution = config.execution || {};
    config.execution.bail = context.options.bail;
    config.execution.coverage = context.options.coverage;

    // Apply filtering
    if (context.options.filter) {
      config.filters = config.filters || {};
      config.filters.pattern = context.options.filter;
    }

    if (context.options.tags) {
      config.filters = config.filters || {};
      config.filters.includeTags = context.options.tags.split(',').map((tag: string) => tag.trim());
    }

    if (context.options['exclude-tags']) {
      config.filters = config.filters || {};
      config.filters.excludeTags = context.options['exclude-tags'].split(',').map((tag: string) => tag.trim());
    }

    // Apply suite selection
    if (context.args.suite) {
      config.suites = config.suites || {};
      config.suites.selected = [context.args.suite];
    }
  }

  private async handleDryRun(config: any, context: CLIContext): Promise<number> {
    this.log('Dry run mode - showing tests that would be executed:', context);
    
    try {
      const testPlan = await this.orchestrator.createExecutionPlan(config);
      
      this.log(`\nTest Execution Plan:`, context);
      this.log(`Environment: ${config.environment}`, context);
      this.log(`Parallel executions: ${config.execution?.parallel || 1}`, context);
      this.log(`Timeout: ${config.execution?.timeout || 300000}ms`, context);
      this.log(`Retry attempts: ${config.execution?.retryAttempts || 0}`, context);
      
      if (testPlan.suites && testPlan.suites.length > 0) {
        this.log(`\nTest Suites (${testPlan.suites.length}):`, context);
        testPlan.suites.forEach((suite: any, index: number) => {
          this.log(`  ${index + 1}. ${suite.name} (${suite.tests?.length || 0} tests)`, context);
          if (context.verbose && suite.tests) {
            suite.tests.forEach((test: any) => {
              this.log(`     - ${test.name}`, context);
            });
          }
        });
      } else {
        this.log('\nNo test suites found matching the criteria.', context);
      }

      if (config.filters) {
        this.log('\nFilters applied:', context);
        if (config.filters.pattern) {
          this.log(`  Pattern: ${config.filters.pattern}`, context);
        }
        if (config.filters.includeTags) {
          this.log(`  Include tags: ${config.filters.includeTags.join(', ')}`, context);
        }
        if (config.filters.excludeTags) {
          this.log(`  Exclude tags: ${config.filters.excludeTags.join(', ')}`, context);
        }
      }

      return 0;
    } catch (error) {
      this.logError(`Failed to create execution plan: ${error.message}`, context);
      return 1;
    }
  }

  private async handleWatchMode(config: any, context: CLIContext): Promise<number> {
    this.log('Watch mode enabled - monitoring for file changes...', context);
    
    // This would implement file watching and re-execution
    // For now, we'll just run once and exit
    this.logWarning('Watch mode not fully implemented yet, running tests once', context);
    return await this.executeTests(config, context);
  }

  private async executeTests(config: any, context: CLIContext): Promise<number> {
    const startTime = Date.now();
    
    this.log('Starting test execution...', context);
    this.logVerbose(`Configuration: ${JSON.stringify(config, null, 2)}`, context);

    try {
      // Create execution plan
      const executionPlan = await this.orchestrator.createExecutionPlan(config);
      
      // Execute tests
      const results = await this.orchestrator.executeTests(executionPlan);
      
      // Generate reports
      await this.generateReports(results, config, context);
      
      // Display summary
      this.displaySummary(results, startTime, context);
      
      // Return exit code based on results
      return results.success ? 0 : 1;
      
    } catch (error) {
      this.logError(`Test execution failed: ${error.message}`, context);
      return 1;
    }
  }

  private async generateReports(results: any, config: any, context: CLIContext): Promise<void> {
    try {
      const reportDir = config.reporting?.outputDir || './test-reports';
      
      // Ensure report directory exists
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const format = config.reporting?.format || 'console';
      
      switch (format) {
        case 'json':
          await this.generateJsonReport(results, reportDir, context);
          break;
        case 'junit':
          await this.generateJunitReport(results, reportDir, context);
          break;
        case 'html':
          await this.generateHtmlReport(results, reportDir, context);
          break;
        case 'console':
        default:
          // Console output is handled in displaySummary
          break;
      }
      
    } catch (error) {
      this.logWarning(`Failed to generate reports: ${error.message}`, context);
    }
  }

  private async generateJsonReport(results: any, reportDir: string, context: CLIContext): Promise<void> {
    const reportPath = path.join(reportDir, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    this.logVerbose(`JSON report saved to ${reportPath}`, context);
  }

  private async generateJunitReport(results: any, reportDir: string, context: CLIContext): Promise<void> {
    const reportPath = path.join(reportDir, 'junit.xml');
    
    // Generate JUnit XML format
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites tests="${results.totalTests}" failures="${results.failures}" errors="${results.errors}" time="${results.duration / 1000}">\n`;
    
    if (results.suites) {
      for (const suite of results.suites) {
        xml += `  <testsuite name="${suite.name}" tests="${suite.tests?.length || 0}" failures="${suite.failures || 0}" errors="${suite.errors || 0}" time="${suite.duration / 1000}">\n`;
        
        if (suite.tests) {
          for (const test of suite.tests) {
            xml += `    <testcase name="${test.name}" classname="${suite.name}" time="${test.duration / 1000}">\n`;
            
            if (test.status === 'failed') {
              xml += `      <failure message="${test.error?.message || 'Test failed'}">${test.error?.stack || ''}</failure>\n`;
            } else if (test.status === 'error') {
              xml += `      <error message="${test.error?.message || 'Test error'}">${test.error?.stack || ''}</error>\n`;
            }
            
            xml += '    </testcase>\n';
          }
        }
        
        xml += '  </testsuite>\n';
      }
    }
    
    xml += '</testsuites>\n';
    
    fs.writeFileSync(reportPath, xml);
    this.logVerbose(`JUnit report saved to ${reportPath}`, context);
  }

  private async generateHtmlReport(results: any, reportDir: string, context: CLIContext): Promise<void> {
    const reportPath = path.join(reportDir, 'test-report.html');
    
    // Generate simple HTML report
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .error { color: orange; }
        .suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .suite-header { background: #f0f0f0; padding: 10px; font-weight: bold; }
        .test { padding: 10px; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${results.totalTests}</p>
        <p class="passed">Passed: ${results.passed}</p>
        <p class="failed">Failed: ${results.failures}</p>
        <p class="error">Errors: ${results.errors}</p>
        <p>Duration: ${(results.duration / 1000).toFixed(2)}s</p>
        <p>Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%</p>
    </div>
`;

    if (results.suites) {
      for (const suite of results.suites) {
        html += `
    <div class="suite">
        <div class="suite-header">${suite.name}</div>
`;
        
        if (suite.tests) {
          for (const test of suite.tests) {
            const statusClass = test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'error';
            html += `
        <div class="test">
            <span class="${statusClass}">[${test.status.toUpperCase()}]</span>
            <strong>${test.name}</strong>
            <span>(${(test.duration / 1000).toFixed(2)}s)</span>
            ${test.error ? `<br><small>${test.error.message}</small>` : ''}
        </div>
`;
          }
        }
        
        html += '    </div>\n';
      }
    }

    html += `
</body>
</html>
`;
    
    fs.writeFileSync(reportPath, html);
    this.logVerbose(`HTML report saved to ${reportPath}`, context);
  }

  private displaySummary(results: any, startTime: number, context: CLIContext): void {
    const duration = Date.now() - startTime;
    
    this.log('\n' + '='.repeat(60), context);
    this.log('TEST EXECUTION SUMMARY', context);
    this.log('='.repeat(60), context);
    
    this.log(`Total Tests: ${results.totalTests}`, context);
    this.log(`Passed: ${results.passed}`, context);
    this.log(`Failed: ${results.failures}`, context);
    this.log(`Errors: ${results.errors}`, context);
    this.log(`Skipped: ${results.skipped || 0}`, context);
    this.log(`Duration: ${(duration / 1000).toFixed(2)}s`, context);
    
    const successRate = results.totalTests > 0 ? (results.passed / results.totalTests) * 100 : 0;
    this.log(`Success Rate: ${successRate.toFixed(1)}%`, context);
    
    if (results.success) {
      this.logSuccess('All tests passed!', context);
    } else {
      this.logError(`${results.failures + results.errors} test(s) failed`, context);
    }
    
    this.log('='.repeat(60), context);
  }
}