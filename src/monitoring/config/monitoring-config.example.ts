/**
 * Example Monitoring Configuration
 * Shows how to configure the monitoring infrastructure
 */

import { MonitoringConfig } from '../MonitoringService'

// Development configuration
export const developmentConfig: MonitoringConfig = {
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: true,
    enableElastic: false,
    enableSyslog: false,
    fileConfig: {
      directory: './logs',
      maxSize: '10m',
      maxFiles: 5,
      datePattern: 'YYYY-MM-DD'
    }
  },
  metrics: {
    prefix: 'gocars_testing_dev',
    defaultLabels: {
      service: 'gocars-testing-agent',
      version: '1.0.0',
      environment: 'development'
    },
    collectDefaultMetrics: true,
    customMetrics: [
      {
        name: 'custom_business_metric',
        help: 'Custom business metric for development',
        type: 'gauge',
        labels: ['category', 'type']
      }
    ]
  },
  alerting: {
    evaluationInterval: 60000, // 1 minute
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    groupWait: 10000,
    groupInterval: 300000,
    repeatInterval: 3600000,
    channels: [
      {
        id: 'dev-email',
        name: 'Development Email',
        type: 'email',
        config: {
          host: 'localhost',
          port: 1025,
          secure: false,
          from: 'testing@gocars.dev',
          to: 'dev-team@gocars.dev'
        },
        enabled: true
      }
    ],
    escalationPolicies: [],
    rules: []
  },
  enableHealthChecks: true,
  healthCheckInterval: 30000, // 30 seconds
  enableAutoRemediation: false
}

// Staging configuration
export const stagingConfig: MonitoringConfig = {
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableElastic: true,
    enableSyslog: false,
    fileConfig: {
      directory: './logs',
      maxSize: '50m',
      maxFiles: 10,
      datePattern: 'YYYY-MM-DD'
    },
    elasticConfig: {
      host: 'elasticsearch.staging.gocars.com',
      port: 9200,
      index: 'gocars-testing-staging',
      username: 'elastic',
      password: process.env.ELASTIC_PASSWORD
    }
  },
  metrics: {
    prefix: 'gocars_testing_staging',
    defaultLabels: {
      service: 'gocars-testing-agent',
      version: process.env.APP_VERSION || '1.0.0',
      environment: 'staging'
    },
    collectDefaultMetrics: true,
    pushGateway: {
      url: 'http://pushgateway.staging.gocars.com:9091',
      jobName: 'gocars-testing-agent',
      interval: 30000
    },
    customMetrics: [
      {
        name: 'test_execution_queue_size',
        help: 'Number of tests in execution queue',
        type: 'gauge'
      },
      {
        name: 'user_session_duration',
        help: 'Duration of user sessions',
        type: 'histogram',
        buckets: [1, 5, 10, 30, 60, 300, 600]
      }
    ]
  },
  alerting: {
    evaluationInterval: 30000, // 30 seconds
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    groupWait: 10000,
    groupInterval: 300000,
    repeatInterval: 1800000, // 30 minutes
    channels: [
      {
        id: 'staging-email',
        name: 'Staging Email',
        type: 'email',
        config: {
          host: 'smtp.gocars.com',
          port: 587,
          secure: false,
          username: process.env.SMTP_USERNAME,
          password: process.env.SMTP_PASSWORD,
          from: 'alerts@gocars.com',
          to: 'staging-team@gocars.com'
        },
        enabled: true
      },
      {
        id: 'staging-slack',
        name: 'Staging Slack',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        },
        enabled: true
      }
    ],
    escalationPolicies: [
      {
        id: 'staging-escalation',
        name: 'Staging Escalation Policy',
        rules: [
          {
            delay: 0,
            channels: ['staging-slack'],
            severity: 'high'
          },
          {
            delay: 15,
            channels: ['staging-email'],
            severity: 'high'
          }
        ]
      }
    ],
    rules: []
  },
  enableHealthChecks: true,
  healthCheckInterval: 30000,
  enableAutoRemediation: true
}

// Production configuration
export const productionConfig: MonitoringConfig = {
  logging: {
    level: 'info',
    enableConsole: false,
    enableFile: true,
    enableElastic: true,
    enableSyslog: true,
    fileConfig: {
      directory: '/var/log/gocars-testing',
      maxSize: '100m',
      maxFiles: 30,
      datePattern: 'YYYY-MM-DD'
    },
    elasticConfig: {
      host: 'elasticsearch.gocars.com',
      port: 9200,
      index: 'gocars-testing-production',
      username: 'elastic',
      password: process.env.ELASTIC_PASSWORD
    },
    syslogConfig: {
      host: 'syslog.gocars.com',
      port: 514,
      protocol: 'udp',
      facility: 'local0'
    }
  },
  metrics: {
    prefix: 'gocars_testing',
    defaultLabels: {
      service: 'gocars-testing-agent',
      version: process.env.APP_VERSION || '1.0.0',
      environment: 'production',
      datacenter: process.env.DATACENTER || 'us-east-1'
    },
    collectDefaultMetrics: true,
    pushGateway: {
      url: 'http://pushgateway.gocars.com:9091',
      jobName: 'gocars-testing-agent',
      interval: 15000
    },
    customMetrics: [
      {
        name: 'business_revenue_impact',
        help: 'Revenue impact of testing activities',
        type: 'gauge',
        labels: ['test_type', 'impact_category']
      },
      {
        name: 'customer_satisfaction_score',
        help: 'Customer satisfaction score from testing',
        type: 'gauge',
        labels: ['region', 'service_type']
      },
      {
        name: 'test_coverage_percentage',
        help: 'Test coverage percentage by component',
        type: 'gauge',
        labels: ['component', 'test_type']
      }
    ]
  },
  alerting: {
    evaluationInterval: 15000, // 15 seconds
    retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    groupWait: 5000,
    groupInterval: 180000, // 3 minutes
    repeatInterval: 900000, // 15 minutes
    channels: [
      {
        id: 'prod-email',
        name: 'Production Email',
        type: 'email',
        config: {
          host: 'smtp.gocars.com',
          port: 587,
          secure: true,
          username: process.env.SMTP_USERNAME,
          password: process.env.SMTP_PASSWORD,
          from: 'alerts@gocars.com',
          to: 'production-team@gocars.com'
        },
        enabled: true
      },
      {
        id: 'prod-slack',
        name: 'Production Slack',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        },
        enabled: true
      },
      {
        id: 'prod-pagerduty',
        name: 'Production PagerDuty',
        type: 'pagerduty',
        config: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
        },
        enabled: true
      },
      {
        id: 'prod-sms',
        name: 'Production SMS',
        type: 'sms',
        config: {
          phoneNumber: process.env.ONCALL_PHONE_NUMBER,
          apiKey: process.env.SMS_API_KEY
        },
        enabled: true
      }
    ],
    escalationPolicies: [
      {
        id: 'prod-critical-escalation',
        name: 'Production Critical Escalation',
        rules: [
          {
            delay: 0,
            channels: ['prod-slack', 'prod-pagerduty'],
            severity: 'critical'
          },
          {
            delay: 5,
            channels: ['prod-sms'],
            severity: 'critical'
          },
          {
            delay: 15,
            channels: ['prod-email'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'prod-high-escalation',
        name: 'Production High Escalation',
        rules: [
          {
            delay: 0,
            channels: ['prod-slack'],
            severity: 'high'
          },
          {
            delay: 10,
            channels: ['prod-email'],
            severity: 'high'
          },
          {
            delay: 30,
            channels: ['prod-pagerduty'],
            severity: 'high'
          }
        ]
      }
    ],
    rules: []
  },
  enableHealthChecks: true,
  healthCheckInterval: 15000, // 15 seconds
  enableAutoRemediation: true
}

// Helper function to get configuration by environment
export function getMonitoringConfig(environment: string = 'development'): MonitoringConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return productionConfig
    case 'staging':
    case 'stage':
      return stagingConfig
    case 'development':
    case 'dev':
    default:
      return developmentConfig
  }
}

// Configuration validation
export function validateMonitoringConfig(config: MonitoringConfig): string[] {
  const errors: string[] = []

  // Validate logging config
  if (!config.logging.fileConfig.directory) {
    errors.push('Logging file directory is required')
  }

  // Validate metrics config
  if (!config.metrics.prefix) {
    errors.push('Metrics prefix is required')
  }

  // Validate alerting config
  if (config.alerting.channels.length === 0) {
    errors.push('At least one notification channel is required')
  }

  // Validate notification channels
  config.alerting.channels.forEach((channel, index) => {
    if (!channel.name || !channel.type) {
      errors.push(`Notification channel ${index} is missing name or type`)
    }

    switch (channel.type) {
      case 'email':
        if (!channel.config.host || !channel.config.from || !channel.config.to) {
          errors.push(`Email channel ${channel.name} is missing required configuration`)
        }
        break
      case 'slack':
        if (!channel.config.webhookUrl) {
          errors.push(`Slack channel ${channel.name} is missing webhook URL`)
        }
        break
      case 'pagerduty':
        if (!channel.config.integrationKey) {
          errors.push(`PagerDuty channel ${channel.name} is missing integration key`)
        }
        break
    }
  })

  return errors
}