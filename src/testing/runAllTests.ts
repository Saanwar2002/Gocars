#!/usr/bin/env node

// Comprehensive test runner that orchestrates all testing types
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

interface TestSuiteResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  details?: any;
}

interface TestRunSummary {
  totalDuration: number;
  suites: TestSuiteResult[];
  overallStatus: 'passed' | 'failed';
  timestamp: string;
}

class ComprehensiveTestRunner {
  private results: TestSuiteResult[] = [];
  private startTime: number = 0;

  public async runAllTests(options: {
    unit?: boolean;
    integration?: boolean;
    e2e?: boolean;
    performance?: boolean;
    coverage?: boolean;
    parallel?: boolean;
    bail?: boolean;
  } = {}): Promise<TestRunSummary> {
    console.log('🚀 Starting comprehensive test suite...');
    this.startTime = performance.now();

    // Default to running all tests if no specific options provided
    const config = {
      unit: true,
      integration: true,
      e2e: true,
      performance: false, // Performance tests are opt-in
      coverage: true,
      parallel: false,
      bail: false,
      ...options,
    };

    try {
      // Create test results directory
      this.ensureTestResultsDirectory();

      // Run test suites based on configuration
      if (config.unit) {
        await this.runUnitTests(config);
      }

      if (config.integration) {
        await this.runIntegrationTests(config);
      }

      if (config.e2e) {
        await this.runE2ETests(config);
      }

      if (config.performance) {
        await this.runPerformanceTests(config);
      }

      // Generate comprehensive report
      const summary = this.generateSummary();
      await this.generateFinalReport(summary);

      return summary;

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      throw error;
    }
  }

  private async runUnitTests(config: any): Promise<void> {
    console.log('\\n🧪 Running unit tests...');
    const startTime = performance.now();

    try {
      const jestArgs = [
        '--testPathPattern=unit',
        '--passWithNoTests',
      ];

      if (config.coverage) {
        jestArgs.push('--coverage');
      }

      if (config.bail) {
        jestArgs.push('--bail');
      }

      const command = `npx jest ${jestArgs.join(' ')}`;
      console.log(`Executing: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      const endTime = performance.now();
      this.results.push({
        name: 'Unit Tests',
        status: 'passed',
        duration: endTime - startTime,
      });

      console.log('✅ Unit tests completed successfully');

    } catch (error) {
      const endTime = performance.now();
      this.results.push({
        name: 'Unit Tests',
        status: 'failed',
        duration: endTime - startTime,
        details: error,
      });

      console.error('❌ Unit tests failed');
      
      if (config.bail) {
        throw error;
      }
    }
  }

  private async runIntegrationTests(config: any): Promise<void> {
    console.log('\\n🔗 Running integration tests...');
    const startTime = performance.now();

    try {
      const jestArgs = [
        '--testPathPattern=integration',
        '--passWithNoTests',
        '--runInBand', // Integration tests should run sequentially
      ];

      if (config.bail) {
        jestArgs.push('--bail');
      }

      const command = `npx jest ${jestArgs.join(' ')}`;
      console.log(`Executing: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      const endTime = performance.now();
      this.results.push({
        name: 'Integration Tests',
        status: 'passed',
        duration: endTime - startTime,
      });

      console.log('✅ Integration tests completed successfully');

    } catch (error) {
      const endTime = performance.now();
      this.results.push({
        name: 'Integration Tests',
        status: 'failed',
        duration: endTime - startTime,
        details: error,
      });

      console.error('❌ Integration tests failed');
      
      if (config.bail) {
        throw error;
      }
    }
  }

  private async runE2ETests(config: any): Promise<void> {
    console.log('\\n🌐 Running end-to-end tests...');
    const startTime = performance.now();

    try {
      const playwrightArgs = [
        '--reporter=html',
        '--reporter=json',
      ];

      if (config.bail) {
        playwrightArgs.push('--max-failures=1');
      }

      const command = `npx playwright test ${playwrightArgs.join(' ')}`;
      console.log(`Executing: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      const endTime = performance.now();
      this.results.push({
        name: 'End-to-End Tests',
        status: 'passed',
        duration: endTime - startTime,
      });

      console.log('✅ End-to-end tests completed successfully');

    } catch (error) {
      const endTime = performance.now();
      this.results.push({
        name: 'End-to-End Tests',
        status: 'failed',
        duration: endTime - startTime,
        details: error,
      });

      console.error('❌ End-to-end tests failed');
      
      if (config.bail) {
        throw error;
      }
    }
  }

  private async runPerformanceTests(config: any): Promise<void> {
    console.log('\\n⚡ Running performance tests...');
    const startTime = performance.now();

    try {
      const jestArgs = [
        '--testPathPattern=performance',
        '--passWithNoTests',
        '--runInBand', // Performance tests should run sequentially
        '--detectOpenHandles',
      ];

      const command = `npx jest ${jestArgs.join(' ')}`;
      console.log(`Executing: ${command}`);

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      const endTime = performance.now();
      this.results.push({
        name: 'Performance Tests',
        status: 'passed',
        duration: endTime - startTime,
      });

      console.log('✅ Performance tests completed successfully');

    } catch (error) {
      const endTime = performance.now();
      this.results.push({
        name: 'Performance Tests',
        status: 'failed',
        duration: endTime - startTime,
        details: error,
      });

      console.error('❌ Performance tests failed');
      
      if (config.bail) {
        throw error;
      }
    }
  }

  private generateSummary(): TestRunSummary {
    const endTime = performance.now();
    const totalDuration = endTime - this.startTime;
    
    const failedSuites = this.results.filter(r => r.status === 'failed');
    const overallStatus = failedSuites.length > 0 ? 'failed' : 'passed';

    return {
      totalDuration,
      suites: this.results,
      overallStatus,
      timestamp: new Date().toISOString(),
    };
  }

  private async generateFinalReport(summary: TestRunSummary): Promise<void> {
    console.log('\\n📊 Generating comprehensive test report...');

    // Write JSON summary
    const summaryPath = path.join('test-results', 'comprehensive-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Generate HTML dashboard
    const htmlReport = this.generateHtmlDashboard(summary);
    const htmlPath = path.join('test-results', 'test-dashboard.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // Log summary to console
    this.logFinalSummary(summary);

    console.log(`\\n📈 Reports generated:`);
    console.log(`   JSON Summary: ${summaryPath}`);
    console.log(`   HTML Dashboard: ${htmlPath}`);
  }

  private generateHtmlDashboard(summary: TestRunSummary): string {
    const { suites, totalDuration, overallStatus, timestamp } = summary;
    const passedSuites = suites.filter(s => s.status === 'passed').length;
    const failedSuites = suites.filter(s => s.status === 'failed').length;
    const skippedSuites = suites.filter(s => s.status === 'skipped').length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #6c757d; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .suites { display: grid; gap: 20px; }
        .suite-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .suite-name { font-size: 1.2em; font-weight: bold; }
        .suite-duration { color: #6c757d; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin: 15px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .chart-container { margin: 30px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Test Dashboard</h1>
            <div class="status-badge status-${overallStatus}">${overallStatus.toUpperCase()}</div>
            <p>Generated on ${new Date(timestamp).toLocaleString()}</p>
            <p>Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds</p>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value" style="color: #28a745;">${passedSuites}</div>
                <div class="metric-label">Passed Suites</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #dc3545;">${failedSuites}</div>
                <div class="metric-label">Failed Suites</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #ffc107;">${skippedSuites}</div>
                <div class="metric-label">Skipped Suites</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${suites.length}</div>
                <div class="metric-label">Total Suites</div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suite Results</h2>
            ${suites.map(suite => `
                <div class="suite-card">
                    <div class="suite-header">
                        <div class="suite-name">${suite.name}</div>
                        <div class="suite-duration">${(suite.duration / 1000).toFixed(2)}s</div>
                    </div>
                    <div class="status-badge status-${suite.status}">${suite.status.toUpperCase()}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${suite.status === 'passed' ? '100' : suite.status === 'failed' ? '0' : '50'}%; background: ${suite.status === 'passed' ? '#28a745' : suite.status === 'failed' ? '#dc3545' : '#ffc107'};"></div>
                    </div>
                    ${suite.details ? `<div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-family: monospace; font-size: 0.9em; color: #dc3545;">Error details available in logs</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="chart-container">
            <h2>Test Execution Timeline</h2>
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    ${suites.map((suite, index) => `
                        <div style="flex: 1; text-align: center; padding: 10px;">
                            <div style="width: 100%; height: 40px; background: ${suite.status === 'passed' ? '#28a745' : suite.status === 'failed' ? '#dc3545' : '#ffc107'}; border-radius: 4px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                ${index + 1}
                            </div>
                            <div style="font-size: 0.8em; color: #6c757d;">${suite.name}</div>
                            <div style="font-size: 0.7em; color: #6c757d;">${(suite.duration / 1000).toFixed(1)}s</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private logFinalSummary(summary: TestRunSummary): void {
    const { suites, totalDuration, overallStatus } = summary;
    const passedSuites = suites.filter(s => s.status === 'passed').length;
    const failedSuites = suites.filter(s => s.status === 'failed').length;
    const skippedSuites = suites.filter(s => s.status === 'skipped').length;

    console.log('\\n' + '='.repeat(80));
    console.log('🏁 COMPREHENSIVE TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`\\nSuite Results:`);
    console.log(`  ✅ Passed: ${passedSuites}`);
    console.log(`  ❌ Failed: ${failedSuites}`);
    console.log(`  ⏭️  Skipped: ${skippedSuites}`);
    console.log(`  📊 Total: ${suites.length}`);

    console.log('\\nIndividual Suite Results:');
    suites.forEach(suite => {
      const icon = suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⏭️';
      const duration = (suite.duration / 1000).toFixed(2);
      console.log(`  ${icon} ${suite.name} (${duration}s)`);
    });

    if (failedSuites > 0) {
      console.log('\\n❌ Failed Suites:');
      suites.filter(s => s.status === 'failed').forEach(suite => {
        console.log(`  • ${suite.name}`);
      });
    }

    console.log('='.repeat(80));
  }

  private ensureTestResultsDirectory(): void {
    const testResultsDir = 'test-results';
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: any = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--unit-only':
        options.unit = true;
        options.integration = false;
        options.e2e = false;
        break;
      case '--integration-only':
        options.unit = false;
        options.integration = true;
        options.e2e = false;
        break;
      case '--e2e-only':
        options.unit = false;
        options.integration = false;
        options.e2e = true;
        break;
      case '--with-performance':
        options.performance = true;
        break;
      case '--no-coverage':
        options.coverage = false;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--bail':
        options.bail = true;
        break;
    }
  });

  const runner = new ComprehensiveTestRunner();
  
  try {
    const summary = await runner.runAllTests(options);
    
    if (summary.overallStatus === 'failed') {
      process.exit(1);
    } else {
      console.log('\\n🎉 All tests passed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { ComprehensiveTestRunner };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}