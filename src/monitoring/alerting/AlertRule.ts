export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  threshold: number;
  timeWindow?: number; // in seconds
  evaluationInterval?: number; // in seconds
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty' | 'sms';
  config: {
    [key: string]: any;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: AlertCondition[];
  actions: AlertAction[];
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  cooldown?: number; // in seconds
  maxAlerts?: number; // max alerts per hour
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved';
  message: string;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  startsAt: Date;
  endsAt?: Date;
  generatorURL?: string;
  fingerprint: string;
}

export class AlertRuleBuilder {
  private rule: Partial<AlertRule> = {
    enabled: true,
    severity: 'medium',
    conditions: [],
    actions: [],
    labels: {},
    annotations: {},
    cooldown: 300, // 5 minutes
    maxAlerts: 10
  };

  public static create(): AlertRuleBuilder {
    return new AlertRuleBuilder();
  }

  public withId(id: string): AlertRuleBuilder {
    this.rule.id = id;
    return this;
  }

  public withName(name: string): AlertRuleBuilder {
    this.rule.name = name;
    return this;
  }

  public withDescription(description: string): AlertRuleBuilder {
    this.rule.description = description;
    return this;
  }

  public withSeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AlertRuleBuilder {
    this.rule.severity = severity;
    return this;
  }

  public addCondition(condition: AlertCondition): AlertRuleBuilder {
    this.rule.conditions!.push(condition);
    return this;
  }

  public addMetricCondition(
    metric: string,
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne',
    threshold: number,
    timeWindow: number = 300
  ): AlertRuleBuilder {
    return this.addCondition({
      metric,
      operator,
      threshold,
      timeWindow,
      evaluationInterval: 60
    });
  }

  public addAction(action: AlertAction): AlertRuleBuilder {
    this.rule.actions!.push(action);
    return this;
  }

  public addEmailAction(emails: string[], subject?: string): AlertRuleBuilder {
    return this.addAction({
      type: 'email',
      config: {
        to: emails,
        subject: subject || 'Alert: {{.RuleName}}'
      }
    });
  }

  public addWebhookAction(url: string, method: string = 'POST'): AlertRuleBuilder {
    return this.addAction({
      type: 'webhook',
      config: {
        url,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  }

  public addSlackAction(webhook: string, channel?: string): AlertRuleBuilder {
    return this.addAction({
      type: 'slack',
      config: {
        webhook,
        channel: channel || '#alerts'
      }
    });
  }

  public withLabel(key: string, value: string): AlertRuleBuilder {
    this.rule.labels![key] = value;
    return this;
  }

  public withAnnotation(key: string, value: string): AlertRuleBuilder {
    this.rule.annotations![key] = value;
    return this;
  }

  public withCooldown(seconds: number): AlertRuleBuilder {
    this.rule.cooldown = seconds;
    return this;
  }

  public withMaxAlerts(count: number): AlertRuleBuilder {
    this.rule.maxAlerts = count;
    return this;
  }

  public enabled(enabled: boolean = true): AlertRuleBuilder {
    this.rule.enabled = enabled;
    return this;
  }

  public build(): AlertRule {
    if (!this.rule.id) {
      throw new Error('Alert rule ID is required');
    }
    if (!this.rule.name) {
      throw new Error('Alert rule name is required');
    }
    if (!this.rule.conditions || this.rule.conditions.length === 0) {
      throw new Error('At least one condition is required');
    }
    if (!this.rule.actions || this.rule.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    const now = new Date();
    return {
      ...this.rule,
      createdAt: now,
      updatedAt: now
    } as AlertRule;
  }
}

// Predefined alert rules for common scenarios
export class CommonAlertRules {
  public static highErrorRate(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('high-error-rate')
      .withName('High Error Rate')
      .withDescription('Error rate is above 5% for 5 minutes')
      .withSeverity('high')
      .addMetricCondition('error_rate_percent', 'gt', 5, 300)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/high-error-rate')
      .build();
  }

  public static highMemoryUsage(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('high-memory-usage')
      .withName('High Memory Usage')
      .withDescription('Memory usage is above 90% for 2 minutes')
      .withSeverity('medium')
      .addMetricCondition('memory_usage_percent', 'gt', 90, 120)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/high-memory-usage')
      .build();
  }

  public static highResponseTime(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('high-response-time')
      .withName('High Response Time')
      .withDescription('Average response time is above 2 seconds for 3 minutes')
      .withSeverity('medium')
      .addMetricCondition('avg_response_time_seconds', 'gt', 2, 180)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/high-response-time')
      .build();
  }

  public static testFailureSpike(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('test-failure-spike')
      .withName('Test Failure Spike')
      .withDescription('Test failure rate increased by 50% in the last 10 minutes')
      .withSeverity('high')
      .addMetricCondition('test_failure_rate_increase_percent', 'gt', 50, 600)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/test-failure-spike')
      .build();
  }

  public static serviceDown(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('service-down')
      .withName('Service Down')
      .withDescription('Service is not responding to health checks')
      .withSeverity('critical')
      .addMetricCondition('service_up', 'eq', 0, 60)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/service-down')
      .withCooldown(60) // 1 minute cooldown for critical alerts
      .build();
  }

  public static diskSpaceWarning(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('disk-space-warning')
      .withName('Disk Space Warning')
      .withDescription('Disk usage is above 80%')
      .withSeverity('medium')
      .addMetricCondition('disk_usage_percent', 'gt', 80, 300)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/disk-space-warning')
      .build();
  }

  public static databaseConnectionFailure(): AlertRule {
    return AlertRuleBuilder.create()
      .withId('database-connection-failure')
      .withName('Database Connection Failure')
      .withDescription('Database connection failures detected')
      .withSeverity('high')
      .addMetricCondition('database_connection_failures', 'gt', 0, 60)
      .withLabel('component', 'testing-agent')
      .withAnnotation('runbook', 'https://docs.gocars.com/runbooks/database-connection-failure')
      .build();
  }

  public static getAllCommonRules(): AlertRule[] {
    return [
      this.highErrorRate(),
      this.highMemoryUsage(),
      this.highResponseTime(),
      this.testFailureSpike(),
      this.serviceDown(),
      this.diskSpaceWarning(),
      this.databaseConnectionFailure()
    ];
  }
}