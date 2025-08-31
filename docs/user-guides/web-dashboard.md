# Web Dashboard Guide

The GoCars Testing Agent Web Dashboard provides a comprehensive, user-friendly interface for managing tests, monitoring system health, and analyzing results in real-time.

## 🌐 Accessing the Dashboard

### Starting the Web Interface

```bash
# Start the web interface
npm run start:web

# Or using the CLI
./bin/gocars-test start --web
```

### Login

1. **Open your browser** and navigate to `http://localhost:8080`
2. **Login** with demo credentials:
   - **Admin**: `admin` / `admin123`
   - **Operator**: `operator` / `operator123`
   - **Viewer**: `viewer` / `viewer123`

### User Roles

- **Admin**: Full access to all features, user management
- **Operator**: Can run tests, manage configurations, view reports
- **Viewer**: Read-only access to dashboards and reports

## 📊 Dashboard Overview

### Main Dashboard

The main dashboard provides an at-a-glance view of your testing system:

#### Key Metrics Cards
- **Active Tests**: Number of currently running test sessions
- **Total Configurations**: Available test configurations
- **Virtual Users**: Active virtual user profiles
- **Active Alerts**: Current system alerts

#### System Health Panel
- **Overall Status**: System health indicator (Healthy/Warning/Critical)
- **Component Status**: Individual component health
- **Resource Usage**: Memory and CPU utilization
- **Network Status**: Connectivity to external services

#### Recent Activity
- **Test Sessions**: Recently completed test runs
- **Alerts**: Recent system alerts and notifications
- **Performance Trends**: Key performance indicators over time

### Navigation Menu

The sidebar navigation provides access to all major features:

- 🏠 **Dashboard**: Main overview and metrics
- 🧪 **Test Management**: Run and monitor tests
- ⚙️ **Configurations**: Manage test configurations
- 👥 **Virtual Users**: Manage user profiles
- 📊 **Monitoring**: System monitoring and metrics
- 📋 **Reports**: Test reports and analytics
- 🔧 **Settings**: System configuration and preferences

## 🧪 Test Management

### Running Tests

#### Quick Test Execution

1. **Click "Start Test"** button on the dashboard
2. **Select Configuration**: Choose from existing configurations
3. **Set Options** (optional):
   - Test timeout
   - Retry attempts
   - Concurrent users
4. **Click "Start"** to begin execution

#### Advanced Test Options

```javascript
// Test options example
{
  "configurationId": "firebase-auth-test",
  "options": {
    "timeout": 60000,
    "retryAttempts": 3,
    "concurrentUsers": 50,
    "environment": "staging",
    "tags": ["smoke", "regression"]
  }
}
```

### Monitoring Test Execution

#### Real-time Progress

- **Progress Bar**: Visual progress indicator
- **Live Logs**: Real-time test execution logs
- **Metrics**: Live performance metrics
- **Status Updates**: Test status changes via WebSocket

#### Test Session Details

- **Session ID**: Unique identifier for the test run
- **Configuration**: Test configuration used
- **Start Time**: When the test began
- **Duration**: Elapsed time
- **Status**: Current test status
- **Results**: Test results as they complete

### Managing Test Sessions

#### Active Sessions

View and manage currently running tests:

- **View Details**: Click on session to see detailed information
- **Stop Test**: Terminate running tests if needed
- **View Logs**: Access real-time logs and debug information
- **Monitor Resources**: Track resource usage during execution

#### Test History

Access historical test data:

- **Filter by Date**: View tests from specific time periods
- **Filter by Status**: Show only passed, failed, or error tests
- **Search**: Find specific test sessions
- **Export**: Download test history data

## ⚙️ Configuration Management

### Creating Test Configurations

#### Basic Configuration

1. **Navigate to Configurations** page
2. **Click "Create Configuration"**
3. **Fill in Basic Details**:
   - Name: Descriptive name for the configuration
   - Description: Purpose and scope of the tests
   - Environment: Target environment (dev/staging/prod)

4. **Select Test Suites**:
   - Firebase Authentication
   - WebSocket Communication
   - UI Components
   - Integration Workflows
   - Performance Tests

5. **Configure Virtual Users**:
   - User profiles to simulate
   - Number of concurrent users
   - User behavior patterns

#### Advanced Configuration

```json
{
  "name": "Comprehensive E2E Test",
  "description": "Full end-to-end testing suite",
  "environment": "staging",
  "testSuites": [
    "firebase-auth",
    "websocket-messaging",
    "ui-components",
    "booking-workflow",
    "payment-processing"
  ],
  "virtualUsers": {
    "profiles": [
      {
        "role": "passenger",
        "count": 30,
        "demographics": {
          "ageRange": [18, 65],
          "locations": ["New York", "Los Angeles"],
          "deviceTypes": ["mobile", "desktop"],
          "experience": "mixed"
        },
        "behaviorPatterns": {
          "bookingFrequency": "high",
          "averageRideDistance": 5.2,
          "preferredTimes": ["morning", "evening"],
          "cancellationRate": 0.05
        }
      },
      {
        "role": "driver",
        "count": 10,
        "demographics": {
          "ageRange": [21, 60],
          "locations": ["New York", "Los Angeles"],
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
    "failFast": false
  },
  "reporting": {
    "formats": ["html", "json"],
    "includeScreenshots": true,
    "includePerformanceMetrics": true
  }
}
```

### Managing Configurations

#### Configuration List

- **View All**: See all available configurations
- **Search**: Find configurations by name or description
- **Filter**: Filter by environment, status, or tags
- **Sort**: Sort by name, creation date, or last used

#### Configuration Actions

- **Edit**: Modify existing configurations
- **Clone**: Create copy of existing configuration
- **Delete**: Remove unused configurations
- **Export**: Download configuration as JSON
- **Import**: Upload configuration from file

### Configuration Templates

#### Pre-built Templates

- **Smoke Tests**: Quick validation of core functionality
- **Regression Tests**: Comprehensive feature validation
- **Performance Tests**: Load and stress testing
- **Security Tests**: Security vulnerability testing
- **Mobile Tests**: Mobile-specific testing scenarios

#### Custom Templates

Create reusable templates for common testing scenarios:

1. **Create Configuration** with desired settings
2. **Save as Template** with descriptive name
3. **Share Template** with team members
4. **Use Template** to create new configurations quickly

## 👥 Virtual User Management

### User Profiles

#### Creating User Profiles

1. **Navigate to Virtual Users** page
2. **Click "Create User Profile"**
3. **Define User Characteristics**:
   - Role (passenger, driver, operator, admin)
   - Demographics (age, location, device type)
   - Experience level (new, regular, power user)
   - Behavior patterns

#### Profile Configuration

```json
{
  "id": "premium-passenger",
  "name": "Premium Passenger Profile",
  "role": "passenger",
  "demographics": {
    "age": 35,
    "location": "Manhattan, NY",
    "deviceType": "mobile",
    "experience": "power",
    "income": "high"
  },
  "preferences": {
    "paymentMethod": "credit_card",
    "vehicleType": "premium",
    "notificationSettings": {
      "push": true,
      "sms": false,
      "email": true
    },
    "language": "en-US"
  },
  "behaviorPatterns": {
    "bookingFrequency": 15,
    "averageRideDistance": 8.5,
    "preferredTimes": ["morning", "evening"],
    "cancellationRate": 0.02,
    "tipPercentage": 0.20,
    "ratingBehavior": "generous"
  }
}
```

### User Simulation

#### Behavior Simulation

- **Realistic Actions**: Simulate real user interactions
- **Timing Patterns**: Natural delays and think times
- **Error Handling**: Realistic error responses
- **Session Management**: Maintain user state across actions

#### Scaling Virtual Users

- **Concurrent Users**: Run multiple users simultaneously
- **Ramp-up Patterns**: Gradually increase user load
- **Load Distribution**: Distribute users across scenarios
- **Resource Management**: Monitor resource usage

## 📊 Monitoring and Metrics

### Real-time Monitoring

#### System Metrics Dashboard

- **Performance Metrics**: Response times, throughput, error rates
- **Resource Usage**: CPU, memory, disk, network utilization
- **Test Metrics**: Active tests, completion rates, success rates
- **Alert Status**: Current alerts and their severity

#### Live Charts and Graphs

- **Response Time Trends**: Track response times over time
- **Error Rate Monitoring**: Monitor error rates and patterns
- **Resource Utilization**: Track system resource usage
- **Test Execution Metrics**: Monitor test execution statistics

### Alerting System

#### Alert Configuration

1. **Navigate to Monitoring** page
2. **Click "Configure Alerts"**
3. **Set Alert Rules**:
   - Metric thresholds
   - Time windows
   - Severity levels
   - Notification channels

#### Alert Types

- **Performance Alerts**: High response times, low throughput
- **Error Alerts**: High error rates, test failures
- **Resource Alerts**: High CPU/memory usage, disk space
- **System Alerts**: Service outages, connectivity issues

#### Alert Management

- **View Active Alerts**: See current system alerts
- **Acknowledge Alerts**: Mark alerts as acknowledged
- **Resolve Alerts**: Mark alerts as resolved
- **Alert History**: View historical alert data

## 📋 Reports and Analytics

### Test Reports

#### Report Generation

1. **Navigate to Reports** page
2. **Select Report Type**:
   - Executive Summary
   - Technical Details
   - Performance Analysis
   - Trend Analysis

3. **Configure Report Options**:
   - Time range
   - Test sessions to include
   - Report format (HTML, PDF, JSON)
   - Include screenshots and logs

#### Report Types

**Executive Summary**
- High-level metrics and KPIs
- Success/failure rates
- Performance trends
- Business impact analysis

**Technical Report**
- Detailed test results
- Error analysis and categorization
- Performance metrics
- System resource usage

**Performance Analysis**
- Response time analysis
- Throughput measurements
- Resource utilization trends
- Bottleneck identification

### Analytics Dashboard

#### Key Performance Indicators

- **Test Success Rate**: Percentage of tests passing over time
- **Mean Time to Detection (MTTD)**: Average time to detect issues
- **Mean Time to Resolution (MTTR)**: Average time to resolve issues
- **System Availability**: Uptime percentage
- **Performance Trends**: Response time and throughput trends

#### Trend Analysis

- **Historical Data**: View trends over weeks, months, quarters
- **Comparative Analysis**: Compare different time periods
- **Regression Detection**: Identify performance regressions
- **Capacity Planning**: Predict future resource needs

### Custom Dashboards

#### Creating Custom Views

1. **Click "Create Dashboard"**
2. **Add Widgets**:
   - Metric cards
   - Charts and graphs
   - Tables and lists
   - Status indicators

3. **Configure Layout**:
   - Drag and drop widgets
   - Resize and arrange
   - Set refresh intervals
   - Configure filters

#### Sharing Dashboards

- **Save Dashboard**: Save custom dashboard configurations
- **Share with Team**: Share dashboards with other users
- **Export Dashboard**: Export dashboard configuration
- **Public Dashboards**: Create read-only public dashboards

## 🔧 Settings and Configuration

### User Preferences

#### Profile Settings

- **Personal Information**: Name, email, timezone
- **Notification Preferences**: Email, push, SMS notifications
- **Dashboard Preferences**: Default views, refresh intervals
- **Theme Settings**: Light/dark mode, color schemes

#### Security Settings

- **Password Management**: Change password, enable 2FA
- **Session Management**: View active sessions, logout devices
- **API Keys**: Generate and manage API keys
- **Access Logs**: View login history and access logs

### System Configuration

#### Application Settings

- **General Settings**: Application name, timezone, language
- **Performance Settings**: Timeout values, retry attempts
- **Logging Settings**: Log levels, retention periods
- **Integration Settings**: External service configurations

#### Advanced Configuration

```json
{
  "application": {
    "name": "GoCars Testing Agent",
    "timezone": "UTC",
    "language": "en-US",
    "theme": "light"
  },
  "performance": {
    "defaultTimeout": 30000,
    "maxConcurrentTests": 50,
    "retryAttempts": 3,
    "resourceLimits": {
      "maxMemory": "4GB",
      "maxCPU": "80%"
    }
  },
  "monitoring": {
    "metricsRetention": "30d",
    "alertRetention": "90d",
    "healthCheckInterval": 30000
  },
  "security": {
    "sessionTimeout": 3600000,
    "passwordPolicy": {
      "minLength": 8,
      "requireSpecialChars": true,
      "requireNumbers": true
    }
  }
}
```

## 🔍 Advanced Features

### API Integration

#### REST API Access

The web dashboard provides access to the full REST API:

- **API Explorer**: Interactive API documentation
- **Authentication**: API key management
- **Rate Limiting**: API usage monitoring
- **Webhooks**: Configure webhook endpoints

#### WebSocket Integration

Real-time updates via WebSocket connections:

- **Live Updates**: Real-time test progress updates
- **Event Streaming**: System events and notifications
- **Custom Subscriptions**: Subscribe to specific event types
- **Connection Management**: Monitor WebSocket connections

### Automation Features

#### Scheduled Tests

- **Cron Scheduling**: Schedule tests using cron expressions
- **Recurring Tests**: Set up daily, weekly, monthly test runs
- **Conditional Execution**: Run tests based on conditions
- **Notification Integration**: Get notified of scheduled test results

#### CI/CD Integration

- **Webhook Triggers**: Trigger tests from CI/CD pipelines
- **Status Reporting**: Report test status back to CI/CD systems
- **Artifact Management**: Store and retrieve test artifacts
- **Pipeline Integration**: Integrate with popular CI/CD tools

## 🆘 Troubleshooting

### Common Issues

#### Dashboard Not Loading

1. **Check Service Status**: Ensure web service is running
2. **Check Port**: Verify port 8080 is available
3. **Check Logs**: Review web service logs for errors
4. **Clear Browser Cache**: Clear browser cache and cookies

#### Login Issues

1. **Verify Credentials**: Check username and password
2. **Check User Status**: Ensure user account is active
3. **Reset Password**: Use password reset functionality
4. **Check Session**: Clear existing sessions if needed

#### Performance Issues

1. **Check Resource Usage**: Monitor CPU and memory usage
2. **Optimize Queries**: Review database query performance
3. **Scale Resources**: Increase system resources if needed
4. **Check Network**: Verify network connectivity and speed

### Getting Help

- **Built-in Help**: Click "?" icons for contextual help
- **Documentation**: Access full documentation from help menu
- **Support**: Contact support through the help system
- **Community**: Join community discussions and forums

## 📱 Mobile Access

### Responsive Design

The web dashboard is fully responsive and works on:

- **Desktop**: Full-featured desktop experience
- **Tablet**: Optimized tablet interface
- **Mobile**: Mobile-friendly responsive design

### Mobile Features

- **Touch Navigation**: Touch-friendly interface elements
- **Swipe Gestures**: Swipe to navigate between sections
- **Mobile Notifications**: Push notifications on mobile devices
- **Offline Support**: Limited offline functionality

---

*Next: [CLI Guide](./cli-guide.md) | [Test Configuration Guide](./test-configuration.md)*