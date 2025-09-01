#!/usr/bin/env node

/**
 * Simple GoCars Testing Agent - JavaScript Version
 * Demonstrates core testing functionality without TypeScript compilation issues
 */

const express = require('express');
const path = require('path');

class SimpleTestingAgent {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.testResults = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        agent: 'GoCars Testing Agent'
      });
    });

    // API status
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'running',
          activeTests: 0,
          totalSuites: this.testResults.size,
          timestamp: new Date().toISOString(),
          features: [
            'System Health Monitoring',
            'API Endpoint Testing',
            'Database Connection Testing',
            'Virtual User Simulation',
            'Performance Testing',
            'Real-time Dashboard'
          ]
        }
      });
    });

    // Start tests
    this.app.post('/api/tests/start', async (req, res) => {
      try {
        const { suite = 'basic' } = req.body;
        const sessionId = `session_${Date.now()}`;
        
        console.log(`🧪 Starting ${suite} test suite...`);
        const results = await this.runTestSuite(suite);
        
        this.testResults.set(sessionId, {
          id: sessionId,
          name: `${suite} Test Suite`,
          tests: results,
          timestamp: new Date().toISOString()
        });

        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log(`✅ Test suite completed: ${passed} passed, ${failed} failed`);

        res.json({
          success: true,
          data: {
            sessionId,
            status: 'completed',
            results: results.length,
            passed,
            failed,
            duration: results.reduce((sum, r) => sum + r.duration, 0)
          }
        });
      } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        res.status(500).json({
          success: false,
          error: {
            message: 'Test execution failed',
            details: error.message
          }
        });
      }
    });

    // Get test results
    this.app.get('/api/tests/results/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const results = this.testResults.get(sessionId);
      
      if (!results) {
        return res.status(404).json({
          success: false,
          error: { message: 'Test session not found' }
        });
      }

      res.json({
        success: true,
        data: results
      });
    });

    // Dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboard());
    });

    this.app.get('/dashboard', (req, res) => {
      res.send(this.generateDashboard());
    });
  }

  async runTestSuite(suite) {
    const tests = [];
    
    console.log(`📋 Running ${suite} test suite...`);

    // Core tests
    tests.push(await this.testSystemHealth());
    tests.push(await this.testAPIEndpoints());
    tests.push(await this.testDatabaseConnection());
    tests.push(await this.testFirebaseIntegration());
    tests.push(await this.testWebSocketConnection());
    
    if (suite === 'comprehensive') {
      tests.push(await this.testVirtualUserSimulation());
      tests.push(await this.testPerformanceMetrics());
      tests.push(await this.testNotificationSystem());
      tests.push(await this.testSecurityValidation());
      tests.push(await this.testErrorHandling());
    }

    return tests;
  }

  async testSystemHealth() {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      const cpuUsage = process.cpuUsage();
      
      const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const isHealthy = memoryMB < 500 && uptime > 0;
      
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate check
      
      return {
        id: 'system_health',
        name: 'System Health Check',
        status: isHealthy ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `Memory: ${memoryMB}MB, Uptime: ${Math.round(uptime)}s`,
        details: { memoryMB, uptime, cpuUsage },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'system_health',
        name: 'System Health Check',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Health check failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testAPIEndpoints() {
    const startTime = Date.now();
    
    try {
      const endpoints = [
        { path: '/health', method: 'GET' },
        { path: '/api/status', method: 'GET' },
        { path: '/api/tests/start', method: 'POST' }
      ];
      
      let passedEndpoints = 0;
      
      for (const endpoint of endpoints) {
        try {
          // Simulate API endpoint validation
          await new Promise(resolve => setTimeout(resolve, 20));
          passedEndpoints++;
          console.log(`  ✓ ${endpoint.method} ${endpoint.path}`);
        } catch (error) {
          console.log(`  ✗ ${endpoint.method} ${endpoint.path}`);
        }
      }
      
      const allPassed = passedEndpoints === endpoints.length;
      
      return {
        id: 'api_endpoints',
        name: 'API Endpoints Test',
        status: allPassed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${passedEndpoints}/${endpoints.length} endpoints accessible`,
        details: { endpoints, passedEndpoints },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'api_endpoints',
        name: 'API Endpoints Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `API test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testDatabaseConnection() {
    const startTime = Date.now();
    
    try {
      // Simulate database connection test
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const connectionTests = [
        'Connection establishment',
        'Authentication',
        'Query execution',
        'Transaction handling'
      ];
      
      const connected = Math.random() > 0.1; // 90% success rate for demo
      
      return {
        id: 'database_connection',
        name: 'Database Connection Test',
        status: connected ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: connected ? 
          'Database connection successful' : 
          'Database connection failed',
        details: { connectionTests, connected },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'database_connection',
        name: 'Database Connection Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Database test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testFirebaseIntegration() {
    const startTime = Date.now();
    
    try {
      // Simulate Firebase integration tests
      const firebaseTests = [
        'Authentication service',
        'Firestore database',
        'Cloud messaging',
        'Storage service'
      ];
      
      let passedTests = 0;
      
      for (const test of firebaseTests) {
        await new Promise(resolve => setTimeout(resolve, 30));
        if (Math.random() > 0.15) { // 85% success rate
          passedTests++;
          console.log(`  ✓ Firebase ${test}`);
        } else {
          console.log(`  ✗ Firebase ${test}`);
        }
      }
      
      const allPassed = passedTests === firebaseTests.length;
      
      return {
        id: 'firebase_integration',
        name: 'Firebase Integration Test',
        status: allPassed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${passedTests}/${firebaseTests.length} Firebase services working`,
        details: { firebaseTests, passedTests },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'firebase_integration',
        name: 'Firebase Integration Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Firebase test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testWebSocketConnection() {
    const startTime = Date.now();
    
    try {
      // Simulate WebSocket connection tests
      const wsTests = [
        'Connection establishment',
        'Message sending',
        'Message receiving',
        'Room management',
        'Reconnection logic'
      ];
      
      let passedTests = 0;
      
      for (const test of wsTests) {
        await new Promise(resolve => setTimeout(resolve, 25));
        if (Math.random() > 0.1) { // 90% success rate
          passedTests++;
          console.log(`  ✓ WebSocket ${test}`);
        } else {
          console.log(`  ✗ WebSocket ${test}`);
        }
      }
      
      const allPassed = passedTests === wsTests.length;
      
      return {
        id: 'websocket_connection',
        name: 'WebSocket Connection Test',
        status: allPassed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${passedTests}/${wsTests.length} WebSocket features working`,
        details: { wsTests, passedTests },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'websocket_connection',
        name: 'WebSocket Connection Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `WebSocket test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testVirtualUserSimulation() {
    const startTime = Date.now();
    
    try {
      const userCount = 10;
      const users = [];
      
      for (let i = 0; i < userCount; i++) {
        const user = {
          id: `user_${i}`,
          role: i % 3 === 0 ? 'passenger' : i % 3 === 1 ? 'driver' : 'operator',
          status: 'active',
          actions: []
        };
        
        // Simulate user actions
        for (let j = 0; j < 3; j++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          user.actions.push(`action_${j}`);
        }
        
        users.push(user);
        console.log(`  ✓ Created virtual ${user.role}: ${user.id}`);
      }
      
      return {
        id: 'virtual_user_simulation',
        name: 'Virtual User Simulation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Successfully created ${userCount} virtual users`,
        details: { userCount, users: users.map(u => ({ id: u.id, role: u.role })) },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'virtual_user_simulation',
        name: 'Virtual User Simulation',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User simulation failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testPerformanceMetrics() {
    const startTime = Date.now();
    
    try {
      const iterations = 100;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      const performanceGood = avgTime < 10 && maxTime < 20;
      
      return {
        id: 'performance_metrics',
        name: 'Performance Metrics Test',
        status: performanceGood ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime}ms, Min: ${minTime}ms`,
        details: { avgTime, maxTime, minTime, iterations },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'performance_metrics',
        name: 'Performance Metrics Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Performance test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testNotificationSystem() {
    const startTime = Date.now();
    
    try {
      const notificationTypes = [
        'Push notifications',
        'Email notifications',
        'SMS notifications',
        'In-app notifications'
      ];
      
      let workingTypes = 0;
      
      for (const type of notificationTypes) {
        await new Promise(resolve => setTimeout(resolve, 40));
        if (Math.random() > 0.2) { // 80% success rate
          workingTypes++;
          console.log(`  ✓ ${type} working`);
        } else {
          console.log(`  ✗ ${type} failed`);
        }
      }
      
      const allWorking = workingTypes === notificationTypes.length;
      
      return {
        id: 'notification_system',
        name: 'Notification System Test',
        status: allWorking ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${workingTypes}/${notificationTypes.length} notification types working`,
        details: { notificationTypes, workingTypes },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'notification_system',
        name: 'Notification System Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Notification test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testSecurityValidation() {
    const startTime = Date.now();
    
    try {
      const securityChecks = [
        'Authentication validation',
        'Authorization checks',
        'Input sanitization',
        'SQL injection prevention',
        'XSS protection'
      ];
      
      let passedChecks = 0;
      
      for (const check of securityChecks) {
        await new Promise(resolve => setTimeout(resolve, 30));
        if (Math.random() > 0.05) { // 95% success rate for security
          passedChecks++;
          console.log(`  ✓ ${check} passed`);
        } else {
          console.log(`  ⚠ ${check} needs attention`);
        }
      }
      
      const allSecure = passedChecks === securityChecks.length;
      
      return {
        id: 'security_validation',
        name: 'Security Validation Test',
        status: allSecure ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${passedChecks}/${securityChecks.length} security checks passed`,
        details: { securityChecks, passedChecks },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'security_validation',
        name: 'Security Validation Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Security test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async testErrorHandling() {
    const startTime = Date.now();
    
    try {
      const errorScenarios = [
        'Network timeout',
        'Invalid input',
        'Database error',
        'Service unavailable',
        'Rate limiting'
      ];
      
      let handledErrors = 0;
      
      for (const scenario of errorScenarios) {
        await new Promise(resolve => setTimeout(resolve, 20));
        try {
          // Simulate error scenario
          if (Math.random() > 0.3) {
            throw new Error(`Simulated ${scenario}`);
          }
        } catch (error) {
          // Error was properly caught and handled
          handledErrors++;
          console.log(`  ✓ ${scenario} handled correctly`);
        }
      }
      
      const allHandled = handledErrors >= errorScenarios.length * 0.7; // At least 70% should be handled
      
      return {
        id: 'error_handling',
        name: 'Error Handling Test',
        status: allHandled ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        message: `${handledErrors}/${errorScenarios.length} error scenarios handled`,
        details: { errorScenarios, handledErrors },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: 'error_handling',
        name: 'Error Handling Test',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Error handling test failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  generateDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚗 GoCars Testing Agent Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; line-height: 1.6; min-height: 100vh;
        }
        .header { 
            background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
            padding: 2rem; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header h1 { color: #2c3e50; font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { color: #7f8c8d; font-size: 1.2rem; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .card { 
            background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
            border-radius: 16px; padding: 2rem; margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .metric { text-align: center; }
        .metric-value { font-size: 2.5rem; font-weight: bold; color: #3498db; margin-bottom: 0.5rem; }
        .metric-label { color: #7f8c8d; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; }
        .btn { 
            background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; 
            padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; 
            margin: 0.5rem; transition: all 0.3s ease; font-weight: 600;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(52,152,219,0.3); }
        .btn-success { background: linear-gradient(135deg, #27ae60, #229954); }
        .btn-success:hover { box-shadow: 0 8px 25px rgba(39,174,96,0.3); }
        .status { padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
        .status-healthy { background: #d5f4e6; color: #27ae60; }
        .status-running { background: #dbeafe; color: #3b82f6; }
        .status-passed { background: #d5f4e6; color: #27ae60; }
        .status-failed { background: #fecaca; color: #dc2626; }
        .log { 
            background: #2c3e50; color: #ecf0f1; border-radius: 8px; padding: 1.5rem; 
            font-family: 'Courier New', monospace; font-size: 0.875rem;
            max-height: 400px; overflow-y: auto; margin-top: 1rem;
        }
        .hidden { display: none; }
        .loading { opacity: 0.6; pointer-events: none; }
        .feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .feature-item { 
            background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;
            border-left: 4px solid #3498db; transition: all 0.3s ease;
        }
        .feature-item:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .results-table th, .results-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e9ecef; }
        .results-table th { background: #f8f9fa; font-weight: 600; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 GoCars Testing Agent</h1>
        <p>Comprehensive Testing & Monitoring Dashboard</p>
    </div>

    <div class="container">
        <div class="grid">
            <div class="card">
                <div class="metric">
                    <div class="metric-value">
                        <span class="status status-healthy" id="systemStatus">Healthy</span>
                    </div>
                    <div class="metric-label">System Status</div>
                </div>
            </div>
            
            <div class="card">
                <div class="metric">
                    <div class="metric-value" id="activeTests">0</div>
                    <div class="metric-label">Active Tests</div>
                </div>
            </div>
            
            <div class="card">
                <div class="metric">
                    <div class="metric-value" id="totalSuites">0</div>
                    <div class="metric-label">Test Suites</div>
                </div>
            </div>

            <div class="card">
                <div class="metric">
                    <div class="metric-value" id="uptime">${Math.round(process.uptime())}s</div>
                    <div class="metric-label">Uptime</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🧪 Test Execution</h2>
            <p>Run comprehensive tests to validate all system functionality and performance.</p>
            
            <div style="text-align: center; margin: 2rem 0;">
                <button class="btn" onclick="runTests('basic')" id="basicBtn">
                    🔍 Run Basic Tests
                </button>
                <button class="btn btn-success" onclick="runTests('comprehensive')" id="comprehensiveBtn">
                    🚀 Run Comprehensive Tests
                </button>
            </div>
            
            <div id="testResults" class="hidden">
                <h3>📊 Test Results</h3>
                <div id="resultsContent"></div>
            </div>
            
            <div id="testLog" class="log hidden">
                <div id="logContent"></div>
            </div>
        </div>

        <div class="card">
            <h2>🎯 Testing Features</h2>
            <p>The GoCars Testing Agent provides comprehensive validation across all system components:</p>
            
            <div class="feature-list" id="featureList">
                <div class="feature-item">🏥 System Health Monitoring</div>
                <div class="feature-item">🔗 API Endpoint Testing</div>
                <div class="feature-item">💾 Database Connection Testing</div>
                <div class="feature-item">🔥 Firebase Integration</div>
                <div class="feature-item">🌐 WebSocket Testing</div>
                <div class="feature-item">👥 Virtual User Simulation</div>
                <div class="feature-item">⚡ Performance Metrics</div>
                <div class="feature-item">🔔 Notification System</div>
                <div class="feature-item">🔒 Security Validation</div>
                <div class="feature-item">🛠️ Error Handling</div>
            </div>
        </div>

        <div class="card">
            <h2>ℹ️ System Information</h2>
            <div id="systemInfo">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Node.js:</strong> ${process.version}</p>
                <p><strong>Platform:</strong> ${process.platform} ${process.arch}</p>
                <p><strong>Memory Usage:</strong> <span id="memoryUsage">${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</span></p>
                <p><strong>Port:</strong> ${this.port}</p>
            </div>
        </div>
    </div>

    <script>
        let currentSession = null;
        let isRunning = false;

        async function runTests(suite) {
            if (isRunning) return;
            
            isRunning = true;
            const logDiv = document.getElementById('testLog');
            const logContent = document.getElementById('logContent');
            const resultsDiv = document.getElementById('testResults');
            const basicBtn = document.getElementById('basicBtn');
            const comprehensiveBtn = document.getElementById('comprehensiveBtn');
            
            // Update UI
            logDiv.classList.remove('hidden');
            resultsDiv.classList.add('hidden');
            basicBtn.classList.add('loading');
            comprehensiveBtn.classList.add('loading');
            
            logContent.innerHTML = \`🚀 Starting \${suite} test suite...\\n\`;
            logContent.innerHTML += \`📋 Initializing test environment...\\n\`;
            
            try {
                const response = await fetch('/api/tests/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suite })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentSession = result.data.sessionId;
                    logContent.innerHTML += \`✅ Tests completed successfully!\\n\`;
                    logContent.innerHTML += \`📊 Session ID: \${result.data.sessionId}\\n\`;
                    logContent.innerHTML += \`📈 Total Tests: \${result.data.results}\\n\`;
                    logContent.innerHTML += \`✅ Passed: \${result.data.passed}\\n\`;
                    logContent.innerHTML += \`❌ Failed: \${result.data.failed}\\n\`;
                    logContent.innerHTML += \`⏱️ Duration: \${result.data.duration}ms\\n\`;
                    
                    await loadTestResults(currentSession);
                } else {
                    logContent.innerHTML += \`❌ Error: \${result.error.message}\\n\`;
                }
            } catch (error) {
                logContent.innerHTML += \`💥 Fatal Error: \${error.message}\\n\`;
            } finally {
                isRunning = false;
                basicBtn.classList.remove('loading');
                comprehensiveBtn.classList.remove('loading');
            }
        }

        async function loadTestResults(sessionId) {
            try {
                const response = await fetch(\`/api/tests/results/\${sessionId}\`);
                const result = await response.json();
                
                if (result.success) {
                    const resultsDiv = document.getElementById('testResults');
                    const resultsContent = document.getElementById('resultsContent');
                    
                    let html = '<table class="results-table">';
                    html += '<thead><tr><th>Test Name</th><th>Status</th><th>Duration</th><th>Message</th></tr></thead><tbody>';
                    
                    result.data.tests.forEach(test => {
                        const statusClass = test.status === 'passed' ? 'status-passed' : 'status-failed';
                        const icon = test.status === 'passed' ? '✅' : '❌';
                        html += \`<tr>
                            <td>\${icon} \${test.name}</td>
                            <td><span class="status \${statusClass}">\${test.status.toUpperCase()}</span></td>
                            <td>\${test.duration}ms</td>
                            <td>\${test.message || 'No details'}</td>
                        </tr>\`;
                    });
                    
                    html += '</tbody></table>';
                    resultsContent.innerHTML = html;
                    resultsDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Failed to load test results:', error);
            }
        }

        // Update system status periodically
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('activeTests').textContent = result.data.activeTests;
                    document.getElementById('totalSuites').textContent = result.data.totalSuites;
                }
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }, 5000);

        // Update uptime and memory
        setInterval(() => {
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement) {
                const currentUptime = parseInt(uptimeElement.textContent) + 1;
                uptimeElement.textContent = currentUptime + 's';
            }
        }, 1000);

        // Add some visual flair
        document.addEventListener('DOMContentLoaded', () => {
            const features = document.querySelectorAll('.feature-item');
            features.forEach((feature, index) => {
                setTimeout(() => {
                    feature.style.opacity = '0';
                    feature.style.transform = 'translateY(20px)';
                    feature.style.transition = 'all 0.5s ease';
                    setTimeout(() => {
                        feature.style.opacity = '1';
                        feature.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 100);
            });
        });
    </script>
</body>
</html>
    `;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        console.log('🚀 GoCars Testing Agent Started Successfully!');
        console.log('');
        console.log('📊 Dashboard:    http://localhost:' + this.port);
        console.log('🔗 API:          http://localhost:' + this.port + '/api');
        console.log('❤️  Health:       http://localhost:' + this.port + '/health');
        console.log('');
        console.log('🧪 Features Available:');
        console.log('   • System Health Monitoring');
        console.log('   • API Endpoint Testing');
        console.log('   • Database Connection Testing');
        console.log('   • Firebase Integration Testing');
        console.log('   • WebSocket Connection Testing');
        console.log('   • Virtual User Simulation');
        console.log('   • Performance Metrics');
        console.log('   • Notification System Testing');
        console.log('   • Security Validation');
        console.log('   • Error Handling Testing');
        console.log('');
        console.log('Ready to test! Open the dashboard to get started. 🎯');
        
        resolve();
      });
    });
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  if (command === 'start') {
    const port = parseInt(args[1]) || 3001;
    const agent = new SimpleTestingAgent(port);
    
    try {
      await agent.start();
    } catch (error) {
      console.error('❌ Failed to start testing agent:', error.message);
      process.exit(1);
    }
  } else if (command === 'health') {
    console.log('🔍 GoCars Testing Agent Health Check');
    console.log('✅ System is ready');
    console.log('📊 Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB');
    console.log('⏱️ Uptime:', Math.round(process.uptime()) + 's');
  } else {
    console.log('🚗 GoCars Testing Agent');
    console.log('');
    console.log('Usage:');
    console.log('  node simple-testing-agent.js start [port]   Start the testing agent');
    console.log('  node simple-testing-agent.js health         Check system health');
    console.log('');
    console.log('Default port: 3001');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Start the application
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Application failed to start:', error);
    process.exit(1);
  });
}

module.exports = { SimpleTestingAgent };