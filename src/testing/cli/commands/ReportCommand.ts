import { CLICommand, CLIContext } from '../CLICommand';
import { ReportGenerator } from '../../../reporting/ReportGenerator';
import * as fs from 'fs';
import * as path from 'path';

export class ReportCommand extends CLICommand {
  private reportGenerator: ReportGenerator;

  constructor() {
    super({
      name: 'report',
      description: 'Generate and manage test reports',
      usage: 'gocars-test report <subcommand> [options]',
      subcommands: [],
      options: [
        {
          name: 'input',
          alias: 'i',
          description: 'Input directory or file containing test results',
          type: 'string',
          default: './test-reports'
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output directory for generated reports',
          type: 'string',
          default: './reports'
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Report format',
          type: 'string',
          choices: ['html', 'pdf', 'json', 'csv', 'junit'],
          default: 'html'
        },
        {
          name: 'template',
          alias: 't',
          description: 'Report template',
          type: 'string',
          choices: ['default', 'detailed', 'summary', 'executive'],
          default: 'default'
        }
      ],
      examples: [
        'gocars-test report generate',
        'gocars-test report generate --format pdf',
        'gocars-test report list',
        'gocars-test report merge --input ./results1,./results2',
        'gocars-test report compare --baseline ./baseline --current ./current'
      ]
    });

    this.reportGenerator = new ReportGenerator();
    
    // Add subcommands
    this.config.subcommands = [
      new GenerateSubcommand(),
      new ListSubcommand(),
      new MergeSubcommand(),
      new CompareSubcommand(),
      new ServeSubcommand(),
      new CleanSubcommand()
    ];
  }

  public async execute(context: CLIContext): Promise<number> {
    // This command requires a subcommand
    if (!context.rawArgs.some(arg => ['generate', 'list', 'merge', 'compare', 'serve', 'clean'].includes(arg))) {
      this.logError('Report command requires a subcommand', context);
      this.log(this.getHelp(), context);
      return 1;
    }

    return 0;
  }
}

class GenerateSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'generate',
      description: 'Generate test reports from results',
      options: [
        {
          name: 'title',
          description: 'Report title',
          type: 'string',
          default: 'Test Report'
        },
        {
          name: 'include-coverage',
          description: 'Include code coverage in report',
          type: 'boolean',
          default: false
        },
        {
          name: 'include-performance',
          description: 'Include performance metrics in report',
          type: 'boolean',
          default: false
        },
        {
          name: 'theme',
          description: 'Report theme',
          type: 'string',
          choices: ['light', 'dark', 'corporate'],
          default: 'light'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const inputPath = context.options.input || './test-reports';
    const outputPath = context.options.output || './reports';
    const format = context.options.format || 'html';
    const template = context.options.template || 'default';

    try {
      this.log('Generating test report...', context);
      this.logVerbose(`Input: ${inputPath}`, context);
      this.logVerbose(`Output: ${outputPath}`, context);
      this.logVerbose(`Format: ${format}`, context);

      // Check if input exists
      if (!fs.existsSync(inputPath)) {
        this.logError(`Input path not found: ${inputPath}`, context);
        return 1;
      }

      // Load test results
      const results = await this.loadTestResults(inputPath, context);
      if (!results) {
        return 1;
      }

      // Ensure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Generate report configuration
      const reportConfig = {
        title: context.options.title || 'Test Report',
        format,
        template,
        theme: context.options.theme || 'light',
        includeCoverage: context.options['include-coverage'] || false,
        includePerformance: context.options['include-performance'] || false,
        outputPath,
        timestamp: new Date()
      };

      // Generate report
      const reportGenerator = new ReportGenerator();
      const reportPath = await reportGenerator.generateReport(results, reportConfig);

      this.logSuccess(`Report generated: ${reportPath}`, context);
      
      // Display summary
      this.displayReportSummary(results, context);

      return 0;
    } catch (error) {
      this.logError(`Failed to generate report: ${error.message}`, context);
      return 1;
    }
  }

  private async loadTestResults(inputPath: string, context: CLIContext): Promise<any | null> {
    try {
      const stats = fs.statSync(inputPath);
      
      if (stats.isFile()) {
        // Single file
        const content = fs.readFileSync(inputPath, 'utf8');
        return JSON.parse(content);
      } else if (stats.isDirectory()) {
        // Directory - look for result files
        const files = fs.readdirSync(inputPath);
        const resultFiles = files.filter(file => 
          file.endsWith('.json') || file.endsWith('.xml')
        );

        if (resultFiles.length === 0) {
          this.logError(`No test result files found in ${inputPath}`, context);
          return null;
        }

        // Merge multiple result files
        const allResults = [];
        for (const file of resultFiles) {
          const filePath = path.join(inputPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (file.endsWith('.json')) {
            allResults.push(JSON.parse(content));
          }
          // Handle XML files (JUnit format) if needed
        }

        return this.mergeResults(allResults);
      }
    } catch (error) {
      this.logError(`Failed to load test results: ${error.message}`, context);
      return null;
    }
  }

  private mergeResults(results: any[]): any {
    if (results.length === 1) {
      return results[0];
    }

    // Merge multiple result objects
    const merged = {
      totalTests: 0,
      passed: 0,
      failures: 0,
      errors: 0,
      skipped: 0,
      duration: 0,
      suites: [],
      timestamp: new Date(),
      success: true
    };

    for (const result of results) {
      merged.totalTests += result.totalTests || 0;
      merged.passed += result.passed || 0;
      merged.failures += result.failures || 0;
      merged.errors += result.errors || 0;
      merged.skipped += result.skipped || 0;
      merged.duration += result.duration || 0;
      
      if (result.suites) {
        merged.suites.push(...result.suites);
      }
      
      if (!result.success) {
        merged.success = false;
      }
    }

    return merged;
  }

  private displayReportSummary(results: any, context: CLIContext): void {
    this.log('\nReport Summary:', context);
    this.log('='.repeat(40), context);
    this.log(`Total Tests: ${results.totalTests}`, context);
    this.log(`Passed: ${results.passed}`, context);
    this.log(`Failed: ${results.failures}`, context);
    this.log(`Errors: ${results.errors}`, context);
    this.log(`Duration: ${(results.duration / 1000).toFixed(2)}s`, context);
    
    const successRate = results.totalTests > 0 ? (results.passed / results.totalTests) * 100 : 0;
    this.log(`Success Rate: ${successRate.toFixed(1)}%`, context);
  }
}

class ListSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'list',
      description: 'List available test reports',
      options: [
        {
          name: 'detailed',
          alias: 'd',
          description: 'Show detailed information',
          type: 'boolean',
          default: false
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const reportsPath = context.options.output || './reports';

    try {
      if (!fs.existsSync(reportsPath)) {
        this.log('No reports directory found', context);
        return 0;
      }

      const files = fs.readdirSync(reportsPath);
      const reportFiles = files.filter(file => 
        file.endsWith('.html') || file.endsWith('.pdf') || file.endsWith('.json')
      );

      if (reportFiles.length === 0) {
        this.log('No reports found', context);
        return 0;
      }

      this.log(`Found ${reportFiles.length} report(s):`, context);
      this.log('='.repeat(50), context);

      for (const file of reportFiles) {
        const filePath = path.join(reportsPath, file);
        const stats = fs.statSync(filePath);
        
        if (context.options.detailed) {
          this.log(`${file}`, context);
          this.log(`  Size: ${this.formatFileSize(stats.size)}`, context);
          this.log(`  Modified: ${stats.mtime.toLocaleString()}`, context);
          this.log(`  Path: ${filePath}`, context);
          this.log('', context);
        } else {
          const size = this.formatFileSize(stats.size);
          const date = stats.mtime.toLocaleDateString();
          this.log(`${file.padEnd(30)} ${size.padEnd(10)} ${date}`, context);
        }
      }

      return 0;
    } catch (error) {
      this.logError(`Failed to list reports: ${error.message}`, context);
      return 1;
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

class MergeSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'merge',
      description: 'Merge multiple test result files',
      options: [
        {
          name: 'inputs',
          description: 'Comma-separated list of input files or directories',
          type: 'string',
          required: true
        },
        {
          name: 'output-file',
          description: 'Output file for merged results',
          type: 'string',
          default: './merged-results.json'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const inputs = context.options.inputs?.split(',').map((s: string) => s.trim()) || [];
    const outputFile = context.options['output-file'] || './merged-results.json';

    if (inputs.length === 0) {
      this.logError('No input files specified', context);
      return 1;
    }

    try {
      this.log(`Merging ${inputs.length} result file(s)...`, context);

      const allResults = [];
      
      for (const input of inputs) {
        if (!fs.existsSync(input)) {
          this.logWarning(`Input not found, skipping: ${input}`, context);
          continue;
        }

        const content = fs.readFileSync(input, 'utf8');
        const result = JSON.parse(content);
        allResults.push(result);
        
        this.logVerbose(`Loaded: ${input}`, context);
      }

      if (allResults.length === 0) {
        this.logError('No valid result files found', context);
        return 1;
      }

      // Merge results
      const merged = this.mergeResults(allResults);
      
      // Write merged results
      fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
      
      this.logSuccess(`Merged results saved to: ${outputFile}`, context);
      this.log(`Total tests: ${merged.totalTests}`, context);
      this.log(`Success rate: ${((merged.passed / merged.totalTests) * 100).toFixed(1)}%`, context);

      return 0;
    } catch (error) {
      this.logError(`Failed to merge results: ${error.message}`, context);
      return 1;
    }
  }

  private mergeResults(results: any[]): any {
    const merged = {
      totalTests: 0,
      passed: 0,
      failures: 0,
      errors: 0,
      skipped: 0,
      duration: 0,
      suites: [],
      mergedFrom: results.length,
      mergedAt: new Date(),
      success: true
    };

    for (const result of results) {
      merged.totalTests += result.totalTests || 0;
      merged.passed += result.passed || 0;
      merged.failures += result.failures || 0;
      merged.errors += result.errors || 0;
      merged.skipped += result.skipped || 0;
      merged.duration += result.duration || 0;
      
      if (result.suites) {
        merged.suites.push(...result.suites);
      }
      
      if (!result.success) {
        merged.success = false;
      }
    }

    return merged;
  }
}

class CompareSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'compare',
      description: 'Compare test results between two runs',
      options: [
        {
          name: 'baseline',
          alias: 'b',
          description: 'Baseline test results file',
          type: 'string',
          required: true
        },
        {
          name: 'current',
          alias: 'c',
          description: 'Current test results file',
          type: 'string',
          required: true
        },
        {
          name: 'output-format',
          description: 'Comparison output format',
          type: 'string',
          choices: ['table', 'json', 'html'],
          default: 'table'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const baselinePath = context.options.baseline;
    const currentPath = context.options.current;
    const outputFormat = context.options['output-format'] || 'table';

    try {
      // Load baseline results
      if (!fs.existsSync(baselinePath)) {
        this.logError(`Baseline file not found: ${baselinePath}`, context);
        return 1;
      }

      if (!fs.existsSync(currentPath)) {
        this.logError(`Current file not found: ${currentPath}`, context);
        return 1;
      }

      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));

      // Perform comparison
      const comparison = this.compareResults(baseline, current);

      // Display comparison
      this.displayComparison(comparison, outputFormat, context);

      return 0;
    } catch (error) {
      this.logError(`Failed to compare results: ${error.message}`, context);
      return 1;
    }
  }

  private compareResults(baseline: any, current: any): any {
    return {
      baseline: {
        totalTests: baseline.totalTests || 0,
        passed: baseline.passed || 0,
        failures: baseline.failures || 0,
        errors: baseline.errors || 0,
        duration: baseline.duration || 0,
        successRate: baseline.totalTests > 0 ? (baseline.passed / baseline.totalTests) * 100 : 0
      },
      current: {
        totalTests: current.totalTests || 0,
        passed: current.passed || 0,
        failures: current.failures || 0,
        errors: current.errors || 0,
        duration: current.duration || 0,
        successRate: current.totalTests > 0 ? (current.passed / current.totalTests) * 100 : 0
      },
      changes: {
        totalTests: (current.totalTests || 0) - (baseline.totalTests || 0),
        passed: (current.passed || 0) - (baseline.passed || 0),
        failures: (current.failures || 0) - (baseline.failures || 0),
        errors: (current.errors || 0) - (baseline.errors || 0),
        duration: (current.duration || 0) - (baseline.duration || 0),
        successRate: ((current.totalTests > 0 ? (current.passed / current.totalTests) * 100 : 0) - 
                     (baseline.totalTests > 0 ? (baseline.passed / baseline.totalTests) * 100 : 0))
      }
    };
  }

  private displayComparison(comparison: any, format: string, context: CLIContext): void {
    switch (format) {
      case 'json':
        this.log(JSON.stringify(comparison, null, 2), context);
        break;
      case 'html':
        // Generate simple HTML comparison
        this.generateHtmlComparison(comparison, context);
        break;
      case 'table':
      default:
        this.displayTableComparison(comparison, context);
        break;
    }
  }

  private displayTableComparison(comparison: any, context: CLIContext): void {
    this.log('\nTest Results Comparison', context);
    this.log('='.repeat(60), context);
    
    const formatChange = (value: number) => {
      if (value > 0) return `+${value}`;
      if (value < 0) return `${value}`;
      return '0';
    };

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    this.log('Metric'.padEnd(20) + 'Baseline'.padEnd(12) + 'Current'.padEnd(12) + 'Change'.padEnd(12), context);
    this.log('-'.repeat(60), context);
    
    this.log(`Total Tests`.padEnd(20) + 
             `${comparison.baseline.totalTests}`.padEnd(12) + 
             `${comparison.current.totalTests}`.padEnd(12) + 
             `${formatChange(comparison.changes.totalTests)}`.padEnd(12), context);
             
    this.log(`Passed`.padEnd(20) + 
             `${comparison.baseline.passed}`.padEnd(12) + 
             `${comparison.current.passed}`.padEnd(12) + 
             `${formatChange(comparison.changes.passed)}`.padEnd(12), context);
             
    this.log(`Failed`.padEnd(20) + 
             `${comparison.baseline.failures}`.padEnd(12) + 
             `${comparison.current.failures}`.padEnd(12) + 
             `${formatChange(comparison.changes.failures)}`.padEnd(12), context);
             
    this.log(`Errors`.padEnd(20) + 
             `${comparison.baseline.errors}`.padEnd(12) + 
             `${comparison.current.errors}`.padEnd(12) + 
             `${formatChange(comparison.changes.errors)}`.padEnd(12), context);
             
    this.log(`Duration (ms)`.padEnd(20) + 
             `${comparison.baseline.duration}`.padEnd(12) + 
             `${comparison.current.duration}`.padEnd(12) + 
             `${formatChange(comparison.changes.duration)}`.padEnd(12), context);
             
    this.log(`Success Rate`.padEnd(20) + 
             `${formatPercent(comparison.baseline.successRate)}`.padEnd(12) + 
             `${formatPercent(comparison.current.successRate)}`.padEnd(12) + 
             `${formatChange(comparison.changes.successRate).replace(/^([+-])/, '$1')}%`.padEnd(12), context);
  }

  private generateHtmlComparison(comparison: any, context: CLIContext): void {
    // This would generate an HTML comparison report
    this.log('HTML comparison report generation not implemented yet', context);
  }
}

class ServeSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'serve',
      description: 'Serve reports via HTTP server',
      options: [
        {
          name: 'port',
          alias: 'p',
          description: 'Server port',
          type: 'number',
          default: 8080
        },
        {
          name: 'host',
          description: 'Server host',
          type: 'string',
          default: 'localhost'
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const port = context.options.port || 8080;
    const host = context.options.host || 'localhost';
    const reportsPath = context.options.output || './reports';

    this.log(`Starting report server on http://${host}:${port}`, context);
    this.log(`Serving reports from: ${reportsPath}`, context);
    this.log('Press Ctrl+C to stop the server', context);

    // This would implement a simple HTTP server to serve reports
    // For now, just simulate the server
    this.logWarning('Report server not fully implemented yet', context);
    
    return 0;
  }
}

class CleanSubcommand extends CLICommand {
  constructor() {
    super({
      name: 'clean',
      description: 'Clean up old reports',
      options: [
        {
          name: 'days',
          alias: 'd',
          description: 'Remove reports older than specified days',
          type: 'number',
          default: 30
        },
        {
          name: 'confirm',
          description: 'Confirm the cleanup operation',
          type: 'boolean',
          default: false
        }
      ]
    });
  }

  public async execute(context: CLIContext): Promise<number> {
    const reportsPath = context.options.output || './reports';
    const days = context.options.days || 30;
    const confirm = context.options.confirm;

    if (!confirm) {
      this.logWarning(`This will remove reports older than ${days} days. Use --confirm to proceed.`, context);
      return 1;
    }

    try {
      if (!fs.existsSync(reportsPath)) {
        this.log('No reports directory found', context);
        return 0;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const files = fs.readdirSync(reportsPath);
      let removedCount = 0;

      for (const file of files) {
        const filePath = path.join(reportsPath, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          removedCount++;
          this.logVerbose(`Removed: ${file}`, context);
        }
      }

      this.logSuccess(`Removed ${removedCount} old report(s)`, context);
      return 0;
    } catch (error) {
      this.logError(`Failed to clean reports: ${error.message}`, context);
      return 1;
    }
  }
}