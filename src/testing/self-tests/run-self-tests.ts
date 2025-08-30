#!/usr/bin/env node

import { SelfTestRunner } from './SelfTestRunner';

/**
 * CLI script to run Testing Agent self-tests
 * 
 * Usage:
 *   npm run self-test                    # Run all tests
 *   npm run self-test -- --suite core   # Run specific suite
 *   npm run self-test -- --parallel     # Run tests in parallel
 *   npm run self-test -- --format html  # Generate HTML report
 *   npm run self-test -- --verbose      # Verbose output
 * 
 * Options:
 *   --suite <name>     Run specific test suite
 *   --parallel         Run test suites in parallel
 *   --timeout <ms>     Set timeout for tests (default: 60000)
 *   --format <type>    Report format: console, json, html (default: console)
 *   --output <path>    Output path for report
 *   --no-report        Don't generate report file
 *   --fail-fast        Stop on first failure
 *   --verbose          Verbose logging
 *   --quiet            Minimal logging
 *   --no-exit          Don't exit with error code on failure
 *   --help             Show this help message
 */

function showHelp(): void {
  console.log(`
Testing Agent Self-Tests

Usage:
  npm run self-test [options]

Options:
  --suite <name>     Run specific test suite (core-components, testing-workflows, performance-validation)
  --parallel         Run test suites in parallel
  --timeout <ms>     Set timeout for tests (default: 60000)
  --format <type>    Report format: console, json, html (default: console)
  --output <path>    Output path for report
  --no-report        Don't generate report file
  --fail-fast        Stop on first failure
  --verbose          Verbose logging (debug level)
  --quiet            Minimal logging (warn level only)
  --no-exit          Don't exit with error code on failure
  --help             Show this help message

Examples:
  npm run self-test                                    # Run all tests
  npm run self-test -- --suite core-components        # Run core components tests only
  npm run self-test -- --parallel --format html       # Run in parallel, generate HTML report
  npm run self-test -- --verbose --output ./report.html  # Verbose output, save HTML report
  npm run self-test -- --fail-fast --quiet            # Stop on first failure, minimal output

Available Test Suites:
  - core-components      Unit tests for core testing agent components
  - testing-workflows    Integration tests for testing workflows
  - performance-validation  Performance and reliability tests
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  try {
    console.log('🚀 Starting Testing Agent Self-Tests...\n');
    
    // Run the self-tests using the CLI runner
    await SelfTestRunner.runFromCLI(args);
    
  } catch (error) {
    console.error('\n❌ Self-test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main();