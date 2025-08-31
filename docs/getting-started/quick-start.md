# Quick Start Guide

Get up and running with the GoCars Testing Agent in just a few minutes!

## 🚀 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- Basic familiarity with command line

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Saanwar2002/Gocars.git
cd Gocars
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Verify Installation

```bash
npm run self-test
```

If everything is working correctly, you should see:
```
✅ All self-tests passed successfully!
```

## 🎯 Your First Test

### Option 1: Using the Web Dashboard

1. **Start the Web Interface**
   ```bash
   npm run start:web
   ```

2. **Open Your Browser**
   Navigate to `http://localhost:8080`

3. **Login**
   Use the demo credentials:
   - Username: `admin`
   - Password: `admin123`

4. **Run a Test**
   - Click "Start Test" button
   - Select a test configuration
   - Watch the real-time progress

### Option 2: Using the Command Line

1. **Run a Basic Test**
   ```bash
   ./bin/gocars-test run --suite firebase
   ```

2. **View Results**
   ```bash
   ./bin/gocars-test status
   ```

3. **Generate Report**
   ```bash
   ./bin/gocars-test report --format html --output ./test-report.html
   ```

## 📊 Understanding the Results

### Test Status Indicators
- ✅ **Passed**: Test completed successfully
- ❌ **Failed**: Test failed with errors
- ⚠️ **Warning**: Test passed with warnings
- 🔄 **Running**: Test is currently executing

### Key Metrics
- **Success Rate**: Percentage of tests that passed
- **Response Time**: Average response time for operations
- **Error Rate**: Percentage of operations that failed
- **Coverage**: Percentage of features tested

## 🎛️ Basic Configuration

### 1. Create a Test Configuration

Create a file `test-config.json`:

```json
{
  "name": "My First Test",
  "environment": "development",
  "testSuites": ["firebase", "websocket"],
  "userProfiles": [
    {
      "role": "passenger",
      "count": 5,
      "demographics": {
        "age": 25,
        "location": "New York",
        "deviceType": "mobile"
      }
    }
  ],
  "timeout": 30000,
  "retryAttempts": 2
}
```

### 2. Run with Custom Configuration

```bash
./bin/gocars-test run --config ./test-config.json
```

## 🔍 Monitoring Your Tests

### Real-time Monitoring

1. **Web Dashboard**: Visit `http://localhost:8080/dashboard`
2. **CLI Status**: Run `./bin/gocars-test status --watch`
3. **Logs**: Check `./logs/testing-agent.log`

### Key Things to Watch

- **Active Tests**: Number of currently running tests
- **System Health**: Overall system status
- **Error Rate**: Percentage of failed operations
- **Resource Usage**: Memory and CPU utilization

## 🛠️ Common Commands

### Testing Commands
```bash
# Run all test suites
./bin/gocars-test run --all

# Run specific test suite
./bin/gocars-test run --suite firebase

# Run with increased verbosity
./bin/gocars-test run --suite websocket --verbose

# Run performance tests
./bin/gocars-test run --suite performance --users 100
```

### Configuration Commands
```bash
# List available configurations
./bin/gocars-test config list

# Create new configuration
./bin/gocars-test config create --name "My Config"

# Validate configuration
./bin/gocars-test config validate --file ./my-config.json
```

### Reporting Commands
```bash
# Generate HTML report
./bin/gocars-test report --format html

# Generate JSON report
./bin/gocars-test report --format json --output ./results.json

# View test history
./bin/gocars-test history --last 10
```

## 🎯 Next Steps

Now that you have the basics working, explore these areas:

### 1. **Learn the Web Interface**
- [Web Dashboard Guide](../user-guides/web-dashboard.md)
- Explore test configuration options
- Set up monitoring dashboards
- Configure user profiles

### 2. **Customize Your Tests**
- [Test Configuration Guide](../user-guides/test-configuration.md)
- Create custom user profiles
- Configure test environments
- Set up test schedules

### 3. **Integrate with Your Workflow**
- [CLI Guide](../user-guides/cli-guide.md)
- Set up CI/CD integration
- Configure automated reporting
- Set up monitoring alerts

### 4. **Advanced Features**
- [Performance Testing](../test-suites/performance.md)
- [Custom Test Suites](../developer/extensions.md)
- [API Integration](../api/README.md)
- [Production Deployment](../operations/deployment.md)

## 🆘 Need Help?

### Quick Troubleshooting

**Tests are failing?**
```bash
# Check system health
./bin/gocars-test health

# Run diagnostics
./bin/gocars-test diagnose

# Check logs
tail -f ./logs/testing-agent.log
```

**Web interface not loading?**
```bash
# Check if service is running
./bin/gocars-test status

# Restart the web service
npm run restart:web

# Check port availability
netstat -an | grep 8080
```

**Performance issues?**
```bash
# Check resource usage
./bin/gocars-test metrics

# Run performance diagnostics
npm run self-test -- --suite performance-validation
```

### Getting Support

- 📖 [Troubleshooting Guide](../operations/troubleshooting.md)
- ❓ [FAQ](../reference/faq.md)
- 🐛 [Report Issues](https://github.com/Saanwar2002/Gocars/issues)
- 💬 [Community Discussions](https://github.com/Saanwar2002/Gocars/discussions)

## 🎉 Congratulations!

You've successfully set up and run your first tests with the GoCars Testing Agent! 

The system is now ready to help you:
- Automate your testing workflows
- Monitor system performance
- Detect issues early
- Generate comprehensive reports

Continue with the [Web Dashboard Guide](../user-guides/web-dashboard.md) to learn more about the web interface, or check out the [CLI Guide](../user-guides/cli-guide.md) for advanced command-line usage.

---

*Next: [Installation Guide](./installation.md) | [Configuration Guide](./configuration.md)*