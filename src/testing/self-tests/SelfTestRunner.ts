import { SelfTestFramework, SelfTestConfig } from './SelfTestFramework';
import { CoreComponentsTestSuite } from './unit/CoreComponentsTestSuite';
import { TestingWorkflowsTestSuite } from './integration/TestingWorkflowsTestSuite';
import { PerformanceTestSuite } from './performance/PerformanceTestSuite';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SelfTestRunnerConfig extends SelfTestConfig {
  generateReport: boolean;
  reportPath?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  exitOnFailure: boolean;
}

export class SelfTestRunner {
  private framework: SelfTestFramework;
  private config: SelfTestRunnerConfig;

  constructor(config: Partial<SelfTestRunnerConfig> = {}) {
    this.config = {
      suites: [],
      timeout: 60000,
      retryAttempts: 1,
      parallel: false,
      reportFormat: 'console',
      includePerformanceMetrics: true,
      failFast: false,
      generateReport: true,
      logLevel: 'info',
      exitOnFailure: true,
      ...config
    };

    this.framework = new SelfTestFramework(this.config);
    this.setupEventListeners();
    this.registerTestSuites();
  }

  private setupEventListeners(): void {
    this.framework.on('testRunStarted', (data) => {
      this.log('info', `Starting self-tests with ${data.suiteCount} test suites`);
    });

    this.framework.on('suiteStarted', (suite) => {
      this.log('info', `Running test suite: ${suite.name}`);
    });

    this.framework.on('suiteCompleted', (data) => {
      const { suite, results } = data;
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const errors = results.filter(r => r.status === 'error').length;
      
      this.log('info', `Completed ${suite.name}: ${passed} passed, ${failed} failed, ${errors} errors`);
    });

    this.framework.on('suiteFailed', (data) => {
      this.log('error', `Test suite ${data.suite.name} failed: ${data.error.message}`);
    });

    this.framework.on('testRunCompleted', (data) => {
      this.log('info', `Self-tests completed in ${(data.duration / 1000).toFixed(2)}s`);
    });

    this.framework.on('testRunFailed', (error) => {
      this.log('error', `Self-test run failed: ${error.message}`);
    });
  }

  private registerTestSuites(): void {
    // Register all test suites
    this.framework.registerTestSuite(new CoreComponentsTestSuite());
    this.framework.registerTestSuite(new TestingWorkflowsTestSuite());
    this.framework.registerTestSuite(new PerformanceTestSuite());
  }

  async runAllTests(): Promise<boolean> {
    try {
      this.log('info', 'Starting Testing Agent Self-Tests');
      this.log('info', '='.repeat(50));

      const results = await this.framework.runAllTests();
      const summary = this.framework.generateSummary();
      const overallStatus = this.framework.getOverallStatus();

      // Log summary
      this.log('info', '');
      this.log('info', 'TEST SUMMARY:');
      this.log('info', `-Total Tests: ${summary.totalTests}`);
      this.log('info', `-Passed: ${summary.passed} (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`);
      this.log('info', `-Failed: ${summary.failed} (${((summary.failed / summary.totalTests) * 100).toFixed(1)}%)`);
      this.log('info', `-Errors: ${summary.errors} (${((summary.errors / summary.totalTests) * 100).toFixed(1)}%)`);
      this.log('info', `-Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      this.log('info', `-Overall Status: ${overallStatus.toUpperCase()}`);

      // Generate and save report if requested
      if (this.config.generateReport) {
        await this.generateAndSaveReport();
      }

      // Log detailed results for failures
      if (summary.failed > 0 || summary.errors > 0) {
        this.log('warn', '');
        this.log('warn', 'FAILED TESTS:');
        for (const [suiteId, suiteResults] of results) {
          const failedResults = suiteResults.filter(r => r.status === 'failed' || r.status === 'error');
          if (failedResults.length > 0) {
            this.log('warn', `Suite: ${suiteId}`);
            for (const result of failedResults) {
              this.log('warn', `  - ${result.name}: ${result.message || result.error?.message}`);
            }
          }
        }
      }

      const success = overallStatus === 'passed';
      
      if (success) {
        this.log('info', '');
        this.log('info', '✅ All self-tests passed successfully!');
      } else {
        this.log('error', '');
        this.log('error', '❌ Some self-tests failed. Please review the results above.');
      }

      return success;
    } catch (error) {
      this.log('error', `Self-test execution failed: ${(error as Error).message}`);
      return false;
    }
  }

  async runSpecificSuite(suiteId: string): Promise<boolean> {
    try {
      this.log('info', `Running specific test suite: ${suiteId}`);
      
      const results = await this.framework.runTestSuite(suiteId);
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const errors = results.filter(r => r.status === 'error').length;

      this.log('info', `Suite completed: ${passed} passed, ${failed} failed, ${errors} errors`);

      const success = failed === 0 && errors === 0;
      
      if (success) {
        this.log('info', '✅ Test suite passed successfully!');
      } else {
        this.log('error', '❌ Test suite had failures.');
        
        // Log failed tests
        const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error');
        for (const result of failedResults) {
          this.log('error', `  - ${result.name}: ${result.message || result.error?.message}`);
        }
      }

      return success;
    } catch (error) {
      this.log('error', `Test suite execution failed: ${(error as Error).message}`);
      return false;
    }
  }

  async generateAndSaveReport(): Promise<void> {
    try {
      const report = await this.framework.generateReport(this.config.reportFormat);
      
      if (this.config.reportPath) {
        // Ensure directory exists
        const reportDir = path.dirname(this.config.reportPath);
        await fs.mkdir(reportDir, { recursive: true });
        
        // Write report
        await fs.writeFile(this.config.reportPath, report, 'utf8');
        this.log('info', `Report saved to: ${this.config.reportPath}`);
      } else {
        // Generate default report path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.config.reportFormat === 'html' ? 'html' : 
                         this.config.reportFormat === 'json' ? 'json' : 'txt';
        const defaultPath = `./self-test-report-${timestamp}.${extension}`;
        
        await fs.writeFile(defaultPath, report, 'utf8');
        this.log('info', `Report saved to: ${defaultPath}`);
      }
    } catch (error) {
      this.log('error', `Failed to save report: ${(error as Error).message}`);
    }
  }

  getAvailableSuites(): string[] {
    return this.framework.getRegisteredSuites().map(suite => suite.id);
  }

  getFrameworkStatus(): {
    isRunning: boolean;
    registeredSuites: number;
    lastResults?: any;
  } {
    return {
      isRunning: this.framework.isTestRunning(),
      registeredSuites: this.framework.getRegisteredSuites().length,
      lastResults: this.framework.getTestResults()
    };
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= currentLevelIndex) {
      const timestamp = new Date().toISOString();
      const prefix = level.toUpperCase().padEnd(5);
      console.log(`[${timestamp}] ${prefix} ${message}`);
    }
  }

  // Static method for easy CLI usage
  static async runFromCLI(args: string[] = []): Promise<void> {
    const config: Partial<SelfTestRunnerConfig> = {
      logLevel: 'info',
      generateReport: true,
      exitOnFailure: true
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--suite':
          config.suites = [args[++i]];
          break;
        case '--parallel':
          config.parallel = true;
          break;
        case '--timeout':
          config.timeout = parseInt(args[++i]);
          break;
        case '--format':
          config.reportFormat = args[++i] as any;
          break;
        case '--output':
          config.reportPath = args[++i];
          break;
        case '--no-report':
          config.generateReport = false;
          break;
        case '--fail-fast':
          config.failFast = true;
          break;
        case '--verbose':
          config.logLevel = 'debug';
          break;
        case '--quiet':
          config.logLevel = 'warn';
          break;
        case '--no-exit':
          config.exitOnFailure = false;
          break;
      }
    }

    const runner = new SelfTestRunner(config);
    
    let success = false;
    if (config.suites && config.suites.length === 1) {
      success = await runner.runSpecificSuite(config.suites[0]);
    } else {
      success = await runner.runAllTests();
    }

    if (config.exitOnFailure && !success) {
      process.exit(1);
    }
  }
}

// CLI entry point
if (require.main === module) {
  SelfTestRunner.runFromCLI(process.argv.slice(2))
    .catch(error => {
      console.error('Self-test runner failed:', error);
      process.exit(1);
    });
}