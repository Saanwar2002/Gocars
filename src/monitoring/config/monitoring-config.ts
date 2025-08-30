import { MonitoringConfig } from '../MonitoringService';
import { LogLevel } from '../logging/LogLevel';

export const createMonitoringConfig = (environment: 'development' | 'staging' | 'production' = 'production'): MonitoringConfig => {
  const baseConfig: MonitoringConfig = {
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      enableConsole: environment === 'development',
      enableFile: true,
      enableElastic: environment === 'production',
      enableSyslog: false,
      fileConfig: {
        directory: process.env.LOG_DIRECTORY || './logs',
        maxSize: process.env.LOG_MAX_SIZE || '50m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '10')
      }
    },
    metrics: {
      enabled: true,
      port: parseInt(process.env.METRICS_PORT || '9090'),
      path: process.env.METRICS_PATH || '/metrics',
      collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL || '15000'),
      prometheusEnabled: true
    },
    alerting: {
      enabled: true,
      evaluationInterval: parseInt(process.env.ALERT_EVALUATION_INTERVAL || '60'),
      cooldownPeriod: parseInt(process.env.ALERT_COOLDOWN_PERIOD || '300'),
      maxAlertsPerHour: parseInt(process.env.MAX_ALERTS_PER_HOUR || '10'),
      retentionDays: parseInt(process.env.ALERT_RETENTION_DAYS || '30'),
      enableCommonRules: process.env.ENABLE_COMMON_ALERT_RULES !== 'false'
    },
    dashboard: {
      enabled: true,
      refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || '30000'),
      autoRefresh: process.env.DASHBOARD_AUTO_REFRESH !== 'false',
      theme: (process.env.DASHBOARD_THEME as 'light' | 'dark') || 'dark'
    },
    healthCheck: {
      enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000')
    }
  };

  // Environment-specific overrides
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          level: 'debug',
          enableConsole: true,
          enableFile: false,
          enableElasticsearch: false
        },
        metrics: {
          ...baseConfig.metrics,
          collectInterval: 5000 // More frequent collection in dev
        },
        alerting: {
          ...baseConfig.alerting,
          evaluationInterval: 30, // More frequent evaluation in dev
          enableCommonRules: false // Disable noisy alerts in dev
        },
        dashboard: {
          ...baseConfig.dashboard,
          refreshInterval: 10000 // More frequent refresh in dev
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          level: 'info',
          enableConsole: true,
          enableFile: true,
          enableElasticsearch: false
        },
        alerting: {
          ...baseConfig.alerting,
          maxAlertsPerHour: 20 // Allow more alerts in staging
        }
      };

    case 'production':
    default:
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enableConsole: false,
          enableFile: true,
          enableElasticsearch: true,
          elasticsearchConfig: {
            host: process.env.ELASTICSEARCH_HOST || 'localhost',
            port: parseInt(process.env.ELASTICSEARCH_PORT || '9200'),
            index: process.env.ELASTICSEARCH_INDEX || 'gocars-testing-logs',
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        }
      };
  }
};

export const createTestingMonitoringConfig = (): MonitoringConfig => {
  return {
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: false,
      enableElasticsearch: false,
      enableHttp: false,
      fileConfig: {
        directory: './test-logs',
        maxSize: '10m',
        maxFiles: 3
      }
    },
    metrics: {
      enabled: true,
      port: 9091,
      path: '/test-metrics',
      collectInterval: 1000,
      prometheusEnabled: false
    },
    alerting: {
      enabled: false,
      evaluationInterval: 10,
      cooldownPeriod: 60,
      maxAlertsPerHour: 100,
      retentionDays: 1,
      enableCommonRules: false
    },
    dashboard: {
      enabled: false,
      refreshInterval: 5000,
      autoRefresh: false,
      theme: 'light'
    },
    healthCheck: {
      enabled: true,
      interval: 5000,
      timeout: 1000
    }
  };
};

export const createMinimalMonitoringConfig = (): MonitoringConfig => {
  return {
    logging: {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableElasticsearch: false,
      enableHttp: false,
      fileConfig: {
        directory: './logs',
        maxSize: '10m',
        maxFiles: 5
      }
    },
    metrics: {
      enabled: false,
      port: 9090,
      path: '/metrics',
      collectInterval: 30000,
      prometheusEnabled: false
    },
    alerting: {
      enabled: false,
      evaluationInterval: 60,
      cooldownPeriod: 300,
      maxAlertsPerHour: 10,
      retentionDays: 7,
      enableCommonRules: false
    },
    dashboard: {
      enabled: false,
      refreshInterval: 60000,
      autoRefresh: false,
      theme: 'dark'
    },
    healthCheck: {
      enabled: false,
      interval: 60000,
      timeout: 5000
    }
  };
};

// Configuration validation
export const validateMonitoringConfig = (config: MonitoringConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate logging config
  if (!config.logging) {
    errors.push('Logging configuration is required');
  } else {
    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(config.logging.level)) {
      errors.push('Invalid logging level');
    }
    
    if (config.logging.enableFile && !config.logging.fileConfig) {
      errors.push('File configuration is required when file logging is enabled');
    }
    
    if (config.logging.enableElasticsearch && !config.logging.elasticsearchConfig) {
      errors.push('Elasticsearch configuration is required when Elasticsearch logging is enabled');
    }
  }

  // Validate metrics config
  if (!config.metrics) {
    errors.push('Metrics configuration is required');
  } else {
    if (config.metrics.port < 1 || config.metrics.port > 65535) {
      errors.push('Invalid metrics port');
    }
    
    if (config.metrics.collectInterval < 1000) {
      errors.push('Metrics collection interval must be at least 1000ms');
    }
  }

  // Validate alerting config
  if (!config.alerting) {
    errors.push('Alerting configuration is required');
  } else {
    if (config.alerting.evaluationInterval < 10) {
      errors.push('Alert evaluation interval must be at least 10 seconds');
    }
    
    if (config.alerting.cooldownPeriod < 60) {
      errors.push('Alert cooldown period must be at least 60 seconds');
    }
    
    if (config.alerting.maxAlertsPerHour < 1) {
      errors.push('Max alerts per hour must be at least 1');
    }
  }

  // Validate dashboard config
  if (!config.dashboard) {
    errors.push('Dashboard configuration is required');
  } else {
    if (config.dashboard.refreshInterval < 1000) {
      errors.push('Dashboard refresh interval must be at least 1000ms');
    }
    
    if (!['light', 'dark'].includes(config.dashboard.theme)) {
      errors.push('Invalid dashboard theme');
    }
  }

  // Validate health check config
  if (!config.healthCheck) {
    errors.push('Health check configuration is required');
  } else {
    if (config.healthCheck.interval < 1000) {
      errors.push('Health check interval must be at least 1000ms');
    }
    
    if (config.healthCheck.timeout < 100) {
      errors.push('Health check timeout must be at least 100ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Environment detection
export const detectEnvironment = (): 'development' | 'staging' | 'production' => {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  
  if (nodeEnv === 'development' || nodeEnv === 'dev') {
    return 'development';
  } else if (nodeEnv === 'staging' || nodeEnv === 'stage') {
    return 'staging';
  } else {
    return 'production';
  }
};

// Default configuration factory
export const createDefaultMonitoringConfig = (): MonitoringConfig => {
  const environment = detectEnvironment();
  return createMonitoringConfig(environment);
};

// Configuration presets
export const MONITORING_PRESETS = {
  development: () => createMonitoringConfig('development'),
  staging: () => createMonitoringConfig('staging'),
  production: () => createMonitoringConfig('production'),
  testing: createTestingMonitoringConfig,
  minimal: createMinimalMonitoringConfig,
  default: createDefaultMonitoringConfig
};

// Export commonly used configurations
export {
  LogLevel
};