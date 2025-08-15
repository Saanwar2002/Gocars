/**
 * Core Types for Testing Framework
 * 
 * This module exports all the core types used throughout the testing framework.
 */

export interface TestResult {
  id: string
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'error'
  duration: number
  message?: string
  details?: any
  screenshots?: string[]
  logs?: string[]
  timestamp?: number
}

export interface TestSuite {
  id: string
  name: string
  description: string
  dependencies: string[]
  setup(): Promise<void>
  teardown(): Promise<void>
  runTests(): Promise<TestResult[]>
  getHealthStatus(): HealthStatus
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  details?: any
  timestamp?: string
}

export interface TestConfiguration {
  id: string
  name: string
  environment: 'development' | 'staging' | 'production'
  testSuites: string[]
  userProfiles: UserProfile[]
  concurrencyLevel: number
  timeout: number
  retryAttempts: number
  reportingOptions: ReportingOptions
  autoFixEnabled: boolean
  notificationSettings: NotificationSettings
}

export interface UserProfile {
  id: string
  role: 'passenger' | 'driver' | 'operator' | 'admin'
  demographics: {
    age: number
    location: string
    deviceType: 'mobile' | 'desktop' | 'tablet'
    experience: 'new' | 'regular' | 'power'
  }
  preferences: {
    paymentMethod: string
    notificationSettings: any
    language: string
  }
  behaviorPatterns: {
    bookingFrequency: number
    averageRideDistance: number
    preferredTimes: string[]
    cancellationRate: number
  }
}

export interface ReportingOptions {
  formats: ('json' | 'html' | 'pdf')[]
  includeScreenshots: boolean
  includeLogs: boolean
  realTimeUpdates: boolean
}

export interface NotificationSettings {
  enabled: boolean
  channels: ('email' | 'slack' | 'webhook')[]
  thresholds: {
    criticalErrors: number
    failureRate: number
  }
}

export interface ErrorEntry {
  id: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'functional' | 'performance' | 'security' | 'usability' | 'integration'
  component: string
  description: string
  stackTrace?: string
  context: any
  autoFixable: boolean
  fixApplied?: boolean
  fixDetails?: string
}

// Additional types for AI testing
export interface AITestConfiguration extends TestConfiguration {
  aiModelSettings?: {
    temperature?: number
    maxTokens?: number
    timeout?: number
  }
  performanceBenchmarks?: {
    responseTimeThreshold: number
    throughputThreshold: number
    accuracyThreshold: number
  }
}

export interface AITestResult extends TestResult {
  aiMetrics?: {
    responseTime: number
    accuracy?: number
    confidence?: number
    tokensUsed?: number
  }
}