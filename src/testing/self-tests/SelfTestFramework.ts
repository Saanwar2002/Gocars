import { EventEmitter } from 'events';

export interface SelfTestResult {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'performance' | 'reliability';
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  startTime: Date;
  endTime: Date;
  message?: string;
  details?: any;
  error?: Error;
  metrics?: {
    memoryUsage?: number;
    cpuUsage?: number;
    responseTime?: number;
    throughput?: number;
  };
}

export interface SelfTestSuite {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'performance' | 'reliability';
  setup?(): Promise<void>;
  teardown?(): Promise<void>;
  runTests(): Promise<SelfTestResult[]>;
  getHealthStatus(): 'healthy' | 'warning' | 'critical';
}

export interface SelfTestConfig {
  suites: string[];
  timeout: number;
  retryAttempts: number;
  parallel: boolean;
  reportFormat: 'json' | 'html' | 'console';
  outputPath?: string;
  includePerformanceMetrics: boolean;
  failFast: boolean;
}

export class SelfTestFramework extends EventEmitter {
  private testSuites: Map<string, SelfTestSuite> = new Map();
  private results: Map<string, SelfTestResult[]> = new Map();
  private isRunning = false;
  private startTime?: Date;
  private endTime?: Date;

  constructor(private config: SelfTestConfig) {
    super();
  }

  registerTestSuite(suite: SelfTestSuite): void {
    this.testSuites.set(suite.id, suite);
    this.emit('suiteRegistered', suite);
  }

  async runAllTests(): Promise<Map<string, SelfTestResult[]>> {
    if (this.isRunning) {
      throw new Error('Self-tests are already running');
    }

    this.isRunning = true;
    this.startTime = new Date();
    this.results.clear();

    this.emit('testRunStarted', {
      suiteCount: this.testSuites.size,
      config: this.config
    });

    try {
      const suitesToRun = Array.from(this.testSuites.values())
        .filter(suite => this.config.suites.length === 0 || this.config.suites.includes(suite.id));

      if (this.config.parallel) {
        await this.runSuitesInParallel(suitesToRun);
      } else {
        await this.runSuitesSequentially(suitesToRun);
      }

      this.endTime = new Date();
      this.emit('testRunCompleted', {
        duration: this.endTime.getTime() - this.startTime!.getTime(),
        results: this.results
      });

      return this.results;
    } catch (error) {
      this.emit('testRunFailed', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async runTestSuite(suiteId: string): Promise<SelfTestResult[]> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite '${suiteId}' not found`);
    }

    this.emit('suiteStarted', suite);

    try {
      // Setup
      if (suite.setup) {
        await this.executeWithTimeout(suite.setup.bind(suite), this.config.timeout);
      }

      // Run tests
      const results = await this.executeWithTimeout(
        suite.runTests.bind(suite),
        this.config.timeout
      );

      // Store results
      this.results.set(suiteId, results);

      // Teardown
      if (suite.teardown) {
        await this.executeWithTimeout(suite.teardown.bind(suite), this.config.timeout);
      }

      this.emit('suiteCompleted', { suite, results });
      return results;
    } catch (error) {
      const errorResult: SelfTestResult = {
        id: `${suiteId}-error`,
        name: `${suite.name} - Suite Error`,
        category: suite.category,
        status: 'error',
        duration: 0,
        startTime: new Date(),
        endTime: new Date(),
        error: error as Error,
        message: `Suite execution failed: ${(error as Error).message}`
      };

      this.results.set(suiteId, [errorResult]);
      this.emit('suiteFailed', { suite, error });
      
      if (this.config.failFast) {
        throw error;
      }
      
      return [errorResult];
    }
  }

  private async runSuitesInParallel(suites: SelfTestSuite[]): Promise<void> {
    const promises = suites.map(suite => this.runTestSuite(suite.id));
    await Promise.allSettled(promises);
  }

  private async runSuitesSequentially(suites: SelfTestSuite[]): Promise<void> {
    for (const suite of suites) {
      try {
        await this.runTestSuite(suite.id);
      } catch (error) {
        if (this.config.failFast) {
          throw error;
        }
        // Continue with next suite if failFast is disabled
      }
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  getTestResults(): Map<string, SelfTestResult[]> {
    return new Map(this.results);
  }

  getOverallStatus(): 'passed' | 'failed' | 'warning' {
    const allResults = Array.from(this.results.values()).flat();
    
    if (allResults.length === 0) {
      return 'warning';
    }

    const hasFailures = allResults.some(result => 
      result.status === 'failed' || result.status === 'error'
    );

    if (hasFailures) {
      return 'failed';
    }

    return 'passed';
  }

  generateSummary(): {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    duration: number;
    categories: Record<string, { passed: number; failed: number; total: number }>;
  } {
    const allResults = Array.from(this.results.values()).flat();
    const categories: Record<string, { passed: number; failed: number; total: number }> = {};

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let errors = 0;

    for (const result of allResults) {
      switch (result.status) {
        case 'passed':
          passed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'skipped':
          skipped++;
          break;
        case 'error':
          errors++;
          break;
      }

      // Track by category
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0, total: 0 };
      }
      categories[result.category].total++;
      if (result.status === 'passed') {
        categories[result.category].passed++;
      } else if (result.status === 'failed' || result.status === 'error') {
        categories[result.category].failed++;
      }
    }

    const duration = this.endTime && this.startTime 
      ? this.endTime.getTime() - this.startTime.getTime()
      : 0;

    return {
      totalTests: allResults.length,
      passed,
      failed,
      skipped,
      errors,
      duration,
      categories
    };
  }

  async generateReport(format: 'json' | 'html' | 'console' = 'console'): Promise<string> {
    const summary = this.generateSummary();
    const results = this.getTestResults();

    switch (format) {
      case 'json':
        return JSON.stringify({
          summary,
          results: Object.fromEntries(results),
          timestamp: new Date().toISOString()
        }, null, 2);

      case 'html':
        return this.generateHTMLReport(summary, results);

      case 'console':
      default:
        return this.generateConsoleReport(summary, results);
    }
  }

  private generateConsoleReport(
    summary: any,
    results: Map<string, SelfTestResult[]>
  ): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('TESTING AGENT SELF-TEST REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Summary
    lines.push(`Total Tests: ${summary.totalTests}`);
    lines.push(`Passed: ${summary.passed} (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`);
    lines.push(`Failed: ${summary.failed} (${((summary.failed / summary.totalTests) * 100).toFixed(1)}%)`);
    lines.push(`Errors: ${summary.errors} (${((summary.errors / summary.totalTests) * 100).toFixed(1)}%)`);
    lines.push(`Skipped: ${summary.skipped} (${((summary.skipped / summary.totalTests) * 100).toFixed(1)}%)`);
    lines.push(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    lines.push('');

    // Category breakdown
    lines.push('RESULTS BY CATEGORY:');
    lines.push('-'.repeat(40));
    for (const [category, stats] of Object.entries(summary.categories)) {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      lines.push(`${category.toUpperCase()}: ${stats.passed}/${stats.total} (${successRate}%)`);
    }
    lines.push('');

    // Detailed results
    for (const [suiteId, suiteResults] of results) {
      lines.push(`SUITE: ${suiteId}`);
      lines.push('-'.repeat(40));
      
      for (const result of suiteResults) {
        const status = result.status.toUpperCase().padEnd(8);
        const duration = `${result.duration}ms`.padStart(8);
        const icon = result.status === 'passed' ? '✓' : 
                    result.status === 'failed' ? '✗' : 
                    result.status === 'error' ? '⚠' : '○';
        
        lines.push(`  ${icon} ${status} ${duration} ${result.name}`);
        
        if (result.message && result.status !== 'passed') {
          lines.push(`    Message: ${result.message}`);
        }
        
        if (result.error) {
          lines.push(`    Error: ${result.error.message}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateHTMLReport(
    summary: any,
    results: Map<string, SelfTestResult[]>
  ): string {
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testing Agent Self-Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .error { color: #fd7e14; }
        .skipped { color: #6c757d; }
        .suite { margin-bottom: 30px; }
        .suite-header { background: #e9ecef; padding: 10px; border-radius: 6px 6px 0 0; font-weight: bold; }
        .test-result { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .test-result:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; font-weight: bold; }
        .test-duration { margin-left: 10px; color: #666; font-size: 0.9em; }
        .test-message { margin-top: 5px; color: #666; font-size: 0.9em; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Testing Agent Self-Test Report</h1>
            <p>Generated on ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${summary.errors}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(summary.duration / 1000).toFixed(2)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>
        
        ${Array.from(results.entries()).map(([suiteId, suiteResults]) => `
            <div class="suite">
                <div class="suite-header">${suiteId}</div>
                <div class="suite-results">
                    ${suiteResults.map(result => `
                        <div class="test-result">
                            <div class="test-name">
                                ${result.name}
                                ${result.message ? `<div class="test-message">${result.message}</div>` : ''}
                            </div>
                            <div>
                                <span class="test-status ${result.status}">${result.status.toUpperCase()}</span>
                                <span class="test-duration">${result.duration}ms</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }

  getRegisteredSuites(): SelfTestSuite[] {
    return Array.from(this.testSuites.values());
  }
}