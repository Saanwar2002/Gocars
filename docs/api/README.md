# API Reference

The GoCars Testing Agent provides a comprehensive REST API for programmatic access to all testing functionality. This API enables integration with external systems, custom dashboards, and automated workflows.

## 🌐 Base URL

```
Development: http://localhost:3000/api
Staging: https://staging-api.gocars.com/api
Production: https://api.gocars.com/api
```

## 🔐 Authentication

### API Key Authentication

Include your API key in the request headers:

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Session Authentication

For web applications, use session-based authentication:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

Response:
```json
{
  "sessionId": "session-abc123",
  "user": {
    "username": "admin",
    "role": "admin",
    "permissions": ["read", "write", "delete", "manage_users"]
  }
}
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22.000Z",
    "requestId": "req-abc123",
    "version": "1.0.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "timeout",
      "reason": "Must be a positive integer"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22.000Z",
    "requestId": "req-abc123",
    "version": "1.0.0"
  }
}
```

## 🧪 Test Execution API

### Start Test Execution

Start a new test session with specified configuration.

```http
POST /api/tests/start
```

**Request Body:**
```json
{
  "configurationId": "config-123",
  "options": {
    "timeout": 60000,
    "retryAttempts": 3,
    "concurrentUsers": 50,
    "environment": "staging",
    "tags": ["smoke", "regression"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-abc123",
    "status": "starting",
    "startTime": "2024-01-15T14:30:22.000Z",
    "configuration": {
      "id": "config-123",
      "name": "Firebase Authentication Tests"
    }
  }
}
```

### Stop Test Execution

Stop a running test session.

```http
POST /api/tests/stop
```

**Request Body:**
```json
{
  "sessionId": "session-abc123",
  "reason": "Manual termination"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-abc123",
    "status": "stopped",
    "stopTime": "2024-01-15T14:35:22.000Z",
    "reason": "Manual termination"
  }
}
```

### Get Test Status

Get the current status of a test session.

```http
GET /api/tests/status/{sessionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-abc123",
    "status": "running",
    "progress": {
      "completed": 15,
      "total": 25,
      "percentage": 60
    },
    "currentTest": {
      "id": "firebase-auth-003",
      "name": "Password reset test",
      "status": "running",
      "startTime": "2024-01-15T14:33:10.000Z"
    },
    "metrics": {
      "averageResponseTime": 1240,
      "errorRate": 0.05,
      "throughput": 12.5
    }
  }
}
```

### Get Test Results

Retrieve results for a completed test session.

```http
GET /api/tests/results/{sessionId}
```

**Query Parameters:**
- `format`: Response format (`json`, `summary`)
- `includeDetails`: Include detailed test information (`true`, `false`)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-abc123",
    "configuration": {
      "id": "config-123",
      "name": "Firebase Authentication Tests"
    },
    "execution": {
      "startTime": "2024-01-15T14:30:22.000Z",
      "endTime": "2024-01-15T14:35:45.000Z",
      "duration": 323000,
      "status": "completed"
    },
    "summary": {
      "total": 25,
      "passed": 23,
      "failed": 2,
      "skipped": 0,
      "successRate": 92.0
    },
    "tests": [
      {
        "id": "firebase-auth-001",
        "name": "User registration test",
        "status": "passed",
        "duration": 1200,
        "startTime": "2024-01-15T14:30:25.000Z",
        "endTime": "2024-01-15T14:30:26.200Z"
      }
      // ... more test results
    ],
    "metrics": {
      "averageResponseTime": 1340,
      "maxResponseTime": 5200,
      "minResponseTime": 450,
      "errorRate": 0.08,
      "throughput": 11.2
    }
  }
}
```

## ⚙️ Configuration Management API

### List Configurations

Get all available test configurations.

```http
GET /api/configurations
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `environment`: Filter by environment
- `tags`: Filter by tags (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "configurations": [
      {
        "id": "config-123",
        "name": "Firebase Authentication Tests",
        "description": "Comprehensive Firebase auth testing",
        "environment": "staging",
        "testSuites": ["firebase", "websocket"],
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-15T09:30:00.000Z",
        "tags": ["auth", "firebase", "smoke"]
      }
      // ... more configurations
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Configuration

Get a specific configuration by ID.

```http
GET /api/configurations/{configId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "config-123",
    "name": "Firebase Authentication Tests",
    "description": "Comprehensive Firebase auth testing",
    "environment": "staging",
    "testSuites": [
      {
        "name": "firebase",
        "enabled": true,
        "config": {
          "timeout": 30000,
          "retryAttempts": 3
        }
      }
    ],
    "virtualUsers": {
      "profiles": [
        {
          "role": "passenger",
          "count": 30,
          "demographics": {
            "ageRange": [18, 65],
            "locations": ["New York", "Los Angeles"],
            "deviceTypes": ["mobile", "desktop"]
          }
        }
      ]
    },
    "execution": {
      "timeout": 300000,
      "retryAttempts": 2,
      "parallelExecution": true
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-15T09:30:00.000Z"
  }
}
```

### Create Configuration

Create a new test configuration.

```http
POST /api/configurations
```

**Request Body:**
```json
{
  "name": "New Test Configuration",
  "description": "Description of the test configuration",
  "environment": "development",
  "testSuites": ["firebase", "websocket", "ui"],
  "virtualUsers": {
    "profiles": [
      {
        "role": "passenger",
        "count": 20,
        "demographics": {
          "ageRange": [25, 45],
          "locations": ["New York"],
          "deviceTypes": ["mobile"]
        }
      }
    ]
  },
  "execution": {
    "timeout": 180000,
    "retryAttempts": 2,
    "parallelExecution": false
  },
  "tags": ["new", "development"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "config-456",
    "name": "New Test Configuration",
    "createdAt": "2024-01-15T14:30:22.000Z"
  }
}
```

### Update Configuration

Update an existing configuration.

```http
PUT /api/configurations/{configId}
```

**Request Body:** (Same as create, but all fields are optional)

### Delete Configuration

Delete a configuration.

```http
DELETE /api/configurations/{configId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration deleted successfully"
  }
}
```

## 👥 Virtual Users API

### List Virtual Users

Get all virtual user profiles.

```http
GET /api/users/virtual
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "profile": {
          "role": "passenger",
          "demographics": {
            "age": 32,
            "location": "New York",
            "deviceType": "mobile",
            "experience": "regular"
          }
        },
        "status": "active",
        "createdAt": "2024-01-15T14:20:00.000Z"
      }
      // ... more users
    ]
  }
}
```

### Create Virtual User

Create a new virtual user profile.

```http
POST /api/users/virtual
```

**Request Body:**
```json
{
  "profile": {
    "role": "passenger",
    "demographics": {
      "age": 28,
      "location": "Los Angeles",
      "deviceType": "mobile",
      "experience": "power"
    },
    "preferences": {
      "paymentMethod": "credit_card",
      "notificationSettings": {
        "push": true,
        "sms": false,
        "email": true
      }
    },
    "behaviorPatterns": {
      "bookingFrequency": 12,
      "averageRideDistance": 6.5,
      "cancellationRate": 0.03
    }
  }
}
```

### Delete Virtual User

Delete a virtual user profile.

```http
DELETE /api/users/virtual/{userId}
```

## 📊 Monitoring and Metrics API

### Get System Metrics

Get current system performance metrics.

```http
GET /api/metrics
```

**Query Parameters:**
- `timeRange`: Time range for metrics (`1h`, `24h`, `7d`, `30d`)
- `metrics`: Specific metrics to retrieve (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T14:30:22.000Z",
    "system": {
      "cpu": {
        "usage": 45.2,
        "cores": 8
      },
      "memory": {
        "used": 2147483648,
        "total": 8589934592,
        "percentage": 25.0
      },
      "disk": {
        "used": 107374182400,
        "total": 536870912000,
        "percentage": 20.0
      }
    },
    "application": {
      "activeTests": 3,
      "totalConfigurations": 25,
      "virtualUsers": 150,
      "uptime": 86400000
    },
    "performance": {
      "averageResponseTime": 1240,
      "requestsPerSecond": 45.2,
      "errorRate": 0.02,
      "successRate": 98.0
    }
  }
}
```

### Get Alerts

Get current system alerts.

```http
GET /api/alerts
```

**Query Parameters:**
- `status`: Filter by status (`active`, `acknowledged`, `resolved`)
- `severity`: Filter by severity (`low`, `medium`, `high`, `critical`)
- `limit`: Number of alerts to return

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-123",
        "title": "High Memory Usage",
        "message": "System memory usage is above 90%",
        "severity": "high",
        "status": "active",
        "component": "system",
        "createdAt": "2024-01-15T14:25:00.000Z",
        "metrics": {
          "memoryUsage": 92.5,
          "threshold": 90.0
        }
      }
      // ... more alerts
    ]
  }
}
```

### Acknowledge Alert

Mark an alert as acknowledged.

```http
POST /api/alerts/{alertId}/acknowledge
```

### Resolve Alert

Mark an alert as resolved.

```http
POST /api/alerts/{alertId}/resolve
```

## 📋 Reports API

### Generate Report

Generate a test report for a specific session.

```http
GET /api/reports/generate
```

**Query Parameters:**
- `sessionId`: Test session ID
- `format`: Report format (`json`, `html`, `pdf`)
- `type`: Report type (`executive`, `technical`, `performance`)
- `includeMetrics`: Include performance metrics (`true`, `false`)

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report-123",
    "format": "html",
    "type": "executive",
    "generatedAt": "2024-01-15T14:30:22.000Z",
    "downloadUrl": "/api/reports/download/report-123",
    "expiresAt": "2024-01-22T14:30:22.000Z"
  }
}
```

### Get Report

Retrieve a generated report.

```http
GET /api/reports/{reportId}
```

### Download Report

Download a report file.

```http
GET /api/reports/download/{reportId}
```

## 🔧 System Management API

### Health Check

Get system health status.

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T14:30:22.000Z",
    "uptime": 86400000,
    "version": "1.0.0",
    "components": {
      "database": {
        "status": "healthy",
        "responseTime": 12
      },
      "redis": {
        "status": "healthy",
        "responseTime": 3
      },
      "firebase": {
        "status": "healthy",
        "responseTime": 45
      },
      "websocket": {
        "status": "warning",
        "responseTime": 156,
        "message": "High latency detected"
      }
    }
  }
}
```

### System Information

Get detailed system information.

```http
GET /api/system/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "name": "GoCars Testing Agent",
      "version": "1.0.0",
      "environment": "production",
      "startTime": "2024-01-14T14:30:22.000Z"
    },
    "system": {
      "platform": "linux",
      "architecture": "x64",
      "nodeVersion": "18.17.0",
      "memory": {
        "total": 8589934592,
        "free": 4294967296
      },
      "cpu": {
        "model": "Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz",
        "cores": 8,
        "speed": 2300
      }
    },
    "configuration": {
      "maxConcurrentTests": 50,
      "defaultTimeout": 30000,
      "retryAttempts": 3
    }
  }
}
```

## 🔌 WebSocket API

### Connection

Connect to the WebSocket endpoint for real-time updates:

```javascript
const socket = io('ws://localhost:3000');

// Authenticate
socket.emit('authenticate', { sessionId: 'your-session-id' });

// Subscribe to events
socket.emit('subscribe', { 
  channels: ['testProgress', 'systemMetrics', 'alerts'] 
});
```

### Events

#### Test Progress Updates

```javascript
socket.on('testProgress', (data) => {
  console.log('Test progress:', data);
  // {
  //   sessionId: 'session-abc123',
  //   progress: { completed: 15, total: 25, percentage: 60 },
  //   currentTest: { id: 'test-003', name: 'Password reset test' }
  // }
});
```

#### System Metrics Updates

```javascript
socket.on('systemMetrics', (data) => {
  console.log('System metrics:', data);
  // {
  //   timestamp: '2024-01-15T14:30:22.000Z',
  //   cpu: { usage: 45.2 },
  //   memory: { percentage: 25.0 },
  //   activeTests: 3
  // }
});
```

#### Alert Notifications

```javascript
socket.on('alertTriggered', (data) => {
  console.log('New alert:', data);
  // {
  //   id: 'alert-123',
  //   title: 'High Memory Usage',
  //   severity: 'high',
  //   message: 'System memory usage is above 90%'
  // }
});
```

## 📚 SDK and Client Libraries

### JavaScript/Node.js SDK

```javascript
const { GoCarsTestingClient } = require('@gocars/testing-agent-sdk');

const client = new GoCarsTestingClient({
  apiUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key'
});

// Start a test
const session = await client.tests.start({
  configurationId: 'config-123',
  options: { timeout: 60000 }
});

// Monitor progress
client.tests.onProgress(session.sessionId, (progress) => {
  console.log(`Progress: ${progress.percentage}%`);
});

// Get results
const results = await client.tests.getResults(session.sessionId);
```

### Python SDK

```python
from gocars_testing import TestingClient

client = TestingClient(
    api_url='http://localhost:3000/api',
    api_key='your-api-key'
)

# Start a test
session = client.tests.start(
    configuration_id='config-123',
    options={'timeout': 60000}
)

# Wait for completion
results = client.tests.wait_for_completion(session['sessionId'])
print(f"Test completed with {results['summary']['successRate']}% success rate")
```

## 🚨 Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

### Application Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_FAILED` | Authentication credentials invalid |
| `AUTHORIZATION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `TEST_SESSION_NOT_FOUND` | Test session not found |
| `CONFIGURATION_INVALID` | Test configuration is invalid |
| `SYSTEM_OVERLOADED` | System is overloaded |
| `SERVICE_UNAVAILABLE` | External service unavailable |

## 📊 Rate Limiting

API requests are rate limited to ensure system stability:

- **Default Limit**: 1000 requests per hour per API key
- **Burst Limit**: 100 requests per minute
- **WebSocket Connections**: 10 concurrent connections per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## 🔍 Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field and direction (`field:asc` or `field:desc`)

**Response:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

*Next: [Architecture Overview](../developer/architecture.md) | [Extension Guide](../developer/extensions.md)*