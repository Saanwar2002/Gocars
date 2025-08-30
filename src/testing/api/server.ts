/**
 * Testing Agent REST API Server
 * Express.js server that exposes the testing agent REST API
 */

import express from 'express'
import cors from 'cors'
import { TestingAgentAPI, TestExecutionRequest } from './TestingAgentAPI'
import { TestConfiguration } from '../core/TestingAgentController'

const app = express()
const testingAPI = new TestingAgentAPI()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await testingAPI.getHealthStatus()
    res.status(health.data?.status === 'healthy' ? 200 : 503).json(health)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: Date.now(),
      requestId: 'health_check'
    })
  }
})

// Test execution endpoints
app.post('/api/testing/execute', async (req, res) => {
  try {
    const request: TestExecutionRequest = req.body
    const result = await testingAPI.startTesting(request)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'execute_error'
    })
  }
})

app.post('/api/testing/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const result = await testingAPI.stopTesting(sessionId)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'stop_error'
    })
  }
})

app.get('/api/testing/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const result = await testingAPI.getTestStatus(sessionId)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'status_error'
    })
  }
})

app.get('/api/testing/sessions', async (req, res) => {
  try {
    const result = await testingAPI.getActiveSessions()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'sessions_error'
    })
  }
})

// Configuration endpoints
app.post('/api/testing/configurations', async (req, res) => {
  try {
    const configuration: TestConfiguration = req.body
    const result = await testingAPI.createConfiguration(configuration)
    res.status(result.success ? 201 : 400).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'create_config_error'
    })
  }
})

app.get('/api/testing/configurations', async (req, res) => {
  try {
    const result = await testingAPI.listConfigurations()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'list_configs_error'
    })
  }
})

app.get('/api/testing/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await testingAPI.getConfiguration(id)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'get_config_error'
    })
  }
})

app.put('/api/testing/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates: Partial<TestConfiguration> = req.body
    const result = await testingAPI.updateConfiguration(id, updates)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'update_config_error'
    })
  }
})

app.delete('/api/testing/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await testingAPI.deleteConfiguration(id)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'delete_config_error'
    })
  }
})

app.post('/api/testing/configurations/validate', async (req, res) => {
  try {
    const configuration: TestConfiguration = req.body
    const result = await testingAPI.validateConfiguration(configuration)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'validate_config_error'
    })
  }
})

// Results and reporting endpoints
app.get('/api/testing/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const result = await testingAPI.getTestResults(sessionId)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'get_results_error'
    })
  }
})

app.post('/api/testing/reports/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { format } = req.body
    const result = await testingAPI.generateReport(sessionId, format)
    
    if (result.success && format === 'html') {
      res.setHeader('Content-Type', 'text/html')
    }
    
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'generate_report_error'
    })
  }
})

app.get('/api/testing/analytics', async (req, res) => {
  try {
    const { start, end } = req.query
    const timeRange = start && end ? {
      start: parseInt(start as string),
      end: parseInt(end as string)
    } : undefined
    
    const result = await testingAPI.getAnalytics(timeRange)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'get_analytics_error'
    })
  }
})

app.get('/api/testing/logs/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { level } = req.query
    const result = await testingAPI.getExecutionLogs(sessionId, level as string)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'get_logs_error'
    })
  }
})

// Test suites endpoint
app.get('/api/testing/suites', async (req, res) => {
  try {
    const result = await testingAPI.getAvailableTestSuites()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
      timestamp: Date.now(),
      requestId: 'get_suites_error'
    })
  }
})

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: Date.now(),
    requestId: 'unhandled_error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: Date.now(),
    requestId: 'not_found'
  })
})

// Start server
const PORT = process.env.PORT || 3001
const server = app.listen(PORT, () => {
  console.log(`Testing Agent API Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`API Documentation: http://localhost:${PORT}/api/testing`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Cleanup inactive sessions periodically
setInterval(async () => {
  try {
    await testingAPI.cleanupInactiveSessions()
  } catch (error) {
    console.error('Failed to cleanup inactive sessions:', error)
  }
}, 60 * 60 * 1000) // Every hour

export default app