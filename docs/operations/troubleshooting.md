# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the GoCars Testing Agent.

## 🔍 Quick Diagnostics

### Health Check Commands

```bash
# Overall system health
./bin/gocars-test health

# Detailed diagnostics
./bin/gocars-test diagnose --verbose

# Component-specific checks
./bin/gocars-test diagnose --component database
./bin/gocars-test diagnose --component network
./bin/gocars-test diagnose --component permissions
```

### Log Analysis

```bash
# View recent errors
./bin/gocars-test logs --level error --since "1h"

# Follow logs in real-time
./bin/gocars-test logs --follow

# Search for specific issues
./bin/gocars-test logs --grep "timeout"
./bin/gocars-test logs --grep "connection refused"
```

## 🚨 Common Issues

### Installation and Setup Issues

#### Node.js Version Problems

**Symptoms:**
- Installation fails with version errors
- TypeScript compilation errors
- Runtime errors about unsupported features

**Solutions:**
```bash
# Check Node.js version
node --version

# Should be 18.0 or higher
# Update Node.js if needed:

# Windows: Download from nodejs.org
# macOS: brew upgrade node
# Linux: 
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Permission Issues (Linux/macOS)

**Symptoms:**
- `EACCES` errors during npm install
- Permission denied when running commands
- Cannot write to directories

**Solutions:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm for user-level installation
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Make CLI executable
chmod +x ./bin/gocars-test
```

#### Port Conflicts

**Symptoms:**
- `EADDRINUSE` errors
- Services fail to start
- Web interface not accessible

**Solutions:**
```bash
# Check what's using the port
netstat -an | grep 3000
lsof -i :3000

# Kill process using the port
kill -9 $(lsof -t -i:3000)

# Or change port in configuration
export PORT=3001
export WEB_PORT=8081

# Update configuration file
./bin/gocars-test config set --key server.port --value 3001
```

### Service Startup Issues

#### Services Won't Start

**Symptoms:**
- Services fail to start
- Timeout errors during startup
- Process exits immediately

**Diagnostic Steps:**
```bash
# Check service status
./bin/gocars-test status --detailed

# Check system resources
free -h
df -h
ps aux | grep node

# Check configuration
./bin/gocars-test config validate

# Check logs for startup errors
./bin/gocars-test logs --since "10m" --level error
```

**Common Solutions:**
```bash
# Clear temporary files
rm -rf ./tmp/*
rm -rf ./logs/*.lock

# Reset configuration to defaults
./bin/gocars-test config reset

# Restart with clean state
./bin/gocars-test stop
./bin/gocars-test start --clean
```

#### Database Connection Issues

**Symptoms:**
- Database connection timeouts
- Authentication failures
- Connection pool exhausted

**Solutions:**
```bash
# Check database connectivity
./bin/gocars-test diagnose --component database

# Test connection manually
telnet localhost 27017  # MongoDB
redis-cli ping          # Redis

# Check database logs
tail -f /var/log/mongodb/mongod.log
tail -f /var/log/redis/redis-server.log

# Reset database connection
./bin/gocars-test config set --key database.url --value "mongodb://localhost:27017/gocars"
./bin/gocars-test restart
```

### Test Execution Issues

#### Tests Failing to Start

**Symptoms:**
- Tests don't start when triggered
- "Configuration not found" errors
- Permission denied errors

**Diagnostic Steps:**
```bash
# Verify configuration exists
./bin/gocars-test config list

# Validate configuration
./bin/gocars-test config validate --name "Your Config"

# Check test suite availability
./bin/gocars-test status --component test-suites

# Verify permissions
./bin/gocars-test diagnose --component permissions
```

**Solutions:**
```bash
# Recreate configuration
./bin/gocars-test config create --name "Fixed Config" --file ./config.json

# Reset test environment
./bin/gocars-test reset --test-environment

# Check and fix permissions
chmod -R 755 ./src/testing/
chown -R $(whoami) ./src/testing/
```

#### Test Timeouts

**Symptoms:**
- Tests timeout before completion
- Slow test execution
- Hanging test processes

**Solutions:**
```bash
# Increase timeout values
./bin/gocars-test config set --key execution.timeout --value 300000

# Check system resources during tests
./bin/gocars-test monitor --metrics cpu,memory --duration 300

# Run tests with reduced load
./bin/gocars-test run --suite firebase --users 5 --timeout 60000

# Check for resource bottlenecks
./bin/gocars-test diagnose --component performance
```

#### Virtual User Creation Failures

**Symptoms:**
- Virtual users fail to create
- User profile errors
- Authentication failures for virtual users

**Solutions:**
```bash
# Validate user profiles
./bin/gocars-test config validate --section virtualUsers

# Check user creation logs
./bin/gocars-test logs --grep "virtual user" --level error

# Reset user factory
./bin/gocars-test reset --user-factory

# Test with minimal user profile
./bin/gocars-test run --suite firebase --users 1 --profile minimal
```

### Performance Issues

#### High Memory Usage

**Symptoms:**
- System becomes slow
- Out of memory errors
- Process crashes

**Diagnostic Steps:**
```bash
# Monitor memory usage
./bin/gocars-test monitor --metrics memory --interval 5

# Check for memory leaks
./bin/gocars-test diagnose --component memory

# Analyze heap usage
node --inspect ./dist/main.js
```

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Reduce concurrent operations
./bin/gocars-test config set --key execution.maxConcurrent --value 5

# Enable garbage collection logging
export NODE_OPTIONS="--max-old-space-size=4096 --trace-gc"

# Restart services regularly
./bin/gocars-test restart --schedule "0 2 * * *"  # Daily at 2 AM
```

#### High CPU Usage

**Symptoms:**
- System becomes unresponsive
- High CPU utilization
- Slow response times

**Solutions:**
```bash
# Monitor CPU usage
./bin/gocars-test monitor --metrics cpu --interval 5

# Reduce parallel execution
./bin/gocars-test config set --key execution.parallel --value false

# Limit concurrent tests
./bin/gocars-test config set --key execution.maxConcurrentTests --value 3

# Add delays between operations
./bin/gocars-test config set --key execution.delayBetweenTests --value 5000
```

#### Slow Response Times

**Symptoms:**
- API responses are slow
- Web interface is sluggish
- Test execution takes too long

**Solutions:**
```bash
# Check network connectivity
./bin/gocars-test diagnose --component network

# Optimize database queries
./bin/gocars-test optimize --database

# Enable caching
./bin/gocars-test config set --key cache.enabled --value true

# Check external service latency
./bin/gocars-test diagnose --component external-services
```

### Web Interface Issues

#### Dashboard Not Loading

**Symptoms:**
- Blank page or loading spinner
- JavaScript errors in browser console
- 404 errors for assets

**Solutions:**
```bash
# Check web service status
./bin/gocars-test status --component web

# Restart web service
./bin/gocars-test restart --component web

# Clear browser cache
# In browser: Ctrl+Shift+R (hard refresh)

# Check static file serving
ls -la ./src/testing/web/dashboard/
./bin/gocars-test config show --key web.staticPath
```

#### Authentication Issues

**Symptoms:**
- Cannot log in
- Session expires immediately
- Permission denied errors

**Solutions:**
```bash
# Reset user credentials
./bin/gocars-test user reset --username admin

# Check session configuration
./bin/gocars-test config show --key auth.sessionTimeout

# Clear all sessions
./bin/gocars-test auth clear-sessions

# Verify user permissions
./bin/gocars-test user show --username admin
```

#### WebSocket Connection Issues

**Symptoms:**
- Real-time updates not working
- Connection errors in browser console
- Frequent disconnections

**Solutions:**
```bash
# Check WebSocket service
./bin/gocars-test status --component websocket

# Test WebSocket connectivity
wscat -c ws://localhost:8080

# Check firewall settings
sudo ufw status
sudo iptables -L

# Enable WebSocket debugging
./bin/gocars-test config set --key websocket.debug --value true
```

### External Service Issues

#### Firebase Connection Problems

**Symptoms:**
- Firebase authentication failures
- Firestore operation timeouts
- Invalid credentials errors

**Solutions:**
```bash
# Verify Firebase configuration
./bin/gocars-test config show --key firebase

# Test Firebase connectivity
./bin/gocars-test diagnose --component firebase

# Update Firebase credentials
./bin/gocars-test config set --key firebase.privateKey --file ./firebase-key.json

# Check Firebase project settings
# Verify project ID, API keys, and service account permissions
```

#### Network Connectivity Issues

**Symptoms:**
- External API timeouts
- DNS resolution failures
- SSL certificate errors

**Solutions:**
```bash
# Test network connectivity
./bin/gocars-test diagnose --component network

# Check DNS resolution
nslookup api.gocars.com
dig api.gocars.com

# Test SSL certificates
openssl s_client -connect api.gocars.com:443

# Configure proxy if needed
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Enable debug logging
export DEBUG=gocars:*
export LOG_LEVEL=debug

# Run with debug output
./bin/gocars-test run --suite firebase --debug --verbose

# Enable Node.js debugging
node --inspect-brk ./dist/main.js
```

### Memory Analysis

Analyze memory usage and leaks:

```bash
# Generate heap snapshot
kill -USR2 $(pgrep -f "gocars-test")

# Analyze with Chrome DevTools
# 1. Open chrome://inspect
# 2. Click "Open dedicated DevTools for Node"
# 3. Go to Memory tab
# 4. Take heap snapshot

# Use clinic.js for performance analysis
npm install -g clinic
clinic doctor -- node ./dist/main.js
```

### Performance Profiling

Profile application performance:

```bash
# CPU profiling
node --prof ./dist/main.js
node --prof-process isolate-*.log > profile.txt

# Use clinic.js flame graphs
clinic flame -- node ./dist/main.js

# Memory profiling
clinic heapprofiler -- node ./dist/main.js
```

### Database Debugging

Debug database issues:

```bash
# MongoDB debugging
# Enable profiling in MongoDB
mongo
> use gocars
> db.setProfilingLevel(2)
> db.system.profile.find().limit(5).sort({ts:-1}).pretty()

# Redis debugging
redis-cli monitor

# Check database performance
./bin/gocars-test diagnose --component database --performance
```

## 📊 Monitoring and Alerting

### Set Up Monitoring

```bash
# Enable system monitoring
./bin/gocars-test monitor --enable

# Configure alerts
./bin/gocars-test alerts configure --file ./alerts-config.json

# Set up health checks
./bin/gocars-test health-check --interval 30 --endpoint /health
```

### Alert Configuration

```json
{
  "alerts": [
    {
      "name": "High Memory Usage",
      "metric": "memory.percentage",
      "threshold": 90,
      "severity": "high",
      "actions": ["email", "restart"]
    },
    {
      "name": "Test Failure Rate",
      "metric": "tests.failureRate",
      "threshold": 10,
      "severity": "medium",
      "actions": ["email", "slack"]
    }
  ]
}
```

## 🆘 Emergency Procedures

### System Recovery

If the system becomes completely unresponsive:

```bash
# Emergency stop
pkill -f gocars-test

# Clean restart
./bin/gocars-test stop --force
./bin/gocars-test start --clean --safe-mode

# Reset to factory defaults
./bin/gocars-test reset --factory --confirm
```

### Data Recovery

If data is corrupted or lost:

```bash
# Restore from backup
./bin/gocars-test restore --backup ./backups/latest.tar.gz

# Rebuild indexes
./bin/gocars-test database --rebuild-indexes

# Verify data integrity
./bin/gocars-test database --verify
```

### Rollback Procedures

If an update causes issues:

```bash
# Rollback to previous version
git checkout v1.0.0
npm install
npm run build

# Restore previous configuration
./bin/gocars-test config restore --backup ./config-backup.json

# Restart services
./bin/gocars-test restart
```

## 📞 Getting Help

### Self-Service Resources

1. **Check Documentation**: Review relevant documentation sections
2. **Search Issues**: Check [GitHub Issues](https://github.com/Saanwar2002/Gocars/issues)
3. **Run Diagnostics**: Use built-in diagnostic tools
4. **Check Logs**: Review system logs for error details

### Community Support

1. **GitHub Discussions**: [Community Forum](https://github.com/Saanwar2002/Gocars/discussions)
2. **Stack Overflow**: Tag questions with `gocars-testing-agent`
3. **Discord**: Join our community Discord server

### Professional Support

For critical issues or enterprise support:

1. **Email**: support@gocars.com
2. **Priority Support**: Available for enterprise customers
3. **Professional Services**: Custom implementation and training

### Reporting Bugs

When reporting issues, include:

1. **System Information**: OS, Node.js version, system specs
2. **Error Messages**: Complete error messages and stack traces
3. **Reproduction Steps**: Detailed steps to reproduce the issue
4. **Configuration**: Relevant configuration settings (sanitized)
5. **Logs**: Recent log entries related to the issue

**Bug Report Template:**

```markdown
## Bug Report

### Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.17.0]
- Testing Agent Version: [e.g., 1.0.0]

### Description
[Clear description of the issue]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior
[What you expected to happen]

### Actual Behavior
[What actually happened]

### Error Messages
```
[Paste error messages here]
```

### Additional Context
[Any additional information, screenshots, etc.]
```

---

*Next: [Deployment Guide](./deployment.md) | [Monitoring Guide](./monitoring.md)*