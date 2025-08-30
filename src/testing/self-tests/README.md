# Testing Agent Self-Tests

This directory contains comprehensive self-tests for the GoCars Testing Agent. The self-test system validates the functionality, performance, and reliability of all testing agent components.

## Overview

The self-test framework provides:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows and component interactions
- **Performance Tests**: Validate performance benchmarks and resource usage
- **Reliability Tests**: Test system stability and error recovery

## Architecture

### Core Components

- **SelfTestFramework**: Core testing framework that orchestrates test execution
- **SelfTestRunner**: High-level runner with CLI support and reporting
- **Test Suites**: Individual test suites for different categories

### Test Suites

1. **CoreComponentsTestSuite** (`unit/`)
   - Tests core testing agent components
   - Validates TestingAgentController, VirtualUserFactory, ErrorAnalysisEngine
   - Ensures proper initialization, configuration, and lifecycle management

2. **TestingWorkflowsTestSuite** (`integration/`)
   - Tests complete testing workflows
   - Validates test execution, suite coordination, error handling
   - Tests concurrent execution and result aggregation

3. **PerformanceTestSuite** (`performance/`)
   - Performance and reliability validation
   - Memory usage, CPU usage, response times, throughput
   - System stability, error recovery, long-running tests

## Usage

### Command Line

```bash
# Run all self-tests
npm run self-test

# Run specific test suite
npm run self-test -- --suite core-components
npm run self-test -- --suite testing-workflows
npm run self-test -- --suite performance-validation

# Run with options
npm run self-test -- --parallel --format html --output ./report.html
npm run self-test -- --verbose --fail-fast
npm run self-test -- --quiet --no-report
```

### Programmatic Usage

```typescript
import { runSelfTests, runSelfTestSuite } from './self-tests';

// Run all tests
const success = await runSelfTests({
  parallel: true,
  reportFormat: 'json',
  generateReport: true
});

// Run specific suite
const suiteSuccess = await runSelfTestSuite('core-components', {
  timeout: 30000,
  logLevel: 'debug'
});
```

### Integration with Testing Agent

```typescript
import { SelfTestRunner } from './self-tests/SelfTestRunner';

// Create runner with custom configuration
const runner = new SelfTestRunner({
  suites: ['core-components', 'performance-validation'],
  parallel: false,
  timeout: 60000,
  reportFormat: 'html',
  generateReport: true
});

// Run tests and get results
const success = await runner.runAllTests();
console.log('Self-tests passed:', success);
```

## Configuration Options

### SelfTestConfig

- `suites`: Array of suite IDs to run (empty = all suites)
- `timeout`: Timeout for individual tests (default: 60000ms)
- `retryAttempts`: Number of retry attempts for failed tests (default: 1)
- `parallel`: Run test suites in parallel (default: false)
- `reportFormat`: Report format - 'console', 'json', 'html' (default: 'console')
- `includePerformanceMetrics`: Include performance metrics in results (default: true)
- `failFast`: Stop on first failure (default: false)

### SelfTestRunnerConfig

Extends SelfTestConfig with additional options:

- `generateReport`: Generate report file (default: true)
- `reportPath`: Custom path for report file
- `logLevel`: Logging level - 'debug', 'info', 'warn', 'error' (default: 'info')
- `exitOnFailure`: Exit with error code on failure (default: true)

## Command Line Options

- `--suite <name>`: Run specific test suite
- `--parallel`: Run test suites in parallel
- `--timeout <ms>`: Set timeout for tests
- `--format <type>`: Report format (console, json, html)
- `--output <path>`: Output path for report
- `--no-report`: Don't generate report file
- `--fail-fast`: Stop on first failure
- `--verbose`: Verbose logging (debug level)
- `--quiet`: Minimal logging (warn level only)
- `--no-exit`: Don't exit with error code on failure
- `--help`: Show help message

## Test Categories

### Unit Tests

Test individual components in isolation:

- **Controller Tests**: TestingAgentController initialization, configuration, lifecycle
- **User Factory Tests**: VirtualUserFactory creation, profiles, scaling
- **Error Analysis Tests**: ErrorAnalysisEngine analysis, categorization, prioritization
- **Data Generation Tests**: TestDataGenerator basic generation, variety, consistency

### Integration Tests

Test complete workflows and component interactions:

- **Test Execution**: Basic and multi-suite test execution
- **Error Handling**: Error handling workflows and recovery
- **Concurrent Execution**: Multiple simultaneous test sessions
- **Dependencies**: Test suite dependency management
- **Result Aggregation**: Collection and aggregation of test results
- **Configuration Management**: CRUD operations for test configurations
- **Session Management**: Test session lifecycle management

### Performance Tests

Validate performance and reliability:

- **Resource Usage**: Memory usage, CPU usage monitoring
- **Response Times**: Operation response time validation
- **Throughput**: Operations per second measurement
- **Concurrent Load**: Multiple concurrent user simulation
- **Resource Scaling**: Performance scaling with increased load
- **System Stability**: Long-term stability testing
- **Error Recovery**: Recovery from induced errors
- **Memory Leaks**: Detection of memory leaks

## Report Formats

### Console Report

Text-based report with summary and detailed results:

```
================================================================================
TESTING AGENT SELF-TEST REPORT
================================================================================

Total Tests: 25
Passed: 23 (92.0%)
Failed: 2 (8.0%)
Errors: 0 (0.0%)
Duration: 15.43s

RESULTS BY CATEGORY:
----------------------------------------
UNIT: 10/10 (100.0%)
INTEGRATION: 8/10 (80.0%)
PERFORMANCE: 5/5 (100.0%)
```

### JSON Report

Structured JSON with complete test data:

```json
{
  "summary": {
    "totalTests": 25,
    "passed": 23,
    "failed": 2,
    "duration": 15430
  },
  "results": {
    "core-components": [...],
    "testing-workflows": [...],
    "performance-validation": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTML Report

Interactive HTML report with charts and detailed views:

- Executive summary with metrics
- Test results by category
- Performance charts and graphs
- Detailed error information
- Interactive filtering and sorting

## Extending the Framework

### Creating Custom Test Suites

```typescript
import { SelfTestSuite, SelfTestResult } from '../SelfTestFramework';

export class CustomTestSuite implements SelfTestSuite {
  id = 'custom-tests';
  name = 'Custom Test Suite';
  description = 'Custom tests for specific functionality';
  category = 'unit' as const;

  async setup(): Promise<void> {
    // Initialize test environment
  }

  async teardown(): Promise<void> {
    // Cleanup resources
  }

  async runTests(): Promise<SelfTestResult[]> {
    const results: SelfTestResult[] = [];
    
    // Add your tests here
    results.push(await this.testCustomFunctionality());
    
    return results;
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    return 'healthy';
  }

  private async testCustomFunctionality(): Promise<SelfTestResult> {
    const startTime = new Date();
    
    try {
      // Your test logic here
      
      return {
        id: 'custom-test',
        name: 'Custom Functionality Test',
        category: 'unit',
        status: 'passed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        message: 'Test passed successfully'
      };
    } catch (error) {
      return {
        id: 'custom-test',
        name: 'Custom Functionality Test',
        category: 'unit',
        status: 'failed',
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: error as Error,
        message: `Test failed: ${(error as Error).message}`
      };
    }
  }
}
```

### Registering Custom Test Suites

```typescript
import { SelfTestRunner } from './SelfTestRunner';
import { CustomTestSuite } from './CustomTestSuite';

const runner = new SelfTestRunner();
runner.framework.registerTestSuite(new CustomTestSuite());
```

## Best Practices

### Test Design

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up resources in teardown methods
3. **Timeouts**: Set appropriate timeouts for long-running operations
4. **Error Handling**: Handle expected errors gracefully
5. **Assertions**: Use clear, descriptive assertions and error messages

### Performance Testing

1. **Baselines**: Establish performance baselines for comparison
2. **Metrics**: Collect relevant metrics (memory, CPU, response time)
3. **Load Testing**: Test with realistic load scenarios
4. **Resource Monitoring**: Monitor resource usage during tests
5. **Cleanup**: Ensure proper cleanup to avoid affecting subsequent tests

### Reliability Testing

1. **Error Scenarios**: Test various error conditions
2. **Recovery**: Verify system recovery after errors
3. **Stability**: Test long-running scenarios
4. **Concurrency**: Test concurrent operations
5. **Resource Limits**: Test behavior under resource constraints

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout values for slow operations
2. **Memory Issues**: Check for memory leaks in test cleanup
3. **Concurrency Issues**: Ensure thread-safe operations
4. **Resource Conflicts**: Avoid resource conflicts between tests
5. **Environment Issues**: Verify test environment setup

### Debugging

1. **Verbose Logging**: Use `--verbose` flag for detailed logs
2. **Single Suite**: Run individual suites to isolate issues
3. **No Parallel**: Disable parallel execution for debugging
4. **Custom Timeouts**: Adjust timeouts for debugging
5. **Error Details**: Check error details in reports

## Integration with CI/CD

### GitHub Actions

```yaml
name: Self-Tests
on: [push, pull_request]

jobs:
  self-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run self-test -- --format json --output ./self-test-results.json
      - uses: actions/upload-artifact@v2
        with:
          name: self-test-results
          path: ./self-test-results.json
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Self-Tests') {
            steps {
                sh 'npm install'
                sh 'npm run self-test -- --format html --output ./reports/self-test-report.html'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'self-test-report.html',
                        reportName: 'Self-Test Report'
                    ])
                }
            }
        }
    }
}
```

## Monitoring and Alerting

The self-test system can be integrated with monitoring systems to:

- Run periodic health checks
- Alert on test failures
- Track performance trends
- Monitor system reliability
- Generate automated reports

Example integration with monitoring:

```typescript
import { runSelfTests } from './self-tests';

// Periodic health check
setInterval(async () => {
  const success = await runSelfTests({
    suites: ['core-components'],
    generateReport: false,
    logLevel: 'warn'
  });
  
  if (!success) {
    // Send alert to monitoring system
    await sendAlert('Self-tests failed', 'critical');
  }
}, 3600000); // Every hour
```