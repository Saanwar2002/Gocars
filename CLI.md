# GoCars Testing Agent CLI

The GoCars Testing Agent CLI provides a comprehensive command-line interface for managing and executing tests, generating reports, and automating testing workflows.

## Installation

### Global Installation
```bash
npm install -g gocars-testing-agent
```

### Local Installation
```bash
npm install gocars-testing-agent
npx gocars-test --help
```

### From Source
```bash
git clone <repository>
cd gocars-testing-agent
npm install
npm run build:agent
./bin/gocars-test --help
```

## Quick Start

```bash
# Initialize a test configuration
gocars-test config init

# Run all tests
gocars-test test

# Run specific test suite
gocars-test test auth-suite

# Check testing agent status
gocars-test status

# Generate test reports
gocars-test report generate
```

## Commands

### `test` - Execute Test Suites

Execute test suites with various configuration options.

```bash
gocars-test test [suite] [options]
```

**Arguments:**
- `suite` - Test suite to execute (optional, runs all if not specified)

**Options:**
- `-c, --config <file>` - Configuration file path (default: ./test-config.json)
- `-e, --environment <env>` - Test environment (development|staging|production)
- `-p, --parallel <num>` - Number of parallel test executions (default: 1)
- `-t, --timeout <ms>` - Test timeout in milliseconds (default: 300000)
- `-r, --retry <num>` - Number of retry attempts for failed tests (default: 0)
- `-o, --output <format>` - Output format (console|json|junit|html)
- `--report-dir <dir>` - Directory to save test reports (default: ./test-reports)
- `-b, --bail` - Stop execution on first failure
- `--dry-run` - Show what tests would be executed without running them
- `-f, --filter <pattern>` - Filter tests by pattern (regex)
- `--tags <tags>` - Run tests with specific tags (comma-separated)
- `--exclude-tags <tags>` - Exclude tests with specific tags
- `--coverage` - Generate code coverage report
- `-w, --watch` - Watch for file changes and re-run tests

**Examples:**
```bash
# Run all tests with default settings
gocars-test test

# Run specific test suite with custom environment
gocars-test test auth-suite --environment staging

# Run tests in parallel with HTML output
gocars-test test --parallel 4 --output html

# Run smoke tests only
gocars-test test --tags smoke --bail

# Dry run to see what would be executed
gocars-test test --dry-run --verbose

# Run tests with coverage and custom timeout
gocars-test test --coverage --timeout 600000
```

### `config` - Manage Configuration

Manage test configuration files with various subcommands.

```bash
gocars-test config <subcommand> [options]
```

**Subcommands:**

#### `config init` - Initialize Configuration
```bash
gocars-test config init [options]
```

**Options:**
- `-t, --template <type>` - Configuration template (basic|advanced|ci|performance)
- `--force` - Overwrite existing configuration file

**Examples:**
```bash
# Create basic configuration
gocars-test config init

# Create advanced configuration with all features
gocars-test config init --template advanced

# Create CI-specific configuration
gocars-test config init --template ci --force
```

#### `config validate` - Validate Configuration
```bash
gocars-test config validate [options]
```

#### `config show` - Display Configuration
```bash
gocars-test config show [options]
```

**Options:**
- `--format <format>` - Output format (json|yaml|table)

#### `config set` - Set Configuration Value
```bash
gocars-test config set <key> <value>
```

**Examples:**
```bash
# Set parallel execution count
gocars-test config set execution.parallel 4

# Set default environment
gocars-test config set environment staging

# Set timeout
gocars-test config set execution.timeout 600000
```

#### `config get` - Get Configuration Value
```bash
gocars-test config get <key>
```

**Examples:**
```bash
# Get parallel execution setting
gocars-test config get execution.parallel

# Get all execution settings
gocars-test config get execution
```

### `report` - Generate and Manage Reports

Generate test reports and manage report files.

```bash
gocars-test report <subcommand> [options]
```

**Subcommands:**

#### `report generate` - Generate Test Reports
```bash
gocars-test report generate [options]
```

**Options:**
- `-i, --input <path>` - Input directory or file containing test results
- `-o, --output <dir>` - Output directory for generated reports
- `-f, --format <format>` - Report format (html|pdf|json|csv|junit)
- `-t, --template <template>` - Report template (default|detailed|summary|executive)
- `--title <title>` - Report title
- `--include-coverage` - Include code coverage in report
- `--include-performance` - Include performance metrics in report
- `--theme <theme>` - Report theme (light|dark|corporate)

**Examples:**
```bash
# Generate HTML report from default results
gocars-test report generate

# Generate PDF report with custom title
gocars-test report generate --format pdf --title "Weekly Test Report"

# Generate detailed report with coverage
gocars-test report generate --template detailed --include-coverage
```

#### `report list` - List Available Reports
```bash
gocars-test report list [options]
```

**Options:**
- `-d, --detailed` - Show detailed information

#### `report merge` - Merge Multiple Result Files
```bash
gocars-test report merge --inputs <files> [options]
```

**Options:**
- `--inputs <files>` - Comma-separated list of input files
- `--output-file <file>` - Output file for merged results

#### `report compare` - Compare Test Results
```bash
gocars-test report compare --baseline <file> --current <file> [options]
```

**Options:**
- `-b, --baseline <file>` - Baseline test results file
- `-c, --current <file>` - Current test results file
- `--output-format <format>` - Comparison output format (table|json|html)

### `status` - Check Testing Agent Status

Check the status and health of the testing agent service.

```bash
gocars-test status [options]
```

**Options:**
- `-u, --url <url>` - Testing agent URL (default: http://localhost:3000)
- `-f, --format <format>` - Output format (table|json|yaml)
- `-w, --watch` - Watch mode - continuously monitor status
- `-i, --interval <seconds>` - Watch interval in seconds (default: 5)
- `-t, --timeout <ms>` - Request timeout in milliseconds (default: 10000)
- `-d, --detailed` - Show detailed status information

**Examples:**
```bash
# Check basic status
gocars-test status

# Check status with detailed information
gocars-test status --detailed

# Monitor status continuously
gocars-test status --watch --interval 10

# Check remote testing agent
gocars-test status --url http://staging.gocars.com:3000
```

### `batch` - Execute Batch Jobs

Execute batch jobs and automation scripts for complex testing workflows.

```bash
gocars-test batch <subcommand> [options]
```

**Subcommands:**

#### `batch run` - Execute Batch Job
```bash
gocars-test batch run --file <job-file> [options]
```

**Options:**
- `-f, --file <file>` - Batch job file path (required)
- `-p, --parallel` - Override parallel execution setting
- `--continue-on-error` - Continue execution even if commands fail
- `-t, --timeout <ms>` - Override job timeout in milliseconds
- `-r, --retry-attempts <num>` - Override retry attempts for failed commands
- `-w, --working-directory <dir>` - Override working directory
- `-o, --output <file>` - Output file for batch results

#### `batch create` - Create Batch Job File
```bash
gocars-test batch create [options]
```

**Options:**
- `-t, --template <type>` - Template to use (basic|ci|regression|performance)
- `-o, --output-file <file>` - Output file path (default: ./batch-job.json)
- `-f, --format <format>` - Output format (json|yaml)

#### `batch list` - List Batch Job Files
```bash
gocars-test batch list [options]
```

**Options:**
- `-d, --directory <dir>` - Directory to search for batch job files
- `-r, --recursive` - Search recursively in subdirectories

#### `batch validate` - Validate Batch Job File
```bash
gocars-test batch validate --file <job-file>
```

**Examples:**
```bash
# Create a CI pipeline batch job
gocars-test batch create --template ci --output-file ci-pipeline.json

# Execute a batch job
gocars-test batch run --file ci-pipeline.json

# List all batch jobs in current directory
gocars-test batch list --recursive

# Validate a batch job file
gocars-test batch validate --file regression-suite.yaml
```

## Configuration Files

### CLI Configuration

The CLI supports configuration files to set default values and create reusable profiles.

**Supported file names:**
- `.gocars-test.json`
- `.gocars-test.yaml`
- `gocars-test.config.json`
- `gocars-test.config.yaml`

**Example configuration:**
```json
{
  "version": "1.0",
  "defaults": {
    "environment": "development",
    "parallel": 2,
    "timeout": 300000,
    "outputFormat": "console"
  },
  "profiles": {
    "ci": {
      "environment": "ci",
      "parallel": 8,
      "timeout": 1800000,
      "outputFormat": "junit",
      "excludeTags": ["manual", "interactive"]
    },
    "smoke": {
      "parallel": 2,
      "timeout": 120000,
      "tags": ["smoke"]
    }
  },
  "aliases": {
    "quick": {
      "command": "test",
      "args": ["--tags", "smoke", "--parallel", "2"]
    }
  }
}
```

### Test Configuration

Test-specific configuration files define test suites, environments, and execution parameters.

**Example test configuration:**
```json
{
  "version": "1.0",
  "environment": "development",
  "execution": {
    "parallel": 4,
    "timeout": 300000,
    "retryAttempts": 2,
    "bail": false
  },
  "reporting": {
    "format": "html",
    "outputDir": "./test-reports",
    "coverage": true
  },
  "suites": {
    "auth": {
      "enabled": true,
      "timeout": 60000,
      "tags": ["smoke", "auth"]
    },
    "api": {
      "enabled": true,
      "timeout": 120000,
      "tags": ["api", "integration"]
    }
  },
  "filters": {
    "includeTags": ["smoke"],
    "excludeTags": ["slow"]
  }
}
```

### Batch Job Files

Batch job files define complex automation workflows with multiple commands.

**Example batch job:**
```json
{
  "id": "ci-pipeline-123",
  "name": "CI Pipeline",
  "description": "Continuous Integration pipeline",
  "parallel": false,
  "continueOnError": false,
  "timeout": 7200000,
  "retryAttempts": 2,
  "environment": {
    "NODE_ENV": "ci",
    "CI": "true"
  },
  "commands": [
    {
      "name": "Smoke Tests",
      "command": "test",
      "args": ["--tags", "smoke", "--bail"],
      "timeout": 600000
    },
    {
      "name": "Integration Tests",
      "command": "test",
      "args": ["--tags", "integration", "--parallel", "4"],
      "timeout": 1800000
    },
    {
      "name": "Generate Report",
      "command": "report",
      "args": ["generate", "--format", "html"],
      "timeout": 300000
    }
  ]
}
```

## Global Options

These options are available for all commands:

- `-v, --verbose` - Enable verbose output
- `-q, --quiet` - Suppress output
- `-c, --config <file>` - Configuration file path
- `-h, --help` - Show help information
- `--version` - Show version information

## Environment Variables

The CLI respects these environment variables:

- `NODE_ENV` - Node.js environment (development|staging|production)
- `LOG_LEVEL` - Logging level (debug|info|warn|error)
- `TEST_TIMEOUT` - Default test timeout in milliseconds
- `PARALLEL_TESTS` - Default number of parallel test executions
- `REPORT_DIR` - Default report output directory
- `CONFIG_FILE` - Default configuration file path

## Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error or test failures
- `2` - Invalid command line arguments
- `3` - Configuration error
- `4` - Test execution error
- `5` - Report generation error

## Examples

### Basic Testing Workflow

```bash
# 1. Initialize configuration
gocars-test config init --template advanced

# 2. Validate configuration
gocars-test config validate

# 3. Run smoke tests
gocars-test test --tags smoke --output console

# 4. Run full test suite
gocars-test test --parallel 4 --output html --coverage

# 5. Generate comprehensive report
gocars-test report generate --format html --include-coverage
```

### CI/CD Pipeline

```bash
# 1. Create CI batch job
gocars-test batch create --template ci --output-file .github/workflows/test-pipeline.json

# 2. Execute CI pipeline
gocars-test batch run --file .github/workflows/test-pipeline.json --output ci-results.json

# 3. Check results
gocars-test report compare --baseline baseline-results.json --current ci-results.json
```

### Continuous Monitoring

```bash
# Monitor testing agent status
gocars-test status --watch --interval 30 --detailed

# Run tests on file changes
gocars-test test --watch --tags smoke
```

## Troubleshooting

### Common Issues

1. **Command not found**
   ```bash
   # Install globally or use npx
   npm install -g gocars-testing-agent
   # or
   npx gocars-test --help
   ```

2. **Configuration errors**
   ```bash
   # Validate configuration
   gocars-test config validate
   
   # Reset to defaults
   gocars-test config init --force
   ```

3. **Test execution failures**
   ```bash
   # Run with verbose output
   gocars-test test --verbose
   
   # Check testing agent status
   gocars-test status --detailed
   ```

4. **Report generation issues**
   ```bash
   # Check input files exist
   gocars-test report list
   
   # Validate test results format
   gocars-test report validate --file results.json
   ```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
export DEBUG=gocars:*
gocars-test test --verbose
```

### Getting Help

```bash
# General help
gocars-test --help

# Command-specific help
gocars-test test --help
gocars-test config --help
gocars-test report --help

# Subcommand help
gocars-test config init --help
gocars-test batch create --help
```

## Integration

### CI/CD Integration

The CLI is designed to integrate seamlessly with CI/CD pipelines:

**GitHub Actions:**
```yaml
- name: Run Tests
  run: |
    gocars-test config init --template ci
    gocars-test test --output junit --coverage
    gocars-test report generate --format html
```

**Jenkins:**
```groovy
stage('Test') {
    steps {
        sh 'gocars-test batch run --file jenkins-pipeline.json'
    }
    post {
        always {
            publishTestResults testResultsPattern: 'test-reports/*.xml'
        }
    }
}
```

### IDE Integration

The CLI can be integrated with IDEs through tasks and scripts:

**VS Code tasks.json:**
```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Run Smoke Tests",
            "type": "shell",
            "command": "gocars-test",
            "args": ["test", "--tags", "smoke"],
            "group": "test"
        }
    ]
}
```

This comprehensive CLI provides all the tools needed for effective test management, execution, and reporting in the GoCars Testing Agent ecosystem.