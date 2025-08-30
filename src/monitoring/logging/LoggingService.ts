/**
 * Centralized Logging Service
 * Provides structured logging with multiple transports and log aggregation
 */

import * as winston from 'winston'
import * as path from 'path'

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
  message: string
  timestamp: string
  service: string
  component?: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
}

export interface LoggingConfig {
  level: string
  enableConsole: boolean
  enableFile: boolean
  enableElastic: boolean
  enableSyslog: boolean
  fileConfig: {
    directory: string
    maxSize: string
    maxFiles: number
    datePattern: string
  }
  elasticConfig?: {
    host: string
    port: number
    index: string
    username?: string
    password?: string
  }
  syslogConfig?: {
    host: string
    port: number
    protocol: 'tcp' | 'udp'
    facility: string
  }
}

export class LoggingService {
  private logger: winston.Logger
  private config: LoggingConfig
  private serviceName: string

  constructor(serviceName: string, config: LoggingConfig) {
    this.serviceName = serviceName
    this.config = config
    this.logger = this.createLogger()
  }

  /**
   * Create Winston logger with configured transports
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = []

    // Console transport
    if (this.config.enableConsole) {
      transports.push(new winston.transports.Console({
        level: this.config.level,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, service, component, ...meta }) => {
            const componentStr = component ? `[${component}]` : ''
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
            return `${timestamp} ${level} [${service}]${componentStr}: ${message}${metaStr}`
          })
        )
      }))
    }

    // File transport
    if (this.config.enableFile) {
      // Main log file
      transports.push(new winston.transports.File({
        level: this.config.level,
        filename: path.join(this.config.fileConfig.directory, 'application.log'),
        maxsize: this.parseSize(this.config.fileConfig.maxSize),
        maxFiles: this.config.fileConfig.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }))

      // Error log file
      transports.push(new winston.transports.File({
        level: 'error',
        filename: path.join(this.config.fileConfig.directory, 'error.log'),
        maxsize: this.parseSize(this.config.fileConfig.maxSize),
        maxFiles: this.config.fileConfig.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }))

      // Daily rotating file
      const DailyRotateFile = require('winston-daily-rotate-file')
      transports.push(new DailyRotateFile({
        level: this.config.level,
        filename: path.join(this.config.fileConfig.directory, 'application-%DATE%.log'),
        datePattern: this.config.fileConfig.datePattern,
        maxSize: this.config.fileConfig.maxSize,
        maxFiles: `${this.config.fileConfig.maxFiles}d`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }))
    }

    // Elasticsearch transport
    if (this.config.enableElastic && this.config.elasticConfig) {
      const ElasticsearchTransport = require('winston-elasticsearch')
      transports.push(new ElasticsearchTransport({
        level: this.config.level,
        clientOpts: {
          node: `http://${this.config.elasticConfig.host}:${this.config.elasticConfig.port}`,
          auth: this.config.elasticConfig.username ? {
            username: this.config.elasticConfig.username,
            password: this.config.elasticConfig.password || ''
          } : undefined
        },
        index: this.config.elasticConfig.index,
        transformer: (logData: any) => {
          return {
            '@timestamp': new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            service: logData.service || this.serviceName,
            component: logData.component,
            userId: logData.userId,
            sessionId: logData.sessionId,
            requestId: logData.requestId,
            metadata: logData.metadata,
            error: logData.error
          }
        }
      }))
    }

    // Syslog transport
    if (this.config.enableSyslog && this.config.syslogConfig) {
      const SyslogTransport = require('winston-syslog').Syslog
      transports.push(new SyslogTransport({
        level: this.config.level,
        host: this.config.syslogConfig.host,
        port: this.config.syslogConfig.port,
        protocol: this.config.syslogConfig.protocol,
        facility: this.config.syslogConfig.facility,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }))
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.serviceName
      },
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.config.fileConfig.directory, 'exceptions.log')
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.config.fileConfig.directory, 'rejections.log')
        })
      ]
    })
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, { error: this.formatError(error), ...metadata })
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  /**
   * Log verbose message
   */
  public verbose(message: string, metadata?: Record<string, any>): void {
    this.log('verbose', message, metadata)
  }

  /**
   * Generic log method
   */
  public log(level: string, message: string, metadata?: Record<string, any>): void {
    this.logger.log(level, message, {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  }

  /**
   * Create child logger with additional context
   */
  public child(context: Record<string, any>): LoggingService {
    const childLogger = new LoggingService(this.serviceName, this.config)
    childLogger.logger = this.logger.child(context)
    return childLogger
  }

  /**
   * Log test execution events
   */
  public logTestEvent(event: {
    type: 'start' | 'end' | 'pass' | 'fail' | 'skip'
    testId: string
    testName: string
    suiteName: string
    duration?: number
    error?: Error
    metadata?: Record<string, any>
  }): void {
    const logData = {
      component: 'test-execution',
      testId: event.testId,
      testName: event.testName,
      suiteName: event.suiteName,
      eventType: event.type,
      duration: event.duration,
      error: event.error ? this.formatError(event.error) : undefined,
      ...event.metadata
    }

    const level = event.type === 'fail' ? 'error' : 'info'
    this.log(level, `Test ${event.type}: ${event.testName}`, logData)
  }

  /**
   * Log performance metrics
   */
  public logPerformanceMetric(metric: {
    name: string
    value: number
    unit: string
    component: string
    tags?: Record<string, string>
  }): void {
    this.info(`Performance metric: ${metric.name}`, {
      component: 'performance',
      metricName: metric.name,
      metricValue: metric.value,
      metricUnit: metric.unit,
      metricComponent: metric.component,
      tags: metric.tags
    })
  }

  /**
   * Log security events
   */
  public logSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'vulnerability' | 'incident'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    userId?: string
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, any>
  }): void {
    const level = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn'
    
    this.log(level, `Security event: ${event.description}`, {
      component: 'security',
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      ...event.metadata
    })
  }

  /**
   * Log business events
   */
  public logBusinessEvent(event: {
    type: string
    description: string
    userId?: string
    value?: number
    currency?: string
    metadata?: Record<string, any>
  }): void {
    this.info(`Business event: ${event.description}`, {
      component: 'business',
      eventType: event.type,
      userId: event.userId,
      value: event.value,
      currency: event.currency,
      ...event.metadata
    })
  }

  /**
   * Create structured log query
   */
  public createQuery(filters: {
    level?: string
    component?: string
    userId?: string
    timeRange?: {
      start: Date
      end: Date
    }
    searchText?: string
  }): string {
    const conditions: string[] = []

    if (filters.level) {
      conditions.push(`level:"${filters.level}"`)
    }

    if (filters.component) {
      conditions.push(`component:"${filters.component}"`)
    }

    if (filters.userId) {
      conditions.push(`userId:"${filters.userId}"`)
    }

    if (filters.timeRange) {
      conditions.push(`@timestamp:[${filters.timeRange.start.toISOString()} TO ${filters.timeRange.end.toISOString()}]`)
    }

    if (filters.searchText) {
      conditions.push(`message:*${filters.searchText}*`)
    }

    return conditions.join(' AND ')
  }

  /**
   * Get log statistics
   */
  public async getLogStatistics(timeRange: { start: Date; end: Date }): Promise<{
    totalLogs: number
    logsByLevel: Record<string, number>
    logsByComponent: Record<string, number>
    errorRate: number
    topErrors: Array<{ message: string; count: number }>
  }> {
    // This would typically query the log storage backend
    // For now, return mock data
    return {
      totalLogs: 10000,
      logsByLevel: {
        error: 150,
        warn: 500,
        info: 8000,
        debug: 1350
      },
      logsByComponent: {
        'test-execution': 5000,
        'performance': 2000,
        'security': 100,
        'business': 500,
        'system': 2400
      },
      errorRate: 1.5,
      topErrors: [
        { message: 'Database connection timeout', count: 45 },
        { message: 'Test execution failed', count: 32 },
        { message: 'Authentication failed', count: 28 }
      ]
    }
  }

  // Private helper methods

  private formatError(error?: Error): { name: string; message: string; stack?: string; code?: string } | undefined {
    if (!error) return undefined

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    }
  }

  private parseSize(size: string): number {
    const units = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 }
    const match = size.toLowerCase().match(/^(\d+)([bkmg]?)$/)
    
    if (!match) return 10 * 1024 * 1024 // Default 10MB
    
    const value = parseInt(match[1])
    const unit = match[2] || 'b'
    
    return value * (units[unit as keyof typeof units] || 1)
  }
}

// Singleton instance
let loggingServiceInstance: LoggingService | null = null

/**
 * Get singleton logging service instance
 */
export function getLoggingService(serviceName?: string, config?: LoggingConfig): LoggingService {
  if (!loggingServiceInstance) {
    const defaultConfig: LoggingConfig = {
      level: process.env.LOG_LEVEL || 'info',
      enableConsole: true,
      enableFile: true,
      enableElastic: false,
      enableSyslog: false,
      fileConfig: {
        directory: process.env.LOG_DIRECTORY || './logs',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
      }
    }

    loggingServiceInstance = new LoggingService(
      serviceName || 'gocars-testing-agent',
      config || defaultConfig
    )
  }

  return loggingServiceInstance
}

/**
 * Initialize logging service with configuration
 */
export function initializeLogging(serviceName: string, config: LoggingConfig): LoggingService {
  loggingServiceInstance = new LoggingService(serviceName, config)
  return loggingServiceInstance
}