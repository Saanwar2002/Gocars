# CLI Guide

The GoCars Testing Agent Command Line Interface (CLI) provides powerful tools for automating tests, managing configurations, and integrating with CI/CD pipelines.

## 🚀 Getting Started

### CLI Installation

The CLI is included with the main installation:

```bash
# Make CLI executable (Linux/macOS)
chmod +x ./bin/gocars-test

# Add to PATH (optional)
export PATH=$PATH:$(pwd)/bin

# Verify installation
./bin/gocars-test --version
```

### Basic Usage

```bash
# Show help
./bin/gocars-test --help

# Show command-specific help
./bin/gocars-test run --help

# Check system status
./bin/gocars-test status
```

## 📋 Command Reference

### Core Commands

#### `run` - Execute Tests

Run test suites with various options:

```bash
# Run all test suites
./bin/gocars-test run --all

# Run specific test suite
./bin/gocars-test run --suite firebase

# Run multiple suites
./bin/gocars-test run --suite firebase,websocket,ui

# Run with custom configuration
./bin/gocars-test run --config ./my-config.json

# Run with specific user count
./bin/gocars-test run --suite performance --users 100

# Run with timeout
./bin/gocars-test run --suite firebase --timeout 60000

# Run with verbose output
./bin/gocars-test run --suite websocket --verbose

# Run in background
./bin/gocars-test run --suite integration --background
```

**Options:**
- `--suite, -s`: Test suite(s) to run
- `--config, -c`: Configuration file path
- `--users, -u`: Number of virtual users
- `--timeout, -t`: Test timeout in milliseconds
- `--verbose, -v`: Verbose output
- `--quiet, -q`: Minimal output
- `--background, -b`: Run in background
- `--all, -a`: Run all available test suites

#### `status` - Check System Status

Monitor system and test status:

```bash
# Show overall status
./bin/gocars-test status

# Show detailed status
./bin/gocars-test status --detailed

# Show specific component status
./bin/gocars-test status --component web
./bin/gocars-test status --component api
./bin/gocars-test status --component database

# Watch status (auto-refresh)
./bin/gocars-test status --watch

# Show active test sessions
./bin/gocars-test status --sessions

# Show system health
./bin/gocars-test status --health
```

**Options:**
- `--detailed, -d`: Show detailed status information
- `--component, -c`: Show specific component status
- `--watch, -w`: Auto-refresh status every 5 seconds
- `--sessions, -s`: Show active test sessions
- `--health, -h`: Show system health metrics

#### `config` - Configuration Management

Manage test configurations:

```bash
# List all configurations
./bin/gocars-test config list

# Show specific configuration
./bin/gocars-test config show --name "My Config"

# Create new configuration
./bin/gocars-test config create --name "New Config" --file ./template.json

# Update existing configuration
./bin/gocars-test config update --name "My Config" --file ./updated.json

# Delete configuration
./bin/gocars-test config delete --name "Old Config"

# Validate configuration file
./bin/gocars-test config validate --file ./my-config.json

# Export configuration
./bin/gocars-test config export --name "My Config" --output ./exported.json

# Import configuration
./bin/gocars-test config import --file ./imported.json
```

**Options:**
- `--name, -n`: Configuration name
- `--file, -f`: Configuration file path
- `--output, -o`: Output file path
- `--format`: Output format (json, yaml)

#### `report` - Generate Reports

Create and manage test reports:

```bash
# Generate report for latest test session
./bin/gocars-test report

# Generate report for specific session
./bin/gocars-test report --session abc123

# Generate HTML report
./bin/gocars-test report --format html --output ./report.html

# Generate PDF report
./bin/gocars-test report --format pdf --output ./report.pdf

# Generate JSON report
./bin/gocars-test report --format json --output ./report.json

# Generate report for date range
./bin/gocars-test report --from "2024-01-01" --to "2024-01-31"

# Generate executive summary
./bin/gocars-test report --type executive --format html

# Generate technical report
./bin/gocars-test report --type technical --format pdf

# Include performance metrics
./bin/gocars-test report --include-metrics --format html
```

**Options:**
- `--session, -s`: Specific session ID
- `--format, -f`: Report format (html, pdf, json, console)
- `--output, -o`: Output file path
- `--type, -t`: Report type (executive, technical, performance)
- `--from`: Start date (YYYY-MM-DD)
- `--to`: End date (YYYY-MM-DD)
- `--include-metrics`: Include performance metrics

### Advanced Commands

#### `batch` - Batch Operations

Execute multiple operations in batch:

```bash
# Run batch from file
./bin/gocars-test batch --file ./batch-commands.txt

# Run batch with parallel execution
./bin/gocars-test batch --file ./batch.txt --parallel

# Run batch with custom concurrency
./bin/gocars-test batch --file ./batch.txt --concurrency 5

# Validate batch file
./bin/gocars-test batch --validate --file ./batch.txt
```

**Batch File Format:**
```bash
# batch-commands.txt
run --suite firebase --users 10
run --suite websocket --users 20
config create --name "Batch Config" --file ./config.json
report --format html --output ./batch-report.html
```

#### `monitor` - System Monitoring

Monitor system performance and health:

```bash
# Start monitoring
./bin/gocars-test monitor

# Monitor specific metrics
./bin/gocars-test monitor --metrics cpu,memory,network

# Monitor with custom interval
./bin/gocars-test monitor --interval 10

# Monitor and log to file
./bin/gocars-test monitor --log ./monitoring.log

# Monitor with alerts
./bin/gocars-test monitor --alerts --threshold cpu:80,memory:90
```

#### `logs` - Log Management

Access and manage system logs:

```bash
# Show recent logs
./bin/gocars-test logs

# Show logs for specific component
./bin/gocars-test logs --component api

# Follow logs in real-time
./bin/gocars-test logs --follow

# Show logs for specific time range
./bin/gocars-test logs --since "1h" --until "now"

# Filter logs by level
./bin/gocars-test logs --level error

# Search logs
./bin/gocars-test logs --grep "authentication"

# Export logs
./bin/gocars-test logs --export ./logs-export.txt
```

## 🔧 Configuration Files

### CLI Configuration

Create a CLI configuration file at `~/.gocars-cli.json`:

```json
{
  "defaults": {
    "timeout": 30000,
    "retryAttempts": 3,
    "outputFormat": "console",
    "logLevel": "info"
  },
  "profiles": {
    "development": {
      "apiUrl": "http://localhost:3000",
      "webUrl": "http://localhost:8080",
      "environment": "dev"
    },
    "staging": {
      "apiUrl": "https://staging-api.gocars.com",
      "webUrl": "https://staging.gocars.com",
      "environment": "staging"
    },
    "production": {
      "apiUrl": "https://api.gocars.com",
      "webUrl": "https://gocars.com",
      "environment": "prod"
    }
  },
  "aliases": {
    "smoke": "run --suite firebase,websocket --users 5 --timeout 15000",
    "regression": "run --all --users 50 --timeout 300000",
    "performance": "run --suite performance --users 100 --timeout 600000"
  }
}
```

### Test Configuration Files

#### Basic Configuration

```json
{
  "name": "Basic Smoke Test",
  "description": "Quick validation of core functionality",
  "environment": "development",
  "testSuites": ["firebase", "websocket"],
  "virtualUsers": {
    "count": 10,
    "profiles": ["passenger", "driver"]
  },
  "execution": {
    "timeout": 30000,
    "retryAttempts": 2,
    "parallelExecution": false
  }
}
```

#### Advanced Configuration

```json
{
  "name": "Comprehensive E2E Test",
  "description": "Full end-to-end testing with multiple user scenarios",
  "environment": "staging",
  "testSuites": [
    {
      "name": "firebase",
      "enabled": true,
      "config": {
        "timeout": 15000,
        "retryAttempts": 3
      }
    },
    {
      "name": "websocket",
      "enabled": true,
      "config": {
        "connectionTimeout": 5000,
        "messageTimeout": 10000
      }
    },
    {
      "name": "ui",
      "enabled": true,
      "config": {
        "browsers": ["chrome", "firefox"],
        "headless": true,
        "viewport": {
          "width": 1920,
          "height": 1080
        }
      }
    }
  ],
  "virtualUsers": {
    "rampUp": {
      "duration": 60000,
      "steps": 10
    },
    "profiles": [
      {
        "name": "premium-passenger",
        "count": 30,
        "weight": 60,
        "demographics": {
          "ageRange": [25, 45],
          "locations": ["Manhattan", "Brooklyn"],
          "deviceTypes": ["mobile"],
          "experience": "power"
        }
      },
      {
        "name": "regular-passenger",
        "count": 50,
        "weight": 30,
        "demographics": {
          "ageRange": [18, 65],
          "locations": ["Queens", "Bronx"],
          "deviceTypes": ["mobile", "desktop"],
          "experience": "regular"
        }
      },
      {
        "name": "driver",
        "count": 20,
        "weight": 10,
        "demographics": {
          "ageRange": [21, 60],
          "locations": ["All NYC"],
          "deviceTypes": ["mobile"],
          "experience": "experienced"
        }
      }
    ]
  },
  "execution": {
    "timeout": 300000,
    "retryAttempts": 2,
    "parallelExecution": true,
    "failFast": false,
    "resourceLimits": {
      "maxMemory": "4GB",
      "maxCPU": "80%"
    }
  },
  "reporting": {
    "formats": ["html", "json"],
    "includeScreenshots": true,
    "includePerformanceMetrics": true,
    "includeErrorDetails": true
  },
  "notifications": {
    "onCompletion": true,
    "onFailure": true,
    "channels": ["email", "slack"],
    "recipients": ["team@gocars.com"]
  }
}
```

## 🔄 Automation and Scripting

### Shell Scripts

Create shell scripts for common operations:

```bash
#!/bin/bash
# smoke-test.sh - Run smoke tests

echo "Starting smoke tests..."

# Run basic smoke tests
./bin/gocars-test run --suite firebase,websocket --users 5 --timeout 30000

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ Smoke tests passed"
    ./bin/gocars-test report --format html --output ./smoke-report.html
else
    echo "❌ Smoke tests failed"
    ./bin/gocars-test logs --level error --since "10m"
    exit 1
fi
```

### Batch Processing

Create batch files for complex workflows:

```bash
# comprehensive-test.batch
config create --name "Nightly Test" --file ./nightly-config.json
run --config "Nightly Test" --background
monitor --metrics all --duration 300
report --format pdf --output ./nightly-report.pdf
config delete --name "Nightly Test"
```

Run batch file:
```bash
./bin/gocars-test batch --file ./comprehensive-test.batch
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Testing Agent CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build project
        run: npm run build
      
      - name: Run smoke tests
        run: ./bin/gocars-test run --suite firebase,websocket --users 10
      
      - name: Generate report
        run: ./bin/gocars-test report --format html --output ./test-report.html
      
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: ./test-report.html
```

#### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        
        stage('Smoke Tests') {
            steps {
                sh './bin/gocars-test run --suite firebase --users 5'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh './bin/gocars-test run --suite integration --users 20'
            }
        }
        
        stage('Performance Tests') {
            when {
                branch 'main'
            }
            steps {
                sh './bin/gocars-test run --suite performance --users 100'
            }
        }
        
        stage('Generate Reports') {
            steps {
                sh './bin/gocars-test report --format html --output ./reports/test-report.html'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'test-report.html',
                    reportName: 'Test Report'
                ])
            }
        }
    }
    
    post {
        failure {
            sh './bin/gocars-test logs --level error --since "1h" --export ./error-logs.txt'
            archiveArtifacts artifacts: 'error-logs.txt'
        }
    }
}
```

## 📊 Output Formats

### Console Output

Default console output with color coding:

```bash
$ ./bin/gocars-test run --suite firebase

🚀 Starting test execution...
📋 Configuration: Firebase Authentication Tests
👥 Virtual Users: 10 passengers, 5 drivers

⏳ Initializing test environment...
✅ Firebase connection established
✅ Virtual users created

🧪 Running test suite: Firebase Authentication
  ✅ User registration test (1.2s)
  ✅ User login test (0.8s)
  ✅ Password reset test (2.1s)
  ❌ Social login test (timeout after 30s)
  ✅ Token validation test (0.5s)

📊 Test Results:
  Total: 5 tests
  Passed: 4 (80%)
  Failed: 1 (20%)
  Duration: 34.6s

📋 Report generated: ./reports/firebase-test-20240115-143022.html
```

### JSON Output

Structured JSON output for programmatic processing:

```bash
./bin/gocars-test run --suite firebase --format json
```

```json
{
  "sessionId": "test-session-abc123",
  "configuration": {
    "name": "Firebase Authentication Tests",
    "suite": "firebase",
    "users": 15
  },
  "execution": {
    "startTime": "2024-01-15T14:30:22.000Z",
    "endTime": "2024-01-15T14:30:56.600Z",
    "duration": 34600
  },
  "results": {
    "total": 5,
    "passed": 4,
    "failed": 1,
    "skipped": 0,
    "successRate": 80.0
  },
  "tests": [
    {
      "id": "firebase-auth-001",
      "name": "User registration test",
      "status": "passed",
      "duration": 1200,
      "message": "User registration completed successfully"
    },
    {
      "id": "firebase-auth-002",
      "name": "User login test",
      "status": "passed",
      "duration": 800,
      "message": "User login completed successfully"
    },
    {
      "id": "firebase-auth-003",
      "name": "Password reset test",
      "status": "passed",
      "duration": 2100,
      "message": "Password reset completed successfully"
    },
    {
      "id": "firebase-auth-004",
      "name": "Social login test",
      "status": "failed",
      "duration": 30000,
      "message": "Test timed out after 30 seconds",
      "error": {
        "type": "TimeoutError",
        "message": "Operation timed out",
        "stack": "..."
      }
    },
    {
      "id": "firebase-auth-005",
      "name": "Token validation test",
      "status": "passed",
      "duration": 500,
      "message": "Token validation completed successfully"
    }
  ],
  "metrics": {
    "averageResponseTime": 1240,
    "maxResponseTime": 2100,
    "minResponseTime": 500,
    "errorRate": 0.2,
    "throughput": 8.67
  }
}
```

## 🔍 Debugging and Troubleshooting

### Verbose Output

Enable detailed logging for debugging:

```bash
# Maximum verbosity
./bin/gocars-test run --suite firebase --verbose --debug

# Show HTTP requests/responses
./bin/gocars-test run --suite api --verbose --trace-http

# Show WebSocket messages
./bin/gocars-test run --suite websocket --verbose --trace-ws
```

### Log Analysis

Analyze logs for troubleshooting:

```bash
# Show error logs from last hour
./bin/gocars-test logs --level error --since "1h"

# Search for specific errors
./bin/gocars-test logs --grep "authentication failed"

# Show logs for specific test session
./bin/gocars-test logs --session abc123

# Export logs for analysis
./bin/gocars-test logs --export ./debug-logs.txt --since "24h"
```

### Health Diagnostics

Run comprehensive health checks:

```bash
# Basic health check
./bin/gocars-test health

# Detailed diagnostics
./bin/gocars-test diagnose --verbose

# Check specific components
./bin/gocars-test diagnose --component database
./bin/gocars-test diagnose --component network
./bin/gocars-test diagnose --component permissions

# Generate diagnostic report
./bin/gocars-test diagnose --report --output ./diagnostic-report.html
```

## 🔐 Security and Authentication

### API Authentication

Configure API authentication:

```bash
# Set API key
export GOCARS_API_KEY="your-api-key-here"

# Or use config file
./bin/gocars-test config set --key api.key --value "your-api-key"

# Use specific profile
./bin/gocars-test run --profile production --suite firebase
```

### Secure Configuration

Store sensitive configuration securely:

```bash
# Use environment variables
export FIREBASE_PRIVATE_KEY="$(cat ./firebase-key.json)"
export DATABASE_PASSWORD="secure-password"

# Use encrypted configuration files
./bin/gocars-test config encrypt --file ./config.json --output ./config.enc
./bin/gocars-test run --config ./config.enc --decrypt
```

## 📚 Best Practices

### Configuration Management

1. **Use Version Control**: Store configurations in version control
2. **Environment Separation**: Use different configs for dev/staging/prod
3. **Sensitive Data**: Use environment variables for secrets
4. **Validation**: Always validate configurations before use

### Test Execution

1. **Start Small**: Begin with smoke tests, then expand
2. **Monitor Resources**: Watch CPU/memory usage during tests
3. **Parallel Execution**: Use parallel execution for independent tests
4. **Timeout Management**: Set appropriate timeouts for different test types

### Automation

1. **CI/CD Integration**: Integrate with your CI/CD pipeline
2. **Scheduled Runs**: Set up regular automated test runs
3. **Failure Handling**: Implement proper error handling and notifications
4. **Artifact Management**: Store and version test artifacts

### Monitoring

1. **Real-time Monitoring**: Monitor tests in real-time
2. **Alert Configuration**: Set up alerts for critical failures
3. **Log Management**: Implement proper log rotation and retention
4. **Performance Tracking**: Track performance trends over time

---

*Next: [Test Configuration Guide](./test-configuration.md) | [Virtual Users Guide](./virtual-users.md)*